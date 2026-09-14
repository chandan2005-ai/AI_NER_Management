/**
 * INTELLIGENCE COMPOSER
 *
 * Runs the whole decision pipeline over a snapshot in one deterministic pass:
 *
 *   PREDICT -> EXPLAIN -> SIMULATE -> ASSESS IMPACT -> PRIORITIZE -> ACT
 *
 * Kept pure so it can be memoised per snapshot tick and reused by every route.
 */

import type { Snapshot } from "./demo-data";
import { assessAllIsolation, type IsolationAssessment } from "./isolation-engine";
import { assessAllLifelines, type RoadLifeline } from "./lifeline-engine";
import { fuseAll, type EvidenceFusion } from "./evidence-fusion";
import { buildImpact, type ImpactAssessment } from "./impact-engine";
import { detectChanges, type SatelliteChange } from "./satellite-change";
import { buildResponsePlan, type ResponsePlan } from "./recommendation-engine";
import { verifyAll, type ReportVerification } from "./citizen-verification";
import {
  optimizeResources,
  DEFAULT_RESOURCES,
  type ResourceAllocation,
  type ResourcePool,
} from "./resource-optimizer";
import { hospitalsOf, schoolsOf, villagesOf } from "./assets";

export interface Intelligence {
  isolation: IsolationAssessment[];
  isolationById: Map<string, IsolationAssessment>;
  lifelines: RoadLifeline[];
  evidence: Map<string, EvidenceFusion>;
  impact: Map<string, ImpactAssessment>;
  plans: Map<string, ResponsePlan>;
  changes: SatelliteChange[];
  verifications: Map<string, ReportVerification>;
  allocations: ResourceAllocation[];
  resourcesRemaining: ResourcePool;
  totals: {
    criticalZones: number;
    criticalIsolation: number;
    roadsAtRisk: number;
    criticalLifelines: number;
    villagesAtRisk: number;
    hospitalsAtRisk: number;
    schoolsAtRisk: number;
    populationExposed: number;
    confirmedAlerts: number;
    watchOnly: number;
    satelliteDetections: number;
    sensorAnomalies: number;
    meanConfidence: number;
    dataQualityHigh: number;
  };
}

export function buildIntelligence(
  snapshot: Snapshot,
  resources: ResourcePool = DEFAULT_RESOURCES,
): Intelligence {
  const isolation = assessAllIsolation(snapshot.zones, snapshot.roads);
  const isolationById = new Map(isolation.map((i) => [i.districtId, i]));
  const lifelines = assessAllLifelines(snapshot.roads, snapshot.zones);
  const evidence = fuseAll(snapshot);
  const changes = detectChanges(snapshot);

  const impact = new Map<string, ImpactAssessment>();
  const plans = new Map<string, ResponsePlan>();

  for (const z of snapshot.zones) {
    const iso = isolationById.get(z.district.id)!;
    const imp = buildImpact(z, iso, lifelines);
    impact.set(z.district.id, imp);
    plans.set(
      z.district.id,
      buildResponsePlan({
        zone: z,
        evidence: evidence.get(z.district.id)!,
        isolation: iso,
        lifelines: lifelines.filter((l) => l.road.districtId === z.district.id),
        impact: imp,
        reports: snapshot.reports,
      }),
    );
  }

  const verifications = verifyAll(snapshot, snapshot.reports, changes);
  const { allocations, remaining } = optimizeResources(snapshot, isolation, lifelines, resources);

  const criticalZones = snapshot.zones.filter(
    (z) => z.assessment.level === "CRITICAL" || z.assessment.level === "VERY HIGH",
  );
  const atRiskDistrictIds = new Set(criticalZones.map((z) => z.district.id));

  const villagesAtRisk = isolation
    .filter((i) => i.level === "HIGH" || i.level === "CRITICAL")
    .reduce((s, i) => s + Math.max(1, i.villagesAtRisk), 0);

  const hospitalsAtRisk = [...atRiskDistrictIds].reduce((s, id) => s + hospitalsOf(id).length, 0);
  const schoolsAtRisk = [...atRiskDistrictIds].reduce((s, id) => s + schoolsOf(id).length, 0);
  const populationExposed = [...atRiskDistrictIds].reduce(
    (s, id) => s + villagesOf(id).reduce((v, x) => v + x.population, 0),
    0,
  );

  const evidenceValues = [...evidence.values()];

  return {
    isolation,
    isolationById,
    lifelines,
    evidence,
    impact,
    plans,
    changes,
    verifications,
    allocations,
    resourcesRemaining: remaining,
    totals: {
      criticalZones: criticalZones.length,
      criticalIsolation: isolation.filter((i) => i.level === "CRITICAL").length,
      roadsAtRisk: lifelines.filter((l) => l.priority === "HIGH" || l.priority === "CRITICAL")
        .length,
      criticalLifelines: lifelines.filter((l) => l.priority === "CRITICAL").length,
      villagesAtRisk,
      hospitalsAtRisk,
      schoolsAtRisk,
      populationExposed,
      confirmedAlerts: evidenceValues.filter((e) => e.verdict === "MULTI-SOURCE CONFIRMED").length,
      watchOnly: evidenceValues.filter((e) => e.verdict === "WATCH / MONITOR").length,
      satelliteDetections: changes.length,
      sensorAnomalies: snapshot.sensors.filter(
        (s) => s.status === "WARNING" || s.status === "CRITICAL",
      ).length,
      meanConfidence:
        Math.round(
          (evidenceValues.reduce((s, e) => s + e.confidence, 0) /
            Math.max(1, evidenceValues.length)) *
            100,
        ) / 100,
      dataQualityHigh: evidenceValues.filter((e) => e.dataQuality === "HIGH").length,
    },
  };
}
