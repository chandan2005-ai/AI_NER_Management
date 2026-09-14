/**
 * ROAD LIFELINE AI
 *
 * Ranks road segments not by landslide probability alone, but by what the road
 * *does* for the community it serves: population dependency, hospital access,
 * school/public infrastructure dependency and redundancy of the network.
 */

import type { RiskZone, RoadSegment } from "./demo-data";
import { hospitalsOf, schoolsOf, villagesOf } from "./assets";
import { seeded } from "./seed";

export type LifelinePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RoadLifeline {
  road: RoadSegment;
  landslideProbability: number;
  blockageProbability: number;
  trafficImportance: number;
  alternativeRoute: boolean;
  alternativeRouteLabel: string;
  populationDependency: number;
  hospitalDependency: boolean;
  schoolDependency: number;
  emergencyAccessImportance: number;
  lifelineScore: number;
  priority: LifelinePriority;
  recommendation: string;
  reasons: string[];
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

const IMPORTANCE_WEIGHT: Record<RoadSegment["importance"], number> = {
  "National Highway": 1,
  "State Highway": 0.8,
  "District Road": 0.55,
  "Rural Road": 0.4,
};

function priorityOf(score: number): LifelinePriority {
  if (score >= 76) return "CRITICAL";
  if (score >= 58) return "HIGH";
  if (score >= 38) return "MEDIUM";
  return "LOW";
}

export function lifelinePriorityClass(p: LifelinePriority) {
  return {
    LOW: "bg-risk-low/15 text-risk-low border-risk-low/40",
    MEDIUM: "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/40",
    HIGH: "bg-risk-high/18 text-risk-high border-risk-high/45",
    CRITICAL: "bg-risk-critical/25 text-risk-critical border-risk-critical/55",
  }[p];
}

export function assessLifeline(road: RoadSegment, zone: RiskZone | undefined): RoadLifeline {
  const probability = zone?.assessment.probability ?? road.riskScore / 130;
  const statusBoost =
    road.status === "CLOSED" || road.status === "BLOCKED"
      ? 0.3
      : road.status === "DANGEROUS"
        ? 0.18
        : road.status === "PARTIALLY BLOCKED"
          ? 0.08
          : 0;
  const blockageProbability = clamp(
    probability * 0.82 + statusBoost + seeded(`${road.id}-bp`) * 0.08,
  );

  const villages = villagesOf(road.districtId);
  const hospitals = hospitalsOf(road.districtId);
  const schools = schoolsOf(road.districtId);
  const alternativeRoute = !road.alternativeRoute.startsWith("No viable");
  const populationDependency = villages.reduce((s, v) => s + v.population, 0);
  const hospitalDependency = hospitals.length > 0 && !alternativeRoute;
  const trafficImportance = IMPORTANCE_WEIGHT[road.importance];
  const emergencyAccessImportance = clamp(
    trafficImportance * 0.5 + (alternativeRoute ? 0 : 0.3) + (hospitals.length ? 0.2 : 0),
  );

  const lifelineScore = Math.round(
    clamp(
      probability * 0.3 +
        blockageProbability * 0.16 +
        trafficImportance * 0.14 +
        (alternativeRoute ? 0.02 : 0.14) +
        clamp(populationDependency / 3500) * 0.12 +
        (hospitalDependency ? 0.08 : 0.02) +
        clamp(schools.length / 4) * 0.04 +
        emergencyAccessImportance * 0.08,
    ) * 100,
  );

  const priority = priorityOf(lifelineScore);

  const reasons: string[] = [];
  if (probability > 0.6) reasons.push(`Landslide probability ${Math.round(probability * 100)} %`);
  if (!alternativeRoute) reasons.push("No viable alternative route");
  if (hospitalDependency) reasons.push("Sole access to district health facility");
  if (populationDependency > 1500)
    reasons.push(`${populationDependency.toLocaleString()} residents depend on this link`);
  if (road.importance === "National Highway") reasons.push("National highway / relief corridor");
  if (road.status !== "OPEN") reasons.push(`Currently ${road.status.toLowerCase()}`);
  if (reasons.length === 0) reasons.push("Redundant network, low current hazard");

  const recommendation =
    priority === "CRITICAL"
      ? "Inspect immediately and pre-position clearance equipment at the cut section."
      : priority === "HIGH"
        ? "Schedule inspection within 6 h, restrict heavy vehicles and confirm the alternate route."
        : priority === "MEDIUM"
          ? "Inspect within 24 h and keep drainage clear along the cut slope."
          : "Routine patrol cycle; no pre-positioning required.";

  return {
    road,
    landslideProbability: probability,
    blockageProbability,
    trafficImportance,
    alternativeRoute,
    alternativeRouteLabel: road.alternativeRoute,
    populationDependency,
    hospitalDependency,
    schoolDependency: schools.length,
    emergencyAccessImportance,
    lifelineScore,
    priority,
    recommendation,
    reasons,
  };
}

export function assessAllLifelines(roads: RoadSegment[], zones: RiskZone[]): RoadLifeline[] {
  const byId = new Map(zones.map((z) => [z.district.id, z]));
  return roads
    .map((r) => assessLifeline(r, byId.get(r.districtId)))
    .sort((a, b) => b.lifelineScore - a.lifelineScore);
}
