import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Building2, Radar, Users } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, RiskBadge, ScoreMeter, StatCard } from "@/components/ner/bits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSystem } from "@/lib/ner/store";
import { isolationBgClass } from "@/lib/ner/isolation-engine";
import { lifelinePriorityClass } from "@/lib/ner/lifeline-engine";

export const Route = createFileRoute("/command-center")({
  head: () => ({
    meta: [
      { title: "Decision Command Center | NER-SAFE" },
      {
        name: "description",
        content:
          "One-screen disaster decision intelligence for the North East: highest risk districts, communities at risk of isolation, threatened lifeline roads and the most urgent recommended action.",
      },
      { property: "og:title", content: "Decision Command Center — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Predict, explain, simulate, assess impact, prioritise and act — the NER-SAFE regional command picture.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandCenter,
});

function CommandCenter() {
  const { snapshot, intelligence, modeBanner, lastUpdate } = useSystem();
  const { totals, isolationById, lifelines, evidence, plans } = intelligence;
  const zones = snapshot.zones;
  const [selected, setSelected] = useState(zones[0]?.district.id ?? "");
  const zone = zones.find((z) => z.district.id === selected) ?? zones[0]!;
  const iso = isolationById.get(zone.district.id)!;
  const ev = evidence.get(zone.district.id)!;
  const plan = plans.get(zone.district.id)!;
  const topLifelines = lifelines.slice(0, 6);
  const urgent = plan.actions[0];

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-eyebrow">
              Predict → Explain → Simulate → Impact → Prioritise → Act
            </p>
            <h1 className="text-2xl font-semibold uppercase">Decision command center</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {modeBanner.label} · updated {lastUpdate}. {modeBanner.detail}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to="/simulator">Run what-if</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/resources">Allocate resources</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Districts at very high / critical risk"
            value={totals.criticalZones}
            tone="critical"
            sub={`${totals.confirmedAlerts} multi-source confirmed`}
            icon={<AlertTriangle className="size-4" />}
          />
          <StatCard
            label="Communities at isolation risk"
            value={totals.villagesAtRisk}
            tone="veryhigh"
            sub={`${totals.criticalIsolation} districts at critical isolation`}
            icon={<Users className="size-4" />}
          />
          <StatCard
            label="Lifeline roads threatened"
            value={totals.roadsAtRisk}
            tone="high"
            sub={`${totals.criticalLifelines} critical lifelines`}
          />
          <StatCard
            label="Population in exposure envelope"
            value={totals.populationExposed.toLocaleString("en-IN")}
            tone="moderate"
            sub={`${totals.hospitalsAtRisk} hospitals · ${totals.schoolsAtRisk} schools`}
            icon={<Building2 className="size-4" />}
          />
        </div>

        {/* Most urgent action */}
        <div className="panel border-risk-critical/40 bg-risk-critical/5 p-4">
          <p className="label-eyebrow text-risk-critical">Most urgent recommended action</p>
          <h2 className="mt-1 text-lg font-semibold">{urgent?.action}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{plan.why}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{urgent?.within}</span>
            <span>Owner: {urgent?.owner}</span>
            <span>Reassess in {plan.reassessHours} h</span>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Priority districts */}
          <div className="panel p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
              Priority districts
            </h2>
            <ul className="space-y-2">
              {zones.slice(0, 10).map((z) => {
                const i = isolationById.get(z.district.id)!;
                const active = z.district.id === selected;
                return (
                  <li key={z.district.id}>
                    <button
                      onClick={() => setSelected(z.district.id)}
                      className={cn(
                        "w-full rounded border p-3 text-left transition-colors",
                        active
                          ? "border-primary/60 bg-primary/10"
                          : "border-border hover:bg-surface",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {z.district.name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {z.district.state}
                          </span>
                        </span>
                        <RiskBadge level={z.assessment.level} />
                      </div>
                      <div className="mt-2">
                        <ScoreMeter score={z.assessment.score} level={z.assessment.level} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.7rem] text-muted-foreground">
                        <span className="metric">{z.assessment.score}/100 risk</span>
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 font-semibold",
                            isolationBgClass(i.level),
                          )}
                        >
                          isolation {i.score}
                        </span>
                        <span>
                          {Math.round(z.assessment.probability * 100)} % hazard probability
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Selected district intelligence */}
          <div className="space-y-4">
            <div className="panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="label-eyebrow">Evidence fusion</p>
                  <h2 className="text-lg font-semibold">
                    {zone.district.name}, {zone.district.state}
                  </h2>
                </div>
                <span
                  className={cn(
                    "rounded border px-2 py-1 text-[0.7rem] font-semibold uppercase",
                    ev.verdict === "MULTI-SOURCE CONFIRMED"
                      ? "border-risk-critical/50 bg-risk-critical/15 text-risk-critical"
                      : ev.verdict === "PARTIALLY CORROBORATED"
                        ? "border-risk-high/50 bg-risk-high/15 text-risk-high"
                        : "border-border bg-surface text-muted-foreground",
                  )}
                >
                  {ev.verdict}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{ev.summary}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {ev.sources.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-start gap-2 rounded border border-border p-2 text-xs"
                  >
                    <span
                      className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        !s.available
                          ? "bg-muted-foreground"
                          : s.corroborating
                            ? "bg-risk-critical"
                            : "bg-risk-low",
                      )}
                    />
                    <span>
                      <span className="font-medium">{s.label}</span>
                      <span className="block text-muted-foreground">{s.detail}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Confidence {Math.round(ev.confidence * 100)} %</span>
                <span>Data quality {ev.dataQuality}</span>
                <span>Freshest input {ev.freshestInputMinutes} min old</span>
                <span>
                  {ev.availableCount}/{ev.totalSources} sources available
                </span>
              </div>
            </div>

            <div className="panel p-4">
              <p className="label-eyebrow">Community isolation risk</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="metric text-2xl font-semibold">{iso.score}/100</span>
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-[0.7rem] font-semibold",
                    isolationBgClass(iso.level),
                  )}
                >
                  {iso.level}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{iso.recommendation}</p>
              <ul className="mt-3 space-y-1.5">
                {iso.factors.slice(0, 5).map((f) => (
                  <li key={f.label} className="flex items-baseline justify-between gap-3 text-xs">
                    <span>
                      <span className="font-medium">{f.label}</span>
                      <span className="ml-2 text-muted-foreground">{f.value}</span>
                    </span>
                    <span className="metric text-risk-high">+{f.points}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel p-4">
              <p className="label-eyebrow">Ordered response plan</p>
              <h3 className="mt-1 text-sm font-semibold">{plan.headline}</h3>
              <ol className="mt-3 space-y-2">
                {plan.actions.map((a) => (
                  <li key={a.order} className="rounded border border-border p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">
                        {a.order}. {a.action}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold",
                          a.priority === "IMMEDIATE"
                            ? "border-risk-critical/50 bg-risk-critical/15 text-risk-critical"
                            : a.priority === "HIGH"
                              ? "border-risk-high/50 bg-risk-high/15 text-risk-high"
                              : "border-border text-muted-foreground",
                        )}
                      >
                        {a.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.rationale}</p>
                    <p className="mt-1 text-[0.7rem] text-muted-foreground">
                      {a.within} · {a.owner}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Lifelines snapshot */}
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Lifeline roads — highest consequence of loss
            </h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/lifelines">All lifelines</Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-1.5 pr-3">Road</th>
                  <th className="py-1.5 pr-3">Priority</th>
                  <th className="py-1.5 pr-3">Blockage prob.</th>
                  <th className="py-1.5 pr-3">Population dependent</th>
                  <th className="py-1.5">Alternate route</th>
                </tr>
              </thead>
              <tbody>
                {topLifelines.map((l) => (
                  <tr key={l.road.id} className="border-t border-border/70">
                    <td className="py-2 pr-3">
                      <span className="font-medium">{l.road.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {l.road.district}, {l.road.state}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold",
                          lifelinePriorityClass(l.priority),
                        )}
                      >
                        {l.priority}
                      </span>
                    </td>
                    <td className="metric py-2 pr-3">
                      {Math.round(l.blockageProbability * 100)} %
                    </td>
                    <td className="metric py-2 pr-3">
                      {l.populationDependency.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {l.alternativeRouteLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <Radar className="size-4 text-accent" />
            <p className="label-eyebrow">Satellite change candidates</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {totals.satelliteDetections} terrain-change candidate(s) detected. AI DETECTED CHANGE —
            FIELD VERIFICATION REQUIRED before any determination.
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-3">
            <Link to="/digital-twin">Open impact & change view</Link>
          </Button>
        </div>

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
