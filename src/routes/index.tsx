import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ActivitySquare,
  Brain,
  CloudRain,
  Gauge,
  Globe,
  Languages,
  Lock,
  MapPinned,
  Radio,
  Satellite,
  ShieldAlert,
  Siren,
  Users,
  WifiOff,
  Info,
  Accessibility,
} from "lucide-react";

import heroImage from "@/assets/ner-hero.jpg";
import { Button } from "@/components/ui/button";
import { DemoDataNotice, RiskBadge } from "@/components/ner/bits";
import { getRegionSummary } from "@/lib/ner/snapshot.functions";
import { NER_STATES } from "@/lib/ner/districts";
import { INNOVATION_SCORECARD } from "@/lib/ner/judge-demo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NER-SAFE — AI-Powered Landslide Risk Monitoring & Early Warning" },
      {
        name: "description",
        content:
          "NER-SAFE protects communities across the North Eastern Region through intelligent landslide risk monitoring, early warnings, and coordinated response.",
      },
      {
        property: "og:title",
        content: "NER-SAFE — AI Landslide Early Warning for North East India",
      },
      {
        property: "og:description",
        content:
          "Explainable landslide risk scoring, live GIS monitoring, road connectivity tracking and multilingual early warnings for the North Eastern Region.",
      },
    ],
  }),
  loader: () => getRegionSummary(),
  component: Landing,
});

const FEATURES = [
  {
    icon: <Brain className="size-5" />,
    title: "Explainable risk engine",
    body: "Every 0–100 score decomposes into per-factor point contributions — rainfall, slope, soil moisture, history, satellite anomaly, field reports.",
  },
  {
    icon: <MapPinned className="size-5" />,
    title: "Interactive GIS dashboard",
    body: "Toggleable layers for risk, rainfall, soil, slope, roads, villages, shelters, reports and sensors over an OpenStreetMap basemap.",
  },
  {
    icon: <CloudRain className="size-5" />,
    title: "Rainfall analytics",
    body: "1 h, 6 h, 12 h, 24 h and 72 h cumulative rainfall with anomaly detection against district normals.",
  },
  {
    icon: <Radio className="size-5" />,
    title: "Sensor & IoT telemetry",
    body: "Soil moisture, rain gauges, inclinometers, ground movement and water level with battery, freshness and data-quality flags.",
  },
  {
    icon: <Siren className="size-5" />,
    title: "Four-level alert engine",
    body: "Information, Watch, Warning and Critical alerts routed to administration, police, PWD and community channels.",
  },
  {
    icon: <ActivitySquare className="size-5" />,
    title: "6–72 h risk forecast",
    body: "Rainfall forecasts propagated through an infiltration balance to project risk trajectories per district.",
  },
  {
    icon: <WifiOff className="size-5" />,
    title: "Low-network & offline mode",
    body: "Field reports are captured offline and background-synced when connectivity returns — built for remote hill terrain.",
  },
  {
    icon: <Languages className="size-5" />,
    title: "Multilingual alerts",
    body: "English, Hindi and Assamese fully translated, with Bengali and Nepali scaffolding in place.",
  },
  {
    icon: <Satellite className="size-5" />,
    title: "Pluggable data adapters",
    body: "Weather, satellite and sensor adapters are abstracted — connect IMD, Sentinel-1/2 or field hardware without touching the risk engine.",
  },
];

