/**
 * CITIZEN REPORT AI VERIFICATION
 *
 * Image/video analysis alone NEVER proves a landslide. This module performs
 * AI-assisted visual triage and then fuses the visual indicators with GPS
 * context: rainfall, soil moisture, terrain risk, historical record, satellite
 * change and ground sensors. The output is a REPORT CONFIDENCE plus a
 * verification classification for the field team — not a determination.
 */

import type { CitizenReport, RiskZone, SensorDevice, Snapshot } from "./demo-data";
import { changesFor, type SatelliteChange } from "./satellite-change";

export type VisualIndicator =
  | "Ground cracks"
  | "Road deformation"
  | "Mud / debris"
  | "Slope movement indicators"
  | "Blocked road"
  | "Water / mud emergence"
  | "Visible terrain change";

export interface VerificationSignal {
  label: string;
  present: boolean;
  detail: string;
  weight: number;
}

export type VerificationClass =
  | "HIGH PRIORITY FIELD VERIFICATION"
  | "FIELD VERIFICATION QUEUED"
  | "MONITOR — LOW CORROBORATION"
  | "LIKELY NON-HAZARD / INFORMATIONAL";

export interface ReportVerification {
  reportId: string;
  /** 0-100 fused report confidence. */
  confidence: number;
  classification: VerificationClass;
  visualIndicators: VisualIndicator[];
  visualConfidence: number;
  signals: VerificationSignal[];
  contextRiskScore: number;
  recommendation: string;
  caveat: string;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

const TYPE_INDICATORS: Record<string, VisualIndicator[]> = {
  CRACK: ["Ground cracks", "Slope movement indicators"],
  "SLOPE MOVEMENT": ["Slope movement indicators", "Visible terrain change"],
  LANDSLIDE: ["Mud / debris", "Visible terrain change", "Blocked road"],
  "ROAD BLOCKAGE": ["Blocked road", "Mud / debris", "Road deformation"],
  ROCKFALL: ["Mud / debris", "Road deformation"],
  WATERLOGGING: ["Water / mud emergence"],
  OTHER: ["Visible terrain change"],
};

export function verifyReport(args: {
  report: CitizenReport;
  zone: RiskZone | undefined;
  sensors: SensorDevice[];
  changes: SatelliteChange[];
  peerReports: CitizenReport[];
}): ReportVerification {
  const { report, zone, sensors, changes, peerReports } = args;
  const o = zone?.observation;
  const zoneSensors = sensors.filter((s) => s.districtId === report.districtId);
  const alarmSensors = zoneSensors.filter((s) => s.status === "WARNING" || s.status === "CRITICAL");
  const satChanges = changesFor(changes, report.districtId);
  const peers = peerReports.filter((r) => r.districtId === report.districtId && r.id !== report.id);

  const visualIndicators = TYPE_INDICATORS[report.type] ?? TYPE_INDICATORS["OTHER"]!;
  const visualConfidence = report.imageAnalysis ? report.imageAnalysis.confidence / 100 : 0.35; // no media attached — triage relies on the text description only

  const signals: VerificationSignal[] = [
    {
      label: "Photo / video visual triage",
      present: Boolean(report.imageAnalysis),
      detail: report.imageAnalysis
        ? `${report.imageAnalysis.detected} · ${report.imageAnalysis.confidence} % model confidence`
        : "No media attached — text description only",
      weight: 0.2,
    },
    {
      label: "GPS inside monitored slope buffer",
      present: Boolean(zone),
      detail: zone
        ? `${zone.district.name}, ${zone.district.state} · ${zone.district.slope}° mean slope`
        : "Location outside monitored districts",
      weight: 0.1,
    },
    {
      label: "Rainfall at location",
      present: (o?.rainfall24h ?? 0) > 70,
      detail: o ? `${o.rainfall24h} mm / 24 h @ ${o.rainfallIntensity} mm/h` : "Unavailable",
      weight: 0.16,
    },
    {
      label: "Soil moisture",
      present: (o?.soilMoisture ?? 0) > 72,
      detail: o ? `${o.soilMoisture} % volumetric` : "Unavailable",
      weight: 0.12,
    },
    {
      label: "Terrain susceptibility",
      present: (zone?.district.slope ?? 0) > 26,
      detail: zone
        ? `${zone.district.slope}° slope · road-cut index ${zone.district.roadCutIndex}`
        : "Unavailable",
      weight: 0.1,
    },
    {
      label: "Historical landslide record",
      present: (zone?.district.historicalEvents ?? 0) >= 8,
      detail: zone ? `${zone.district.historicalEvents} recorded events` : "Unavailable",
      weight: 0.08,
    },
    {
      label: "Satellite change candidate nearby",
      present: satChanges.length > 0,
      detail: satChanges.length
        ? `${satChanges.length} candidate(s), top ${Math.round((satChanges[0]?.confidence ?? 0) * 100)} %`
        : "No change candidate above threshold",
      weight: 0.12,
    },
    {
      label: "Ground sensor corroboration",
      present: alarmSensors.length > 0 || (o?.groundMovement ?? 0) > 4,
      detail: zoneSensors.length
        ? `${alarmSensors.length}/${zoneSensors.length} above threshold · creep ${o?.groundMovement ?? 0} mm`
        : "No sensor in this district",
      weight: 0.07,
    },
    {
      label: "Corroborating nearby reports",
      present: peers.length > 0,
      detail: peers.length
        ? `${peers.length} other report(s) in the district`
        : "Single isolated report",
      weight: 0.05,
    },
  ];

  const contextStrength = signals.filter((s) => s.present).reduce((sum, s) => sum + s.weight, 0);

  const confidence = Math.round(clamp(contextStrength * 0.72 + visualConfidence * 0.28) * 100);

  const classification: VerificationClass =
    confidence >= 78
      ? "HIGH PRIORITY FIELD VERIFICATION"
      : confidence >= 58
        ? "FIELD VERIFICATION QUEUED"
        : confidence >= 38
          ? "MONITOR — LOW CORROBORATION"
          : "LIKELY NON-HAZARD / INFORMATIONAL";

  const recommendation =
    classification === "HIGH PRIORITY FIELD VERIFICATION"
      ? `Dispatch the nearest field team to ${report.district} within 2 h and restrict traffic on the affected stretch pending inspection.`
      : classification === "FIELD VERIFICATION QUEUED"
        ? `Add to the next inspection round in ${report.district}; request an additional photo from a safe distance.`
        : classification === "MONITOR — LOW CORROBORATION"
          ? "Keep under observation; escalate if rainfall increases or a second report arrives."
          : "Log for the record; no field action indicated by current evidence.";

  return {
    reportId: report.id,
    confidence,
    classification,
    visualIndicators,
    visualConfidence: Math.round(visualConfidence * 100),
    signals,
    contextRiskScore: zone?.assessment.score ?? 0,
    recommendation,
    caveat:
      "AI-assisted triage only. Image analysis indicates possible hazard features; it does not prove a landslide occurred. Field verification is required before any determination.",
  };
}

export function verifyAll(
  snapshot: Snapshot,
  reports: CitizenReport[],
  changes: SatelliteChange[],
): Map<string, ReportVerification> {
  const zoneById = new Map(snapshot.zones.map((z) => [z.district.id, z]));
  const map = new Map<string, ReportVerification>();
  for (const r of reports) {
    map.set(
      r.id,
      verifyReport({
        report: r,
        zone: zoneById.get(r.districtId),
        sensors: snapshot.sensors,
        changes,
        peerReports: reports,
      }),
    );
  }
  return map;
}
