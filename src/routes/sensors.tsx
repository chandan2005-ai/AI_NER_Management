import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BatteryLow, Radio } from "lucide-react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, StatCard } from "@/components/ner/bits";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSystem } from "@/lib/ner/store";

export const Route = createFileRoute("/sensors")({
  head: () => ({
    meta: [
      { title: "Sensor & IoT Network Monitoring | NER-SAFE" },
      {
        name: "description",
        content:
          "Live status of soil moisture, rain gauge, inclinometer, ground movement and water level sensors across NER slope monitoring sites.",
      },
      { property: "og:title", content: "Sensor & IoT Network Monitoring — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Sensor readings, thresholds, battery health, data freshness and quality flags for the NER-SAFE monitoring network.",
      },
    ],
  }),
  component: SensorsPage,
});

const STATUS_CLASS: Record<string, string> = {
  NORMAL: "text-risk-low",
  WARNING: "text-risk-high",
  CRITICAL: "text-risk-critical",
  OFFLINE: "text-muted-foreground",
};

function SensorsPage() {
  const { snapshot } = useSystem();
  const [q, setQ] = useState("");

  const sensors = snapshot.sensors.filter((s) =>
    `${s.id} ${s.type} ${s.district} ${s.state}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const count = (status: string) => snapshot.sensors.filter((s) => s.status === status).length;

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <h1 className="text-2xl font-semibold uppercase">Sensor network</h1>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            label="Total devices"
            value={snapshot.summary.totalSensors}
            icon={<Radio className="size-4" />}
          />
          <StatCard label="Normal" value={count("NORMAL")} tone="low" />
          <StatCard label="Warning" value={count("WARNING")} tone="high" />
          <StatCard label="Critical" value={count("CRITICAL")} tone="critical" />
          <StatCard
            label="Offline / stale"
            value={count("OFFLINE")}
            sub="no comms > 200 min"
            icon={<BatteryLow className="size-4" />}
          />
        </div>

        <Input
          placeholder="Search sensor ID, type or district…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        {sensors.length === 0 ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            No sensors match that search.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sensors.map((s) => (
              <div key={`${s.id}-${s.districtId}`} className="panel p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="metric font-semibold">{s.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.type} · {s.district}, {s.state}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-display text-[0.7rem] font-semibold tracking-wider uppercase",
                      STATUS_CLASS[s.status],
                    )}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <span className="metric text-2xl">
                    {s.reading}
                    <span className="ml-1 text-sm text-muted-foreground">{s.unit}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    threshold {s.threshold}
                    {s.unit}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (s.reading / (s.threshold * 1.6)) * 100)}
                  className="mt-2 h-1.5"
                />

                <dl className="mt-3 grid grid-cols-3 gap-2 text-[0.7rem]">
                  <div>
                    <dt className="text-muted-foreground">Battery</dt>
                    <dd className={cn("metric", s.battery < 45 && "text-risk-moderate")}>
                      {s.battery} %
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Last comms</dt>
                    <dd className="metric">{s.lastSeenMinutes} min</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Quality</dt>
                    <dd
                      className={cn(
                        "metric",
                        s.dataQuality !== "OK" ? "text-risk-moderate" : "text-risk-low",
                      )}
                    >
                      {s.dataQuality}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
