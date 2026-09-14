/**
 * AI EMERGENCY RESOURCE OPTIMIZER — "Where should we send resources first?"
 *
 * Greedy priority allocation over a ranked need model. Deterministic and
 * explainable: each allocation carries the reason it outranked the next zone.
 */

import type { Snapshot } from "./demo-data";
import type { IsolationAssessment } from "./isolation-engine";
import type { RoadLifeline } from "./lifeline-engine";

export interface ResourcePool {
  rescueTeams: number;
  ambulances: number;
  excavators: number;
  clearanceTeams: number;
  medicalTeams: number;
  supplyKits: number;
}

export const DEFAULT_RESOURCES: ResourcePool = {
  rescueTeams: 4,
  ambulances: 6,
  excavators: 3,
  clearanceTeams: 5,
  medicalTeams: 4,
  supplyKits: 12,
};

export const RESOURCE_LABELS: { key: keyof ResourcePool; label: string; unit: string }[] = [
  { key: "rescueTeams", label: "Rescue teams", unit: "teams" },
  { key: "ambulances", label: "Ambulances", unit: "vehicles" },
  { key: "excavators", label: "Excavators", unit: "machines" },
  { key: "clearanceTeams", label: "Road clearance teams", unit: "teams" },
  { key: "medicalTeams", label: "Medical teams", unit: "teams" },
  { key: "supplyKits", label: "Emergency supply kits", unit: "kits" },
];

export interface ResourceAllocation {
  rank: number;
  districtId: string;
  district: string;
  state: string;
  riskScore: number;
  riskLevel: string;
  isolationScore: number;
  populationExposed: number;
  needScore: number;
  timeSensitivityHours: number;
  alternativeRoute: boolean;
  hospitalAccessThreatened: boolean;
  reason: string;
  allocation: Partial<Record<keyof ResourcePool, number>>;
  unmet: string[];
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function optimizeResources(
  snapshot: Snapshot,
  isolation: IsolationAssessment[],
  lifelines: RoadLifeline[],
  pool: ResourcePool,
  limit = 8,
): { allocations: ResourceAllocation[]; remaining: ResourcePool } {
  const isoById = new Map(isolation.map((i) => [i.districtId, i]));

  const ranked = snapshot.zones
    .map((z) => {
      const iso = isoById.get(z.district.id);
      const zoneLifelines = lifelines.filter((l) => l.road.districtId === z.district.id);
      const worstLifeline = zoneLifelines[0];
      const alternativeRoute = zoneLifelines.some((l) => l.alternativeRoute);
      const timeSensitivityHours =
        z.trend === "RAPIDLY INCREASING" ? 2 : z.trend === "INCREASING" ? 6 : 12;

      const needScore =
        clamp(z.assessment.score / 100) * 34 +
        clamp((iso?.score ?? 0) / 100) * 26 +
        clamp((iso?.populationServed ?? z.district.exposedPopulation) / 4000) * 14 +
        (iso?.hospitalAccessThreatened ? 8 : 2) +
        clamp((worstLifeline?.lifelineScore ?? 0) / 100) * 9 +
        (12 / timeSensitivityHours) * 4 +
        (alternativeRoute ? 0 : 5);

      const reasonBits: string[] = [];
      if (z.assessment.score > 70)
        reasonBits.push(`${z.assessment.level} landslide risk (${z.assessment.score}/100)`);
      if ((iso?.singleAccessVillages ?? 0) > 0)
        reasonBits.push(`${iso?.singleAccessVillages} single-access settlement(s)`);
      if (iso?.hospitalAccessThreatened) reasonBits.push("hospital access threatened");
      if (!alternativeRoute) reasonBits.push("no alternative route");
      else reasonBits.push("alternative road available");
      reasonBits.push(
        `${(iso?.populationServed ?? z.district.exposedPopulation).toLocaleString()} residents exposed`,
      );

      return {
        z,
        iso,
        needScore: Math.round(needScore * 10) / 10,
        timeSensitivityHours,
        alternativeRoute,
        reason: reasonBits.join(" + "),
      };
    })
    .sort((a, b) => b.needScore - a.needScore)
    .slice(0, limit);

  const remaining: ResourcePool = { ...pool };
  const allocations: ResourceAllocation[] = ranked.map((r, i) => {
    const allocation: Partial<Record<keyof ResourcePool, number>> = {};
    const unmet: string[] = [];

    const take = (key: keyof ResourcePool, want: number, label: string) => {
      if (want <= 0) return;
      const given = Math.min(want, remaining[key]);
      if (given > 0) {
        allocation[key] = given;
        remaining[key] -= given;
      }
      if (given < want) unmet.push(`${label} (${want - given} short)`);
    };

    const critical = r.z.assessment.score > 80;
    const high = r.z.assessment.score > 60;
    const isoCritical = (r.iso?.score ?? 0) > 75;

    take("clearanceTeams", critical ? 2 : high ? 1 : 0, "Road clearance team");
    take("excavators", critical || isoCritical ? 1 : 0, "Excavator");
    take("rescueTeams", critical ? 1 : 0, "Rescue team");
    take("ambulances", r.iso?.hospitalAccessThreatened ? 2 : critical ? 1 : 0, "Ambulance");
    take("medicalTeams", isoCritical ? 1 : 0, "Medical team");
    take("supplyKits", isoCritical ? 3 : high ? 2 : 1, "Supply kit");

    return {
      rank: i + 1,
      districtId: r.z.district.id,
      district: r.z.district.name,
      state: r.z.district.state,
      riskScore: r.z.assessment.score,
      riskLevel: r.z.assessment.level,
      isolationScore: r.iso?.score ?? 0,
      populationExposed: r.iso?.populationServed ?? r.z.district.exposedPopulation,
      needScore: r.needScore,
      timeSensitivityHours: r.timeSensitivityHours,
      alternativeRoute: r.alternativeRoute,
      hospitalAccessThreatened: r.iso?.hospitalAccessThreatened ?? false,
      reason: r.reason,
      allocation,
      unmet,
    };
  });

  return { allocations, remaining };
}
