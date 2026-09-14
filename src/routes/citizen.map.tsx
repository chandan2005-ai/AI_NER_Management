import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
} from "lucide-react";

import { CitizenShell } from "@/components/security/CitizenShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPublicRisk } from "@/lib/security/citizen.functions";
import { PUBLIC_LEVEL_META } from "@/lib/security/classification";
import { NER_STATES, DISTRICTS } from "@/lib/ner/districts";
import { RiskMap } from "@/components/ner/RiskMap";
import { useSystem } from "@/lib/ner/store";

export const Route = createFileRoute("/citizen/map")({
  head: () => ({
    meta: [
      { title: "Interactive Landslide Risk Map — NER-SAFE Community" },
      {
        name: "description",
        content:
          "Real-time district-level landslide risk map across all eight North Eastern states with road status, rainfall and public safety advisories.",
      },
      { property: "og:title", content: "Interactive Public Risk Map — NER-SAFE" },
      {
        property: "og:description",
        content:
          "See which districts in North East India are calm, watched or at high landslide risk right now.",
      },
    ],
  }),
  component: CitizenMapPage,
});

const TONE: Record<string, { badge: string; border: string; bg: string }> = {
  LOW: {
    badge: "bg-emerald-600 text-white",
    border: "border-emerald-200",
    bg: "bg-emerald-50/70",
  },
  MODERATE: {
    badge: "bg-amber-500 text-white",
    border: "border-amber-200",
    bg: "bg-amber-50/70",
  },
  HIGH: {
    badge: "bg-orange-600 text-white",
    border: "border-orange-200",
    bg: "bg-orange-50/70",
  },
  "VERY HIGH": {
    badge: "bg-rose-600 text-white",
    border: "border-rose-300",
    bg: "bg-rose-50/80",
  },
  CRITICAL: {
    badge: "bg-red-700 text-white animate-pulse",
    border: "border-red-400",
    bg: "bg-red-50",
  },
};

function CitizenMapPage() {
  const { snapshot } = useSystem();
  const [filter, setFilter] = useState("");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>("d-ekh");

  const query = useQuery({
    queryKey: ["public-risk", "region"],
    queryFn: () => getPublicRisk({ data: {} }),
    refetchInterval: 120_000,
  });

  const allPublicDistricts = query.data?.region ?? [];

  const filteredDistricts = allPublicDistricts.filter((r) => {
    const matchesSearch = `${r.district} ${r.state}`.toLowerCase().includes(filter.toLowerCase());
    const matchesState = selectedState === "ALL" || r.state === selectedState;
    return matchesSearch && matchesState;
  });

  const selectedZone =
    snapshot.zones.find((z) => z.district.id === selectedDistrictId) ||
    snapshot.zones.find(
      (z) => z.district.name.toLowerCase() === selectedDistrictId?.toLowerCase(),
    ) ||
    snapshot.zones[0];

  const selectedData =
    allPublicDistricts.find(
      (d) => d.district.toLowerCase() === selectedZone?.district.name.toLowerCase(),
    ) || allPublicDistricts[0];

  return (
    <CitizenShell title="Interactive Landslide Risk Map">
      {/* Search & State Filter Controls */}
      <section className="rounded-2xl border border-border bg-white p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search district or state in North East India…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 h-9 text-xs bg-surface border-border"
          />
        </div>

        {/* State Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Button
            size="sm"
            variant={selectedState === "ALL" ? "default" : "outline"}
            className="h-7 text-[0.7rem] px-2.5"
            onClick={() => setSelectedState("ALL")}
          >
            All NER ({allPublicDistricts.length})
          </Button>
          {NER_STATES.map((state) => (
            <Button
              key={state}
              size="sm"
              variant={selectedState === state ? "default" : "outline"}
              className="h-7 text-[0.7rem] px-2"
              onClick={() => setSelectedState(state)}
            >
              {state}
            </Button>
          ))}
        </div>
      </section>

      {/* Visual GIS Map Container */}
      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5 text-xs">
          <span className="flex items-center gap-2 font-bold text-foreground">
            <Compass className="size-4 text-primary" />
            North Eastern Regional Hazard Viewer
          </span>
          <span className="text-[0.68rem] text-muted-foreground">
            Click any circle or list item to focus district
          </span>
        </div>

        <div className="h-[420px] w-full relative">
          <RiskMap
            zones={snapshot.zones}
            roads={snapshot.roads}
            sensors={[]}
            reports={snapshot.reports}
            selectedId={selectedZone?.district.id ?? "d-ekh"}
            onSelect={(id) => {
              setSelectedDistrictId(id);
            }}
            className="h-full border-none rounded-none"
          />
        </div>
      </section>

      {/* Selected District Focus Card */}
      {selectedData && (
        <section
          className={`rounded-2xl border-2 p-5 shadow-xs transition-all ${
            TONE[selectedData.risk_level]?.border || "border-border"
          } ${TONE[selectedData.risk_level]?.bg || "bg-white"}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                Selected District Safety Status
              </p>
              <h2 className="text-lg font-bold text-foreground">
                {selectedData.district}, {selectedData.state}
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                TONE[selectedData.risk_level]?.badge || "bg-primary text-white"
              }`}
            >
              {selectedData.risk_level} RISK
            </span>
          </div>

          <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">
            {selectedData.public_message}
          </p>

          <div className="mt-3 rounded-xl bg-white/90 p-3.5 border border-black/5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Public Guidance for Residents & Travelers:
            </p>
            <ul className="space-y-1 text-xs text-foreground">
              {selectedData.safety_guidance.map((guide, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-risk-low shrink-0 mt-0.5" />
                  <span>{guide}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* District Directory List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Districts Overview ({filteredDistricts.length})
          </h3>
          <span className="text-[0.68rem] text-muted-foreground">
            Showing public aggregated safety status
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {filteredDistricts.map((row) => {
            const meta = PUBLIC_LEVEL_META[row.risk_level] || { label: row.risk_level, icon: "🟡" };
            const tone = TONE[row.risk_level] ??
              TONE["MODERATE"] ?? {
                badge: "bg-primary text-white",
                border: "border-border",
                bg: "bg-surface",
              };
            const matchingZone = snapshot.zones.find(
              (z) => z.district.name.toLowerCase() === row.district.toLowerCase(),
            );
            const isSelected =
              selectedZone?.district.name.toLowerCase() === row.district.toLowerCase() ||
              selectedDistrictId === matchingZone?.district.id;

            return (
              <button
                type="button"
                key={`${row.state}-${row.district}`}
                onClick={() => {
                  if (matchingZone) {
                    setSelectedDistrictId(matchingZone.district.id);
                  } else {
                    setSelectedDistrictId(row.district);
                  }
                }}
                className={`text-left rounded-xl border p-3.5 transition-all hover:shadow-xs ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                    : "border-border bg-white hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{row.district}</p>
                    <p className="text-[0.68rem] text-muted-foreground">{row.state}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${tone.badge}`}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                  {row.public_message}
                </p>
              </button>
            );
          })}
        </div>

        {filteredDistricts.length === 0 && (
          <div className="rounded-xl border border-border bg-white p-6 text-center text-xs text-muted-foreground">
            No districts match "{filter}". Try searching for another name or selecting "All NER".
          </div>
        )}
      </section>
    </CitizenShell>
  );
}
