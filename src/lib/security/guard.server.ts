import { createHmac, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type Role = "citizen" | "authority" | "admin";

type Client = SupabaseClient<Database>;

/** Reads the caller's roles from the database — never from client-supplied data. */
export async function readRoles(supabase: Client, userId: string): Promise<Role[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error("Unable to verify authorization");
  return (data ?? []).map((r) => r.role as Role);
}

function forbidden(message: string): never {
  throw new Response(message, { status: 403 });
}

export function unauthorized(message = "Unauthorized"): never {
  throw new Response(message, { status: 401 });
}

/** Authority-or-admin gate. Throws HTTP 403 for citizens. */
export async function requireAuthority(supabase: Client, userId: string): Promise<Role[]> {
  const roles = await readRoles(supabase, userId);
  if (!roles.includes("authority") && !roles.includes("admin")) {
    forbidden("403 Forbidden — authority role required");
  }
  return roles;
}

export async function requireAdmin(supabase: Client, userId: string): Promise<Role[]> {
  const roles = await readRoles(supabase, userId);
  if (!roles.includes("admin")) forbidden("403 Forbidden — administrator role required");
  return roles;
}

/* ------------------------------------------------------------------ *
 * Multi-factor authentication (demo TOTP-style, 60 second window)
 *
 * The architecture is provider-agnostic: the same verify step accepts an
 * authenticator/TOTP code, an emailed OTP or (later) a hardware security key
 * assertion. For the prototype the code is derived server-side and clearly
 * labelled DEMO in the UI. Real deployments swap `deriveCode` for a per-user
 * TOTP secret without changing any caller.
 * ------------------------------------------------------------------ */

const STEP_MS = 60_000;
/** Authority MFA sessions expire far sooner than the login session. */
export const MFA_TTL_MS = 30 * 60_000;

function secret(): string {
  const value = process.env["NER_MFA_SIGNING_SECRET"];
  if (!value) throw new Error("MFA signing secret is not configured");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function deriveCode(userId: string, slot: number): string {
  const digest = createHmac("sha256", secret()).update(`${userId}:${slot}`).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const num =
    ((digest[offset]! & 0x7f) << 24) |
    (digest[offset + 1]! << 16) |
    (digest[offset + 2]! << 8) |
    digest[offset + 3]!;
  return String(num % 1_000_000).padStart(6, "0");
}

export function currentMfaCode(userId: string): { code: string; secondsLeft: number } {
  const now = Date.now();
  const slot = Math.floor(now / STEP_MS);
  return {
    code: deriveCode(userId, slot),
    secondsLeft: Math.ceil((STEP_MS - (now % STEP_MS)) / 1000),
  };
}

/** Accepts the current or previous window to tolerate slow typing. */
export function checkMfaCode(userId: string, code: string): boolean {
  const slot = Math.floor(Date.now() / STEP_MS);
  const clean = code.replace(/\D/g, "");
  return [slot, slot - 1].some((s) => safeEqual(deriveCode(userId, s), clean));
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function issueMfaToken(userId: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + MFA_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

/** Restricted server functions call this; a forged or expired token is rejected. */
export function requireMfaToken(userId: string, token: string | undefined): void {
  if (!token) forbidden("403 Forbidden — multi-factor verification required");
  const parts = token.split(".");
  if (parts.length !== 3) forbidden("403 Forbidden — invalid MFA session");
  const [tokenUser, expiry, signature] = parts as [string, string, string];
  const payload = `${tokenUser}.${expiry}`;
  if (!safeEqual(sign(payload), signature)) forbidden("403 Forbidden — invalid MFA session");
  if (tokenUser !== userId) forbidden("403 Forbidden — invalid MFA session");
  if (Number(expiry) < Date.now()) forbidden("403 Forbidden — MFA session expired, verify again");
}

/** Append-only security audit trail. Writes bypass RLS by design (no client insert grant). */
export async function audit(entry: {
  actorId?: string | null;
  actorLabel?: string | null;
  action: string;
  detail?: string;
  severity?: "info" | "warning" | "critical";
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: entry.actorId ?? null,
      actor_label: entry.actorLabel ?? null,
      action: entry.action,
      detail: entry.detail ?? null,
      severity: entry.severity ?? "info",
    });
  } catch (error) {
    console.error("[audit] failed to record entry", error);
  }
}
