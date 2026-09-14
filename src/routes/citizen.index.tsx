import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudRain,
  Compass,
  FileText,
  HeartPulse,
  Info,
  LifeBuoy,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Megaphone,
  Phone,
  PhoneCall,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CitizenShell } from "@/components/security/CitizenShell";
import { useApproxLocation } from "@/hooks/useApproxLocation";
import { DISTRICTS } from "@/lib/ner/districts";
import { getPublicAlerts, getPublicRisk } from "@/lib/security/citizen.functions";
import { PUBLIC_LEVEL_META } from "@/lib/security/classification";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/citizen/")({
  head: () => ({
    meta: [
      { title: "NER-SAFE Community — Landslide Safety & Risk Portal for North East India" },
      {
        name: "description",
        content:
          "Official landslide risk level, real-time safety advisories, emergency helplines, hazard reporting, and disaster preparedness for communities across North East India.",
      },
      { property: "og:title", content: "NER-SAFE Community — Landslide Safety Portal" },
      {
        property: "og:description",
        content:
          "Area-level landslide risk, safety steps, hazard reporting and local alerts for communities, students and visitors in North East India.",
      },
    ],
  }),
  component: CitizenHome,
});

const LEVEL_STYLE: Record<
  string,
  {
    card: string;
    badge: string;
    text: string;
    icon: string;
    bgGradient: string;
  }
> = {
  LOW: {
    card: "border-emerald-200 bg-emerald-50/70 text-emerald-950",
    badge: "bg-emerald-600 text-white",
    text: "text-emerald-800",
    icon: "🟢",
    bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
  },
  MODERATE: {
    card: "border-amber-200 bg-amber-50/70 text-amber-950",
    badge: "bg-amber-500 text-white",
    text: "text-amber-800",
    icon: "🟡",
    bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
  },
  HIGH: {
    card: "border-orange-200 bg-orange-50/70 text-orange-950",
    badge: "bg-orange-600 text-white",
    text: "text-orange-800",
    icon: "🟠",
    bgGradient: "from-orange-500/10 via-orange-500/5 to-transparent",
  },
  "VERY HIGH": {
    card: "border-rose-300 bg-rose-50/80 text-rose-950",
    badge: "bg-rose-600 text-white",
    text: "text-rose-800",
    icon: "🔴",
    bgGradient: "from-rose-500/15 via-rose-500/5 to-transparent",
  },
  CRITICAL: {
    card: "border-red-400 bg-red-50 text-red-950 shadow-sm",
    badge: "bg-red-700 text-white animate-pulse",
    text: "text-red-900 font-semibold",
    icon: "🚨",
    bgGradient: "from-red-600/20 via-red-600/10 to-transparent",
  },
};

const ALERT_LEVEL_STYLES: Record<
  string,
  {
    badge: string;
    border: string;
    bg: string;
    icon: string;
    text: string;
  }
> = {
  critical: {
    badge: "bg-red-600 text-white animate-pulse",
    border: "border-red-300",
    bg: "bg-red-50/90",
    icon: "🚨",
    text: "text-red-950",
  },
  warning: {
    badge: "bg-orange-600 text-white",
    border: "border-orange-300",
    bg: "bg-orange-50/90",
    icon: "⚠️",
    text: "text-orange-950",
  },
  watch: {
    badge: "bg-amber-500 text-white",
    border: "border-amber-300",
    bg: "bg-amber-50/90",
    icon: "🟡",
    text: "text-amber-950",
  },
  information: {
    badge: "bg-blue-600 text-white",
    border: "border-blue-200",
    bg: "bg-blue-50/90",
    icon: "ℹ️",
    text: "text-blue-950",
  },
};

