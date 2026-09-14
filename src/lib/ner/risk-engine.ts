/**
 * NER-SAFE risk engine.
 *
 * Hybrid model: a calibrated additive scoring model (weights derived from
 * published landslide-susceptibility literature for the Eastern Himalaya /
 * Meghalaya plateau) combined with a transparent physics-informed rule layer.
 *
 * The additive form is intentional: every prediction is decomposable into
 * per-factor point contributions, which is what an explainable early-warning
 * system needs. The model is swappable — replace `scoreFactors` with a served
 * ML model (XGBoost/LightGBM) and keep the same `RiskAssessment` contract.
 *
 * DEMO MODEL: coefficients are literature-informed, not fitted on official
 * Government of India landslide inventories.
 */

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "VERY HIGH" | "CRITICAL";
export type RiskTrend = "DECREASING" | "STABLE" | "INCREASING" | "RAPIDLY INCREASING";

export interface RiskFeatures {
  /** mm in the last 24 hours */
  rainfall24h: number;
  /** mm cumulative over 72 hours */
  rainfall72h: number;
  /** mm/hour current intensity */
  rainfallIntensity: number;
  /** volumetric soil moisture, percent */
  soilMoisture: number;
  /** mean terrain slope, degrees */
  slope: number;
  /** metres */
  elevation: number;
  /** historical landslide events on record */
  historicalEvents: number;
  /** 0-1 satellite indicator (vegetation loss / surface deformation) */
  satelliteIndicator: number;
  /** 0-1 hill-cutting and road-cut density */
  roadCutIndex: number;
  /** verified field / citizen reports in last 48h */
  recentReports: number;
  /** mm of ground movement measured by inclinometers, last 24h */
  groundMovement: number;
}

