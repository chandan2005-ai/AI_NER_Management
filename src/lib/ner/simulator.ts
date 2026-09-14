/**
 * AI WHAT-IF DISASTER SIMULATOR
 *
 * Applies operator-defined perturbations to the current environmental state,
 * re-runs the full intelligence pipeline (risk -> isolation -> lifeline ->
 * impact) and returns a BEFORE / AFTER comparison. Nothing is mutated: the
 * simulation is a pure function of the live snapshot plus the scenario.
 */

import { assessRisk, type RiskAssessment } from "./risk-engine";
import type { RiskZone, RoadSegment, Snapshot } from "./demo-data";
import { assessIsolation, type IsolationAssessment } from "./isolation-engine";
import { assessAllLifelines, type RoadLifeline } from "./lifeline-engine";
import { buildImpact, type ImpactAssessment } from "./impact-engine";

export interface Scenario {
  /** Percentage change applied to rainfall depth & intensity, e.g. +30. */
  rainfallPct: number;
  /** Absolute percentage points added to soil moisture. */
  soilMoistureDelta: number;
  /** Additional mm/24 h of measured ground movement. */
  groundMovementDelta: number;
  /** Additional degrees of effective slope instability (cut-slope failure, undercutting). */
  slopeInstabilityDelta: number;
  /** Force the district's monitored roads into a blocked state. */
  roadBlockage: boolean;
  /** Simulate loss of the ground sensor network in the district. */
  sensorFailure: boolean;
  /** Simulate concurrent hazards (rain + earthquake shaking + upstream debris). */
  multiHazard: boolean;
}

export const DEFAULT_SCENARIO: Scenario = {
  rainfallPct: 30,
  soilMoistureDelta: 0,
  groundMovementDelta: 0,
  slopeInstabilityDelta: 0,
  roadBlockage: false,
  sensorFailure: false,
  multiHazard: false,
};

export const SCENARIO_PRESETS: {
  id: string;
  label: string;
  description: string;
  scenario: Scenario;
}[] = [
  {
    id: "rain10",
    label: "Rainfall +10 %",
    description: "Mild intensification of the current spell.",
    scenario: { ...DEFAULT_SCENARIO, rainfallPct: 10 },
  },
  {
    id: "rain30",
    label: "Rainfall +30 %",
    description: "IMD heavy-rainfall upgrade for the district.",
    scenario: { ...DEFAULT_SCENARIO, rainfallPct: 30 },
  },
  {
    id: "rain50",
    label: "Rainfall +50 %",
    description: "Extremely heavy rainfall / cloudburst conditions.",
    scenario: { ...DEFAULT_SCENARIO, rainfallPct: 50, soilMoistureDelta: 6 },
  },
  {
    id: "saturation",
    label: "Soil saturation surge",
    description: "Continuous rain drives regolith close to saturation.",
    scenario: { ...DEFAULT_SCENARIO, rainfallPct: 15, soilMoistureDelta: 14 },
  },
  {
    id: "creep",
    label: "Ground movement +6 mm",
    description: "Inclinometers report accelerating creep.",
    scenario: { ...DEFAULT_SCENARIO, rainfallPct: 10, groundMovementDelta: 6 },
  },
  {
    id: "cutslope",
    label: "Cut-slope failure",
    description: "Hill cutting removes lateral support along the corridor.",
    scenario: { ...DEFAULT_SCENARIO, rainfallPct: 10, slopeInstabilityDelta: 6 },
  },
  {
    id: "blockage",
    label: "Road blockage event",
    description: "Debris closes the primary access road.",
    scenario: { ...DEFAULT_SCENARIO, rainfallPct: 20, roadBlockage: true },
  },
  {
    id: "sensorloss",
    label: "Sensor network failure",
    description: "Telemetry lost — confidence must fall, not rise.",
    scenario: { ...DEFAULT_SCENARIO, rainfallPct: 20, sensorFailure: true },
  },
  {
    id: "compound",
    label: "Compound multi-hazard",
    description: "Cloudburst + saturation + creep + blockage together.",
    scenario: {
      rainfallPct: 50,
      soilMoistureDelta: 12,
      groundMovementDelta: 7,
      slopeInstabilityDelta: 5,
      roadBlockage: true,
      sensorFailure: false,
      multiHazard: true,
    },
  },
];

