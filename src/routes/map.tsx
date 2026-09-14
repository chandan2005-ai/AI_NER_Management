import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/ner/AppShell";
import { RiskMap } from "@/components/ner/RiskMap";
import { ZoneDetail } from "@/components/ner/ZoneDetail";
import { DemoDataNotice } from "@/components/ner/bits";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mergeReports, useSystem } from "@/lib/ner/store";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Live GIS Risk Map | NER-SAFE" },
      {
        name: "description",
        content:
          "Full-screen NER-SAFE GIS map with toggleable landslide risk, rainfall, soil moisture, slope, roads, villages, shelter, report and sensor layers.",
      },
      { property: "og:title", content: "NER-SAFE Live GIS Risk Map" },
      {
        property: "og:description",
        content:
          "Interactive landslide risk heatmap for North East India with selectable GIS layers and per-zone explanations.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { snapshot, localReports } = useSystem();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reports = useMemo(() => mergeReports(snapshot, localReports), [snapshot, localReports]);
  const selected = snapshot.zones.find((z) => z.district.id === selectedId) ?? snapshot.zones[0]!;

  return (
    <AppShell>
      <div className="grid gap-4 p-3 sm:p-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold uppercase">Interactive GIS map</h1>
          <RiskMap
            zones={snapshot.zones}
            roads={snapshot.roads}
            sensors={snapshot.sensors}
            reports={reports}
            selectedId={selected.district.id}
            onSelect={setSelectedId}
            className="h-[60vh] xl:h-[calc(100vh-11rem)]"
          />
          <DemoDataNotice />
        </div>
        <div className="panel p-4">
          <ScrollArea className="h-[60vh] pr-3 xl:h-[calc(100vh-11rem)]">
            <ZoneDetail zone={selected} />
          </ScrollArea>
        </div>
      </div>
    </AppShell>
  );
}
