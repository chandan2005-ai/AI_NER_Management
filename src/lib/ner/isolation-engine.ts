/**
 * COMMUNITY ISOLATION ENGINE
 *
 * Isolation risk is deliberately a *separate* metric from landslide risk.
 * A small slide on the only access road to a hill village can be far more
 * consequential for life safety than a large slide on a slope served by three
 * alternative highways. This engine quantifies that asymmetry.
 *
 * Transparent additive model — every point contribution is reported so a
 * district officer can see exactly why a community ranks where it does.
 */

import type { RiskZone, RoadSegment } from "./demo-data";
import { villagesOf, hospitalsOf, type CommunityAsset } from "./assets";
import { seeded } from "./seed";

export type IsolationLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface IsolationFactor {
  label: string;
  points: number;
  value: string;
  note: string;
}

export interface VillageIsolation {
  asset: CommunityAsset;
  score: number;
  level: IsolationLevel;
  onlyAccessRoute: boolean;
  alternativeRoute: boolean;
  hospitalDistanceKm: number;
  emergencyDistanceKm: number;
  populationServed: number;
}

export interface IsolationAssessment {
  districtId: string;
  district: string;
  state: string;
  /** 0-100 community isolation risk (distinct from landslide risk). */
  score: number;
  level: IsolationLevel;
  factors: IsolationFactor[];
  connectingRoads: number;
  singleAccessVillages: number;
  villagesAtRisk: number;
  populationServed: number;
  hospitalAccessThreatened: boolean;
  nearestHospitalKm: number;
  historicalBlockages: number;
  villages: VillageIsolation[];
  recommendation: string;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

const IMPORTANCE_WEIGHT: Record<RoadSegment["importance"], number> = {
  "National Highway": 1,
  "State Highway": 0.8,
  "District Road": 0.55,
  "Rural Road": 0.4,
};

function levelOf(score: number): IsolationLevel {
  if (score >= 78) return "CRITICAL";
  if (score >= 58) return "HIGH";
  if (score >= 35) return "MODERATE";
  return "LOW";
}

export const ISOLATION_COLORS: Record<IsolationLevel, string> = {
  LOW: "var(--risk-low)",
  MODERATE: "var(--risk-moderate)",
  HIGH: "var(--risk-high)",
  CRITICAL: "var(--risk-critical)",
};

export function isolationBgClass(level: IsolationLevel) {
  return {
    LOW: "bg-risk-low/15 text-risk-low border-risk-low/40",
    MODERATE: "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/40",
    HIGH: "bg-risk-high/18 text-risk-high border-risk-high/45",
    CRITICAL: "bg-risk-critical/25 text-risk-critical border-risk-critical/55",
  }[level];
}

/** Isolation risk for one district, given the roads serving it. */
export function assessIsolation(zone: RiskZone, roads: RoadSegment[]): IsolationAssessment {
  const d = zone.district;
  const districtRoads = roads.filter((r) => r.districtId === d.id);
  const connectingRoads = Math.max(1, districtRoads.length);
  const hasAlternative = districtRoads.some(
    (r) => r.alternativeRoute && !r.alternativeRoute.startsWith("No viable"),
  );
  const blockedRoads = districtRoads.filter(
    (r) => r.status === "BLOCKED" || r.status === "CLOSED" || r.status === "DANGEROUS",
  ).length;
  const importance = districtRoads.length
    ? Math.max(...districtRoads.map((r) => IMPORTANCE_WEIGHT[r.importance]))
    : 0.5;

  const villages = villagesOf(d.id);
  const hospitals = hospitalsOf(d.id);
  const nearestHospitalKm = Math.min(...villages.map((v) => v.hospitalDistanceKm), 99);
  const historicalBlockages = Math.round(d.historicalEvents * 0.6 + seeded(`${d.id}-blk`) * 3);
  const probability = zone.assessment.probability;

  const factors: IsolationFactor[] = [];
  const push = (label: string, fraction: number, budget: number, value: string, note: string) =>
    factors.push({
      label,
      points: Math.round(clamp(fraction) * budget * 10) / 10,
      value,
      note,
    });

  const singleAccessVillages = villages.filter((v) => v.connectingRoads <= 1).length;

  push(
    "Single-access dependency",
    villages.length ? singleAccessVillages / villages.length : 0,
    24,
    `${singleAccessVillages} of ${villages.length} settlements`,
    "Settlements with one road link lose all vehicular access from a single blockage.",
  );
  push(
    "Alternative route availability",
    hasAlternative ? 0.2 : 1,
    16,
    hasAlternative ? "Alternate route exists" : "No viable alternate",
    "Without a bypass, clearance time becomes the access time for emergency vehicles.",
  );
  push(
    "Landslide probability on access roads",
    probability,
    15,
    `${Math.round(probability * 100)} % (24 h)`,
    "Isolation only materialises if the slope above the lifeline actually fails.",
  );
  push(
    "Population served",
    Math.min(1, d.exposedPopulation / 4000),
    12,
    d.exposedPopulation.toLocaleString(),
    "More residents behind a single link means greater consequence per blockage.",
  );
  push(
    "Distance to nearest hospital",
    Math.min(1, nearestHospitalKm / 60),
    11,
    `${nearestHospitalKm} km`,
    "Longer medical evacuation distance shrinks the golden hour once a road closes.",
  );
  push(
    "Emergency service reach",
    Math.min(1, Math.min(...villages.map((v) => v.emergencyDistanceKm), 60) / 50),
    8,
    `${Math.min(...villages.map((v) => v.emergencyDistanceKm), 60)} km to depot`,
    "Response depots far from the community delay clearance and rescue.",
  );
  push(
    "Lifeline road importance",
    importance,
    7,
    districtRoads[0]?.importance ?? "District Road",
    "Higher-order roads carry regional traffic, relief convoys and medical transfer.",
  );
  push(
    "Historical blockage record",
    Math.min(1, historicalBlockages / 12),
    5,
    `${historicalBlockages} recorded closures`,
    "Repeat-blockage corridors tend to fail again in comparable rainfall.",
  );
  push(
    "Current rainfall pressure",
    Math.min(1, zone.observation.rainfall24h / 200),
    2,
    `${zone.observation.rainfall24h} mm / 24 h`,
    "Active rainfall increases both failure likelihood and clearance difficulty.",
  );

  let score = factors.reduce((s, f) => s + f.points, 0);
  if (blockedRoads > 0) score += Math.min(10, blockedRoads * 5);
  if (singleAccessVillages > 0 && probability > 0.6) score += 6;
  score = Math.round(clamp(score, 0, 100));

  const level = levelOf(score);

  const villageDetail: VillageIsolation[] = villages
    .map((v) => {
      const only = v.connectingRoads <= 1;
      const vScore = Math.round(
        clamp(
          (only ? 0.42 : 0.14) +
            probability * 0.26 +
            Math.min(1, v.hospitalDistanceKm / 60) * 0.16 +
            Math.min(1, v.population / 1500) * 0.12 +
            (hasAlternative ? 0 : 0.08),
        ) * 100,
      );
      return {
        asset: v,
        score: vScore,
        level: levelOf(vScore),
        onlyAccessRoute: only,
        alternativeRoute: hasAlternative,
        hospitalDistanceKm: v.hospitalDistanceKm,
        emergencyDistanceKm: v.emergencyDistanceKm,
        populationServed: v.population,
      };
    })
    .sort((a, b) => b.score - a.score);

  const hospitalAccessThreatened =
    hospitals.length > 0 && (probability > 0.55 || blockedRoads > 0) && !hasAlternative;

  const recommendation =
    level === "CRITICAL"
      ? `Pre-position clearance equipment on the ${districtRoads[0]?.name ?? "main access road"} and pre-alert ${villageDetail[0]?.asset.name ?? "the exposed settlement"}; plan a medical evacuation route now.`
      : level === "HIGH"
        ? `Inspect the single-access link serving ${villageDetail[0]?.asset.name ?? "exposed settlements"} and confirm an alternate route with PWD.`
        : level === "MODERATE"
          ? "Verify alternate route condition and keep clearance machinery on standby within the district."
          : "Routine monitoring; access redundancy is adequate for current conditions.";

  return {
    districtId: d.id,
    district: d.name,
    state: d.state,
    score,
    level,
    factors: factors.sort((a, b) => b.points - a.points),
    connectingRoads,
    singleAccessVillages,
    villagesAtRisk: villageDetail.filter((v) => v.level === "HIGH" || v.level === "CRITICAL")
      .length,
    populationServed: villages.reduce((s, v) => s + v.population, 0),
    hospitalAccessThreatened,
    nearestHospitalKm,
    historicalBlockages,
    villages: villageDetail,
    recommendation,
  };
}

export function assessAllIsolation(zones: RiskZone[], roads: RoadSegment[]): IsolationAssessment[] {
  return zones.map((z) => assessIsolation(z, roads)).sort((a, b) => b.score - a.score);
}
