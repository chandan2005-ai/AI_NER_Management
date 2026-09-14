import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, StatCard } from "@/components/ner/bits";
import { useSystem } from "@/lib/ner/store";

export const Route = createFileRoute("/rainfall")({
  head: () => ({
    meta: [
      { title: "Rainfall Analysis & Anomalies | NER-SAFE" },
      {
        name: "description",
        content:
          "Hourly to 72-hour cumulative rainfall, intensity and anomaly detection against district normals across the North Eastern Region.",
      },
      { property: "og:title", content: "Rainfall Analysis & Anomalies — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Track 1 h, 6 h, 12 h, 24 h and 72 h rainfall with anomaly flags feeding the NER-SAFE landslide risk engine.",
      },
    ],
  }),
  component: RainfallPage,
});

function RainfallPage() {
  const { snapshot } = useSystem();

  const top = [...snapshot.zones]
    .sort((a, b) => b.observation.rainfall24h - a.observation.rainfall24h)
    .slice(0, 14)
    .map((z) => ({
      name: z.district.name,
      rain24: z.observation.rainfall24h,
      normal: z.observation.rainfallNormal24h,
      anomaly: z.rainfallAnomalyPct,
    }));

  const regionalMean = Math.round(
    snapshot.zones.reduce((s, z) => s + z.observation.rainfall24h, 0) / snapshot.zones.length,
  );
  const peak = top[0];

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <h1 className="text-2xl font-semibold uppercase">Rainfall analysis</h1>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Regional mean (24 h)" value={`${regionalMean} mm`} />
          <StatCard
            label="Peak district (24 h)"
            value={`${peak?.rain24 ?? 0} mm`}
            sub={peak?.name}
            tone="accent"
          />
          <StatCard
            label="Anomaly districts"
            value={snapshot.summary.rainfallAnomalies}
            sub="above 60 % of normal"
            tone="moderate"
          />
          <StatCard
            label="Cloudburst-intensity zones"
            value={snapshot.zones.filter((z) => z.observation.rainfallIntensity > 40).length}
            sub="> 40 mm/h"
            tone="veryhigh"
          />
        </div>

        <div className="panel p-4">
          <p className="label-eyebrow mb-3">24-hour rainfall vs district normal</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                angle={-25}
                textAnchor="end"
                height={70}
                interval={0}
              />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={34} />
              <ChartTooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="normal" name="Normal mm" fill="var(--muted)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="rain24" name="Observed mm" radius={[3, 3, 0, 0]}>
                {top.map((d) => (
                  <Cell
                    key={d.name}
                    fill={
                      d.anomaly > 120
                        ? "var(--risk-critical)"
                        : d.anomaly > 60
                          ? "var(--risk-veryhigh)"
                          : d.anomaly > 20
                            ? "var(--risk-moderate)"
                            : "var(--chart-2)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-surface-2 text-left">
              <tr className="label-eyebrow">
                <th className="px-4 py-2">District</th>
                <th className="px-4 py-2">1 h</th>
                <th className="px-4 py-2">6 h</th>
                <th className="px-4 py-2">12 h</th>
                <th className="px-4 py-2">24 h</th>
                <th className="px-4 py-2">72 h</th>
                <th className="px-4 py-2">Normal 24 h</th>
                <th className="px-4 py-2">Anomaly</th>
                <th className="px-4 py-2">Intensity</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.zones.map((z) => (
                <tr key={z.district.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">
                    {z.district.name}
                    <span className="ml-2 text-xs text-muted-foreground">{z.district.state}</span>
                  </td>
                  <td className="metric px-4 py-2">{z.observation.rainfall1h}</td>
                  <td className="metric px-4 py-2">{z.observation.rainfall6h}</td>
                  <td className="metric px-4 py-2">{z.observation.rainfall12h}</td>
                  <td className="metric px-4 py-2">{z.observation.rainfall24h}</td>
                  <td className="metric px-4 py-2">{z.observation.rainfall72h}</td>
                  <td className="metric px-4 py-2 text-muted-foreground">
                    {z.observation.rainfallNormal24h}
                  </td>
                  <td
                    className={`metric px-4 py-2 ${
                      z.rainfallAnomalyPct > 60 ? "text-risk-veryhigh" : "text-muted-foreground"
                    }`}
                  >
                    {z.rainfallAnomalyPct > 0 ? "+" : ""}
                    {z.rainfallAnomalyPct} %
                  </td>
                  <td className="metric px-4 py-2">{z.observation.rainfallIntensity} mm/h</td>
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