export interface SimulationSide {
  assessment: RiskAssessment;
  isolation: IsolationAssessment;
  impact: ImpactAssessment;
  lifelines: RoadLifeline[];
  roadsAffected: number;
  villagesIsolated: number;
  hospitalsAffected: number;
  populationExposed: number;
  emergencyAccessReductionPct: number;
  criticalLifelines: number;
}

export interface SimulationResult {
  districtId: string;
  district: string;
  state: string;
  scenario: Scenario;
  before: SimulationSide;
  after: SimulationSide;
  deltas: {
    score: number;
    probability: number;
    isolation: number;
    roads: number;
    villages: number;
    population: number;
    access: number;
    confidence: number;
  };
  recommendation: string[];
  narrative: string;
}

function applyScenario(zone: RiskZone, s: Scenario): RiskZone {
  const rainMul = 1 + s.rainfallPct / 100;
  const observation = {
    ...zone.observation,
    rainfall1h: Math.round(zone.observation.rainfall1h * rainMul * 10) / 10,
    rainfall6h: Math.round(zone.observation.rainfall6h * rainMul),
    rainfall12h: Math.round(zone.observation.rainfall12h * rainMul),
    rainfall24h: Math.round(zone.observation.rainfall24h * rainMul),
    rainfall72h: Math.round(zone.observation.rainfall72h * (1 + s.rainfallPct / 160)),
    rainfallIntensity:
      Math.round(zone.observation.rainfallIntensity * rainMul * (s.multiHazard ? 1.15 : 1) * 10) /
      10,
    soilMoisture: Math.min(98, zone.observation.soilMoisture + s.soilMoistureDelta),
    groundMovement: Math.round((zone.observation.groundMovement + s.groundMovementDelta) * 10) / 10,
    // Losing telemetry ages the freshest input for the district.
    dataAgeMinutes: s.sensorFailure
      ? Math.max(zone.observation.dataAgeMinutes, 180)
      : zone.observation.dataAgeMinutes,
    recentReports: s.multiHazard
      ? zone.observation.recentReports + 2
      : zone.observation.recentReports,
  };

  const district = {
    ...zone.district,
    slope: Math.min(60, zone.district.slope + s.slopeInstabilityDelta),
  };

  const features = {
    ...zone.features,
    rainfall24h: observation.rainfall24h,
    rainfall72h: observation.rainfall72h,
    rainfallIntensity: observation.rainfallIntensity,
    soilMoisture: observation.soilMoisture,
    slope: district.slope,
    groundMovement: s.sensorFailure ? 0 : observation.groundMovement,
    recentReports: observation.recentReports,
  };

  const assessment = assessRisk(features);

  return { ...zone, district, observation, features, assessment };
}

function applyRoadScenario(roads: RoadSegment[], districtId: string, s: Scenario): RoadSegment[] {
  if (!s.roadBlockage) return roads;
  return roads.map((r) =>
    r.districtId === districtId
      ? { ...r, status: "BLOCKED" as const, riskScore: Math.min(100, r.riskScore + 12) }
      : r,
  );
}

function buildSide(zone: RiskZone, zones: RiskZone[], roads: RoadSegment[]): SimulationSide {
  const isolation = assessIsolation(zone, roads);
  const lifelines = assessAllLifelines(
    roads.filter((r) => r.districtId === zone.district.id),
    zones,
  );
  const impact = buildImpact(zone, isolation, lifelines);

  return {
    assessment: zone.assessment,
    isolation,
    impact,
    lifelines,
    roadsAffected: lifelines.filter(
      (l) => l.priority === "HIGH" || l.priority === "CRITICAL" || l.road.status !== "OPEN",
    ).length,
    villagesIsolated: impact.villagesPotentiallyIsolated,
    hospitalsAffected: impact.hospitalsAffected,
    populationExposed: impact.populationExposed,
    emergencyAccessReductionPct: impact.emergencyAccessReductionPct,
    criticalLifelines: lifelines.filter((l) => l.priority === "CRITICAL").length,
  };
}

