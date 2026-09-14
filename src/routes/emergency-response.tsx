import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Route as RouteIcon, Users } from "lucide-react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, RiskBadge, StatCard } from "@/components/ner/bits";
import { cn } from "@/lib/utils";
import { useSystem } from "@/lib/ner/store";

export const Route = createFileRoute("/emergency-response")({
  head: () => ({
    meta: [
      { title: "Emergency Response Priority | NER-SAFE" },
      {
        name: "description",
        content:
          "Ranked response priority for NER districts combining landslide risk score, exposed population and road connectivity impact.",
      },
      { property: "og:title", content: "Emergency Response Priority — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Where to send teams first: priority ranking, evacuation guidance, shelters and alternative routes across the North East.",
      },
    ],
  }),
  component: ResponsePage,
});

function ResponsePage() {
  const { snapshot } = useSystem();
  const priorities = snapshot.priorities;
  const top = priorities.slice(0, 12);

  const totalExposed = priorities.reduce((s, p) => s + p.populationExposed, 0);

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <div>
          <h1 className="text-2xl font-semibold uppercase">Emergency response priority</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Priority score = risk score (55 %) + population exposure (25 %) + road connectivity
            impact (20 %). Highest first.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Districts in queue"
            value={priorities.length}
            icon={<LifeBuoy className="size-4" />}
          />
          <StatCard
            label="Population exposed"
            value={totalExposed.toLocaleString("en-IN")}
            tone="high"
            icon={<Users className="size-4" />}
          />
          <StatCard
            label="Roads impacted"
            value={priorities.filter((p) => p.roadStatus !== "OPEN").length}
            tone="moderate"
            icon={<RouteIcon className="size-4" />}
          />
          <StatCard
            label="Immediate action"
            value={priorities.filter((p) => p.priorityScore >= 70).length}
            tone="critical"
          />
        </div>

        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">District</th>
                <th className="px-3 py-2">Risk</th>
                <th className="px-3 py-2 text-right">Score</th>
                <th className="px-3 py-2 text-right">Exposed</th>
                <th className="px-3 py-2">Key road</th>
                <th className="px-3 py-2 text-right">Priority</th>
                <th className="px-3 py-2">Recommended action</th>
              </tr>
            </thead>
            <tbody>
              {top.map((p) => (
                <tr key={p.districtId} className="border-b border-border/60 last:border-0">
                  <td className="metric px-3 py-2 text-muted-foreground">{p.rank}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{p.district}</div>
                    <div className="text-xs text-muted-foreground">{p.state}</div>
                  </td>
                  <td className="px-3 py-2">
                    <RiskBadge level={p.riskLevel} />
                  </td>
                  <td className="metric px-3 py-2 text-right">{p.riskScore}</td>
                  <td className="metric px-3 py-2 text-right">
                    {p.populationExposed.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2">
                    <div>{p.road}</div>
                    <div
                      className={cn(
                        "text-xs",
                        p.roadStatus === "OPEN" ? "text-risk-low" : "text-risk-veryhigh",
                      )}
                    >
                      {p.roadStatus}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={cn(
                        "metric rounded px-1.5 py-0.5 font-semibold",
                        p.priorityScore >= 70
                          ? "bg-risk-critical/15 text-risk-critical"
                          : p.priorityScore >= 50
                            ? "bg-risk-veryhigh/15 text-risk-veryhigh"
                            : "bg-surface text-muted-foreground",
                      )}
                    >
                      {p.priorityScore}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{p.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {top.slice(0, 3).map((p) => {
            const zone = snapshot.zones.find((z) => z.district.id === p.districtId);
            return (
              <article key={p.districtId} className="panel space-y-2 p-4">
                <p className="label-eyebrow">Priority {p.rank}</p>
                <h2 className="font-display text-lg font-semibold">{p.district}</h2>
                <RiskBadge level={p.riskLevel} />
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  <li>Shelters within reach: {zone?.nearbyShelters ?? "—"}</li>
                  <li>Roads affected: {zone?.affectedRoads ?? "—"}</li>
                  <li>
                    Alternative route status:{" "}
                    {p.roadStatus === "OPEN" ? "Primary route usable" : "Use diversion"}
                  </li>
                  <li>
                    Rainfall anomaly:{" "}
                    {zone
                      ? `${zone.rainfallAnomalyPct > 0 ? "+" : ""}${zone.rainfallAnomalyPct} %`
                      : "—"}
                  </li>
                </ul>
              </article>
            );
          })}
        </div>

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
