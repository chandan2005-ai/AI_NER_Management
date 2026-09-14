import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Boxes,
  Database,
  FlaskConical,
  Layers,
  Presentation,
  Radar,
  AlertTriangle,
  BarChart3,
  CloudRain,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  Map as MapIcon,
  Menu,
  PlusCircle,
  Radio,
  Route as RouteIcon,
  Settings,
  ShieldAlert,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LANGUAGES, useI18n, type Lang } from "@/lib/ner/i18n";
import { useSystem } from "@/lib/ner/store";
import { JudgeDemoBar } from "@/components/ner/JudgeDemoBar";

import { useAuth } from "@/hooks/useAuth";
import { OfflineBanner } from "@/components/ner/OfflineBanner";
import { ShieldCheck, UserCheck, Key, Shield, LogOut, ArrowRightLeft } from "lucide-react";

const NAV: { to: string; icon: ReactNode; label: string; adminOnly?: boolean }[] = [
  { to: "/command-center", icon: <Radar className="size-4" />, label: "Command Center" },
  { to: "/dashboard", icon: <LayoutDashboard className="size-4" />, label: "Operations Dashboard" },
  {
    to: "/authority/alerts",
    icon: <AlertTriangle className="size-4 text-risk-critical" />,
    label: "Alert Dispatcher (MFA)",
  },
  { to: "/map", icon: <MapIcon className="size-4" />, label: "GIS Risk Map" },
  { to: "/risk-zones", icon: <ShieldAlert className="size-4" />, label: "Risk Zones" },
  { to: "/rainfall", icon: <CloudRain className="size-4" />, label: "Rainfall Radar" },
  { to: "/forecast", icon: <Activity className="size-4" />, label: "AI Forecast" },
  { to: "/sensors", icon: <Radio className="size-4" />, label: "IoT Sensors" },
  { to: "/roads", icon: <RouteIcon className="size-4" />, label: "Road Corridors" },
  { to: "/lifelines", icon: <Layers className="size-4" />, label: "Critical Lifelines" },
  { to: "/simulator", icon: <FlaskConical className="size-4" />, label: "Simulation Sandbox" },
  { to: "/digital-twin", icon: <Radar className="size-4" />, label: "3D Digital Twin" },
  { to: "/resources", icon: <Boxes className="size-4" />, label: "Resource Logistics" },
  { to: "/reports", icon: <TriangleAlert className="size-4" />, label: "Field Reports" },
  { to: "/reports/new", icon: <PlusCircle className="size-4" />, label: "Log Incident" },
  { to: "/emergency-response", icon: <LifeBuoy className="size-4" />, label: "Emergency SOPs" },
  { to: "/analytics", icon: <BarChart3 className="size-4" />, label: "Analytics & Telemetry" },
  { to: "/data-sources", icon: <Database className="size-4" />, label: "Data Streams" },
  {
    to: "/authority/security",
    icon: <ShieldCheck className="size-4 text-risk-low" />,
    label: "Security Center",
  },
  {
    to: "/admin",
    icon: <UserCheck className="size-4 text-primary" />,
    label: "Admin Request Panel",
    adminOnly: true,
  },
  { to: "/settings", icon: <Settings className="size-4" />, label: "System Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { session, profile, role, authorityProfile, signOut } = useAuth();
  const {
    demoMode,
    setDemoMode,
    simulating,
    setSimulating,
    online,
    pendingCount,
    lastUpdate,
    snapshot,
    judgeDemo,
    setJudgeDemo,
    setJudgeStep,
  } = useSystem();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-[900] border-b border-border bg-sidebar/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
            aria-label="Toggle navigation"
            onClick={() => setMobileNav((v) => !v)}
          >
            <Menu className="size-5" />
          </Button>

          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded bg-primary text-primary-foreground">
              <Gauge className="size-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-[0.14em]">NER-SAFE</span>
          </Link>

          <span className="hidden items-center gap-1.5 rounded border border-risk-low/40 bg-risk-low/10 px-2 py-0.5 text-[0.7rem] font-semibold text-risk-low sm:inline-flex">
            <span className="live-dot size-1.5 rounded-full bg-risk-low" />
            {t("common.live")}
          </span>

          <span className="hidden rounded border border-risk-critical/40 bg-risk-critical/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-risk-critical sm:inline-block">
            RESTRICTED AUTHORITY
          </span>

          <div className="ml-auto flex items-center gap-3">
            <span className="metric hidden text-xs text-muted-foreground md:inline">
              {snapshot.summary.critical} critical · updated {lastUpdate}
            </span>

            <div className="hidden items-center gap-2 sm:flex">
              <Label htmlFor="sim" className="text-xs text-muted-foreground">
                Simulation
              </Label>
              <Switch id="sim" checked={simulating} onCheckedChange={setSimulating} />
            </div>

            <Button
              size="sm"
              variant={judgeDemo ? "default" : "secondary"}
              className="hidden h-8 gap-1.5 text-xs sm:inline-flex"
              onClick={() => {
                setJudgeStep(1);
                setJudgeDemo(!judgeDemo);
              }}
            >
              <Presentation className="size-3.5" />
              {judgeDemo ? "Exit demo" : "Judge demo"}
            </Button>

            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code} className="text-xs">
                    {l.native}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <OfflineBanner />

      <div className="flex">
        {/* Sidebar */}
        <nav
          className={cn(
            "fixed top-14 bottom-0 left-0 z-[800] w-60 overflow-y-auto border-r border-sidebar-border bg-sidebar p-2 transition-transform lg:translate-x-0 flex flex-col justify-between",
            mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <div>
            {/* User Session Info */}
            <div className="mb-3 rounded-lg border border-sidebar-border bg-surface p-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                  <Shield className="size-3.5 text-primary shrink-0" />
                  {authorityProfile?.organization || profile?.full_name || "Authority User"}
                </span>
                <span className="rounded bg-primary/20 px-1.5 py-0.2 text-[0.6rem] font-mono font-bold text-primary uppercase">
                  {role ?? "AUTHORITY"}
                </span>
              </div>
              <p className="mt-0.5 text-[0.68rem] text-muted-foreground truncate font-mono">
                {session?.user?.email ?? "session: active"}
              </p>
            </div>

            <ul className="space-y-0.5">
              {NAV.map((item) => {
                if (item.adminOnly && role !== "admin") return null;
                const active =
                  pathname === item.to ||
                  (item.to !== "/dashboard" && pathname.startsWith(`${item.to}/`));
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setMobileNav(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded px-3 py-1.5 text-xs transition-colors",
                        active
                          ? "bg-sidebar-accent font-semibold text-sidebar-primary"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                      )}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-4 space-y-2 pt-2 border-t border-sidebar-border">
            <Link
              to="/citizen"
              className="flex w-full items-center justify-between rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft className="size-3" />
                Citizen Portal
              </span>
              <span className="text-[0.65rem] text-risk-low font-semibold">Public</span>
            </Link>

            {session && (
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-xs h-8 text-risk-critical hover:bg-risk-critical/10 hover:text-risk-critical gap-2"
                onClick={() => void signOut()}
              >
                <LogOut className="size-3.5" />
                Sign Out
              </Button>
            )}

            <div className="rounded border border-sidebar-border bg-surface/50 p-2 text-[0.65rem] leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground/80 mb-0.5">Zero-Trust Notice</p>
              Sensitive authority telemetry & commands are strictly logged and audited.
            </div>
          </div>
        </nav>

        {mobileNav ? (
          <button
            aria-label="Close navigation"
            className="fixed inset-0 top-14 z-[700] bg-background/70 lg:hidden"
            onClick={() => setMobileNav(false)}
          />
        ) : null}

        <main className={cn("min-h-[calc(100vh-3.5rem)] w-full lg:pl-60", judgeDemo && "pb-40")}>
          {children}
        </main>
      </div>
      <JudgeDemoBar />
    </div>
  );
}
