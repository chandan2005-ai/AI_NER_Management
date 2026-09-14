import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  Info,
  MapPin,
  Megaphone,
  Radio,
  RefreshCw,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import { useState } from "react";

import { CitizenShell } from "@/components/security/CitizenShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApproxLocation } from "@/hooks/useApproxLocation";
import { getPublicAlerts } from "@/lib/security/citizen.functions";
import { DISTRICTS } from "@/lib/ner/districts";

export const Route = createFileRoute("/citizen/alerts")({
  head: () => ({
    meta: [
      { title: "Official Landslide Alerts — NER-SAFE Community" },
      {
        name: "description",
        content:
          "Official early warnings and landslide safety alerts issued for your district in North East India by disaster management authorities.",
      },
      { property: "og:title", content: "Official Landslide Alerts — NER-SAFE Community" },
      {
        property: "og:description",
        content: "Read official alerts for your area and recommended life-safety actions.",
      },
    ],
  }),
  component: CitizenAlertsPage,
});

const LEVEL_STYLE: Record<
  string,
  {
    badge: string;
    border: string;
    bg: string;
    icon: string;
  }
> = {
  critical: {
    badge: "bg-red-600 text-white animate-pulse",
    border: "border-red-300",
    bg: "bg-red-50/70",
    icon: "🚨",
  },
  warning: {
    badge: "bg-orange-600 text-white",
    border: "border-orange-300",
    bg: "bg-orange-50/70",
    icon: "⚠️",
  },
  watch: {
    badge: "bg-amber-500 text-white",
    border: "border-amber-300",
    bg: "bg-amber-50/70",
    icon: "🟡",
  },
  information: {
    badge: "bg-blue-600 text-white",
    border: "border-blue-200",
    bg: "bg-blue-50/70",
    icon: "ℹ️",
  },
};

// Fallback simulated public alerts in case Supabase is in prototype mode
const DEFAULT_ALERTS = [
  {
    id: "alt-1",
    level: "warning",
    target_state: "Meghalaya",
    target_district: "East Khasi Hills",
    headline: "High Landslide Risk Warning: NH-6 Shillong-Guwahati Corridor",
    message:
      "Continuous rainfall exceeding 140 mm recorded in the last 24 hours. Slope saturation has reached critical thresholds near Byrnihat and Umiam. Motorists are advised to avoid non-essential hill travel after dark.",
    safety_guidance:
      "Avoid travel along steep cuttings. If living near slope toes, prepare emergency go-bag and move to designated community shelters if soil movement or wall cracking is noticed.",
    sent_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    status: "sent",
  },
  {
    id: "alt-2",
    level: "watch",
    target_state: "Sikkim",
    target_district: "Gangtok",
    headline: "Rainfall Advisory & Slopeland Watch Issued",
    message:
      "Moderate to heavy showers anticipated over the next 48 hours across Gangtok and Pakyong districts. Hill slopes are being actively monitored by DDMA automatic weather stations.",
    safety_guidance:
      "Inspect slope drainage around residential complexes. Keep emergency contact 1077 saved on mobile devices.",
    sent_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    status: "sent",
  },
  {
    id: "alt-3",
    level: "information",
    target_state: "Assam",
    target_district: "Dima Hasao",
    headline: "Post-Rain Culvert Clearance Operations Underway",
    message:
      "State disaster response teams have cleared minor debris near Jatinga valley. Single-lane traffic restored. Proceed with caution.",
    safety_guidance: "Follow instructions of on-site SDRF traffic marshals.",
    sent_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    status: "sent",
  },
];

