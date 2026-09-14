import { createFileRoute } from "@tanstack/react-router";
import { Database, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, StatCard } from "@/components/ner/bits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSystem } from "@/lib/ner/store";
import { DATA_SOURCES, connectedSourceCount, sourceStatus } from "@/lib/ner/adapters";
import { INNOVATION_SCORECARD } from "@/lib/ner/judge-demo";

export const Route = createFileRoute("/data-sources")({
  head: () => ({
    meta: [
      { title: "Data Sources & Confidence | NER-SAFE" },
      {
        name: "description",
        content:
          "Demo versus live data source status for NER-SAFE: weather, satellite, IoT sensors, terrain, landslide inventory, asset registers and citizen reports, with confidence and data quality.",
      },
      { property: "og:title", content: "Data Sources & Confidence — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Every screen states where its numbers come from. Adapter status, data quality and model confidence for NER-SAFE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DataSourcesPage,
});

const STATUS_CLASS: Record<string, string> = {
  SIMULATED: "border-primary/50 bg-primary/10 text-primary",
  CONNECTED: "border-risk-low/50 bg-risk-low/10 text-risk-low",
  "NOT CONFIGURED": "border-border bg-surface text-muted-foreground",
  DEGRADED: "border-risk-moderate/50 bg-risk-moderate/10 text-risk-moderate",
};

function DataSourcesPage() {
  const { mode, setMode, modeBanner, intelligence } = useSystem();
  const counts = connectedSourceCount(mode);

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-eyebrow">Trust & transparency</p>
            <h1 className="text-2xl font-semibold uppercase">Data sources & confidence</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              NER-SAFE never presents simulated values as government observations. Each data family
              is an adapter: demo mode uses local deterministic generators, live mode expects a real
              feed to be registered.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === "DEMO" ? "default" : "secondary"}
              onClick={() => setMode("DEMO")}
            >
              Demo mode
            </Button>
            <Button
              size="sm"
              variant={mode === "LIVE" ? "default" : "secondary"}
              onClick={() => setMode("LIVE")}
            >
              Live mode
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "panel p-4",
            mode === "DEMO"
              ? "border-primary/40 bg-primary/5"
              : "border-risk-moderate/40 bg-risk-moderate/5",
          )}
        >
          <p className="label-eyebrow">{modeBanner.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{modeBanner.detail}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Sources in pipeline"
            value={`${counts.connected}/${counts.total}`}
            icon={<Database className="size-4" />}
          />
          <StatCard
            label="Mean model confidence"
            value={`${Math.round(intelligence.totals.meanConfidence * 100)} %`}
            tone="accent"
          />
          <StatCard
            label="Districts at HIGH data quality"
            value={intelligence.totals.dataQualityHigh}
            tone="low"
          />
          <StatCard
            label="Multi-source confirmed alerts"
            value={intelligence.totals.confirmedAlerts}
            tone="critical"
            sub={`${intelligence.totals.watchOnly} watch-only`}
          />
        </div>

        <div className="panel overflow-x-auto p-4">
          <p className="label-eyebrow mb-2">Adapter status</p>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1.5 pr-3">Source</th>
                <th className="py-1.5 pr-3">Provider</th>
                <th className="py-1.5 pr-3">Supplies</th>
                <th className="py-1.5 pr-3">Status ({mode})</th>
                <th className="py-1.5">Integration point</th>
              </tr>
            </thead>
            <tbody>
              {DATA_SOURCES.map((s) => {
                const st = sourceStatus(mode, s.key);
                return (
                  <tr key={s.key} className="border-t border-border/70">
                    <td className="py-2 pr-3 font-medium">{s.label}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{s.provider}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{s.supplies}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold",
                          STATUS_CLASS[st],
                        )}
                      >
                        {st}
                      </span>
                    </td>
                    <td className="py-2 font-mono text-[0.7rem] text-muted-foreground">
                      {s.liveEndpointHint}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="panel overflow-x-auto p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent" />
            <p className="label-eyebrow">Why NER-SAFE — innovation scorecard</p>
          </div>
          <table className="w-full text-sm">
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

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
