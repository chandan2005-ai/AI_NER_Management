import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CloudRain, Radio, ShieldAlert, TriangleAlert, Users } from "lucide-react";

import { AppShell } from "@/components/ner/AppShell";
import { RiskMap } from "@/components/ner/RiskMap";
import { ZoneDetail } from "@/components/ner/ZoneDetail";
import { DemoDataNotice, RiskBadge, StatCard } from "@/components/ner/bits";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mergeReports, useSystem } from "@/lib/ner/store";
import { RISK_COLORS, RISK_LEVELS } from "@/lib/ner/risk-engine";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Live Risk Dashboard | NER-SAFE Landslide Early Warning" },
      {
        name: "description",
        content:
          "Live NER-SAFE operations dashboard: landslide risk scores, GIS heatmap, rainfall trends, sensor health and emergency response priorities across North East India.",
      },
      { property: "og:title", content: "NER-SAFE Live Risk Dashboard" },
      {
        property: "og:description",
        content:
          "Monitor landslide risk, rainfall, sensors and road connectivity across the eight North Eastern states in real time.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { snapshot, localReports } = useSystem();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reports = useMemo(() => mergeReports(snapshot, localReports), [snapshot, localReports]);
  const selected = snapshot.zones.find((z) => z.district.id === selectedId) ?? snapshot.zones[0]!;

  const distribution = RISK_LEVELS.map((level) => ({
    level,
    count: snapshot.zones.filter((z) => z.assessment.level === level).length,
  }));

  const sensorStatus = ["NORMAL", "WARNING", "CRITICAL", "OFFLINE"].map((status) => ({
    status,
    count: snapshot.sensors.filter((s) => s.status === status).length,
  }));

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <div>
          <h1 className="text-2xl font-semibold uppercase">Operations dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live landslide risk across {snapshot.summary.monitoredZones} monitored districts of the
            North Eastern Region.
          </p>
        </div>

        {/* KPI row */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard
            label="Critical"
            value={snapshot.summary.critical}
            tone="critical"
            sub="score 81–100"
            icon={<AlertTriangle className="size-4" />}
          />
          <StatCard
            label="Very high"
            value={snapshot.summary.veryHigh}
            tone="veryhigh"
            sub="score 61–80"
            icon={<ShieldAlert className="size-4" />}
          />
          <StatCard label="High" value={snapshot.summary.high} tone="high" sub="score 41–60" />
          <StatCard
            label="Active alerts"
            value={snapshot.summary.activeAlerts}
            tone="accent"
            sub={`${snapshot.alerts.filter((a) => a.level === 4).length} at level 4`}
          />
          <StatCard
            label="Blocked / unsafe roads"
            value={snapshot.summary.blockedRoads}
            sub={`${snapshot.roads.length} monitored segments`}
          />
          <StatCard
            label="Vulnerable population"
            value={snapshot.summary.vulnerablePopulation.toLocaleString()}
            sub="in zones scoring > 60"
            icon={<Users className="size-4" />}
          />
        </div>

        {/* Map + detail */}
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <RiskMap
            zones={snapshot.zones}
            roads={snapshot.roads}
            sensors={snapshot.sensors}
            reports={reports}
            selectedId={selected.district.id}
            onSelect={setSelectedId}
            className="h-[420px] sm:h-[540px]"
          />
          <div className="panel p-4">
            <ScrollArea className="h-[480px] pr-3 sm:h-[500px]">
              <ZoneDetail zone={selected} />
            </ScrollArea>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="panel p-4">
            <p className="label-eyebrow mb-3">
              Rainfall & soil moisture — last 24 h (regional mean)
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={snapshot.rainfallTrend}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  interval={5}
                />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={28} />
                <ChartTooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rainfall"
                  name="Rain mm/h"
                  stroke="var(--chart-2)"
                  fill="var(--chart-2)"
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="soilMoisture"
                  name="Soil %"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="panel p-4">
            <p className="label-eyebrow mb-3">Regional risk trend</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={snapshot.riskTrend}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={28} />
                <ChartTooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mean"
                  name="Mean score"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="critical"
                  name="Critical zones"
                  stroke="var(--risk-veryhigh)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="panel p-4">
            <p className="label-eyebrow mb-3">Risk distribution</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={distribution}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="level"
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={24} />
                <ChartTooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="Zones" radius={[3, 3, 0, 0]}>
                  {distribution.map((d) => (
                    <Cell key={d.level} fill={RISK_COLORS[d.level]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="panel p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="label-eyebrow">Critical alerts</p>
              <Button asChild size="sm" variant="ghost">
                <Link to="/alerts">All alerts</Link>
              </Button>
            </div>
            <ul className="space-y-2">
              {snapshot.alerts.slice(0, 5).map((a, i) => (
                <li key={a.id} className="rounded border border-border bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="metric text-xs text-muted-foreground">#{i + 1}</span>
                    <span className="font-semibold">
                      {a.district}, {a.state}
                    </span>
                    <RiskBadge level={a.riskLevel} />
                    <span className="rounded border border-border px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
                      LEVEL {a.level} — {a.levelName}
                    </span>
                    <span className="metric ml-auto text-sm">{a.riskScore}/100</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{a.message}</p>
                  <p className="mt-1 text-xs">
                    <span className="text-primary">Action:</span> {a.recommendedAction}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="panel p-4">
              <p className="label-eyebrow mb-3">Sensor network</p>
              <div className="grid grid-cols-2 gap-2">
                {sensorStatus.map((s) => (
                  <div key={s.status} className="rounded border border-border bg-surface p-2">
                    <div className="metric text-xl">{s.count}</div>
                    <div className="text-[0.68rem] text-muted-foreground">{s.status}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Radio className="size-3.5" /> {snapshot.summary.activeSensors}/
                {snapshot.summary.totalSensors} reporting
              </div>
            </div>

            <div className="panel p-4">
              <p className="label-eyebrow mb-3">Response priority</p>
              <ol className="space-y-2">
                {snapshot.priorities.slice(0, 4).map((p) => (
                  <li key={p.districtId} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="metric text-primary">#{p.rank}</span>
                      <span className="font-medium">{p.district}</span>
                      <span className="ml-auto metric">{p.priorityScore}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {p.riskLevel} · {p.populationExposed.toLocaleString()} exposed ·{" "}
                      {p.roadStatus}
                    </p>
                  </li>
                ))}
              </ol>
              <Button asChild size="sm" variant="secondary" className="mt-3 w-full">
                <Link to="/emergency-response">Open prioritisation</Link>
              </Button>
            </div>

            <div className="panel p-4">
              <p className="label-eyebrow mb-2">Open field reports</p>
              <div className="flex items-center gap-2">
                <TriangleAlert className="size-4 text-primary" />
                <span className="metric text-2xl">{snapshot.summary.openReports}</span>
                <span className="text-xs text-muted-foreground">awaiting verification</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <CloudRain className="size-3.5" /> {snapshot.summary.rainfallAnomalies} districts
                with &gt; 60 % rainfall anomaly
              </div>
              <Button asChild size="sm" variant="ghost" className="mt-2 w-full">
                <Link to="/reports">Review reports</Link>
              </Button>
            </div>
          </div>
        </div>

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
