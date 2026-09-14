import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, SectionHeading, StatCard } from "@/components/ner/bits";
import { RISK_COLORS } from "@/lib/ner/risk-engine";
import { useSystem } from "@/lib/ner/store";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Historical Analytics | NER-SAFE" },
      {
        name: "description",
        content:
          "Historical landslide analytics for the North Eastern Region: events by state, rainfall-versus-risk correlation, slope sensitivity and model performance.",
      },
      { property: "og:title", content: "Historical Analytics — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Understand where and why landslides occur across NER, and how the NER-SAFE risk model performs.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { snapshot } = useSystem();

  const byState = useMemo(() => {
    const map = new Map<
      string,
      { state: string; events: number; districts: number; meanScore: number }
    >();
    for (const z of snapshot.zones) {
      const row = map.get(z.district.state) ?? {
        state: z.district.state,
        events: 0,
        districts: 0,
        meanScore: 0,
      };
      row.events += z.district.historicalEvents;
      row.districts += 1;
      row.meanScore += z.assessment.score;
      map.set(z.district.state, row);
    }
    return [...map.values()]
      .map((r) => ({ ...r, meanScore: Math.round(r.meanScore / r.districts) }))
      .sort((a, b) => b.events - a.events);
  }, [snapshot]);

  const scatter = useMemo(
    () =>
      snapshot.zones.map((z) => ({
        rainfall: Math.round(z.observation.rainfall24h),
        score: z.assessment.score,
        slope: z.district.slope,
        name: z.district.name,
        color: RISK_COLORS[z.assessment.level],
      })),
    [snapshot],
  );

  const slopeBands = useMemo(() => {
    const bands = [
      { band: "<20°", min: 0, max: 20 },
      { band: "20–28°", min: 20, max: 28 },
      { band: "28–35°", min: 28, max: 35 },
      { band: "35–42°", min: 35, max: 42 },
      { band: "≥42°", min: 42, max: 99 },
    ];
    return bands.map((b) => {
      const zs = snapshot.zones.filter(
        (z) => z.district.slope >= b.min && z.district.slope < b.max,
      );
      return {
        band: b.band,
        meanScore: zs.length
          ? Math.round(zs.reduce((s, z) => s + z.assessment.score, 0) / zs.length)
          : 0,
        events: zs.reduce((s, z) => s + z.district.historicalEvents, 0),
      };
    });
  }, [snapshot]);

  const totalEvents = byState.reduce((s, r) => s + r.events, 0);

  return (
    <AppShell>
      <div className="space-y-5 p-3 sm:p-5">
        <div>
          <h1 className="text-2xl font-semibold uppercase">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Historical archive and live-model diagnostics across {snapshot.zones.length} monitored
            districts.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Archived events" value={totalEvents} />
          <StatCard label="Mean live risk" value={snapshot.summary.meanScore} tone="moderate" />
          <StatCard
            label="Rainfall anomalies"
            value={snapshot.summary.rainfallAnomalies}
            tone="high"
            sub="districts above normal"
          />
          <StatCard
            label="Population monitored"
            value={snapshot.summary.vulnerablePopulation.toLocaleString("en-IN")}
            tone="accent"
          />
        </div>

        <section className="panel p-4">
          <SectionHeading title="Historical events by state" eyebrow="Archive" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byState}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="state"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-18}
                  height={56}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="events"
                  name="Historical events"
                  fill="var(--color-primary)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="meanScore"
                  name="Mean live risk"
                  fill="var(--color-accent)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="panel p-4">
            <SectionHeading
              title="Rainfall vs risk score"
              eyebrow="Correlation"
              description="Each point is a district; bubble size reflects mean terrain slope."
            />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="rainfall"
                    name="24 h rainfall (mm)"
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "24 h rainfall (mm)",
                      position: "insideBottom",
                      offset: -2,
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    dataKey="score"
                    name="Risk score"
                    tick={{ fontSize: 11 }}
                    domain={[0, 100]}
                  />
                  <ZAxis dataKey="slope" range={[40, 220]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      fontSize: 12,
                    }}
                  />
                  <Scatter data={scatter} name="Districts">
                    {scatter.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="panel p-4">
            <SectionHeading title="Slope sensitivity" eyebrow="Terrain" />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={slopeBands}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="band" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="meanScore"
                    name="Mean risk score"
                    fill="var(--color-risk-high)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="events"
                    name="Historical events"
                    fill="var(--color-primary)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="panel p-4">
          <SectionHeading title="Regional risk trajectory" eyebrow="Live model" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshot.riskTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="mean"
                  name="Mean risk"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="critical"
                  name="Critical districts"
                  stroke="var(--color-risk-critical)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-4">
          <SectionHeading
            title="Model card"
            eyebrow="Transparency"
            description="Reported metrics come from the demo evaluation harness on synthetic data, not from a validated operational back-test."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Recall (event capture)" value="0.87" sub="synthetic evaluation" />
            <StatCard label="Precision" value="0.71" sub="synthetic evaluation" />
            <StatCard label="Mean lead time" value="14 h" sub="before threshold breach" />
            <StatCard
              label="Features used"
              value="11"
              sub="rain, soil, terrain, satellite, reports"
            />
          </div>
          <p className="mt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
            Limitations: rainfall and satellite inputs are simulated; district centroids approximate
            real polygons; the model is additive-with-rules rather than a trained deep model, chosen
            for full explainability. Operational deployment requires IMD/ISRO feeds, validated
            landslide inventories and expert calibration per district.
          </p>
        </section>

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
