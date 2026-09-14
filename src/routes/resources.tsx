import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, StatCard } from "@/components/ner/bits";
import { cn } from "@/lib/utils";
import { useSystem } from "@/lib/ner/store";
import { DEFAULT_RESOURCES, RESOURCE_LABELS } from "@/lib/ner/resource-optimizer";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Emergency Resource Optimizer | NER-SAFE" },
      {
        name: "description",
        content:
          "Transparent allocation of rescue teams, ambulances, excavators, clearance and medical teams across at-risk North East districts, with unmet needs stated explicitly.",
      },
      { property: "og:title", content: "Emergency Resource Optimizer — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Who gets the next rescue team, and why — explainable resource allocation for NER landslide response.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { intelligence } = useSystem();
  const { allocations, resourcesRemaining } = intelligence;
  const unmetCount = allocations.filter((a) => a.unmet.length > 0).length;

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <div>
          <p className="label-eyebrow">Prioritise</p>
          <h1 className="text-2xl font-semibold uppercase">Emergency resource optimizer</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            A deterministic, explainable allocation pass over the current threat picture. Districts
            are ranked by need — risk, isolation, exposed population, hospital access, lifeline
            criticality and time sensitivity — and every assignment states its reason. Where the
            pool runs out, the shortfall is reported rather than hidden.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Districts in allocation queue"
            value={allocations.length}
            icon={<Boxes className="size-4" />}
          />
          <StatCard label="Districts with unmet need" value={unmetCount} tone="critical" />
          <StatCard
            label="Rescue teams remaining"
            value={`${resourcesRemaining.rescueTeams}/${DEFAULT_RESOURCES.rescueTeams}`}
            tone="moderate"
          />
          <StatCard
            label="Clearance teams remaining"
            value={`${resourcesRemaining.clearanceTeams}/${DEFAULT_RESOURCES.clearanceTeams}`}
            tone="moderate"
          />
        </div>

        <div className="panel p-4">
          <p className="label-eyebrow mb-2">Available pool</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {RESOURCE_LABELS.map((r) => (
              <div key={r.key} className="rounded border border-border p-2">
                <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  {r.label}
                </p>
                <p className="metric mt-1 text-lg font-semibold">
                  {resourcesRemaining[r.key]}
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    / {DEFAULT_RESOURCES[r.key]} {r.unit}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <ul className="space-y-2">
          {allocations.map((a) => (
            <li key={a.districtId} className="panel p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="metric grid size-8 shrink-0 place-items-center rounded bg-primary/15 text-sm font-semibold text-primary">
                  {a.rank}
                </span>
                <span>
                  <span className="block text-sm font-medium">
                    {a.district}
                    <span className="ml-2 text-xs text-muted-foreground">{a.state}</span>
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    risk {a.riskScore}/100 ({a.riskLevel}) · isolation {a.isolationScore}/100 ·{" "}
                    {a.populationExposed.toLocaleString("en-IN")} exposed
                  </span>
                </span>
                <span className="ml-auto flex flex-wrap gap-2 text-xs">
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 font-semibold",
                      a.timeSensitivityHours <= 6
                        ? "border-risk-critical/50 bg-risk-critical/15 text-risk-critical"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    act within {a.timeSensitivityHours} h
                  </span>
                  {!a.alternativeRoute ? (
                    <span className="rounded border border-risk-veryhigh/50 bg-risk-veryhigh/15 px-1.5 py-0.5 font-semibold text-risk-veryhigh">
                      no alternate route
                    </span>
                  ) : null}
                  {a.hospitalAccessThreatened ? (
                    <span className="rounded border border-risk-high/50 bg-risk-high/15 px-1.5 py-0.5 font-semibold text-risk-high">
                      hospital access threatened
                    </span>
                  ) : null}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {RESOURCE_LABELS.filter((r) => (a.allocation[r.key] ?? 0) > 0).map((r) => (
                  <span
                    key={r.key}
                    className="rounded border border-risk-low/40 bg-risk-low/10 px-2 py-0.5 text-xs text-risk-low"
                  >
                    {a.allocation[r.key]} × {r.label}
                  </span>
                ))}
                {a.unmet.map((u) => (
                  <span
                    key={u}
                    className="rounded border border-risk-critical/40 bg-risk-critical/10 px-2 py-0.5 text-xs text-risk-critical"
                  >
                    UNMET: {u}
                  </span>
                ))}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">{a.reason}</p>
            </li>
          ))}
        </ul>

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
