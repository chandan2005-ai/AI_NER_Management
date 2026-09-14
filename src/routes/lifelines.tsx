import { createFileRoute } from "@tanstack/react-router";
import { Route as RouteIcon } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, StatCard } from "@/components/ner/bits";
import { cn } from "@/lib/utils";
import { useSystem } from "@/lib/ner/store";
import { lifelinePriorityClass } from "@/lib/ner/lifeline-engine";

export const Route = createFileRoute("/lifelines")({
  head: () => ({
    meta: [
      { title: "Road Lifeline Intelligence | NER-SAFE" },
      {
        name: "description",
        content:
          "Rank North East hill roads by the consequence of losing them: blockage probability, dependent population, route redundancy, hospital dependency and emergency access.",
      },
      { property: "og:title", content: "Road Lifeline Intelligence — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Which road must be kept open first — lifeline criticality scoring for NER landslide response.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LifelinesPage,
});

function LifelinesPage() {
  const { intelligence } = useSystem();
  const { lifelines } = intelligence;
  const [openId, setOpenId] = useState<string | null>(lifelines[0]?.road.id ?? null);

  const critical = lifelines.filter((l) => l.priority === "CRITICAL").length;
  const noAlternate = lifelines.filter((l) => !l.alternativeRoute).length;
  const hospitalDep = lifelines.filter((l) => l.hospitalDependency).length;

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <div>
          <p className="label-eyebrow">Prioritise</p>
          <h1 className="text-2xl font-semibold uppercase">Road lifeline intelligence</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            A road is ranked not by its length or class but by what is lost when it closes:
            population dependent on it, whether any alternate route exists, hospital and school
            dependency, and how much emergency access disappears with it.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Monitored road segments"
            value={lifelines.length}
            icon={<RouteIcon className="size-4" />}
          />
          <StatCard label="Critical lifelines" value={critical} tone="critical" />
          <StatCard label="No viable alternate route" value={noAlternate} tone="veryhigh" />
          <StatCard label="Sole hospital access" value={hospitalDep} tone="high" />
        </div>

        <ul className="space-y-2">
          {lifelines.map((l) => {
            const open = openId === l.road.id;
            return (
              <li key={l.road.id} className="panel overflow-hidden">
                <button
                  className="flex w-full flex-wrap items-center gap-3 p-3 text-left hover:bg-surface"
                  onClick={() => setOpenId(open ? null : l.road.id)}
                >
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold",
                      lifelinePriorityClass(l.priority),
                    )}
                  >
                    {l.priority}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{l.road.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {l.road.district}, {l.road.state} · status {l.road.status}
                    </span>
                  </span>
                  <span className="ml-auto flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="metric">lifeline {l.lifelineScore}/100</span>
                    <span className="metric">
                      blockage {Math.round(l.blockageProbability * 100)} %
                    </span>
                    <span className="metric">
                      {l.populationDependency.toLocaleString("en-IN")} people
                    </span>
                  </span>
                </button>

                {open ? (
                  <div className="grid gap-4 border-t border-border p-3 lg:grid-cols-2">
                    <div>
                      <p className="label-eyebrow mb-2">Why this ranking</p>
                      <ul className="space-y-1.5 text-xs">
                        {l.reasons.map((r) => (
                          <li key={r} className="flex gap-2">
                            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <dl className="space-y-1.5 text-xs">
                        {[
                          [
                            "Landslide probability on segment",
                            `${Math.round(l.landslideProbability * 100)} %`,
                          ],
                          ["Traffic importance", `${Math.round(l.trafficImportance * 100)} %`],
                          ["Alternate route", l.alternativeRouteLabel],
                          [
                            "Hospital dependency",
                            l.hospitalDependency ? "Yes — sole access" : "No",
                          ],
                          ["Schools dependent", `${l.schoolDependency}`],
                          [
                            "Emergency access importance",
                            `${Math.round(l.emergencyAccessImportance * 100)} %`,
                          ],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">{k}</dt>
                            <dd className="metric">{v}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="rounded border border-primary/40 bg-primary/5 p-2 text-xs">
                        <span className="font-semibold">Recommended: </span>
                        {l.recommendation}
                      </p>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
