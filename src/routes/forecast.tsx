import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, RiskBadge, TrendIndicator } from "@/components/ner/bits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSystem } from "@/lib/ner/store";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "6–72 Hour Landslide Risk Forecast | NER-SAFE" },
      {
        name: "description",
        content:
          "Projected landslide risk for the next 6, 12, 24, 48 and 72 hours per NER district, driven by rainfall forecasts and soil infiltration balance.",
      },
      { property: "og:title", content: "6–72 Hour Landslide Risk Forecast — NER-SAFE" },
      {
        property: "og:description",
        content:
          "See how landslide risk is projected to evolve over the next three days across North East India.",
      },
    ],
  }),
  component: ForecastPage,
});

function ForecastPage() {
  const { snapshot } = useSystem();
  const [zoneId, setZoneId] = useState(snapshot.zones[0]!.district.id);
  const zone = snapshot.zones.find((z) => z.district.id === zoneId) ?? snapshot.zones[0]!;

  const series = [
    { label: "now", score: zone.assessment.score, rainfall: zone.observation.rainfall24h },
    ...zone.forecast.map((f) => ({
      label: `+${f.horizon}h`,
      score: f.score,
      rainfall: f.rainfall,
    })),
  ];

  const peak = zone.forecast.reduce((a, b) => (b.score > a.score ? b : a), zone.forecast[0]!);

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold uppercase">Risk forecast</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Rainfall forecast propagated through an infiltration/drainage balance and re-scored.
            </p>
          </div>
          <Select value={zoneId} onValueChange={setZoneId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {snapshot.zones.map((z) => (
                <SelectItem key={z.district.id} value={z.district.id}>
                  {z.district.name} — {z.district.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="panel p-4">
            <p className="label-eyebrow mb-3">
              Projected risk score — {zone.district.name}, {zone.district.state}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={series}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  width={30}
                />
                <ChartTooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Risk score"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="rainfall"
                  name="Forecast rainfall (mm)"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="panel space-y-3 p-4">
            <div>
              <p className="label-eyebrow">Current</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="metric text-3xl">{zone.assessment.score}</span>
                <RiskBadge level={zone.assessment.level} />
              </div>
              <div className="mt-1">
                <TrendIndicator trend={zone.trend} />
              </div>
            </div>
            <div>
              <p className="label-eyebrow">Projected peak</p>
              <p className="mt-1 flex items-center gap-2">
                <span className="metric text-2xl">{peak.score}</span>
                <RiskBadge level={peak.level} />
                <span className="text-xs text-muted-foreground">at +{peak.horizon} h</span>
              </p>
            </div>
            <div className="space-y-1.5">
              {zone.forecast.map((f) => (
                <div
                  key={f.horizon}
                  className="flex items-center justify-between gap-2 border-b border-border/60 pb-1 text-xs"
                >
                  <span className="text-muted-foreground">+{f.horizon} h</span>
                  <span className="metric">{f.rainfall} mm</span>
                  <span className="metric">{f.score}</span>
                  <RiskBadge level={f.level} />
                </div>
              ))}
            </div>
            <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
              Forecast uncertainty grows with the horizon. Beyond 24 hours, treat values as planning
              guidance rather than an operational trigger.
            </p>
          </div>
        </div>

        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-2 text-left">
              <tr className="label-eyebrow">
                <th className="px-4 py-2">District</th>
                <th className="px-4 py-2">Now</th>
                <th className="px-4 py-2">+6 h</th>
                <th className="px-4 py-2">+12 h</th>
                <th className="px-4 py-2">+24 h</th>
                <th className="px-4 py-2">+48 h</th>
                <th className="px-4 py-2">+72 h</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.zones.map((z) => (
                <tr key={z.district.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">
                    {z.district.name}
                    <span className="ml-2 text-xs text-muted-foreground">{z.district.state}</span>
                  </td>
                  <td className="metric px-4 py-2">{z.assessment.score}</td>
                  {z.forecast.map((f) => (
                    <td key={f.horizon} className="metric px-4 py-2">
                      {f.score}
                    </td>
                  ))}
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