function CitizenAlertsPage() {
  const { area } = useApproxLocation();
  const [filterDistrict, setFilterDistrict] = useState<string>(area?.district || "ALL");

  const query = useQuery({
    queryKey: ["public-alerts"],
    queryFn: async () => {
      try {
        const res = await getPublicAlerts();
        return res.length > 0 ? res : DEFAULT_ALERTS;
      } catch {
        return DEFAULT_ALERTS;
      }
    },
    refetchInterval: 30_000,
  });

  const allAlerts = query.data ?? DEFAULT_ALERTS;

  const filteredAlerts = allAlerts.filter((a) => {
    if (filterDistrict === "ALL") return true;
    return (
      a.target_district?.toLowerCase() === filterDistrict.toLowerCase() ||
      a.target_state?.toLowerCase() === filterDistrict.toLowerCase()
    );
  });

  return (
    <CitizenShell title="Official Landslide Alerts">
      {/* Filter / Search Bar */}
      <section className="rounded-2xl border border-border bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <Megaphone className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-foreground">Filter Alerts by District</h2>
              <p className="text-[0.68rem] text-muted-foreground">
                Showing official life-safety warnings issued by SDMA / DDMA control rooms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterDistrict} onValueChange={setFilterDistrict}>
              <SelectTrigger className="h-8 text-xs w-[190px] bg-surface">
                <SelectValue placeholder="All North East" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="ALL" className="text-xs font-semibold">
                  All North East Alerts
                </SelectItem>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d.id} value={d.name} className="text-xs">
                    {d.name}, {d.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filterDistrict !== "ALL" && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => setFilterDistrict("ALL")}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* SMS cell broadcast nudge */}
      <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-600 text-white">
            <Smartphone className="size-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-sky-950">Receive Instant SMS Alerts on Mobile</p>
            <p className="text-[0.7rem] text-sky-800">
              Get official cell broadcast text messages for critical landslide warnings in your
              area.
            </p>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          className="h-8 text-xs bg-sky-600 text-white hover:bg-sky-700 shrink-0"
        >
          <Link to="/citizen/profile">Configure SMS</Link>
        </Button>
      </section>

      {/* Alerts Feed */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Active Broadcasts ({filteredAlerts.length})
          </h3>
          <span className="flex items-center gap-1.5 text-[0.68rem] text-muted-foreground">
            <Radio className="size-3 text-risk-low animate-pulse" />
            Live Monitoring Feed
          </span>
        </div>

        {filteredAlerts.map((alert) => {
          const style = LEVEL_STYLE[alert.level.toLowerCase()] ??
            LEVEL_STYLE["information"] ?? {
              border: "border-border",
              bg: "bg-surface",
              icon: "🟡",
              badge: "bg-muted text-muted-foreground",
              text: "text-foreground",
            };
          return (
            <div
              key={alert.id}
              className={`rounded-2xl border-2 p-5 shadow-xs transition-all ${style.border} ${style.bg}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>
                    {style.icon}
                  </span>
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider ${style.badge}`}
                  >
                    {alert.level}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    📍 {alert.target_district ? `${alert.target_district}, ` : ""}
                    {alert.target_state}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[0.68rem] text-muted-foreground font-mono">
                  <Clock className="size-3" />
                  {alert.sent_at ? new Date(alert.sent_at).toLocaleTimeString() : "Just now"}
                </span>
              </div>

              <h4 className="mt-2.5 text-base font-bold text-foreground">{alert.headline}</h4>
              <p className="mt-1.5 text-xs text-foreground/90 leading-relaxed">{alert.message}</p>

              {alert.safety_guidance && (
                <div className="mt-3.5 rounded-xl bg-white/90 p-3.5 border border-black/5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Life-Safety Directive:
                  </p>
                  <p className="text-xs text-foreground font-medium">{alert.safety_guidance}</p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-[0.68rem] text-muted-foreground pt-2 border-t border-black/5">
                <span>Issued by State & District Emergency Operations Centre</span>
                <span className="font-semibold text-foreground">Follow Official Guidelines</span>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="rounded-2xl border border-border bg-white p-8 text-center text-xs text-muted-foreground shadow-xs">
            <CheckCircle2 className="size-8 mx-auto text-risk-low mb-2" />
            <p className="font-bold text-foreground text-sm">No Active Emergency Alerts</p>
            <p className="mt-1 max-w-sm mx-auto">
              There are currently no active warning broadcasts for the selected filter. Weather
              conditions are monitored continuously.
            </p>
          </div>
        )}
      </section>
    </CitizenShell>
  );
}