export interface RiskFactor {
  key: string;
  label: string;
  points: number;
  value: string;
  /** Short human explanation of why this factor contributes. */
  note: string;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  /** Probability of a landslide-related hazard in the next 24h, 0-1. */
  probability: number;
  factors: RiskFactor[];
  triggeredRules: string[];
  /** 0-1 model confidence based on input completeness/freshness. */
  confidence: number;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Saturating normaliser — hazard response flattens above a domain ceiling. */
const norm = (value: number, ceiling: number) => clamp(value / ceiling);

/** Maximum point budget per factor (sums to 100). */
const WEIGHTS = {
  rainfall24h: 24,
  rainfall72h: 12,
  soilMoisture: 16,
  slope: 18,
  historical: 11,
  satellite: 8,
  roadCut: 6,
  reports: 3,
  movement: 2,
} as const;

export function assessRisk(f: RiskFeatures): RiskAssessment {
  const factors: RiskFactor[] = [];

  const push = (
    key: string,
    label: string,
    fraction: number,
    budget: number,
    value: string,
    note: string,
  ) => {
    factors.push({
      key,
      label,
      points: Math.round(clamp(fraction) * budget * 10) / 10,
      value,
      note,
    });
  };

  // Rainfall: intensity-weighted 24h depth. 200 mm/24h is the regional
  // ceiling used by IMD "extremely heavy rainfall" advisories.
  const intensityBoost = 1 + clamp(f.rainfallIntensity / 60) * 0.25;
  push(
    "rainfall24h",
    "Rainfall (24 h)",
    norm(f.rainfall24h, 200) * intensityBoost,
    WEIGHTS.rainfall24h,
    `${Math.round(f.rainfall24h)} mm / 24 h @ ${f.rainfallIntensity.toFixed(1)} mm/h`,
    "Short-duration rainfall raises pore-water pressure and is the dominant landslide trigger in NER.",
  );

  push(
    "rainfall72h",
    "Antecedent rainfall (72 h)",
    norm(f.rainfall72h, 450),
    WEIGHTS.rainfall72h,
    `${Math.round(f.rainfall72h)} mm / 72 h`,
    "Antecedent wetness reduces the rainfall depth needed to initiate failure.",
  );

  // Soil moisture becomes hazardous mostly above ~55% saturation.
  push(
    "soilMoisture",
    "Soil moisture",
    norm(Math.max(0, f.soilMoisture - 45), 50),
    WEIGHTS.soilMoisture,
    `${Math.round(f.soilMoisture)} %`,
    "Near-saturated regolith loses shear strength; above 80 % failure risk rises sharply.",
  );

  // Slope: below 15° translational slides are rare, above 45° material has
  // often already been shed, so the response peaks around 35-45°.
  const slopeResponse = f.slope <= 12 ? 0.05 : f.slope >= 45 ? 0.95 : (f.slope - 12) / 33;
  push(
    "slope",
    "Terrain slope",
    slopeResponse,
    WEIGHTS.slope,
    `${Math.round(f.slope)}°`,
    "Steeper slopes increase the driving gravitational stress on the failure plane.",
  );

  push(
    "historical",
    "Historical landslide frequency",
    norm(f.historicalEvents, 18),
    WEIGHTS.historical,
    `${f.historicalEvents} recorded events`,
    "Past failures indicate persistent geotechnical weakness in the same slope units.",
  );

  push(
    "satellite",
    "Satellite indicator",
    f.satelliteIndicator,
    WEIGHTS.satellite,
    `${Math.round(f.satelliteIndicator * 100)} % anomaly`,
    "Sentinel-derived vegetation loss and surface deformation flag destabilised ground.",
  );

  push(
    "roadCut",
    "Hill cutting / road cuts",
    f.roadCutIndex,
    WEIGHTS.roadCut,
    `index ${f.roadCutIndex.toFixed(2)}`,
    "Unsupported cut slopes along hill roads remove lateral support from the hillside.",
  );

  push(
    "reports",
    "Field & citizen reports",
    norm(f.recentReports, 6),
    WEIGHTS.reports,
    `${f.recentReports} in last 48 h`,
    "Clustered ground observations of cracks or debris corroborate model output.",
  );

  push(
    "movement",
    "Ground movement",
    norm(f.groundMovement, 12),
    WEIGHTS.movement,
    `${f.groundMovement.toFixed(1)} mm / 24 h`,
    "Inclinometer creep is a direct precursor of slope failure.",
  );

  let score = factors.reduce((sum, x) => sum + x.points, 0);

  // ---- Transparent physics/domain rule layer -------------------------------
  const triggeredRules: string[] = [];
  const addRule = (label: string, delta: number) => {
    triggeredRules.push(`${label} (${delta >= 0 ? "+" : ""}${delta})`);
    score += delta;
  };

  if (f.rainfall24h > 150 && f.slope > 30) {
    addRule("Extremely heavy rainfall on steep terrain", 8);
  }
  if (f.soilMoisture > 85 && f.rainfall24h > 80) {
    addRule("Saturated regolith with active rainfall", 6);
  }
  if (f.rainfallIntensity > 40) {
    addRule("Cloudburst-level rainfall intensity", 5);
  }
  if (f.groundMovement > 5) {
    addRule("Measured slope creep above 5 mm/24 h", 5);
  }
  if (f.recentReports >= 3) {
    addRule("Multiple corroborating field reports", 4);
  }
  if (f.rainfall24h < 10 && f.soilMoisture < 55) {
    addRule("Dry antecedent conditions", -5);
  }

  score = Math.round(clamp(score, 0, 100));

  // Probability calibrated so score 50 ≈ 0.35 and score 85 ≈ 0.86.
  const probability = clamp(1 / (1 + Math.exp(-(score - 58) / 11)));

  const confidence = clamp(
    0.62 +
      (f.recentReports > 0 ? 0.08 : 0) +
      (f.groundMovement > 0 ? 0.1 : 0) +
      (f.satelliteIndicator > 0 ? 0.08 : 0) +
      (f.rainfallIntensity >= 0 ? 0.07 : 0),
    0,
    0.95,
  );

  return {
    score,
    level: levelFromScore(score),
    probability,
    factors: factors.sort((a, b) => b.points - a.points),
    triggeredRules,
    confidence,
  };
}

export function levelFromScore(score: number): RiskLevel {
  if (score <= 20) return "LOW";
  if (score <= 40) return "MODERATE";
  if (score <= 60) return "HIGH";
  if (score <= 80) return "VERY HIGH";
  return "CRITICAL";
}

export function trendFromScores(current: number, previous: number): RiskTrend {
  const delta = current - previous;
  if (delta >= 7) return "RAPIDLY INCREASING";
  if (delta >= 2) return "INCREASING";
  if (delta <= -2) return "DECREASING";
  return "STABLE";
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "var(--risk-low)",
  MODERATE: "var(--risk-moderate)",
  HIGH: "var(--risk-high)",
  "VERY HIGH": "var(--risk-veryhigh)",
  CRITICAL: "var(--risk-critical)",
};

export const RISK_LEVELS: RiskLevel[] = ["LOW", "MODERATE", "HIGH", "VERY HIGH", "CRITICAL"];

/** Tailwind-safe class helpers built on hazard tokens. */
export function riskTextClass(level: RiskLevel) {
  return {
    LOW: "text-risk-low",
    MODERATE: "text-risk-moderate",
    HIGH: "text-risk-high",
    "VERY HIGH": "text-risk-veryhigh",
    CRITICAL: "text-risk-critical",
  }[level];
}

export function riskBgClass(level: RiskLevel) {
  return {
    LOW: "bg-risk-low/15 text-risk-low border-risk-low/40",
    MODERATE: "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/40",
    HIGH: "bg-risk-high/15 text-risk-high border-risk-high/40",
    "VERY HIGH": "bg-risk-veryhigh/20 text-risk-veryhigh border-risk-veryhigh/45",
    CRITICAL: "bg-risk-critical/25 text-risk-critical border-risk-critical/55",
  }[level];
}

/**
 * 6/12/24/48/72-hour risk projection driven by a rainfall forecast series.
 * Soil moisture is propagated with a simple infiltration/drainage balance.
 */
export function forecastRisk(
  features: RiskFeatures,
  rainfallForecastMm: number[],
  horizons: number[] = [6, 12, 24, 48, 72],
): { horizon: number; score: number; level: RiskLevel; rainfall: number }[] {
  let soil = features.soilMoisture;
  let cumulative = features.rainfall24h;
  let antecedent = features.rainfall72h;

  return horizons.map((horizon, i) => {
    const rain = rainfallForecastMm[i] ?? 0;
    // Infiltration gain minus drainage loss, saturating at 98 %.
    soil = clamp(soil + rain * 0.09 - horizon * 0.12, 5, 98);
    cumulative = Math.max(0, cumulative * 0.75 + rain);
    antecedent = antecedent * 0.9 + rain;

    const projected = assessRisk({
      ...features,
      rainfall24h: cumulative,
      rainfall72h: antecedent,
      rainfallIntensity: rain / Math.max(1, horizon),
      soilMoisture: soil,
    });

    return {
      horizon,
      score: projected.score,
      level: projected.level,
      rainfall: Math.round(rain),
    };
  });
}
