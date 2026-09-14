/**
 * AI RESPONSE RECOMMENDATION ENGINE
 *
 * Turns a risk assessment plus its evidence, isolation and lifeline context
 * into an ordered action plan a district officer can execute, together with a
 * plain-language "why". Actions are ranked by consequence-reduction value, not
 * by score alone.
 */

import type { CitizenReport, RiskZone } from "./demo-data";
import type { EvidenceFusion } from "./evidence-fusion";
import type { IsolationAssessment } from "./isolation-engine";
import type { RoadLifeline } from "./lifeline-engine";
import type { ImpactAssessment } from "./impact-engine";

export interface RecommendedAction {
  order: number;
  action: string;
  /** Operational urgency window. */
  within: string;
  owner: string;
  rationale: string;
  priority: "IMMEDIATE" | "HIGH" | "ROUTINE";
}

export interface ResponsePlan {
  districtId: string;
  district: string;
  headline: string;
  actions: RecommendedAction[];
  why: string;
  reassessHours: number;
}

export function buildResponsePlan(args: {
  zone: RiskZone;
  evidence: EvidenceFusion;
  isolation: IsolationAssessment;
  lifelines: RoadLifeline[];
  impact: ImpactAssessment;
  reports: CitizenReport[];
}): ResponsePlan {
  const { zone, evidence, isolation, lifelines, impact, reports } = args;
  const score = zone.assessment.score;
  const worstLifeline =
    lifelines.find((l) => l.road.districtId === zone.district.id) ?? lifelines[0];
  const openReport = reports.find((r) => r.districtId === zone.district.id && r.status === "OPEN");
  const worstVillage = isolation.villages[0];

  const actions: RecommendedAction[] = [];
  const add = (
    action: string,
    within: string,
    owner: string,
    rationale: string,
    priority: RecommendedAction["priority"],
  ) => actions.push({ order: actions.length + 1, action, within, owner, rationale, priority });

  if (worstLifeline)
    add(
      `Inspect ${worstLifeline.road.name} (${worstLifeline.road.importance})`,
      score > 80 ? "Immediately" : score > 60 ? "Within 6 h" : "Within 24 h",
      "PWD / NHIDCL road division",
      `Lifeline priority ${worstLifeline.priority}; blockage probability ${Math.round(worstLifeline.blockageProbability * 100)} %.`,
      score > 80 ? "IMMEDIATE" : score > 60 ? "HIGH" : "ROUTINE",
    );

  if (openReport)
    add(
      `Verify field report ${openReport.id} (${openReport.type.toLowerCase()})`,
      "Within 2 h",
      "Circle officer / field team",
      "Ground truth converts a model signal into a confirmed hazard and unlocks escalation.",
      "IMMEDIATE",
    );

  if (score > 60 || isolation.level === "HIGH" || isolation.level === "CRITICAL")
    add(
      "Pre-position road-clearance equipment at the cut section",
      score > 80 ? "Immediately" : "Within 6 h",
      "PWD mechanical wing / SDRF",
      "Clearance time becomes the emergency access time once the corridor fails.",
      score > 80 ? "IMMEDIATE" : "HIGH",
    );

  if (worstVillage)
    add(
      `Monitor and pre-alert ${worstVillage.asset.name}${worstVillage.onlyAccessRoute ? " (single access route)" : ""}`,
      score > 70 ? "Within 2 h" : "Within 12 h",
      "Village disaster management committee",
      `${worstVillage.populationServed.toLocaleString()} residents; nearest hospital ${worstVillage.hospitalDistanceKm} km.`,
      worstVillage.onlyAccessRoute && score > 60 ? "IMMEDIATE" : "HIGH",
    );

  if (score > 60)
    add(
      "Notify the District Disaster Management Authority and SDMA control room",
      "Immediately",
      "District administration",
      `Alert level ${score > 80 ? 4 : 3} threshold crossed with ${evidence.verdict.toLowerCase()} evidence.`,
      "IMMEDIATE",
    );

  if (isolation.hospitalAccessThreatened)
    add(
      "Establish an alternative medical evacuation route",
      "Within 4 h",
      "District health officer + PWD",
      "Health facility access is currently dependent on a single vulnerable corridor.",
      "IMMEDIATE",
    );

  if (!isolation.villages.some((v) => v.alternativeRoute))
    add(
      "Confirm and sign-post an alternative route for the corridor",
      "Within 12 h",
      "PWD + traffic police",
      "No viable alternate is recorded for this district's monitored roads.",
      "HIGH",
    );

  if (evidence.dataQuality !== "HIGH")
    add(
      `Restore telemetry — ${evidence.availableCount}/${evidence.totalSources} sources available`,
      "Within 12 h",
      "Sensor network operator",
      "Data gaps lower model confidence; decisions should not rest on a degraded feed.",
      "HIGH",
    );

  const reassessHours = score > 80 ? 2 : score > 60 ? 4 : 12;
  add(
    `Re-assess risk after ${reassessHours} h`,
    `T+${reassessHours} h`,
    "NER-SAFE operations desk",
    "Rainfall-driven risk decays or escalates quickly; a fixed re-assessment interval prevents stale decisions.",
    "ROUTINE",
  );

  const drivers = zone.assessment.factors
    .slice(0, 3)
    .map((f) => `${f.label.toLowerCase()} (+${f.points})`)
    .join(", ");

  return {
    districtId: zone.district.id,
    district: zone.district.name,
    headline:
      score > 80
        ? `Immediate action required in ${zone.district.name}`
        : score > 60
          ? `Prepare and pre-position in ${zone.district.name}`
          : `Monitor ${zone.district.name}`,
    actions,
    why:
      `Driven by ${drivers}. ${evidence.summary} ` +
      `Consequence pathway: ${impact.summary} Isolation risk is ${isolation.score}/100 (${isolation.level}) because ` +
      `${isolation.singleAccessVillages} settlement(s) depend on a single road link.`,
    reassessHours,
  };
}
