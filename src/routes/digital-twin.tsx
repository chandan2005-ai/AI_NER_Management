import { createFileRoute } from "@tanstack/react-router";
import { Building2, GraduationCap, Home, Satellite, Warehouse } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, RiskBadge, StatCard } from "@/components/ner/bits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSystem } from "@/lib/ner/store";
import { assetsOf } from "@/lib/ner/assets";
import { changesFor } from "@/lib/ner/satellite-change";
import { isolationBgClass } from "@/lib/ner/isolation-engine";

export const Route = createFileRoute("/digital-twin")({
  head: () => ({
    meta: [
      { title: "District Digital Twin & Impact Chain | NER-SAFE" },
      {
        name: "description",
        content:
          "Impact chain from rainfall to isolation, exposed villages, hospitals and schools, cascading hazards and satellite change candidates for each North East district.",
      },
      { property: "og:title", content: "District Digital Twin — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Who and what is affected: assets, isolation, cascading risk and terrain change per NER district.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DigitalTwinPage,
});

const KIND_ICON = {
  VILLAGE: <Home className="size-3.5" />,
  HOSPITAL: <Building2 className="size-3.5" />,
  SCHOOL: <GraduationCap className="size-3.5" />,
  SHELTER: <Warehouse className="size-3.5" />,
  "EMERGENCY DEPOT": <Warehouse className="size-3.5" />,
} as const;

function StageBar({ p }: { p: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full",
          p >= 0.62 ? "bg-risk-critical" : p >= 0.3 ? "bg-risk-high" : "bg-risk-moderate",
        )}
        style={{ width: `${Math.round(p * 100)}%` }}
      />
    </div>
  );
}

function DigitalTwinPage() {
  const { snapshot, intelligence } = useSystem();
  const [districtId, setDistrictId] = useState(snapshot.zones[0]?.district.id ?? "");
  const zone = snapshot.zones.find((z) => z.district.id === districtId) ?? snapshot.zones[0]!;
  const iso = intelligence.isolationById.get(zone.district.id)!;
  const impact = intelligence.impact.get(zone.district.id)!;
  const changes = changesFor(intelligence.changes, zone.district.id);
  const assets = assetsOf(zone.district.id);

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-eyebrow">Assess impact</p>
            <h1 className="text-2xl font-semibold uppercase">District digital twin</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              A living model of one district: the conditional impact chain, the assets and people in
              the exposure envelope, cascading hazards and satellite-detected terrain change.
            </p>
          </div>
          <Select value={districtId} onValueChange={setDistrictId}>
            <SelectTrigger className="h-9 w-[260px] text-sm">
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

        <div className="panel flex flex-wrap items-center gap-4 p-4">
          <div>
            <h2 className="text-lg font-semibold">
              {zone.district.name}, {zone.district.state}
            </h2>
            <p className="text-xs text-muted-foreground">
              {zone.district.slope}° mean slope · {zone.district.elevation} m ·{" "}
              {zone.district.historicalEvents} historical events
            </p>
          </div>
          <RiskBadge level={zone.assessment.level} />
          <span
            className={cn(
              "rounded border px-2 py-0.5 text-[0.7rem] font-semibold",
              isolationBgClass(iso.level),
            )}
          >
            ISOLATION {iso.level} · {iso.score}/100
          </span>
          <p className="ml-auto max-w-xl text-sm text-muted-foreground">{impact.summary}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Roads at risk" value={impact.roadsAtRisk} tone="high" />
          <StatCard
            label="Villages could be isolated"
            value={impact.villagesPotentiallyIsolated}
            tone="veryhigh"
          />
          <StatCard label="Hospitals affected" value={impact.hospitalsAffected} tone="critical" />
          <StatCard label="Schools affected" value={impact.schoolsAffected} tone="moderate" />
          <StatCard
            label="Population exposed"
            value={impact.populationExposed.toLocaleString("en-IN")}
            tone="accent"
            sub={`${impact.emergencyAccessReductionPct} % emergency access reduction`}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="panel p-4">
            <p className="label-eyebrow mb-3">Impact chain — conditional probabilities</p>
            <ol className="space-y-3">
              {impact.stages.map((s, i) => (
                <li key={s.key} className="rounded border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {i + 1}. {s.title}
                    </span>
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold",
                        s.status === "OBSERVED"
                          ? "border-accent/50 bg-accent/15 text-accent"
                          : s.status === "LIKELY"
                            ? "border-risk-critical/50 bg-risk-critical/15 text-risk-critical"
                            : s.status === "POSSIBLE"
                              ? "border-risk-high/50 bg-risk-high/15 text-risk-high"
                              : "border-border text-muted-foreground",
                      )}
                    >
                      {s.status} · {Math.round(s.probability * 100)} %
                    </span>
                  </div>
                  <div className="mt-2">
                    <StageBar p={s.probability} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{s.detail}</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {s.evidence.map(([k, v]) => (
                      <li key={k} className="flex justify-between gap-3 text-[0.7rem]">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="metric">{v}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-4">
            <div className="panel p-4">
              <p className="label-eyebrow mb-2">Cascading risk</p>
              <ul className="space-y-2">
                {impact.cascades.map((c) => (
                  <li key={c.title} className="rounded border border-border p-2.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{c.title}</span>
                      <span className="metric text-xs text-muted-foreground">
                        {Math.round(c.probability * 100)} %
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel p-4">
              <div className="flex items-center gap-2">
                <Satellite className="size-4 text-accent" />
                <p className="label-eyebrow">Satellite change detection</p>
              </div>
              {changes.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No terrain-change candidate above the detection threshold in this district.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {changes.map((c) => (
                    <li key={c.id} className="rounded border border-border p-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{c.changeType}</span>
                        <span className="metric text-xs text-muted-foreground">
                          {Math.round(c.confidence * 100)} % · {c.areaHa} ha
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {(
                          [
                            ["Before", c.beforeDate, c.beforeSeed],
                            ["After", c.afterDate, c.afterSeed],
                          ] as const
                        ).map(([label, date, seed]) => (
                          <div key={label} className="rounded border border-border p-1.5">
                            <p className="text-[0.65rem] uppercase text-muted-foreground">
                              {label} · {date}
                            </p>
                            <div
                              className="mt-1 h-16 rounded"
                              style={{
                                background: `repeating-linear-gradient(${seed % 180}deg, hsl(${100 + (seed % 40)} 30% ${label === "After" ? 26 : 34}%) 0 6px, hsl(${90 + (seed % 30)} 24% ${label === "After" ? 20 : 30}%) 6px 12px)`,
                              }}
                              aria-label={`${label} simulated tile`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        NDVI Δ {c.ndviDelta} · coherence drop {c.coherenceDrop} · {c.note}
                      </p>
                      <p className="mt-1 text-[0.7rem] font-semibold text-risk-moderate">
                        AI DETECTED CHANGE — FIELD VERIFICATION REQUIRED ({c.verificationStatus})
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[0.7rem] text-muted-foreground">
                Imagery tiles are procedurally generated placeholders in demo mode. Live mode
                expects Sentinel-1/2 or NRSC Bhuvan scenes through the satellite adapter.
              </p>
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <p className="label-eyebrow mb-2">Assets in the exposure envelope</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((a) => (
              <div key={a.id} className="flex items-start gap-2 rounded border border-border p-2">
                <span className="mt-0.5 text-muted-foreground">{KIND_ICON[a.kind]}</span>
                <span className="text-xs">
                  <span className="block font-medium">{a.name}</span>
                  <span className="block text-muted-foreground">
                    {a.kind} · {a.population.toLocaleString("en-IN")} · {a.connectingRoads} road
                    link(s) · hospital {a.hospitalDistanceKm} km
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <p className="label-eyebrow mb-2">Villages by isolation risk</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-1.5 pr-3">Village</th>
                  <th className="py-1.5 pr-3">Isolation</th>
                  <th className="py-1.5 pr-3">Residents</th>
                  <th className="py-1.5 pr-3">Access</th>
                  <th className="py-1.5">Hospital / depot</th>
                </tr>
              </thead>
              <tbody>
                {iso.villages.map((v) => (
                  <tr key={v.asset.id} className="border-t border-border/70">
                    <td className="py-2 pr-3 font-medium">{v.asset.name}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold",
                          isolationBgClass(v.level),
                        )}
                      >
                        {v.level} {v.score}
                      </span>
                    </td>
                    <td className="metric py-2 pr-3">
                      {v.populationServed.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {v.onlyAccessRoute ? "Single access road" : "Multiple links"}
                      {v.alternativeRoute ? " · alternate available" : " · no alternate"}
                    </td>
                    <td className="metric py-2 text-xs">
                      {v.hospitalDistanceKm} km / {v.emergencyDistanceKm} km
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
