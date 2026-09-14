/**
 * JUDGE DEMO MODE
 *
 * A guided twelve-step walkthrough of the full decision chain. It does not
 * fabricate outcomes — each step points at a real screen of the running system
 * and states what the operator should look at there. The narrative is data-free
 * so it stays true whatever the live simulation happens to be showing.
 */

export interface DemoStep {
  n: number;
  phase: "PREDICT" | "EXPLAIN" | "SIMULATE" | "IMPACT" | "PRIORITIZE" | "ACT";
  title: string;
  route: string;
  script: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    n: 1,
    phase: "PREDICT",
    title: "Regional situation in one screen",
    route: "/command-center",
    script:
      "The Command Center opens with the regional threat picture: highest-risk districts, communities that could be cut off, lifeline roads under threat and the single most urgent recommended action.",
  },
  {
    n: 2,
    phase: "PREDICT",
    title: "Where the risk is",
    route: "/map",
    script:
      "The GIS layer stack shows risk, rainfall, soil, slope, historical failures, roads, settlements, sensors and citizen reports over the eight NER states.",
  },
  {
    n: 3,
    phase: "PREDICT",
    title: "Ranked risk zones",
    route: "/risk-zones",
    script:
      "Districts are ranked by a 0-100 landslide risk score with level, trend and hazard probability for the next 24 hours.",
  },
  {
    n: 4,
    phase: "EXPLAIN",
    title: "Why this district is at risk",
    route: "/risk-zones",
    script:
      "Open a district: every point of the score is attributed to a named factor — rainfall, antecedent wetness, soil moisture, slope, history, satellite, hill cutting, reports, creep.",
  },
  {
    n: 5,
    phase: "EXPLAIN",
    title: "Evidence fusion, not a single model",
    route: "/command-center",
    script:
      "The alert is only called MULTI-SOURCE CONFIRMED when independent evidence families agree. Confidence and data quality are shown next to every verdict.",
  },
  {
    n: 6,
    phase: "SIMULATE",
    title: "What if it rains 50 % more?",
    route: "/simulator",
    script:
      "The What-If Simulator recomputes risk, isolation, lifelines and impact for rainfall, saturation, creep, blockage, sensor-failure and compound scenarios, as BEFORE vs AFTER deltas.",
  },
  {
    n: 7,
    phase: "IMPACT",
    title: "The impact chain",
    route: "/digital-twin",
    script:
      "Rainfall → saturation → instability → landslide → road blockage → community isolation → emergency access loss, each link with its own conditional probability.",
  },
  {
    n: 8,
    phase: "IMPACT",
    title: "Who and what is affected",
    route: "/digital-twin",
    script:
      "Villages, hospitals, schools, depots and population exposed are enumerated per district, including villages with only one access road.",
  },
  {
    n: 9,
    phase: "PRIORITIZE",
    title: "Lifeline roads first",
    route: "/lifelines",
    script:
      "Roads are ranked not by length but by consequence of losing them: population served, redundancy, hospital dependency and emergency access.",
  },
  {
    n: 10,
    phase: "PRIORITIZE",
    title: "Resource allocation",
    route: "/resources",
    script:
      "A transparent optimiser assigns rescue teams, ambulances, excavators, clearance and medical teams across districts, and states what remains unmet.",
  },
  {
    n: 11,
    phase: "ACT",
    title: "What authorities should do first",
    route: "/command-center",
    script:
      "Each district gets an ordered response plan: action, time window, accountable owner, rationale and reassessment interval.",
  },
  {
    n: 12,
    phase: "ACT",
    title: "Last-mile alerts and field loop",
    route: "/alerts",
    script:
      "Citizen alerts are issued in local languages with one clear action, while the technical bulletin keeps scores and confidence for officers. Field reports come back with AI-assisted verification confidence.",
  },
];

export const PHASE_ORDER: DemoStep["phase"][] = [
  "PREDICT",
  "EXPLAIN",
  "SIMULATE",
  "IMPACT",
  "PRIORITIZE",
  "ACT",
];

export interface ScorecardItem {
  capability: string;
  typical: string;
  nerSafe: string;
}

export const INNOVATION_SCORECARD: ScorecardItem[] = [
  {
    capability: "Risk prediction",
    typical: "Single rainfall threshold",
    nerSafe: "Multi-factor 0-100 score with calibrated hazard probability",
  },
  {
    capability: "Explainability",
    typical: "Black-box output",
    nerSafe: "Per-factor point attribution plus triggered physical rules",
  },
  {
    capability: "Evidence handling",
    typical: "One data source",
    nerSafe: "Fusion across weather, soil, terrain, history, satellite, sensors, reports",
  },
  {
    capability: "Scenario planning",
    typical: "None",
    nerSafe: "What-if simulator with BEFORE/AFTER deltas across the full chain",
  },
  {
    capability: "Impact awareness",
    typical: "Hazard map only",
    nerSafe: "Villages, hospitals, schools, population and isolation exposure",
  },
  {
    capability: "Road intelligence",
    typical: "Blocked / open flag",
    nerSafe: "Lifeline criticality from redundancy and dependent population",
  },
  {
    capability: "Resource decisions",
    typical: "Manual spreadsheets",
    nerSafe: "Explainable allocation with unmet-need reporting",
  },
  {
    capability: "Last-mile reach",
    typical: "English technical bulletin",
    nerSafe: "Multilingual citizen alert plus separate technical bulletin",
  },
  {
    capability: "Remote terrain",
    typical: "Online only",
    nerSafe: "Offline-first field reporting with queued sync",
  },
  {
    capability: "Honesty",
    typical: "Simulated data shown as real",
    nerSafe: "Demo/live source status, confidence and data-quality on every screen",
  },
];