const DEFAULT_INDEX_ALERTS = [
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

function CitizenHome() {
  const { area, status, requestDeviceLocation, setManualArea } = useApproxLocation();
  const { session } = useAuth();
  const [speaking, setSpeaking] = useState(false);

  // Default to East Khasi Hills if not set
  const currentDistrict = area?.district || "East Khasi Hills";
  const currentState = area?.state || "Meghalaya";

  const query = useQuery({
    queryKey: ["public-risk", currentDistrict],
    queryFn: () => getPublicRisk({ data: { district: currentDistrict } }),
    refetchInterval: 60_000,
  });

  const alertsQuery = useQuery({
    queryKey: ["citizen-dashboard-alerts"],
    queryFn: async () => {
      let serverAlerts: Array<{
        id: string;
        level: string;
        target_state: string;
        target_district?: string | null;
        headline: string;
        message: string;
        safety_guidance?: string | null;
        sent_at?: string;
        status?: string;
      }> = [];

      try {
        const res = await getPublicAlerts();
        if (Array.isArray(res) && res.length > 0) {
          serverAlerts = res.map((a) => ({
            id: a.id,
            level: a.level,
            target_state: a.target_state || "Meghalaya",
            target_district: a.target_district || null,
            headline: a.headline,
            message: a.message,
            safety_guidance: a.safety_guidance || null,
            sent_at: a.sent_at || new Date().toISOString(),
            status: "sent",
          }));
        }
      } catch {
        /* fallback */
      }

      let localAlerts: Array<{
        id: string;
        level: string;
        target_state: string;
        target_district?: string | null;
        headline: string;
        message: string;
        safety_guidance?: string | null;
        sent_at?: string;
        created_at?: string;
        status?: string;
      }> = [];

      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("ner-safe-local-dispatched-alerts");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localAlerts = parsed
                .filter((a) => a.status === "sent")
                .map((a) => ({
                  ...a,
                  sent_at: a.sent_at || a.created_at || new Date().toISOString(),
                }));
            }
          }
        } catch {
          /* ignore */
        }
      }

      const combined = [...localAlerts, ...serverAlerts, ...DEFAULT_INDEX_ALERTS];
      const seen = new Set<string>();
      const deduped: typeof DEFAULT_INDEX_ALERTS = [];
      for (const a of combined) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          deduped.push(a as (typeof DEFAULT_INDEX_ALERTS)[0]);
        }
      }
      return deduped;
    },
    refetchInterval: 30_000,
  });

  const allAlerts = alertsQuery.data ?? DEFAULT_INDEX_ALERTS;

  // Filter alerts for the active location:
  // Match district directly, or state-wide alert when target_district is empty
  const locationAlerts = allAlerts.filter((a) => {
    const dMatch =
      a.target_district &&
      a.target_district.toLowerCase().trim() === currentDistrict.toLowerCase().trim();
    const sMatch =
      (!a.target_district || a.target_district === "ALL") &&
      a.target_state &&
      a.target_state.toLowerCase().trim() === currentState.toLowerCase().trim();
    return dMatch || sMatch;
  });

  const risk = query.data?.area ?? null;
  const riskLevel = risk?.risk_level ?? "MODERATE";
  const style = LEVEL_STYLE[riskLevel] ??
    LEVEL_STYLE["MODERATE"] ?? {
      card: "border-border bg-white",
      badge: "bg-primary text-white",
      text: "text-foreground",
      icon: "🟡",
      bgGradient: "from-primary/10 to-transparent",
    };
  const meta = PUBLIC_LEVEL_META[riskLevel] || {
    label: "Moderate Watch",
    icon: "🟡",
    desc: "Monitor weather conditions",
  };

  const handleSpeakGuidance = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported on this browser.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const textToRead = `${currentDistrict}, ${currentState}. Landslide risk level is ${meta.label}. ${risk?.public_message || "Stay aware of heavy rainfall."} Safety instructions: ${risk?.safety_guidance?.join(". ") || "Avoid steep slopes during intense rain."}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <CitizenShell title="Landslide Safety Portal">
      {/* Location Selector Bar */}
      <section className="rounded-2xl border border-border bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </span>
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                Current Monitored Area
              </p>
              <h2 className="text-base font-bold text-foreground">
                {currentDistrict}, {currentState}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={requestDeviceLocation}
              className="h-8 text-xs gap-1.5 bg-surface text-foreground hover:bg-muted"
            >
              <LocateFixed className="size-3.5 text-primary" />
              {status === "asking" ? "Detecting…" : "Use My Location"}
            </Button>

            <Select
              value={currentDistrict}
              onValueChange={(val) => {
                const found = DISTRICTS.find((d) => d.name === val);
                if (found) setManualArea(found.name, found.state);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-[180px] bg-surface">
                <SelectValue placeholder="Change district" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {DISTRICTS.map((d) => (
                  <SelectItem key={d.id} value={d.name} className="text-xs">
                    {d.name}, {d.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {status === "denied" && (
          <p className="mt-2 text-[0.7rem] text-risk-moderate">
            Location permission was declined. Selected district will be used.
          </p>
        )}
      </section>

      {/* Immediate Location-Based Active Emergency Alerts Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-risk-low animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Official Early Warnings & Alerts · {currentDistrict}
            </h3>
          </div>
          <Link
            to="/citizen/alerts"
            className="text-[0.72rem] font-semibold text-primary hover:underline flex items-center gap-1"
          >
            All Regional Alerts <ChevronRight className="size-3" />
          </Link>
        </div>

        {locationAlerts.length > 0 ? (
          <div className="space-y-3">
            {locationAlerts.map((alert) => {
              const defaultStyle = {
                badge: "bg-blue-600 text-white",
                border: "border-blue-200",
                bg: "bg-blue-50/90",
                icon: "ℹ️",
                text: "text-blue-950",
              };
              const alertStyle =
                (alert.level ? ALERT_LEVEL_STYLES[alert.level.toLowerCase()] : undefined) ??
                ALERT_LEVEL_STYLES["information"] ??
                defaultStyle;
              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl border-2 p-5 shadow-xs transition-all ${alertStyle.border} ${alertStyle.bg}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">
                        {alertStyle.icon}
                      </span>
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider ${alertStyle.badge}`}
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
                      {alert.sent_at ? new Date(alert.sent_at).toLocaleTimeString() : "Live"}
                    </span>
                  </div>

                  <h4 className="mt-3 text-base font-bold text-foreground">{alert.headline}</h4>
                  <p className="mt-1.5 text-xs text-foreground/90 leading-relaxed">
                    {alert.message}
                  </p>

                  {alert.safety_guidance && (
                    <div className="mt-3.5 rounded-xl bg-white/95 p-3.5 border border-black/5 shadow-2xs">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                        <ShieldAlert className="size-3.5 text-primary" />
                        Immediate Life-Safety Directive:
                      </p>
                      <p className="text-xs text-foreground font-medium">{alert.safety_guidance}</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[0.68rem] text-muted-foreground pt-2.5 border-t border-black/5">
                    <span>Issued by State & District Emergency Operations Centre</span>
                    <span className="font-semibold text-foreground">
                      Follow Official Instructions
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  No Active Emergency Alerts for {currentDistrict}, {currentState}
                </p>
                <p className="text-[0.7rem] text-emerald-800">
                  Slope stability and rain gauges are actively monitored. Automated risk rating is
                  currently {meta.label}.
                </p>
              </div>
            </div>
            <Link
              to="/citizen/alerts"
              className="text-[0.72rem] font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg shrink-0 transition-colors"
            >
              View Feed
            </Link>
          </div>
        )}
      </section>

      {/* Main Real-Time Risk Level Card */}
      <section
        className={`relative overflow-hidden rounded-2xl border-2 p-5 sm:p-6 transition-all shadow-xs ${style.card}`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${style.bgGradient} pointer-events-none`}
        />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl" aria-hidden="true">
                {style.icon}
              </span>
              <div>
                <span
                  className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${style.badge}`}
                >
                  {meta.label}
                </span>
                <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                  District Landslide Risk Status · {currentDistrict}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 bg-white/90 shadow-xs hover:bg-white text-foreground"
              onClick={handleSpeakGuidance}
            >
              <Volume2 className={`size-3.5 ${speaking ? "text-primary animate-pulse" : ""}`} />
              {speaking ? "Stop Audio" : "Listen in Voice"}
            </Button>
          </div>

          <p className="mt-4 text-base font-semibold leading-snug">
            {risk?.public_message ||
              "Monitoring slope stability and 24-hour accumulated rainfall for this area."}
          </p>

          <div className="mt-4 rounded-xl bg-white/90 p-4 border border-black/5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Shield className="size-3.5 text-primary" />
              Recommended Safety Actions:
            </p>
            <ul className="space-y-1.5 text-xs text-foreground">
              {(
                risk?.safety_guidance || [
                  "Stay clear of steep unstable cut slopes during prolonged rain.",
                  "Ensure local stormwater drainage ditches are unclogged.",
                  "Report any newly formed ground fissures or tilting trees to local authorities.",
                ]
              ).map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-risk-low shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-muted-foreground pt-3 border-t border-black/5">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="size-3 animate-spin" />
              Updated{" "}
              {risk?.last_updated ? new Date(risk.last_updated).toLocaleTimeString() : "Live"} ·
              Automated Early Warning Model
            </span>
            <span className="font-medium text-foreground">
              Rainfall Trend:{" "}
              {riskLevel === "LOW"
                ? "Normal (0-15 mm)"
                : riskLevel === "MODERATE"
                  ? "Moderate Rain (35-70 mm)"
                  : "Heavy Rainfall (>110 mm)"}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Action Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <Link
          to="/citizen/map"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-4.5 shadow-xs transition-all hover:border-primary hover:shadow-md"
        >
          <div>
            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <MapIcon className="size-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">Interactive Risk Map</h3>
            <p className="mt-1 text-[0.72rem] text-muted-foreground leading-relaxed">
              Explore landslide hazard zones across all 8 NER states.
            </p>
          </div>
          <span className="mt-3 text-[0.72rem] font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            View Live Map <ArrowRight className="size-3" />
          </span>
        </Link>

        <Link
          to="/citizen/report"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-4.5 shadow-xs transition-all hover:border-orange-400 hover:shadow-md"
        >
          <div>
            <span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <AlertTriangle className="size-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">Report a Hazard</h3>
            <p className="mt-1 text-[0.72rem] text-muted-foreground leading-relaxed">
              Submit photos of cracks, rockfalls, or road blockages to response teams.
            </p>
          </div>
          <span className="mt-3 text-[0.72rem] font-semibold text-orange-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Send Report <ArrowRight className="size-3" />
          </span>
        </Link>

        <Link
          to="/citizen/alerts"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-4.5 shadow-xs transition-all hover:border-purple-400 hover:shadow-md"
        >
          <div>
            <span className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Megaphone className="size-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">Official Alerts</h3>
            <p className="mt-1 text-[0.72rem] text-muted-foreground leading-relaxed">
              Read active early warning broadcasts issued by disaster authorities.
            </p>
          </div>
          <span className="mt-3 text-[0.72rem] font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Check Alerts <ArrowRight className="size-3" />
          </span>
        </Link>

        <Link
          to="/citizen/safety"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-4.5 shadow-xs transition-all hover:border-emerald-400 hover:shadow-md"
        >
          <div>
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <BookOpen className="size-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">Safety Guidelines</h3>
            <p className="mt-1 text-[0.72rem] text-muted-foreground leading-relaxed">
              Pre-disaster survival actions, early warning signs & emergency steps.
            </p>
          </div>
          <span className="mt-3 text-[0.72rem] font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Read Guide <ArrowRight className="size-3" />
          </span>
        </Link>

        <Link
          to="/citizen/profile"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-4.5 shadow-xs transition-all hover:border-sky-400 hover:shadow-md"
        >
          <div>
            <span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Smartphone className="size-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-foreground">SMS Alert Broadcasts</h3>
            <p className="mt-1 text-[0.72rem] text-muted-foreground leading-relaxed">
              Receive direct SMS text alerts on mobile during critical weather events.
            </p>
          </div>
          <span className="mt-3 text-[0.72rem] font-semibold text-sky-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Configure SMS <ArrowRight className="size-3" />
          </span>
        </Link>

        <a
          href="tel:112"
          className="group flex flex-col justify-between rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white p-4.5 shadow-xs transition-all hover:border-red-500 hover:shadow-md"
        >
          <div>
            <span className="grid size-10 place-items-center rounded-xl bg-red-600 text-white shadow-xs">
              <PhoneCall className="size-5 animate-pulse" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-red-950">Emergency Call (112)</h3>
            <p className="mt-1 text-[0.72rem] text-red-800/80 leading-relaxed">
              Direct connection to Police, Fire, Ambulance & SDRF rescue response.
            </p>
          </div>
          <span className="mt-3 text-[0.72rem] font-bold text-red-600 flex items-center gap-1">
            Dial 112 Toll-Free <Phone className="size-3" />
          </span>
        </a>
      </section>

      {/* Emergency Helplines Quick Directory */}
      <section className="rounded-2xl border border-border bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneCall className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Emergency Response Helplines</h3>
          </div>
          <span className="text-[0.68rem] bg-surface px-2 py-0.5 rounded border border-border text-muted-foreground">
            24x7 Toll Free
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <a
            href="tel:112"
            className="flex items-center justify-between p-3 rounded-xl border border-red-200 bg-red-50/40 hover:border-red-400 hover:bg-red-50 transition-colors"
          >
            <div>
              <p className="font-bold text-red-950">National SOS</p>
              <p className="text-[0.68rem] text-red-800">Unified Rescue (112)</p>
            </div>
            <span className="font-mono font-bold text-red-600 text-sm">112</span>
          </a>

          <a
            href="tel:1078"
            className="flex items-center justify-between p-3 rounded-xl border border-orange-200 bg-orange-50/40 hover:border-orange-400 hover:bg-orange-50 transition-colors"
          >
            <div>
              <p className="font-bold text-orange-950">NDRF Rescue</p>
              <p className="text-[0.68rem] text-orange-800">Disaster Search/Extrication</p>
            </div>
            <span className="font-mono font-bold text-orange-600 text-sm">1078</span>
          </a>

          <a
            href="tel:1077"
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <div>
              <p className="font-bold text-foreground">DDMA Control</p>
              <p className="text-[0.68rem] text-muted-foreground">District Operations</p>
            </div>
            <span className="font-mono font-bold text-primary text-sm">1077</span>
          </a>

          <a
            href="tel:1070"
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <div>
              <p className="font-bold text-foreground">SDMA Control</p>
              <p className="text-[0.68rem] text-muted-foreground">State Operations</p>
            </div>
            <span className="font-mono font-bold text-primary text-sm">1070</span>
          </a>

          <a
            href="tel:108"
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
          >
            <div>
              <p className="font-bold text-foreground">Ambulance / EMS</p>
              <p className="text-[0.68rem] text-muted-foreground">Medical Trauma</p>
            </div>
            <span className="font-mono font-bold text-emerald-600 text-sm">108</span>
          </a>

          <a
            href="tel:1033"
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
          >
            <div>
              <p className="font-bold text-foreground">Highway Helpline</p>
              <p className="text-[0.68rem] text-muted-foreground">NHAI Road Blockages</p>
            </div>
            <span className="font-mono font-bold text-amber-600 text-sm">1033</span>
          </a>

          <a
            href="tel:101"
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-rose-400 hover:bg-rose-50/50 transition-colors"
          >
            <div>
              <p className="font-bold text-foreground">Fire &amp; Rescue</p>
              <p className="text-[0.68rem] text-muted-foreground">Emergency Extrication</p>
            </div>
            <span className="font-mono font-bold text-rose-600 text-sm">101</span>
          </a>

          <a
            href="tel:1091"
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-purple-400 hover:bg-purple-50/50 transition-colors"
          >
            <div>
              <p className="font-bold text-foreground">Women Helpline</p>
              <p className="text-[0.68rem] text-muted-foreground">Distress &amp; Evacuation</p>
            </div>
            <span className="font-mono font-bold text-purple-600 text-sm">1091</span>
          </a>
        </div>
      </section>
    </CitizenShell>
  );
}
