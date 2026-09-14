import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import type { RoadStatus } from "@/lib/ner/demo-data";

export const Route = createFileRoute("/roads")({
  head: () => ({
    meta: [
      { title: "Road Connectivity & Blockage Monitoring | NER-SAFE" },
      {
        name: "description",
        content:
          "Monitor NER highway and hill-road segments for landslide risk, blockage status, last inspection and alternative routes.",
      },
      { property: "og:title", content: "Road Connectivity Monitoring — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Track open, partially blocked, dangerous, blocked and closed road segments across North East India.",
      },
    ],
  }),
  component: RoadsPage,
});

const STATUSES: RoadStatus[] = ["OPEN", "PARTIALLY BLOCKED", "DANGEROUS", "BLOCKED", "CLOSED"];

const STATUS_CLASS: Record<RoadStatus, string> = {
  OPEN: "text-risk-low",
  "PARTIALLY BLOCKED": "text-risk-moderate",
  DANGEROUS: "text-risk-high",
  BLOCKED: "text-risk-veryhigh",
  CLOSED: "text-risk-critical",
};

function RoadsPage() {
  const { snapshot } = useSystem();
  const [overrides, setOverrides] = useState<Record<string, RoadStatus>>({});

  const roads = useMemo(
    () => snapshot.roads.map((r) => ({ ...r, status: overrides[r.id] ?? r.status })),
    [snapshot.roads, overrides],
  );

  const updateStatus = (id: string, name: string, status: RoadStatus) => {
    setOverrides((prev) => ({ ...prev, [id]: status }));
    toast.success(`${name} marked ${status}`, {
      description: "Status update recorded as a field-officer override and shown on the GIS map.",
    });
  };

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <h1 className="text-2xl font-semibold uppercase">Road connectivity</h1>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {STATUSES.map((s) => (
            <StatCard
              key={s}
              label={s}
              value={roads.filter((r) => r.status === s).length}
              tone={
                s === "OPEN"
                  ? "low"
                  : s === "PARTIALLY BLOCKED"
                    ? "moderate"
                    : s === "DANGEROUS"
                      ? "high"
                      : s === "BLOCKED"
                        ? "veryhigh"
                        : "critical"
              }
            />
          ))}
        </div>

        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-surface-2 text-left">
              <tr className="label-eyebrow">
                <th className="px-4 py-2">Road segment</th>
                <th className="px-4 py-2">District</th>
                <th className="px-4 py-2">Classification</th>
                <th className="px-4 py-2">Coordinates</th>
                <th className="px-4 py-2">Risk</th>
                <th className="px-4 py-2">Landslide prob.</th>
                <th className="px-4 py-2">Last inspection</th>
                <th className="px-4 py-2">Alternative route</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {roads.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {r.district}, {r.state}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{r.importance}</td>
                  <td className="metric px-4 py-2 text-xs text-muted-foreground">
                    {r.lat.toFixed(3)}, {r.lng.toFixed(3)}
                  </td>
                  <td className="px-4 py-2">
                    <RiskBadge level={r.riskLevel} />
                  </td>
                  <td className="metric px-4 py-2">{Math.min(95, r.riskScore)} %</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.lastInspection}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{r.alternativeRoute}</td>
                  <td className="px-4 py-2">
                    <Select
                      value={r.status}
                      onValueChange={(v) => updateStatus(r.id, r.name, v as RoadStatus)}
                    >
                      <SelectTrigger
                        className={cn("h-8 w-[180px] text-xs", STATUS_CLASS[r.status])}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
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