export function simulate(
  snapshot: Snapshot,
  districtId: string,
  scenario: Scenario,
): SimulationResult {
  const zone = snapshot.zones.find((z) => z.district.id === districtId) ?? snapshot.zones[0]!;
  const before = buildSide(zone, snapshot.zones, snapshot.roads);

  const afterZone = applyScenario(zone, scenario);
  const afterRoads = applyRoadScenario(snapshot.roads, zone.district.id, scenario);
  const afterZones = snapshot.zones.map((z) =>
    z.district.id === zone.district.id ? afterZone : z,
  );
  const after = buildSide(afterZone, afterZones, afterRoads);

  const recommendation: string[] = [];
  if (after.assessment.score - before.assessment.score >= 12)
    recommendation.push(
      `Escalate ${zone.district.name} to alert level ${after.assessment.score > 80 ? 4 : 3} and notify the district disaster management authority.`,
    );
  if (after.criticalLifelines > 0 || scenario.roadBlockage)
    recommendation.push(
      `Pre-position road-clearance equipment on ${after.lifelines[0]?.road.name ?? "the primary access road"}.`,
    );
  if (after.villagesIsolated > before.villagesIsolated)
    recommendation.push(
      `Pre-alert ${after.isolation.villages
        .filter((v) => v.onlyAccessRoute)
        .slice(0, 2)
        .map((v) => v.asset.name)
        .join(" and ")} — single-access settlements likely to lose vehicular access.`,
    );
  if (after.hospitalsAffected > 0)
    recommendation.push(
      "Establish an alternative medical evacuation route and inform the CHC in advance.",
    );
  if (scenario.sensorFailure)
    recommendation.push(
      "Sensor telemetry lost — treat the score as low-confidence and dispatch a field verification team.",
    );
  if (recommendation.length === 0)
    recommendation.push("No escalation required; continue the current monitoring cycle.");

  return {
    districtId: zone.district.id,
    district: zone.district.name,
    state: zone.district.state,
    scenario,
    before,
    after,
    deltas: {
      score: after.assessment.score - before.assessment.score,
      probability: after.assessment.probability - before.assessment.probability,
      isolation: after.isolation.score - before.isolation.score,
      roads: after.roadsAffected - before.roadsAffected,
      villages: after.villagesIsolated - before.villagesIsolated,
      population: after.populationExposed - before.populationExposed,
      access: after.emergencyAccessReductionPct - before.emergencyAccessReductionPct,
      confidence: after.assessment.confidence - before.assessment.confidence,
    },
    recommendation,
    narrative:
      `Under this scenario ${zone.district.name} moves from ${before.assessment.level} (${before.assessment.score}/100) ` +
      `to ${after.assessment.level} (${after.assessment.score}/100), with isolation risk ${before.isolation.score} → ${after.isolation.score}.`,
  };
}

/** Region-wide sweep: how many districts would cross into CRITICAL. */
export function simulateRegion(snapshot: Snapshot, scenario: Scenario) {
  const results = snapshot.zones
    .slice(0, 16)
    .map((z) => simulate(snapshot, z.district.id, scenario));
  return {
    results,
    criticalBefore: results.filter((r) => r.before.assessment.level === "CRITICAL").length,
    criticalAfter: results.filter((r) => r.after.assessment.level === "CRITICAL").length,
    populationDelta: results.reduce((s, r) => s + r.deltas.population, 0),
    villagesDelta: results.reduce((s, r) => s + r.deltas.villages, 0),
  };
}
