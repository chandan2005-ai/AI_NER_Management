import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { audit, requireAuthority, requireMfaToken } from "./guard.server";

/** Operational, AUTHORITY-classified field reports (all citizens' submissions). */
export const listAuthorityReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAuthority(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("hazard_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Could not load field reports");
    return data ?? [];
  });

export const setReportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { id: string; status: "open" | "verified" | "rejected" | "resolved" }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "verified", "rejected", "resolved"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAuthority(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("hazard_reports")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error("Could not update the report");
    await audit({
      actorId: context.userId,
      action: "authority.report.status_changed",
      detail: `${data.id} → ${data.status}`,
    });
    return { ok: true };
  });

/* ---------------- Alert composer ---------------- */

const draftSchema = z.object({
  level: z.enum(["information", "watch", "warning", "critical"]),
  target_state: z.string().min(2).max(80),
  target_district: z.string().max(80).nullable().optional(),
  headline: z.string().min(5).max(140),
  message: z.string().min(10).max(600),
  safety_guidance: z.string().max(600).nullable().optional(),
});

export const createAlertDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => draftSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAuthority(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("official_alerts")
      .insert({
        level: data.level as never,
        target_state: data.target_state,
        target_district: data.target_district ?? null,
        headline: data.headline,
        message: data.message,
        safety_guidance: data.safety_guidance ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error("Could not save the alert draft");
    await audit({
      actorId: context.userId,
      action: "authority.alert.drafted",
      detail: `${data.level.toUpperCase()} · ${data.target_district ?? data.target_state}`,
      severity: "warning",
    });
    return row;
  });

/**
 * Dispatches a saved alert. Critical alerts require a fresh MFA session.
 * Delivery is per-recipient and honest: nothing is marked delivered unless the
 * gateway accepted it, and simulated sends are labelled as simulated.
 */
export const dispatchAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { id: string; mfaToken?: string }) =>
    z.object({ id: z.string().uuid(), mfaToken: z.string().max(300).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAuthority(context.supabase, context.userId);
    const { data: alert, error } = await context.supabase
      .from("official_alerts")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !alert) throw new Error("Alert not found");
    if (alert.status === "sent") throw new Error("This alert has already been sent");

    const critical = alert.level === "critical" || alert.level === "warning";
    if (critical) requireMfaToken(context.userId, data.mfaToken);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: recipients } = await supabaseAdmin
      .from("citizen_alert_prefs")
      .select(
        "user_id, sms_enabled, in_app_enabled, phone_number, phone_verified, level_critical, level_very_high, level_area, level_general",
      )
      .eq("in_app_enabled", true);

    const eligible = (recipients ?? []).filter((r) => {
      if (alert.level === "critical") return r.level_critical;
      if (alert.level === "warning") return r.level_very_high;
      if (alert.level === "watch") return r.level_area;
      return r.level_general;
    });

    const body = `NER-SAFE ${alert.level.toUpperCase()}: ${alert.headline}. ${alert.message}`.slice(
      0,
      300,
    );
    const smsTargets = eligible.filter((r) => r.sms_enabled && r.phone_verified && r.phone_number);
    const { sendBulkSms } = await import("./sms.server");
    const sms = await sendBulkSms(smsTargets.map((r) => ({ to: r.phone_number as string, body })));

    const deliveries = [
      ...eligible.map((r) => ({
        alert_id: alert.id,
        user_id: r.user_id,
        channel: "in_app" as const,
        status: "delivered" as const,
        provider: "in_app",
      })),
      ...smsTargets.map((r, index) => {
        const result = sms.results[index];
        return {
          alert_id: alert.id,
          user_id: r.user_id,
          channel: "sms" as const,
          status: (result?.status === "sent" ? "sent" : "failed") as "sent" | "failed",
          provider: sms.provider,
          error_message: result?.error ?? null,
        };
      }),
    ];
    if (deliveries.length > 0)
      await supabaseAdmin.from("alert_deliveries").insert(deliveries as never);

    const failed = deliveries.filter((d) => d.status === "failed").length;
    await supabaseAdmin
      .from("official_alerts")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipients_total: deliveries.length,
        delivered_count: deliveries.length - failed,
        failed_count: failed,
        mfa_confirmed: critical,
      })
      .eq("id", alert.id);

    await audit({
      actorId: context.userId,
      action: "authority.alert.dispatched",
      detail: `${alert.level.toUpperCase()} · ${alert.target_district ?? alert.target_state} · ${deliveries.length} recipients · ${failed} failed`,
      severity: "critical",
    });

    return {
      recipients: deliveries.length,
      failed,
      smsProvider: sms.provider,
      smsSimulated: sms.simulated,
    };
  });

export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAuthority(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("official_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error("Could not load alerts");
    return data ?? [];
  });

export const listAlertDeliveries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: { alertId: string }) => z.object({ alertId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAuthority(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("alert_deliveries")
      .select("id, channel, status, provider, error_message, created_at")
      .eq("alert_id", data.alertId)
      .limit(500);
    if (error) throw new Error("Could not load delivery status");
    return rows ?? [];
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAuthority(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Could not load the audit trail");
    return data ?? [];
  });

/** Notification-gateway health for the authority security centre. */
export const getSmsServiceStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAuthority(context.supabase, context.userId);
    const { resolveSmsProvider } = await import("./sms.server");
    const provider = resolveSmsProvider();
    return {
      provider: provider.name,
      configured: provider.name !== "simulated",
      note:
        provider.name === "simulated"
          ? "No SMS gateway credentials are configured — sends are simulated and labelled as such."
          : "Live gateway credentials detected. Outbound alerts only; inbox access is never used.",
    };
  });
