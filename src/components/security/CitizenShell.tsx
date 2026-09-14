import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Home,
  LifeBuoy,
  LogOut,
  Map as MapIcon,
  Megaphone,
  PhoneCall,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANGUAGES, useI18n, type Lang } from "@/lib/ner/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { OfflineBanner } from "@/components/ner/OfflineBanner";

const TABS = [
  { to: "/citizen", label: "Home", icon: Home },
  { to: "/citizen/map", label: "Risk Map", icon: MapIcon },
  { to: "/citizen/alerts", label: "Alerts", icon: Megaphone },
  { to: "/citizen/report", label: "Report", icon: AlertTriangle },
  { to: "/citizen/safety", label: "Safety", icon: BookOpen },
  { to: "/citizen/profile", label: "Profile", icon: User },
] as const;

export function CitizenShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { lang, setLang } = useI18n();
  const { session, profile, isDemoSession, signOut, loginAsDemo } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4">
          <Link to="/citizen" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-risk-low text-white shadow-xs">
              <LifeBuoy className="size-5" />
            </span>
            <div>
              <span className="font-display text-base font-bold leading-tight tracking-[0.08em] text-foreground">
                NER-SAFE
              </span>
              <span className="block text-[0.6rem] font-bold tracking-widest text-risk-low uppercase">
                COMMUNITY PORTAL
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Direct Call 112 SOS Button */}
            <Button
              asChild
              size="sm"
              className="h-8 bg-risk-critical text-white hover:bg-risk-critical/90 text-xs px-2.5 gap-1.5 shadow-xs"
            >
              <a href="tel:112">
                <PhoneCall className="size-3.5 animate-pulse" />
                <span className="font-bold font-mono">112 SOS</span>
              </a>
            </Button>

            {/* Language Selector */}
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger className="h-8 w-[100px] text-xs bg-surface border-border">
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

            {/* Auth button */}
            {session ? (
              <div className="flex items-center gap-1">
                <Link
                  to="/citizen/profile"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <span className="size-2 rounded-full bg-risk-low" />
                  <span className="max-w-[100px] truncate">{profile?.full_name || "Citizen"}</span>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-risk-critical"
                  onClick={() => void signOut()}
                  title="Sign Out"
                >
                  <LogOut className="size-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 border-risk-low/50 text-risk-low hover:bg-risk-low/10"
              >
                <Link to="/auth" search={{ role: "citizen", mode: "signin" }}>
                  Sign In / Register
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <OfflineBanner />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
        </div>

        <div className="space-y-5">{children}</div>

        {/* Community Trust & Disclaimer Footer */}
        <div className="mt-10 rounded-xl border border-border/80 bg-white p-4 text-[0.72rem] leading-relaxed text-muted-foreground shadow-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
            <ShieldCheck className="size-4 text-risk-low" />
            <span>Public Safety & Community Protection Commitment</span>
          </div>
          Risk alerts and rainfall forecasts are provided for public safety. Risk levels are
          aggregated by district — exact GPS tracking is never stored. In case of active slope
          movement, immediately evacuate to higher ground and dial{" "}
          <strong className="text-foreground">112</strong> or your local DDMA helpline.
        </div>
      </main>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-white/95 backdrop-blur-md shadow-lg">
        <ul className="mx-auto grid max-w-4xl grid-cols-6">
          {TABS.map((tab) => {
            const active = pathname === tab.to;
            const Icon = tab.icon;
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[0.65rem] font-semibold transition-all",
                    active
                      ? "text-risk-low scale-105"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-4", active && "text-risk-low stroke-[2.5]")} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
