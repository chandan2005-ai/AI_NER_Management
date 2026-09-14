/**
 * IMPACT & CASCADING HAZARD ENGINE ("What happens next?")
 *
 * Converts a landslide risk score into a causal chain with per-stage
 * likelihoods and the supporting data behind each stage, plus secondary
 * (cascading) hazards such as stream obstruction and downstream water
 * accumulation. Wording is deliberately conditional — these are potential
 * consequences, not forecasts of certainty.
 */

import type { RiskZone } from "./demo-data";
import type { IsolationAssessment } from "./isolation-engine";
import type { RoadLifeline } from "./lifeline-engine";
import { hospitalsOf, schoolsOf } from "./assets";

export type StageStatus = "OBSERVED" | "LIKELY" | "POSSIBLE" | "UNLIKELY";

export interface ImpactStage {
  key: string;
  title: string;
  /** 0-1 likelihood of this stage given the previous one. */
  probability: number;
  status: StageStatus;
  detail: string;
  evidence: [string, string][];
}

export interface CascadeBranch {
  title: string;
  probability: number;
  note: string;
}

export interface ImpactAssessment {
  districtId: string;
  district: string;
  stages: ImpactStage[];
  cascades: CascadeBranch[];
  roadsAtRisk: number;
  villagesPotentiallyIsolated: number;
  hospitalsAffected: number;
  schoolsAffected: number;
  populationExposed: number;
  emergencyAccessReductionPct: number;
  summary: string;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

function statusOf(p: number, observed = false): StageStatus {
  if (observed) return "OBSERVED";
  if (p >= 0.62) return "LIKELY";
  if (p >= 0.3) return "POSSIBLE";
  return "UNLIKELY";
}

export function buildImpact(
  zone: RiskZone,
  isolation: IsolationAssessment,
  lifelines: RoadLifeline[],
): ImpactAssessment {
  const o = zone.observation;
  const d = zone.district;
  const zoneLifelines = lifelines.filter((l) => l.road.districtId === d.id);
  const hospitals = hospitalsOf(d.id);
  const schools = schoolsOf(d.id);

  const pRain = clamp(o.rainfall24h / 160);
  const pSat = clamp((o.soilMoisture - 55) / 35);
  const pInstab = clamp(zone.assessment.score / 100);
  const pSlide = zone.assessment.probability;
  const pBlock = zoneLifelines.length
    ? Math.max(...zoneLifelines.map((l) => l.blockageProbability))
    : pSlide * 0.7;
  const isolationP = clamp((isolation.score / 100) * pBlock * 1.35);
  const accessP = clamp(isolationP * (isolation.hospitalAccessThreatened ? 1.15 : 0.85));
  const infraP = clamp(pSlide * 0.6 + (schools.length ? 0.08 : 0));

  const stages: ImpactStage[] = [
    {
      key: "rainfall",
      title: "Heavy rainfall",
      probability: pRain,
      status: statusOf(pRain, o.rainfall24h > 80),
      detail: `${o.rainfall24h} mm in 24 h at ${o.rainfallIntensity} mm/h against a normal of ${o.rainfallNormal24h} mm.`,
      evidence: [
        ["Rainfall 24 h", `${o.rainfall24h} mm`],
        ["Rainfall 72 h", `${o.rainfall72h} mm`],
        ["Anomaly", `${zone.rainfallAnomalyPct > 0 ? "+" : ""}${zone.rainfallAnomalyPct} %`],
      ],
    },
    {
      key: "saturation",
      title: "Soil saturation",
      probability: pSat,
      status: statusOf(pSat, o.soilMoisture > 80),
      detail: `Regolith at ${o.soilMoisture} % moisture; pore-water pressure rising, shear strength falling.`,
      evidence: [
        ["Soil moisture", `${o.soilMoisture} %`],
        ["Soil class", d.soilClass],
        ["Antecedent rain", `${o.rainfall72h} mm / 72 h`],
      ],
    },
    {
      key: "instability",
      title: "Slope instability",
      probability: pInstab,
      status: statusOf(pInstab, o.groundMovement > 5),
      detail: `${d.slope}° slopes with ${o.groundMovement} mm/24 h measured creep and ${Math.round(o.satelliteIndicator * 100)} % satellite anomaly.`,
      evidence: [
        ["Slope", `${d.slope}°`],
        ["Ground movement", `${o.groundMovement} mm / 24 h`],
        ["Road-cut index", d.roadCutIndex.toFixed(2)],
      ],
    },
    {
      key: "landslide",
      title: "Landslide initiation",
      probability: pSlide,
      status: statusOf(pSlide),
      detail: `Model estimates ${Math.round(pSlide * 100)} % probability of a landslide-related hazard within 24 h.`,
      evidence: [
        ["Risk score", `${zone.assessment.score}/100`],
        ["Risk level", zone.assessment.level],
        ["Historical events", `${d.historicalEvents}`],
      ],
    },
    {
      key: "blockage",
      title: "Road blockage",
      probability: pBlock,
      status: statusOf(
        pBlock,
        zoneLifelines.some((l) => l.road.status === "BLOCKED" || l.road.status === "CLOSED"),
      ),
      detail: zoneLifelines.length
        ? `${zoneLifelines.length} monitored segment(s); highest blockage probability ${Math.round(pBlock * 100)} % on ${zoneLifelines[0]?.road.name}.`
        : "No monitored highway segment in this district; village roads assumed vulnerable.",
      evidence: zoneLifelines
        .slice(0, 3)
        .map((l) => [l.road.name, `${l.road.status} · ${l.priority}`]),
    },
    {
      key: "isolation",
      title: "Village isolation",
      probability: isolationP,
      status: statusOf(isolationP),
      detail: `${isolation.singleAccessVillages} settlement(s) depend on a single road link; isolation risk ${isolation.score}/100.`,
      evidence: [
        ["Isolation risk", `${isolation.score}/100 (${isolation.level})`],
        ["Single-access villages", `${isolation.singleAccessVillages}`],
        ["Population served", isolation.populationServed.toLocaleString()],
      ],
    },
    {
      key: "access",
      title: "Emergency access reduction",
      probability: accessP,
      status: statusOf(accessP),
      detail: `Nearest hospital ${isolation.nearestHospitalKm} km away${isolation.hospitalAccessThreatened ? " with no alternative route" : ""}; ambulance response window would lengthen materially.`,
      evidence: [
        ["Nearest hospital", `${isolation.nearestHospitalKm} km`],
        ["Hospital access threatened", isolation.hospitalAccessThreatened ? "YES" : "NO"],
        [
          "Alternate route",
          zoneLifelines.some((l) => l.alternativeRoute) ? "Available" : "None viable",
        ],
      ],
    },
    {
      key: "infrastructure",
      title: "Potential infrastructure impact",
      probability: infraP,
      status: statusOf(infraP),
      detail: `${hospitals.length} health facility and ${schools.length} school(s) sit inside the monitored slope buffer.`,
      evidence: [
        ["Hospitals in buffer", `${hospitals.length}`],
        ["Schools in buffer", `${schools.length}`],
        ["Shelters available", `${zone.nearbyShelters}`],
      ],
    },
  ];

  const cascades: CascadeBranch[] = [
    {
      title: "Debris obstruction of hill stream",
      probability: clamp(pSlide * 0.55 + (o.rainfall72h > 300 ? 0.12 : 0)),
      note: "Slide debris entering a narrow channel can dam flow temporarily.",
    },
    {
      title: "Water accumulation behind debris dam",
      probability: clamp(pSlide * 0.4 + (o.rainfall24h > 120 ? 0.12 : 0)),
      note: "Ponding upstream of a debris plug builds head over hours, not minutes.",
    },
    {
      title: "Potential downstream flood concern",
      probability: clamp(pSlide * 0.3),
      note: "Sudden breach of a debris dam could send a surge downstream — monitor, do not assume.",
    },
    {
      title: "Power / telecom line disruption",
      probability: clamp(pSlide * 0.45),
      note: "Hill alignments commonly share the road corridor that fails.",
    },
    {
      title: "Relief convoy delay",
      probability: clamp(isolationP * 0.9),
      note: "Single-access corridors extend logistics time for every subsequent operation.",
    },
  ].sort((a, b) => b.probability - a.probability);

  const villagesPotentiallyIsolated = isolation.villages.filter(
    (v) => v.onlyAccessRoute && isolationP > 0.35,
  ).length;

  return {
    districtId: d.id,
    district: d.name,
    stages,
    cascades,
    roadsAtRisk: zoneLifelines.filter((l) => l.priority === "HIGH" || l.priority === "CRITICAL")
      .length,
    villagesPotentiallyIsolated,
    hospitalsAffected: isolation.hospitalAccessThreatened ? hospitals.length : 0,
    schoolsAffected: infraP > 0.5 ? schools.length : 0,
    populationExposed:
      villagesPotentiallyIsolated > 0
        ? isolation.villages
            .filter((v) => v.onlyAccessRoute)
            .reduce((s, v) => s + v.populationServed, 0)
        : Math.round(d.exposedPopulation * clamp(pSlide)),

    emergencyAccessReductionPct: Math.round(accessP * 100),
    summary: `If current conditions persist, the dominant consequence pathway is ${
      isolationP > 0.5
        ? "road blockage leading to village isolation and reduced emergency access"
        : pBlock > 0.5
          ? "localised road blockage with manageable detours"
          : "slope instability without immediate connectivity loss"
    }.`,
  };
}
