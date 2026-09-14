import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  Clock,
  Lock,
  LogIn,
  LogOut,
  MessageSquare,
  Radio,
  Shield,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

import { AppShell } from "@/components/ner/AppShell";
import { AuthorityGuard } from "@/components/security/Guards";
import { Button } from "@/components/ui/button";
import { OnlinePill } from "@/components/ner/OfflineBanner";
import { useAuth } from "@/hooks/useAuth";
import { getMyAccess } from "@/lib/security/access.functions";
import { getSmsServiceStatus, listAuditLogs } from "@/lib/security/authority.functions";

export const Route = createFileRoute("/authority/security")({
  head: () => ({
    meta: [{ title: "Security Center — NER-SAFE Authority" }],
  }),
  component: () => (
    <AuthorityGuard>
      <AppShell>
        <SecurityCenter />
      </AppShell>
    </AuthorityGuard>
  ),
});

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  info: <Activity className="size-3.5 text-muted-foreground" />,
  warning: <Shield className="size-3.5 text-risk-moderate" />,
  critical: <XCircle className="size-3.5 text-risk-critical" />,
};

function actionLabel(action: string) {
  const map: Record<string, string> = {
    "auth.signed_in": "Signed in",
    "auth.signed_out": "Signed out",
    "auth.registered": "Registered",
    "auth.mfa.verified": "MFA verified",
    "auth.mfa.failed": "MFA failed",
    "authority.alert.drafted": "Alert drafted",
    "authority.alert.dispatched": "Alert dispatched",
    "authority.request.submitted": "Verification request submitted",
    "authority.request.approved": "Verification request approved",
    "authority.request.rejected": "Verification request rejected",
    "authority.report.status_changed": "Field report updated",
    "citizen.preferences.updated": "Notification prefs updated",
    "citizen.phone.verified": "Phone number verified",
    "citizen.hazard_report.created": "Hazard report submitted",
  };
  return map[action] ?? action;
}

function SecurityCenter() {
  const { access, mfa, session, signOut } = useAuth();

  const accessQuery = useQuery({
    queryKey: ["my-access"],
    queryFn: () => getMyAccess(),
  });

  const auditQuery = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => listAuditLogs(),
    refetchInterval: 60_000,
  });

  const smsQuery = useQuery({
    queryKey: ["sms-status"],
    queryFn: () => getSmsServiceStatus(),
  });

  const myLogs = (auditQuery.data ?? []).filter((l) => l.actor_id === access?.userId);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <p className="label-eyebrow">Authority operations · restricted</p>
        <h1 className="text-2xl font-semibold uppercase">Security Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Session, credentials, permissions and security event log.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Session card */}
        <div className="panel p-5 space-y-3">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            <p className="label-eyebrow">Session</p>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <OnlinePill />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate max-w-[160px]">{session?.user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium text-risk-critical">
                {access?.isAdmin ? "Administrator" : "Authority"}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => void signOut()}
          >
            <LogOut className="size-3.5 mr-1" /> Sign out of all devices
          </Button>
        </div>

        {/* MFA card */}
        <div className="panel p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <p className="label-eyebrow">Multi-Factor Authentication</p>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Enrollment</span>
              <span
                className={
                  access?.authority?.mfa_enrolled
                    ? "text-risk-low font-medium"
                    : "text-risk-moderate font-medium"
                }
              >
                {access?.authority?.mfa_enrolled ? "✅ Enrolled" : "⚠ Not enrolled"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session MFA</span>
              <span
                className={mfa ? "text-risk-low font-medium" : "text-risk-moderate font-medium"}
              >
                {mfa ? "✅ Verified" : "⚠ Not verified"}
              </span>
            </div>
          </div>
          {!mfa && (
            <Button asChild size="sm" className="w-full text-xs">
              <Link to="/authority/mfa">Verify now</Link>
            </Button>
          )}
        </div>

        {/* Organization card */}
        <div className="panel p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <p className="label-eyebrow">Organization</p>
          </div>
          {access?.authority ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization</span>
                <span className="font-medium text-right max-w-[160px] leading-tight">
                  {access.authority.organization_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Designation</span>
                <span className="font-medium">{access.authority.designation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Region</span>
                <span className="font-medium">{access.authority.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approved</span>
                <span className="font-medium">
                  {new Date(access.authority.approved_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No authority profile linked</p>
          )}
        </div>

        {/* SMS service card */}
        <div className="panel p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            <p className="label-eyebrow">SMS Notification Service</p>
          </div>
          {smsQuery.data ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gateway</span>
                <span
                  className={`font-medium capitalize ${smsQuery.data.configured ? "text-risk-low" : "text-risk-moderate"}`}
                >
                  {smsQuery.data.configured ? "🟢 Connected" : "🟡 Simulated"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-medium capitalize">{smsQuery.data.provider}</span>
              </div>
              <p className="text-[0.68rem] text-muted-foreground leading-relaxed">
                {smsQuery.data.note}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </div>

        {/* Permissions card */}
        <div className="panel p-5 space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-primary" />
            <p className="label-eyebrow">Permissions</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            {[
              ["Public Risk Map", true],
              ["Public Alerts", true],
              ["Hazard Reporting", true],
              ["Raw Sensor Data", true],
              ["Internal GIS Layers", true],
              ["Internal Analytics", true],
              ["Exact Sensor Locations", true],
              ["Response Coordination", true],
              ["Create Official Alerts", true],
              ["Send Emergency SMS", true],
              ["Audit Logs", true],
              ["Authority Management", access?.isAdmin ?? false],
            ].map(([label, allowed]) => (
              <div key={String(label)} className="flex items-center gap-1.5">
                {allowed ? (
                  <CheckCircle2 className="size-3.5 text-risk-low shrink-0" />
                ) : (
                  <XCircle className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span className={allowed ? "" : "text-muted-foreground"}>{String(label)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h2 className="font-semibold uppercase text-sm">Security Audit Log</h2>
          </div>
          <span className="label-eyebrow">Last 20 events</span>
        </div>
        <div className="divide-y divide-border">
          {(auditQuery.data ?? []).slice(0, 20).map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-5 py-3">
              <span className="mt-0.5">{SEVERITY_ICON[log.severity] ?? SEVERITY_ICON["info"]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{actionLabel(log.action)}</p>
                {log.detail && (
                  <p className="text-xs text-muted-foreground truncate">{log.detail}</p>
                )}
                <p className="text-[0.65rem] text-muted-foreground">
                  {log.actor_label ?? "System"} · {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase ${
                  log.severity === "critical"
                    ? "bg-risk-critical/15 text-risk-critical"
                    : log.severity === "warning"
                      ? "bg-risk-moderate/15 text-risk-moderate"
                      : "bg-surface-2 text-muted-foreground"
                }`}
              >
                {log.severity}
              </span>
            </div>
          ))}
          {!auditQuery.data?.length && (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">
              No events recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
