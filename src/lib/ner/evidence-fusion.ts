/**
 * MULTI-SOURCE CONFIRMATION ENGINE ("AI Evidence Fusion")
 *
 * A critical alert should never rest on one abnormal input. This engine checks
 * each independent evidence stream, reports which are corroborating and which
 * are silent or unavailable, and downgrades the verdict when corroboration is
 * thin. Missing sources reduce confidence rather than being ignored.
 */

import type { CitizenReport, RiskZone, SensorDevice, Snapshot } from "./demo-data";

export type EvidenceVerdict =
  "MULTI-SOURCE CONFIRMED" | "PARTIALLY CORROBORATED" | "WATCH / MONITOR";
export type DataQuality = "HIGH" | "MEDIUM" | "LOW";

export interface EvidenceSource {
  key: string;
  label: string;
  /** Source is present in the pipeline at all (adapter connected / sensor alive). */
  available: boolean;
  /** Source is abnormal, i.e. actively corroborating the hazard. */
  corroborating: boolean;
  detail: string;
  weight: number;
}

export interface EvidenceFusion {
  districtId: string;
  district: string;
  sources: EvidenceSource[];
  corroboratingCount: number;
  availableCount: number;
  totalSources: number;
  /** 0-1 fused corroboration strength. */
  strength: number;
  verdict: EvidenceVerdict;
  /** Model confidence adjusted for data availability. */
  confidence: number;
  dataQuality: DataQuality;
  freshestInputMinutes: number;
  summary: string;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function fuseEvidence(
  zone: RiskZone,
  opts: { sensors: SensorDevice[]; reports: CitizenReport[] },
): EvidenceFusion {
  const o = zone.observation;
  const d = zone.district;
  const zoneSensors = opts.sensors.filter((s) => s.districtId === d.id);
  const liveSensors = zoneSensors.filter((s) => s.status !== "OFFLINE");
  const alarmSensors = liveSensors.filter((s) => s.status === "WARNING" || s.status === "CRITICAL");
  const zoneReports = opts.reports.filter((r) => r.districtId === d.id);
  const hazardReports = zoneReports.filter(
    (r) => r.type === "CRACK" || r.type === "SLOPE MOVEMENT" || r.type === "LANDSLIDE",
  );

  const sources: EvidenceSource[] = [
    {
      key: "rainfall",
      label: "Heavy rainfall",
      available: true,
      corroborating: o.rainfall24h > 80 || o.rainfallIntensity > 20,
      detail: `${o.rainfall24h} mm / 24 h · ${o.rainfallIntensity} mm/h`,
      weight: 0.22,
    },
    {
      key: "soil",
      label: "Soil saturation",
      available: true,
      corroborating: o.soilMoisture > 75,
      detail: `${o.soilMoisture} % volumetric`,
      weight: 0.17,
    },
    {
      key: "terrain",
      label: "Terrain susceptibility",
      available: true,
      corroborating: d.slope > 28,
      detail: `${d.slope}° mean slope · ${d.elevation} m`,
      weight: 0.13,
    },
    {
      key: "history",
      label: "Historical landslide record",
      available: true,
      corroborating: d.historicalEvents >= 8,
      detail: `${d.historicalEvents} recorded events`,
      weight: 0.1,
    },
    {
      key: "satellite",
      label: "Satellite change anomaly",
      available: o.satelliteIndicator > 0,
      corroborating: o.satelliteIndicator > 0.55,
      detail: `${Math.round(o.satelliteIndicator * 100)} % anomaly index`,
      weight: 0.13,
    },
    {
      key: "sensors",
      label: "Ground sensor network",
      available: liveSensors.length > 0,
      corroborating: alarmSensors.length > 0 || o.groundMovement > 4,
      detail: liveSensors.length
        ? `${alarmSensors.length}/${liveSensors.length} above threshold · creep ${o.groundMovement} mm`
        : "No live sensor in this district",
      weight: 0.13,
    },
    {
      key: "reports",
      label: "Citizen / field reports",
      available: zoneReports.length > 0,
      corroborating: hazardReports.length > 0,
      detail: zoneReports.length
        ? `${hazardReports.length} hazard report(s) of ${zoneReports.length}`
        : "No ground observation received",
      weight: 0.07,
    },
    {
      key: "forecast",
      label: "Rainfall forecast trend",
      available: zone.forecast.length > 0,
      corroborating: (zone.forecast[1]?.score ?? 0) > zone.assessment.score,
      detail: zone.forecast.length
        ? `+12 h projected ${zone.forecast[1]?.score ?? "—"}/100`
        : "Forecast unavailable",
      weight: 0.05,
    },
  ];

  const corroborating = sources.filter((s) => s.available && s.corroborating);
  const availableCount = sources.filter((s) => s.available).length;
  const strength = clamp(corroborating.reduce((s, x) => s + x.weight, 0));

  const independentFamilies = new Set(
    corroborating.map((s) =>
      s.key === "rainfall" || s.key === "forecast"
        ? "meteorological"
        : s.key === "soil" || s.key === "sensors"
          ? "geotechnical"
          : s.key === "satellite"
            ? "remote-sensing"
            : s.key === "reports"
              ? "ground-truth"
              : "static",
    ),
  ).size;

  const verdict: EvidenceVerdict =
    independentFamilies >= 3 && corroborating.length >= 4
      ? "MULTI-SOURCE CONFIRMED"
      : independentFamilies >= 2
        ? "PARTIALLY CORROBORATED"
        : "WATCH / MONITOR";

  const availability = availableCount / sources.length;
  const confidence = clamp(
    zone.assessment.confidence * (0.62 + availability * 0.38) + strength * 0.1,
  );
  const freshestInputMinutes = Math.min(
    o.dataAgeMinutes,
    ...(liveSensors.length ? liveSensors.map((s) => s.lastSeenMinutes) : [o.dataAgeMinutes]),
  );

  const dataQuality: DataQuality =
    availability >= 0.85 && freshestInputMinutes <= 30
      ? "HIGH"
      : availability >= 0.6 && freshestInputMinutes <= 90
        ? "MEDIUM"
        : "LOW";

  const summary =
    verdict === "MULTI-SOURCE CONFIRMED"
      ? `${corroborating.length} independent streams agree across ${independentFamilies} evidence families — escalation justified.`
      : verdict === "PARTIALLY CORROBORATED"
        ? "Two evidence families agree; escalate only with field verification."
        : "Single-family anomaly only — hold at watch level and seek ground truth.";

  return {
    districtId: d.id,
    district: d.name,
    sources,
    corroboratingCount: corroborating.length,
    availableCount,
    totalSources: sources.length,
    strength,
    verdict,
    confidence,
    dataQuality,
    freshestInputMinutes,
    summary,
  };
}

export function fuseAll(snapshot: Snapshot): Map<string, EvidenceFusion> {
  const map = new Map<string, EvidenceFusion>();
  for (const z of snapshot.zones) {
    map.set(
      z.district.id,
      fuseEvidence(z, { sensors: snapshot.sensors, reports: snapshot.reports }),
    );
  }
  return map;
}
