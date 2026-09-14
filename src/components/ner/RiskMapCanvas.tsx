import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";

import { NER_CENTER } from "@/lib/ner/districts";
import { RISK_COLORS } from "@/lib/ner/risk-engine";
import type { CitizenReport, RiskZone, RoadSegment, SensorDevice } from "@/lib/ner/demo-data";

export interface MapLayers {
  risk: boolean;
  rainfall: boolean;
  soil: boolean;
  slope: boolean;
  history: boolean;
  roads: boolean;
  villages: boolean;
  infrastructure: boolean;
  reports: boolean;
  sensors: boolean;
}

interface Props {
  zones: RiskZone[];
  roads: RoadSegment[];
  sensors: SensorDevice[];
  reports: CitizenReport[];
  layers: MapLayers;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ROAD_COLOR: Record<RoadSegment["status"], string> = {
  OPEN: "var(--risk-low)",
  "PARTIALLY BLOCKED": "var(--risk-moderate)",
  DANGEROUS: "var(--risk-high)",
  BLOCKED: "var(--risk-veryhigh)",
  CLOSED: "var(--risk-critical)",
};

function FocusOnSelection({ zones, selectedId }: { zones: RiskZone[]; selectedId: string | null }) {
  const map = useMap();
  useEffect(() => {
    const z = zones.find((x) => x.district.id === selectedId);
    if (z) map.flyTo([z.district.lat, z.district.lng], 8, { duration: 0.8 });
  }, [selectedId, zones, map]);
  return null;
}

export default function RiskMapCanvas({
  zones,
  roads,
  sensors,
  reports,
  layers,
  selectedId,
  onSelect,
}: Props) {
  return (
    <MapContainer
      center={NER_CENTER}
      zoom={6}
      minZoom={5}
      scrollWheelZoom
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <FocusOnSelection zones={zones} selectedId={selectedId} />

      {layers.risk &&
        zones.map((z) => (
          <CircleMarker
            key={`risk-${z.district.id}`}
            center={[z.district.lat, z.district.lng]}
            radius={9 + (z.assessment.score / 100) * 16}
            pathOptions={{
              color: RISK_COLORS[z.assessment.level],
              fillColor: RISK_COLORS[z.assessment.level],
              fillOpacity: selectedId === z.district.id ? 0.75 : 0.42,
              weight: selectedId === z.district.id ? 3 : 1.5,
            }}
            eventHandlers={{ click: () => onSelect(z.district.id) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span className="font-semibold">{z.district.name}</span> — {z.assessment.level} (
              {z.assessment.score}/100)
            </Tooltip>
          </CircleMarker>
        ))}

      {layers.rainfall &&
        zones.map((z) => (
          <CircleMarker
            key={`rain-${z.district.id}`}
            center={[z.district.lat + 0.09, z.district.lng + 0.09]}
            radius={4 + (z.observation.rainfall24h / 200) * 12}
            pathOptions={{
              color: "var(--chart-2)",
              fillColor: "var(--chart-2)",
              fillOpacity: 0.3,
              weight: 1,
            }}
          >
            <Tooltip>{z.observation.rainfall24h} mm / 24 h</Tooltip>
          </CircleMarker>
        ))}

      {layers.soil &&
        zones.map((z) => (
          <CircleMarker
            key={`soil-${z.district.id}`}
            center={[z.district.lat - 0.09, z.district.lng + 0.09]}
            radius={3 + (z.observation.soilMoisture / 100) * 9}
            pathOptions={{
              color: "var(--chart-5)",
              fillColor: "var(--chart-5)",
              fillOpacity: 0.28,
              weight: 1,
            }}
          >
            <Tooltip>Soil moisture {z.observation.soilMoisture} %</Tooltip>
          </CircleMarker>
        ))}

      {layers.slope &&
        zones.map((z) => (
          <CircleMarker
            key={`slope-${z.district.id}`}
            center={[z.district.lat - 0.09, z.district.lng - 0.09]}
            radius={2 + (z.district.slope / 50) * 9}
            pathOptions={{
              color: "var(--accent)",
              fillColor: "var(--accent)",
              fillOpacity: 0.25,
              weight: 1,
            }}
          >
            <Tooltip>
              Slope {z.district.slope}° · {z.district.elevation} m
            </Tooltip>
          </CircleMarker>
        ))}

      {layers.history &&
        zones.map((z) => (
          <CircleMarker
            key={`hist-${z.district.id}`}
            center={[z.district.lat + 0.11, z.district.lng - 0.11]}
            radius={2 + z.district.historicalEvents * 0.6}
            pathOptions={{
              color: "var(--risk-critical)",
              fillColor: "var(--risk-critical)",
              fillOpacity: 0.35,
              weight: 1,
              dashArray: "2 3",
            }}
          >
            <Tooltip>{z.district.historicalEvents} historical landslide events</Tooltip>
          </CircleMarker>
        ))}

      {layers.roads &&
        roads.map((r) => (
          <Polyline
            key={`road-${r.id}`}
            positions={[
              [r.lat - 0.07, r.lng - 0.07],
              [r.lat + 0.02, r.lng + 0.03],
              [r.lat + 0.07, r.lng + 0.08],
            ]}
            pathOptions={{ color: ROAD_COLOR[r.status], weight: 4, opacity: 0.9 }}
          >
            <Tooltip>
              {r.name} — {r.status}
            </Tooltip>
          </Polyline>
        ))}

      {layers.villages &&
        zones.map((z) => (
          <CircleMarker
            key={`vill-${z.district.id}`}
            center={[z.district.lat + 0.16, z.district.lng]}
            radius={4}
            pathOptions={{
              color: "var(--foreground)",
              fillColor: "var(--foreground)",
              fillOpacity: 0.5,
              weight: 1,
            }}
          >
            <Tooltip>
              Exposed settlements — {z.district.exposedPopulation.toLocaleString()} residents
            </Tooltip>
          </CircleMarker>
        ))}

      {layers.infrastructure &&
        zones.map((z) => (
          <CircleMarker
            key={`infra-${z.district.id}`}
            center={[z.district.lat, z.district.lng + 0.18]}
            radius={4}
            pathOptions={{
              color: "var(--chart-2)",
              fillColor: "var(--chart-2)",
              fillOpacity: 0.6,
              weight: 1,
            }}
          >
            <Tooltip>
              {z.nearbyShelters} emergency shelters · hospitals & schools in slope buffer
            </Tooltip>
          </CircleMarker>
        ))}

      {layers.reports &&
        reports.map((r) => (
          <CircleMarker
            key={`rep-${r.id}`}
            center={[r.lat, r.lng]}
            radius={5}
            pathOptions={{
              color: "var(--primary)",
              fillColor: "var(--primary)",
              fillOpacity: 0.85,
              weight: 1,
            }}
          >
            <Tooltip>
              {r.type} · {r.severity} · {r.reportedBy}
            </Tooltip>
          </CircleMarker>
        ))}

      {layers.sensors &&
        sensors.map((s) => (
          <CircleMarker
            key={`sen-${s.id}`}
            center={[s.lat, s.lng]}
            radius={4}
            pathOptions={{
              color:
                s.status === "CRITICAL"
                  ? "var(--risk-critical)"
                  : s.status === "WARNING"
                    ? "var(--risk-high)"
                    : s.status === "OFFLINE"
                      ? "var(--muted-foreground)"
                      : "var(--risk-low)",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Tooltip>
              {s.id} · {s.type} · {s.reading}
              {s.unit} · {s.status}
            </Tooltip>
          </CircleMarker>
        ))}
    </MapContainer>
  );
}
