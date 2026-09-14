import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, RiskBadge, ScoreMeter } from "@/components/ner/bits";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSystem } from "@/lib/ner/store";
import { DEFAULT_SCENARIO, SCENARIO_PRESETS, simulate, type Scenario } from "@/lib/ner/simulator";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "What-If Disaster Simulator | NER-SAFE" },
      {
        name: "description",
        content:
          "Simulate rainfall increase, saturation, slope creep, road blockage, sensor failure and compound hazards, and see the recomputed risk, isolation, lifeline and impact deltas.",
      },
      { property: "og:title", content: "What-If Disaster Simulator — NER-SAFE" },
      {
        property: "og:description",
        content: "Before vs after decision intelligence for hypothetical NER landslide scenarios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimulatorPage,
});

function Delta({
  value,
  unit = "",
  invert = false,
}: {
  value: number;
  unit?: string;
  invert?: boolean;
}) {
  const bad = invert ? value < 0 : value > 0;
  const neutral = value === 0;
  return (
    <span
      className={cn(
        "metric text-sm font-semibold",
        neutral ? "text-muted-foreground" : bad ? "text-risk-critical" : "text-risk-low",
      )}
    >
      {value > 0 ? "+" : ""}
      {value}
      {unit}
    </span>
  );
}

function SidePanel({
  title,
  side,
  tone,
}: {
  title: string;
  side: import("@/lib/ner/simulator").SimulationSide;
  tone: "before" | "after";
}) {
  return (
    <div
      className={cn(
        "panel p-4",
        tone === "after" ? "border-risk-high/40 bg-risk-high/5" : "border-border",
      )}
    >
      <p className="label-eyebrow">{title}</p>
      <div className="mt-1 flex items-center gap-3">
        <span className="metric text-3xl font-semibold">{side.assessment.score}</span>
        <RiskBadge level={side.assessment.level} />
      </div>
      <div className="mt-2">
        <ScoreMeter score={side.assessment.score} level={side.assessment.level} />
      </div>
      <dl className="mt-3 space-y-1.5 text-xs">
        {[
          ["Hazard probability (24 h)", `${Math.round(side.assessment.probability * 100)} %`],
          ["Model confidence", `${Math.round(side.assessment.confidence * 100)} %`],
          ["Isolation risk", `${side.isolation.score}/100 (${side.isolation.level})`],
          ["Roads affected", `${side.roadsAffected}`],
          ["Critical lifelines", `${side.criticalLifelines}`],
          ["Villages potentially isolated", `${side.villagesIsolated}`],
          ["Hospitals affected", `${side.hospitalsAffected}`],
          ["Population exposed", side.populationExposed.toLocaleString("en-IN")],
          ["Emergency access reduction", `${side.emergencyAccessReductionPct} %`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="metric">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SimulatorPage() {
  const { snapshot, intelligence } = useSystem();
  const [districtId, setDistrictId] = useState(snapshot.zones[0]?.district.id ?? "");
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);

  const result = useMemo(
    () => simulate(snapshot, districtId || snapshot.zones[0]!.district.id, scenario),
    [snapshot, districtId, scenario],
  );

  const patch = (p: Partial<Scenario>) => setScenario((s) => ({ ...s, ...p }));

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <div>
          <p className="label-eyebrow">Simulate</p>
          <h1 className="text-2xl font-semibold uppercase">What-if disaster simulator</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Adjust the drivers and the full chain is recomputed — risk score, hazard probability,
            community isolation, lifeline criticality, exposure and emergency access — as BEFORE vs
            AFTER. Nothing here is a forecast; it is a hypothetical stress test of the current
            state.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          {/* Controls */}
          <div className="panel space-y-4 p-4">
            <div>
              <Label className="text-xs text-muted-foreground">District</Label>
              <Select value={districtId} onValueChange={setDistrictId}>
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {snapshot.zones.map((z) => (
                    <SelectItem key={z.district.id} value={z.district.id} className="text-sm">
                      {z.district.name} — {z.district.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="label-eyebrow mb-2">Scenario presets</p>
              <div className="flex flex-wrap gap-2">
                {SCENARIO_PRESETS.map((p) => (
                  <Button
                    key={p.id}
                    size="sm"
                    variant="secondary"
                    title={p.description}
                    onClick={() => setScenario(p.scenario)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-3">
              <div>
                <div className="flex justify-between text-xs">
                  <Label>Rainfall change</Label>
                  <span className="metric">
                    {scenario.rainfallPct > 0 ? "+" : ""}
                    {scenario.rainfallPct} %
                  </span>
                </div>
                <Slider
                  className="mt-2"
                  min={-50}
                  max={100}
                  step={5}
                  value={[scenario.rainfallPct]}
                  onValueChange={([v]) => patch({ rainfallPct: v ?? 0 })}
                />
              </div>
              <div>
                <div className="flex justify-between text-xs">
                  <Label>Soil moisture</Label>
                  <span className="metric">+{scenario.soilMoistureDelta} pp</span>
                </div>
                <Slider
                  className="mt-2"
                  min={0}
                  max={30}
                  step={1}
                  value={[scenario.soilMoistureDelta]}
                  onValueChange={([v]) => patch({ soilMoistureDelta: v ?? 0 })}
                />
              </div>
              <div>
                <div className="flex justify-between text-xs">
                  <Label>Ground movement</Label>
                  <span className="metric">+{scenario.groundMovementDelta} mm/24 h</span>
                </div>
                <Slider
                  className="mt-2"
                  min={0}
                  max={20}
                  step={0.5}
                  value={[scenario.groundMovementDelta]}
                  onValueChange={([v]) => patch({ groundMovementDelta: v ?? 0 })}
                />
              </div>
              <div>
                <div className="flex justify-between text-xs">
                  <Label>Slope instability</Label>
                  <span className="metric">+{scenario.slopeInstabilityDelta}°</span>
                </div>
                <Slider
                  className="mt-2"
                  min={0}
                  max={15}
                  step={1}
                  value={[scenario.slopeInstabilityDelta]}
                  onValueChange={([v]) => patch({ slopeInstabilityDelta: v ?? 0 })}
                />
              </div>

              {[
                ["roadBlockage", "Force road blockage"],
                ["sensorFailure", "Sensor network failure"],
                ["multiHazard", "Compound multi-hazard"],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-xs">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={scenario[key as "roadBlockage"]}
                    onCheckedChange={(v) =>
                      patch({ [key as "roadBlockage"]: v } as Partial<Scenario>)
                    }
                  />
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setScenario(DEFAULT_SCENARIO)}
            >
              Reset scenario
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="panel border-primary/40 bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="size-4 text-primary" />
                <p className="label-eyebrow text-primary">Scenario outcome</p>
              </div>
              <h2 className="mt-1 text-lg font-semibold">
                {result.district}, {result.state}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{result.narrative}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Risk score", <Delta key="s" value={result.deltas.score} />],
                  [
                    "Hazard probability",
                    <Delta key="p" value={result.deltas.probability} unit=" pp" />,
                  ],
                  ["Isolation risk", <Delta key="i" value={result.deltas.isolation} />],
                  ["Emergency access", <Delta key="a" value={result.deltas.access} unit=" pp" />],
                  ["Roads affected", <Delta key="r" value={result.deltas.roads} />],
                  ["Villages isolated", <Delta key="v" value={result.deltas.villages} />],
                  ["Population exposed", <Delta key="pop" value={result.deltas.population} />],
                  [
                    "Model confidence",
                    <Delta key="c" value={result.deltas.confidence} unit=" pp" invert />,
                  ],
                ].map(([label, node]) => (
                  <div key={String(label)} className="rounded border border-border p-2">
                    <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <div className="mt-0.5">{node}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SidePanel title="Before — current state" side={result.before} tone="before" />
              <SidePanel title="After — scenario applied" side={result.after} tone="after" />
            </div>

            <div className="panel p-4">
              <p className="label-eyebrow">If this scenario occurs, do this</p>
              <ol className="mt-2 space-y-1.5 text-sm">
                {result.recommendation.map((r, i) => (
                  <li key={r} className="flex gap-2">
                    <span className="metric text-muted-foreground">{i + 1}.</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="panel p-4">
              <p className="label-eyebrow">Scenario impact chain</p>
              <ul className="mt-2 space-y-2">
                {result.after.impact.stages.map((s) => (
                  <li key={s.key} className="rounded border border-border p-2.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{s.title}</span>
                      <span className="metric text-xs text-muted-foreground">
                        {Math.round(s.probability * 100)} % · {s.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[0.7rem] text-muted-foreground">
                Regional view: {intelligence.totals.criticalZones} district(s) already at very high
                or critical risk before any scenario is applied.
              </p>
            </div>
          </div>
        </div>

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