function Landing() {
  const data = Route.useLoaderData();
  const summary = data?.summary ?? {
    monitoredZones: 8,
    critical: 2,
    activeAlerts: 3,
    activeSensors: 42,
    totalSensors: 48,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <span className="grid size-8 place-items-center rounded bg-primary text-primary-foreground">
            <Gauge className="size-4" />
          </span>
          <span className="font-display text-lg font-bold tracking-[0.14em]">NER-SAFE</span>
          <nav className="ml-auto hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <a href="#access" className="hover:text-foreground">
              Access
            </a>
            <a href="#problem" className="hover:text-foreground">
              Problem
            </a>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#technology" className="hover:text-foreground">
              Technology
            </a>
          </nav>
          <Button asChild size="sm" className="ml-auto md:ml-4">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="Monsoon clouds over a landslide scar cutting across a hill road in North East India"
          width={1600}
          height={912}
          className="absolute inset-0 size-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <span className="label-eyebrow">Disaster management · North Eastern Region of India</span>
          <h1 className="mt-3 font-display text-5xl leading-[1.05] font-bold sm:text-7xl">
            NER-SAFE
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            AI-Powered Landslide Risk Monitoring &amp; Early Warning
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Protecting communities across the North Eastern Region through intelligent risk
            monitoring, early warnings and coordinated response.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="panel p-4 bg-white/90">
              <p className="label-eyebrow">Monitored zones</p>
              <p className="metric mt-1 text-3xl font-semibold text-foreground">
                {summary.monitoredZones}
              </p>
              <p className="text-xs text-muted-foreground">across {NER_STATES.length} states</p>
            </div>
            <div className="panel p-4 bg-white/90">
              <p className="label-eyebrow">Critical zones</p>
              <p className="metric mt-1 text-3xl font-semibold text-red-600">{summary.critical}</p>
              <p className="text-xs text-muted-foreground">score above 80</p>
            </div>
            <div className="panel p-4 bg-white/90">
              <p className="label-eyebrow">Active alerts</p>
              <p className="metric mt-1 text-3xl font-semibold text-primary">
                {summary.activeAlerts}
              </p>
              <p className="text-xs text-muted-foreground">4-level escalation engine</p>
            </div>
            <div className="panel p-4 bg-white/90">
              <p className="label-eyebrow">Sensors reporting</p>
              <p className="metric mt-1 text-3xl font-semibold text-foreground">
                {summary.activeSensors}/{summary.totalSensors}
              </p>
              <p className="text-xs text-muted-foreground">simulated IoT network</p>
            </div>
          </div>

          {/* Quick Launch Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-risk-low text-white hover:bg-risk-low/90 shadow-md"
            >
              <Link to="/auth" search={{ role: "citizen", mode: "signin" }}>
                <Users className="size-4 mr-2" />
                Open Citizen Public Portal
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white/90 hover:bg-white text-foreground shadow-sm"
            >
              <Link to="/auth" search={{ role: "authority", mode: "signin" }}>
                <Lock className="size-4 mr-2 text-risk-critical" />
                Official Authority Console
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <a href="tel:112" className="flex items-center gap-1.5 text-red-600 font-bold">
                <Siren className="size-4 animate-pulse" />
                Emergency 112
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== DUAL-PORTAL ACCESS SECTION ===== */}
      <section id="access" className="border-y border-border bg-surface/30">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <div className="text-center">
            <span className="label-eyebrow">Secure access</span>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase">
              Choose your interface
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
              Two completely separate experiences. Community users see public safety information
              only. Operational data stays inside the restricted authority interface.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {/* Authority card */}
            <div className="relative overflow-hidden rounded-xl border-2 border-risk-critical/40 bg-surface p-7 shadow-lg transition-shadow hover:shadow-risk-critical/10">
              <div className="absolute inset-0 bg-gradient-to-br from-risk-critical/5 to-transparent pointer-events-none" />
              <div className="relative">
                <span className="grid size-12 place-items-center rounded-lg bg-risk-critical/15 text-risk-critical">
                  <Lock className="size-6" />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold tracking-wide">
                  🏛️ Authority Access
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-risk-critical">
                  Restricted · Verified personnel only
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <ShieldAlert className="size-3.5 shrink-0 text-risk-critical" />
                    Disaster Management Agencies
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldAlert className="size-3.5 shrink-0 text-risk-critical" />
                    Government Officials
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldAlert className="size-3.5 shrink-0 text-risk-critical" />
                    Authorized Emergency Response Personnel
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldAlert className="size-3.5 shrink-0 text-risk-critical" />
                    Requires Administrator Account Approval
                  </li>
                </ul>
                <div className="mt-5 space-y-2">
                  <Button asChild className="w-full" size="lg">
                    <Link to="/auth" search={{ role: "authority", mode: "signin" }}>
                      Authority Sign In
                    </Link>
                  </Button>
                  <div className="text-center">
                    <Link
                      to="/auth"
                      search={{ role: "authority", mode: "signup" }}
                      className="text-[0.72rem] text-primary hover:underline font-semibold"
                    >
                      Register New Authority Account →
                    </Link>
                  </div>
                  <p className="mt-1 text-center text-[0.7rem] text-risk-critical">
                    🔐 Restricted access. Authorized personnel only.
                  </p>
                </div>
              </div>
            </div>

            {/* Citizen card */}
            <div className="relative overflow-hidden rounded-xl border-2 border-risk-low/40 bg-surface p-7 shadow-lg transition-shadow hover:shadow-risk-low/10">
              <div className="absolute inset-0 bg-gradient-to-br from-risk-low/5 to-transparent pointer-events-none" />
              <div className="relative">
                <span className="grid size-12 place-items-center rounded-lg bg-risk-low/15 text-risk-low">
                  <Users className="size-6" />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold tracking-wide">
                  👥 Citizen Access
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-risk-low">
                  Open · Free community account
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Siren className="size-3.5 shrink-0 text-risk-low" />
                    Local Communities &amp; Students
                  </li>
                  <li className="flex items-center gap-2">
                    <Siren className="size-3.5 shrink-0 text-risk-low" />
                    SMS &amp; Email Alert Notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <Siren className="size-3.5 shrink-0 text-risk-low" />
                    Tourists &amp; Visitors in NER
                  </li>
                  <li className="flex items-center gap-2">
                    <Siren className="size-3.5 shrink-0 text-risk-low" />
                    Instant Access · Free Registration
                  </li>
                </ul>
                <div className="mt-5 space-y-2">
                  <Button asChild className="w-full" size="lg" variant="secondary">
                    <Link to="/auth" search={{ role: "citizen", mode: "signin" }}>
                      Citizen Sign In
                    </Link>
                  </Button>
                  <div className="text-center">
                    <Link
                      to="/auth"
                      search={{ role: "citizen", mode: "signup" }}
                      className="text-[0.72rem] text-risk-low hover:underline font-semibold"
                    >
                      Create Free Citizen Account →
                    </Link>
                  </div>
                  <p className="mt-1 text-center text-[0.7rem] text-muted-foreground">
                    ℹ️ Access local safety information, public alerts and hazard reporting.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-7 flex flex-wrap justify-center gap-5 text-xs text-muted-foreground">
            <a href="tel:112" className="flex items-center gap-1.5 hover:text-foreground">
              <Siren className="size-3.5" /> Emergency Information
            </a>
            <Link to="/" className="flex items-center gap-1.5 hover:text-foreground">
              <ShieldAlert className="size-3.5" /> Privacy &amp; Security
            </Link>
            <Link to="/" className="flex items-center gap-1.5 hover:text-foreground">
              <Accessibility className="size-3.5" /> Accessibility
            </Link>
            <Link to="/" className="flex items-center gap-1.5 hover:text-foreground">
              <Globe className="size-3.5" /> Language
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="grid-backdrop border-y border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <span className="label-eyebrow">The problem</span>
          <h2 className="mt-2 text-3xl font-semibold uppercase">Monitoring today is reactive</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              [
                "Extreme, orographic rainfall",
                "Meghalaya and Sikkim receive some of the highest rainfall on Earth; short cloudbursts saturate hill slopes within hours.",
              ],
              [
                "Fragile, cut hill slopes",
                "Hill-cutting for roads and settlements removes lateral support, leaving unstable cut faces above highways and villages.",
              ],
              [
                "Manual, delayed reporting",
                "Damage is usually confirmed after the event; road blockages isolate villages before authorities can pre-position resources.",
              ],
            ].map(([t, b]) => (
              <div key={t} className="panel p-5">
                <h3 className="text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <span className="label-eyebrow">Features</span>
          <h2 className="mt-2 text-3xl font-semibold uppercase">Built for an operations centre</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="panel p-5">
                <span className="grid size-9 place-items-center rounded bg-primary/15 text-primary">
                  {f.icon}
                </span>
                <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="mx-auto max-w-6xl px-4 py-16">
        <span className="label-eyebrow">Technology</span>
        <h2 className="mt-2 text-3xl font-semibold uppercase">Stack</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="panel p-5">
            <h3 className="text-base font-semibold">Application</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              React 19 · TypeScript · TanStack Start (SSR + typed server functions) · TanStack Query
              · Tailwind CSS v4 design tokens · Recharts
            </p>
          </div>
          <div className="panel p-5">
            <h3 className="text-base font-semibold">Geospatial</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Leaflet + OpenStreetMap basemap · GeoJSON-ready layer model · district centroid and
              slope-buffer geometry · client-only map bundle for SSR safety
            </p>
          </div>
          <div className="panel p-5">
            <h3 className="text-base font-semibold">Security</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Supabase auth · Row-Level Security on all tables · server-side RBAC enforcement · MFA
              for authority accounts · audit logging · pluggable SMS gateway
            </p>
          </div>
        </div>

        <div className="mt-6 panel overflow-x-auto p-5">
          <h3 className="text-base font-semibold uppercase">Innovation scorecard</h3>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1.5 pr-3">Capability</th>
                <th className="py-1.5 pr-3">Typical dashboard</th>
                <th className="py-1.5">NER-SAFE</th>
              </tr>
            </thead>
            <tbody>
              {INNOVATION_SCORECARD.map((r) => (
                <tr key={r.capability} className="border-t border-border/70">
                  <td className="py-2 pr-3 font-medium">{r.capability}</td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">{r.typical}</td>
                  <td className="py-2 text-xs text-risk-low">{r.nerSafe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Preparedness */}
      <section className="border-t border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <span className="label-eyebrow">Emergency preparedness</span>
          <h2 className="mt-2 text-3xl font-semibold uppercase">During heavy rainfall</h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "Avoid travel on hill cut sections during and immediately after intense rainfall.",
              "Watch for new cracks, tilting trees or poles, and sudden muddy spring flow above your home.",
              "Keep an emergency kit, torch, charged phone and your village shelter route ready.",
              "Report cracks, debris or blockages through NER-SAFE — reports feed directly into the risk model.",
            ].map((tip) => (
              <li key={tip} className="panel flex gap-3 p-4 text-sm">
                <Siren className="size-4 shrink-0 text-primary" />
                {tip}
              </li>
            ))}
          </ul>

          <div className="mt-8 panel flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h3 className="text-xl font-semibold uppercase">Emergency: Call 112</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                National emergency number · Police · Fire · Medical · available 24/7
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ role: "citizen" }}>
                  Open Community App
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth" search={{ role: "authority" }}>
                  Authority Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl space-y-3 px-4">
          <p className="font-display text-sm tracking-[0.2em]">NER-SAFE</p>
          <DemoDataNotice />
          <p className="text-[0.7rem] text-muted-foreground">
            Not an officially certified emergency-response system. Built as a demonstrable
            decision-support prototype for the North Eastern Region. All data shown is simulated.
          </p>
          <div className="flex flex-wrap gap-4 text-[0.7rem] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Info className="size-3" /> Public Safety Interface
            </span>
            <span className="flex items-center gap-1">
              <ShieldAlert className="size-3" /> Role-based access control enforced at backend +
              database level
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
