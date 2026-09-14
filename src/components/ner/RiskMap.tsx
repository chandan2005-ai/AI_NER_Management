import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Layers } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RISK_LEVELS, RISK_COLORS } from "@/lib/ner/risk-engine";
import type { CitizenReport, RiskZone, RoadSegment, SensorDevice } from "@/lib/ner/demo-data";
import type { MapLayers } from "./RiskMapCanvas";

const Canvas = lazy(() => import("./RiskMapCanvas"));

const LAYER_LABELS: { key: keyof MapLayers; label: string }[] = [
  { key: "risk", label: "Landslide risk" },
  { key: "rainfall", label: "Rainfall" },
  { key: "soil", label: "Soil moisture" },
  { key: "slope", label: "Slope / elevation" },
  { key: "history", label: "Historical landslides" },
  { key: "roads", label: "Roads & bridges" },
  { key: "villages", label: "Villages" },
  { key: "infrastructure", label: "Shelters & critical infra" },
  { key: "reports", label: "Citizen reports" },
  { key: "sensors", label: "Sensors" },
];

export const DEFAULT_LAYERS: MapLayers = {
  risk: true,
  rainfall: false,
  soil: false,
  slope: false,
  history: false,
  roads: true,
  villages: false,
  infrastructure: false,
  reports: true,
  sensors: true,
};

export function RiskMap({
  zones,
  roads,
  sensors,
  reports,
  selectedId,
  onSelect,
  className,
}: {
  zones: RiskZone[];
  roads: RoadSegment[];
  sensors: SensorDevice[];
  reports: CitizenReport[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const [layers, setLayers] = useState<MapLayers>(DEFAULT_LAYERS);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className={cn("panel relative overflow-hidden", className)}>
      <ClientOnly
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-surface">
            <Skeleton className="h-full w-full" />
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-surface text-sm text-muted-foreground">
              Loading GIS layers…
            </div>
          }
        >
          <Canvas
            zones={zones}
            roads={roads}
            sensors={sensors}
            reports={reports}
            layers={layers}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </Suspense>
      </ClientOnly>

      {/* Layer control */}
      <div className="absolute top-3 right-3 z-[500] w-56">
        <Button
          size="sm"
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={() => setPanelOpen((v) => !v)}
        >
          <Layers className="size-4" /> Map layers
        </Button>
        {panelOpen ? (
          <div className="panel mt-2 max-h-[52vh] space-y-2 overflow-auto p-3">
            {LAYER_LABELS.map((l) => (
              <div key={l.key} className="flex items-center justify-between gap-2">
                <Label htmlFor={`layer-${l.key}`} className="text-xs font-normal">
                  {l.label}
                </Label>
                <Switch
                  id={`layer-${l.key}`}
                  checked={layers[l.key]}
                  onCheckedChange={(v) => setLayers((prev) => ({ ...prev, [l.key]: v }))}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Legend */}
      <div className="panel absolute bottom-8 left-3 z-[500] p-3">
        <div className="label-eyebrow mb-2">Risk scale</div>
        <div className="space-y-1">
          {RISK_LEVELS.map((lvl) => (
            <div key={lvl} className="flex items-center gap-2 text-[0.7rem]">
              <span
                className="size-3 rounded-sm"
                style={{ backgroundColor: RISK_COLORS[lvl] }}
                aria-hidden
              />
              {lvl}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
