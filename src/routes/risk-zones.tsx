import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, RiskBadge, ScoreMeter, TrendIndicator } from "@/components/ner/bits";
import { ZoneDetail } from "@/components/ner/ZoneDetail";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NER_STATES } from "@/lib/ner/districts";
import { RISK_LEVELS } from "@/lib/ner/risk-engine";
import { useSystem } from "@/lib/ner/store";

export const Route = createFileRoute("/risk-zones")({
  head: () => ({
    meta: [
      { title: "District-wise Landslide Risk Zones | NER-SAFE" },
      {
        name: "description",
        content:
          "District-wise landslide risk table for all eight North Eastern states with risk score, rainfall, soil moisture, trend and factor-level explanations.",
      },
      { property: "og:title", content: "District-wise Landslide Risk Zones — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Compare landslide risk scores, rainfall and soil moisture across NER districts and inspect why each zone scores as it does.",
      },
    ],
  }),
  component: RiskZonesPage,
});

function RiskZonesPage() {
  const { snapshot } = useSystem();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      snapshot.zones.filter((z) => {
        const q = query.trim().toLowerCase();
        if (q && !`${z.district.name} ${z.district.state}`.toLowerCase().includes(q)) return false;
        if (stateFilter !== "all" && z.district.state !== stateFilter) return false;
        if (levelFilter !== "all" && z.assessment.level !== levelFilter) return false;
        return true;
      }),
    [snapshot.zones, query, stateFilter, levelFilter],
  );

  const openZone = snapshot.zones.find((z) => z.district.id === openId) ?? null;

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <div>
          <h1 className="text-2xl font-semibold uppercase">Risk zones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} of {snapshot.zones.length} monitored district zones · mean regional score{" "}
            <span className="metric">{snapshot.summary.meanScore}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search district or state…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {NER_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {RISK_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {rows.length === 0 ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            No zones match these filters. Clear the search or choose a different state.
          </div>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-surface-2 text-left">
                <tr className="label-eyebrow">
                  <th className="px-4 py-2">District</th>
                  <th className="px-4 py-2">State</th>
                  <th className="px-4 py-2">Risk</th>
                  <th className="px-4 py-2 w-[140px]">Score</th>
                  <th className="px-4 py-2">Rain 24 h</th>
                  <th className="px-4 py-2">Soil</th>
                  <th className="px-4 py-2">Slope</th>
                  <th className="px-4 py-2">Trend</th>
                  <th className="px-4 py-2">Prob.</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((z) => (
                  <tr key={z.district.id} className="border-t border-border hover:bg-surface-2/60">
                    <td className="px-4 py-2 font-medium">{z.district.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{z.district.state}</td>
                    <td className="px-4 py-2">
                      <RiskBadge level={z.assessment.level} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="metric w-8">{z.assessment.score}</span>
                        <ScoreMeter score={z.assessment.score} level={z.assessment.level} />
                      </div>
                    </td>
                    <td className="metric px-4 py-2">{z.observation.rainfall24h} mm</td>
                    <td className="metric px-4 py-2">{z.observation.soilMoisture} %</td>
                    <td className="metric px-4 py-2">{z.district.slope}°</td>
                    <td className="px-4 py-2">
                      <TrendIndicator trend={z.trend} />
                    </td>
                    <td className="metric px-4 py-2">
                      {Math.round(z.assessment.probability * 100)} %
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setOpenId(z.district.id)}>
                        Explain
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DemoDataNotice />
      </div>

      <Dialog open={!!openZone} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogTitle className="sr-only">Zone risk explanation</DialogTitle>
          {openZone ? <ZoneDetail zone={openZone} /> : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
