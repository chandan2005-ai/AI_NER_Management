/**
 * DEMO DATA GENERATOR — NER-SAFE
 *
 * Everything produced here is clearly synthetic and deterministic (seeded),
 * so the platform is fully demonstrable without any external API credentials.
 * Replace these generators with the weather / satellite / sensor adapters once
 * credentials are configured; the downstream contracts stay identical.
 *
 * NOT government data. NOT observed data. Synthetic demonstration values.
 */

import { DISTRICTS, type DistrictRef } from "./districts";
import {
  assessRisk,
  forecastRisk,
  levelFromScore,
  trendFromScores,
  type RiskAssessment,
  type RiskFeatures,
  type RiskLevel,
  type RiskTrend,
} from "./risk-engine";

/* ------------------------------------------------------------------ seeded rng */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random in [0,1) for a given seed string. */
function rand(seed: string): number {
  let x = hash(seed);
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 100000) / 100000;
}

/** Smooth 0-1 oscillation used to animate a monsoon-like signal over ticks. */
function wave(seed: string, tick: number, period: number): number {
  const phase = rand(seed) * Math.PI * 2;
  return (Math.sin((tick / period) * Math.PI * 2 + phase) + 1) / 2;
}

/* ------------------------------------------------------------------ types */

export interface ZoneObservation {
  rainfall1h: number;
  rainfall6h: number;
  rainfall12h: number;
  rainfall24h: number;
  rainfall72h: number;
  rainfallNormal24h: number;
  rainfallIntensity: number;
  soilMoisture: number;
  groundMovement: number;
  satelliteIndicator: number;
  recentReports: number;
  /** Minutes since the freshest input for this zone. */
  dataAgeMinutes: number;
}

export interface RiskZone {
  district: DistrictRef;
  observation: ZoneObservation;
  features: RiskFeatures;
  assessment: RiskAssessment;
  previousScore: number;
  trend: RiskTrend;
  forecast: { horizon: number; score: number; level: RiskLevel; rainfall: number }[];
  rainfallAnomalyPct: number;
  nearbyShelters: number;
  affectedRoads: number;
}

export type RoadStatus = "OPEN" | "PARTIALLY BLOCKED" | "BLOCKED" | "DANGEROUS" | "CLOSED";

export interface RoadSegment {
  id: string;
  name: string;
  districtId: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  status: RoadStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  importance: "National Highway" | "State Highway" | "District Road" | "Rural Road";
  lastInspection: string;
  alternativeRoute: string;
}

export type SensorType =
  "Soil Moisture" | "Rain Gauge" | "Inclinometer" | "Ground Movement" | "Water Level";

export interface SensorDevice {
  id: string;
  type: SensorType;
  districtId: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  reading: number;
  unit: string;
  threshold: number;
  battery: number;
  lastSeenMinutes: number;
  status: "NORMAL" | "WARNING" | "CRITICAL" | "OFFLINE";
  dataQuality: "OK" | "STALE" | "SPIKE";
}

export type ReportType =
  | "CRACK"
  | "SLOPE MOVEMENT"
  | "LANDSLIDE"
  | "ROAD BLOCKAGE"
  | "ROCKFALL"
  | "WATERLOGGING"
  | "OTHER";

export interface CitizenReport {
  id: string;
  type: ReportType;
  severity: "LOW" | "MEDIUM" | "HIGH";
  districtId: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  description: string;
  reportedBy: "Citizen" | "Field Officer";
  minutesAgo: number;
  status: "OPEN" | "VERIFIED" | "RESOLVED";
  imageAnalysis?: { detected: string; confidence: number; suggestedSeverity: string } | undefined;
}

export interface Alert {
  id: string;
  level: 1 | 2 | 3 | 4;
  levelName: "INFORMATION" | "WATCH" | "WARNING" | "CRITICAL";
  districtId: string;
  district: string;
  state: string;
  riskScore: number;
  riskLevel: RiskLevel;
  probability: number;
  confidence: number;
  topFactors: string[];
  message: string;
  recommendedAction: string;
  minutesAgo: number;
  recipients: string[];
  dataAgeMinutes: number;
}

export interface ResponsePriority {
  rank: number;
  districtId: string;
  district: string;
  state: string;
  riskLevel: RiskLevel;
  riskScore: number;
  populationExposed: number;
  road: string;
  roadStatus: RoadStatus;
  priorityScore: number;
  recommendedAction: string;
}

export interface Snapshot {
  tick: number;
  generatedAt: string;
  zones: RiskZone[];
  roads: RoadSegment[];
  sensors: SensorDevice[];
  reports: CitizenReport[];
  alerts: Alert[];
  priorities: ResponsePriority[];
  summary: {
    monitoredZones: number;
    critical: number;
    veryHigh: number;
    high: number;
    moderate: number;
    low: number;
    activeAlerts: number;
    blockedRoads: number;
    openReports: number;
    activeSensors: number;
    totalSensors: number;
    rainfallAnomalies: number;
    vulnerablePopulation: number;
    infrastructureAtRisk: number;
    meanScore: number;
  };
  rainfallTrend: { t: string; rainfall: number; soilMoisture: number }[];
  riskTrend: { t: string; mean: number; critical: number }[];
}

/* ------------------------------------------------------------------ generation */

function buildObservation(d: DistrictRef, tick: number): ZoneObservation {
  const monsoon = wave(`${d.id}-rain`, tick, 26);
  const burst = Math.pow(wave(`${d.id}-burst`, tick, 9), 3);
  const orographic = 0.55 + d.elevation / 4200; // Meghalaya/Sikkim receive far more rain
  const base = rand(`${d.id}-base`) * 40;

  const rainfall24h = Math.max(
    0,
    (base + monsoon * 150 + burst * 110) * Math.min(1.35, orographic),
  );
  const rainfallIntensity = Math.max(0, (burst * 48 + monsoon * 14) * Math.min(1.3, orographic));
  const rainfall72h = rainfall24h * (1.7 + rand(`${d.id}-ant`) * 0.9);
  const rainfallNormal24h = 30 + rand(`${d.id}-norm`) * 45 * Math.min(1.4, orographic);

  const soilMoisture = Math.min(
    98,
    38 +
      rainfall72h * 0.09 +
      wave(`${d.id}-soil`, tick, 34) * 18 +
      (d.soilClass === "Clayey" ? 6 : 0),
  );

  const groundMovement =
    d.slope > 30 ? (rainfall24h / 200) * (2 + rand(`${d.id}-mv`) * 8) : rand(`${d.id}-mv`) * 1.2;

  const satelliteIndicator = Math.min(
    1,
    d.roadCutIndex * 0.45 + wave(`${d.id}-sat`, tick, 48) * 0.35 + d.historicalEvents / 60,
  );

  const recentReports = Math.round(
    Math.max(0, (rainfall24h / 200) * 4 * (0.4 + rand(`${d.id}-rep-${Math.floor(tick / 6)}`))),
  );

  return {
    rainfall1h: Math.round(rainfallIntensity * 10) / 10,
    rainfall6h: Math.round(rainfall24h * 0.34),
    rainfall12h: Math.round(rainfall24h * 0.61),
    rainfall24h: Math.round(rainfall24h),
    rainfall72h: Math.round(rainfall72h),
    rainfallNormal24h: Math.round(rainfallNormal24h),
    rainfallIntensity: Math.round(rainfallIntensity * 10) / 10,
    soilMoisture: Math.round(soilMoisture),
    groundMovement: Math.round(groundMovement * 10) / 10,
    satelliteIndicator: Math.round(satelliteIndicator * 100) / 100,
    recentReports,
    dataAgeMinutes: Math.round(2 + rand(`${d.id}-age-${tick}`) * 26),
  };
}

function featuresOf(d: DistrictRef, o: ZoneObservation): RiskFeatures {
  return {
    rainfall24h: o.rainfall24h,
    rainfall72h: o.rainfall72h,
    rainfallIntensity: o.rainfallIntensity,
    soilMoisture: o.soilMoisture,
    slope: d.slope,
    elevation: d.elevation,
    historicalEvents: d.historicalEvents,
    satelliteIndicator: o.satelliteIndicator,
    roadCutIndex: d.roadCutIndex,
    recentReports: o.recentReports,
    groundMovement: o.groundMovement,
  };
}

function buildZone(d: DistrictRef, tick: number): RiskZone {
  const observation = buildObservation(d, tick);
  const features = featuresOf(d, observation);
  const assessment = assessRisk(features);

  const prevObs = buildObservation(d, Math.max(0, tick - 1));
  const previousScore = assessRisk(featuresOf(d, prevObs)).score;

  // Forecast rainfall for +6/12/24/48/72 h from the same monsoon signal.
  const forecastRain = [6, 12, 24, 48, 72].map((h, i) => {
    const futureTick = tick + (i + 1) * 2;
    const f = buildObservation(d, futureTick);
    return Math.round((f.rainfall24h * h) / 24);
  });

  const forecast = forecastRisk(features, forecastRain);
  const rainfallAnomalyPct = Math.round(
    ((observation.rainfall24h - observation.rainfallNormal24h) / observation.rainfallNormal24h) *
      100,
  );

  return {
    district: d,
    observation,
    features,
    assessment,
    previousScore,
    trend: trendFromScores(assessment.score, previousScore),
    forecast,
    rainfallAnomalyPct,
    nearbyShelters: 2 + Math.round(rand(`${d.id}-sh`) * 6),
    affectedRoads: assessment.score > 60 ? 1 + Math.round(rand(`${d.id}-rd`) * 3) : 0,
  };
}

const ROAD_NAMES: Record<string, string[]> = {
  "ML-EKH": ["NH-6 Shillong–Dawki", "Sohra Bypass Road", "Laitkor Cut Road"],
  "SK-EAST": ["NH-10 Gangtok–Rangpo", "Tsomgo Approach Road"],
  "SK-NORTH": ["NH-310 Mangan–Chungthang"],
  "AS-DIM": ["NH-27 Haflong Cut Section", "Mahur–Harangajao Road"],
  "MZ-AIZ": ["NH-306 Aizawl–Lengpui", "Durtlang Hill Road"],
  "NL-KOH": ["NH-29 Kohima–Dimapur", "Zubza Slope Road"],
  "MN-NON": ["NH-37 Noney–Khoupum", "Tupul Rail Corridor Road"],
  "AR-WKA": ["NH-13 Bomdila–Dirang", "Sela Approach Road"],
  "AS-KAA": ["NH-36 Lumding Ghat Section"],
  "TR-DHA": ["Ambassa–Gandacherra Road"],
};

const IMPORTANCE: RoadSegment["importance"][] = [
  "National Highway",
  "State Highway",
  "District Road",
  "Rural Road",
];

function buildRoads(zones: RiskZone[], tick: number): RoadSegment[] {
  const roads: RoadSegment[] = [];
  for (const z of zones) {
    const names = ROAD_NAMES[z.district.id];
    if (!names) continue;
    names.forEach((name, i) => {
      const seed = `${z.district.id}-road-${i}`;
      const jitter = rand(seed) * 12 - 6;
      const score = Math.round(Math.min(100, Math.max(0, z.assessment.score + jitter)));
      const level = levelFromScore(score);
      const status: RoadStatus =
        score > 84
          ? "CLOSED"
          : score > 74
            ? "BLOCKED"
            : score > 62
              ? "DANGEROUS"
              : score > 48
                ? "PARTIALLY BLOCKED"
                : "OPEN";
      roads.push({
        id: `RD-${z.district.id}-${i + 1}`,
        name,
        districtId: z.district.id,
        district: z.district.name,
        state: z.district.state,
        lat: z.district.lat + (rand(`${seed}-la`) - 0.5) * 0.12,
        lng: z.district.lng + (rand(`${seed}-ln`) - 0.5) * 0.12,
        status,
        riskLevel: level,
        riskScore: score,
        importance: name.startsWith("NH")
          ? "National Highway"
          : IMPORTANCE[1 + Math.floor(rand(`${seed}-imp`) * 3)]!,
        lastInspection: `${1 + Math.round(rand(`${seed}-insp`) * 9)} d ago`,
        alternativeRoute:
          rand(`${seed}-alt`) > 0.35
            ? `Via ${z.district.name} inner bypass`
            : "No viable alternate",
      });
    });
  }
  // Keep ordering stable but rotate slightly with the tick for a "live" feel.
  return roads.sort((a, b) => b.riskScore - a.riskScore || a.id.localeCompare(b.id) + tick * 0);
}

const SENSOR_SPECS: { type: SensorType; unit: string; threshold: number; prefix: string }[] = [
  { type: "Soil Moisture", unit: "%", threshold: 80, prefix: "SM" },
  { type: "Rain Gauge", unit: "mm/h", threshold: 35, prefix: "RAIN" },
  { type: "Inclinometer", unit: "mm", threshold: 5, prefix: "TILT" },
  { type: "Ground Movement", unit: "mm", threshold: 8, prefix: "GM" },
  { type: "Water Level", unit: "m", threshold: 4, prefix: "WL" },
];

function buildSensors(zones: RiskZone[], tick: number): SensorDevice[] {
  const sensors: SensorDevice[] = [];
  const counter: Record<string, number> = {};

  zones.forEach((z, zi) => {
    // Instrument the steeper / higher-history districts more densely.
    const count = z.district.slope > 32 ? 3 : z.district.slope > 22 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const spec = SENSOR_SPECS[(zi + i) % SENSOR_SPECS.length]!;
      counter[spec.prefix] = (counter[spec.prefix] ?? 0) + 1;
      const seed = `${z.district.id}-sensor-${i}`;

      let reading: number;
      switch (spec.type) {
        case "Soil Moisture":
          reading = z.observation.soilMoisture + (rand(seed) - 0.5) * 6;
          break;
        case "Rain Gauge":
          reading = z.observation.rainfallIntensity + (rand(seed) - 0.5) * 4;
          break;
        case "Inclinometer":
        case "Ground Movement":
          reading = z.observation.groundMovement * (0.7 + rand(seed) * 0.7);
          break;
        default:
          reading = 1 + (z.observation.rainfall72h / 450) * 5 * (0.6 + rand(seed) * 0.6);
      }
      reading = Math.max(0, Math.round(reading * 10) / 10);

      const lastSeenMinutes = Math.round(rand(`${seed}-seen-${tick}`) * 240);
      const offline = lastSeenMinutes > 200;
      const ratio = reading / spec.threshold;
      const status: SensorDevice["status"] = offline
        ? "OFFLINE"
        : ratio >= 1.15
          ? "CRITICAL"
          : ratio >= 0.9
            ? "WARNING"
            : "NORMAL";

      sensors.push({
        id: `${spec.prefix}-${String(counter[spec.prefix]).padStart(3, "0")}`,
        type: spec.type,
        districtId: z.district.id,
        district: z.district.name,
        state: z.district.state,
        lat: z.district.lat + (rand(`${seed}-la`) - 0.5) * 0.1,
        lng: z.district.lng + (rand(`${seed}-ln`) - 0.5) * 0.1,
        reading,
        unit: spec.unit,
        threshold: spec.threshold,
        battery: Math.round(35 + rand(`${seed}-bat`) * 64),
        lastSeenMinutes,
        status,
        dataQuality: offline ? "STALE" : ratio > 2.2 ? "SPIKE" : "OK",
      });
    }
  });

  return sensors;
}

const REPORT_TYPES: ReportType[] = [
  "CRACK",
  "SLOPE MOVEMENT",
  "LANDSLIDE",
  "ROAD BLOCKAGE",
  "ROCKFALL",
  "WATERLOGGING",
];

const REPORT_TEXT: Record<ReportType, string> = {
  CRACK: "Tension cracks widening along the upper cut slope above the settlement.",
  "SLOPE MOVEMENT": "Retaining wall bulging and fresh soil creep observed after night rain.",
  LANDSLIDE: "Debris slide across the carriageway, roughly 20 m of road covered.",
  "ROAD BLOCKAGE": "Boulders and mud blocking one lane; traffic being diverted manually.",
  ROCKFALL: "Loose rock detaching from the cut face; two vehicles narrowly missed.",
  WATERLOGGING: "Drain choked, water ponding on the hillside shoulder.",
  OTHER: "Unclassified ground condition reported by resident.",
};

const IMAGE_DETECTIONS = [
  "Possible landslide debris",
  "Possible road blockage",
  "Possible slope cracks",
  "Possible rockfall",
  "Possible mudflow",
];

function buildReports(zones: RiskZone[], tick: number): CitizenReport[] {
  const reports: CitizenReport[] = [];
  zones
    .filter((z) => z.observation.recentReports > 0)
    .forEach((z) => {
      for (let i = 0; i < Math.min(3, z.observation.recentReports); i++) {
        const seed = `${z.district.id}-rp-${i}-${Math.floor(tick / 6)}`;
        const type = REPORT_TYPES[Math.floor(rand(seed) * REPORT_TYPES.length)]!;
        const severity =
          z.assessment.score > 70 ? "HIGH" : z.assessment.score > 45 ? "MEDIUM" : "LOW";
        const hasPhoto = rand(`${seed}-ph`) > 0.35;
        reports.push({
          id: `RPT-${z.district.id}-${i + 1}`,
          type,
          severity,
          districtId: z.district.id,
          district: z.district.name,
          state: z.district.state,
          lat: z.district.lat + (rand(`${seed}-la`) - 0.5) * 0.14,
          lng: z.district.lng + (rand(`${seed}-ln`) - 0.5) * 0.14,
          description: REPORT_TEXT[type],
          reportedBy: rand(`${seed}-by`) > 0.5 ? "Citizen" : "Field Officer",
          minutesAgo: Math.round(5 + rand(`${seed}-t`) * 2600),
          status:
            rand(`${seed}-st`) > 0.68
              ? "VERIFIED"
              : rand(`${seed}-st2`) > 0.85
                ? "RESOLVED"
                : "OPEN",
          imageAnalysis: hasPhoto
            ? {
                detected:
                  IMAGE_DETECTIONS[Math.floor(rand(`${seed}-d`) * IMAGE_DETECTIONS.length)]!,
                confidence: Math.round(62 + rand(`${seed}-c`) * 33),
                suggestedSeverity: severity,
              }
            : undefined,
        });
      }
    });
  return reports.sort((a, b) => a.minutesAgo - b.minutesAgo);
}

function alertLevelFor(z: RiskZone): 1 | 2 | 3 | 4 | null {
  const s = z.assessment.score;
  const rapid = z.trend === "RAPIDLY INCREASING";
  if (s > 80 || (s > 72 && rapid)) return 4;
  if (s > 60 || (s > 52 && rapid)) return 3;
  if (s > 40 || z.observation.soilMoisture > 88 || z.observation.rainfall24h > 120) return 2;
  if (z.observation.recentReports >= 2) return 1;
  return null;
}

const LEVEL_NAMES = {
  1: "INFORMATION",
  2: "WATCH",
  3: "WARNING",
  4: "CRITICAL",
} as const;

const ACTIONS = {
  1: "Continue routine monitoring and keep field teams informed.",
  2: "Increase monitoring frequency and pre-position road clearance equipment.",
  3: "Restrict traffic on vulnerable road sections and initiate field inspection.",
  4: "Recommend immediate field inspection, traffic halt and readiness to evacuate exposed households.",
} as const;

function buildAlerts(zones: RiskZone[], tick: number): Alert[] {
  const alerts: Alert[] = [];
  for (const z of zones) {
    const level = alertLevelFor(z);
    if (!level) continue;
    const top = z.assessment.factors.slice(0, 3).map((f) => `${f.label} +${f.points}`);
    alerts.push({
      id: `ALT-${z.district.id}-${tick}`,
      level,
      levelName: LEVEL_NAMES[level],
      districtId: z.district.id,
      district: z.district.name,
      state: z.district.state,
      riskScore: z.assessment.score,
      riskLevel: z.assessment.level,
      probability: z.assessment.probability,
      confidence: z.assessment.confidence,
      topFactors: top,
      message:
        `The model estimates ${z.assessment.level.toLowerCase()} landslide risk for ${z.district.name}, ` +
        `${z.district.state}, based on current environmental and historical indicators ` +
        `(${Math.round(z.observation.rainfall24h)} mm / 24 h, soil moisture ${z.observation.soilMoisture} %).`,
      recommendedAction: ACTIONS[level],
      minutesAgo: Math.round(rand(`${z.district.id}-alert-${tick}`) * 180),
      recipients:
        level >= 3
          ? ["District Administration", "SDMA", "Police", "PWD", "Community"]
          : ["District Administration", "PWD"],
      dataAgeMinutes: z.observation.dataAgeMinutes,
    });
  }
  return alerts.sort((a, b) => b.level - a.level || b.riskScore - a.riskScore);
}

const ROAD_WEIGHT: Record<RoadSegment["importance"], number> = {
  "National Highway": 1,
  "State Highway": 0.75,
  "District Road": 0.5,
  "Rural Road": 0.3,
};

function buildPriorities(zones: RiskZone[], roads: RoadSegment[]): ResponsePriority[] {
  const scored = zones.map((z) => {
    const zoneRoads = roads.filter((r) => r.districtId === z.district.id);
    const worstRoad = zoneRoads.sort((a, b) => b.riskScore - a.riskScore)[0] ?? null;
    const roadFactor = worstRoad ? ROAD_WEIGHT[worstRoad.importance] : 0.25;
    const populationFactor = Math.min(1, z.district.exposedPopulation / 5000);
    const weatherFactor = Math.min(1, z.observation.rainfall24h / 200);
    const reportFactor = Math.min(1, z.observation.recentReports / 5);

    const priorityScore =
      (z.assessment.score / 100) * 45 +
      populationFactor * 20 +
      roadFactor * 15 +
      weatherFactor * 12 +
      reportFactor * 8;

    return {
      z,
      worstRoad,
      priorityScore: Math.round(priorityScore * 10) / 10,
    };
  });

  return scored
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 8)
    .map((s, i) => ({
      rank: i + 1,
      districtId: s.z.district.id,
      district: s.z.district.name,
      state: s.z.district.state,
      riskLevel: s.z.assessment.level,
      riskScore: s.z.assessment.score,
      populationExposed: s.z.district.exposedPopulation,
      road: s.worstRoad?.name ?? "No monitored highway segment",
      roadStatus: s.worstRoad?.status ?? "OPEN",
      priorityScore: s.priorityScore,
      recommendedAction:
        s.z.assessment.score > 80
          ? "Immediate field inspection and emergency route clearance."
          : s.z.assessment.score > 60
            ? "Deploy inspection team, restrict heavy vehicles, alert villages."
            : "Schedule inspection within 24 h and monitor rainfall.",
    }));
}

/* ------------------------------------------------------------------ snapshot */

export function buildSnapshot(tick = 0): Snapshot {
  const zones = DISTRICTS.map((d) => buildZone(d, tick)).sort(
    (a, b) => b.assessment.score - a.assessment.score,
  );
  const roads = buildRoads(zones, tick);
  const sensors = buildSensors(zones, tick);
  const reports = buildReports(zones, tick);
  const alerts = buildAlerts(zones, tick);
  const priorities = buildPriorities(zones, roads);

  const countLevel = (l: RiskLevel) => zones.filter((z) => z.assessment.level === l).length;

  const rainfallTrend = Array.from({ length: 24 }, (_, i) => {
    const t = tick - (23 - i);
    const obs = DISTRICTS.slice(0, 12).map((d) => buildObservation(d, Math.max(0, t)));
    return {
      t: `${23 - i === 0 ? "now" : `-${23 - i}h`}`,
      rainfall: Math.round(obs.reduce((s, o) => s + o.rainfall1h, 0) / obs.length),
      soilMoisture: Math.round(obs.reduce((s, o) => s + o.soilMoisture, 0) / obs.length),
    };
  });

  const riskTrend = Array.from({ length: 12 }, (_, i) => {
    const t = Math.max(0, tick - (11 - i));
    const scores = DISTRICTS.map((d) => {
      const o = buildObservation(d, t);
      return assessRisk(featuresOf(d, o)).score;
    });
    return {
      t: 11 - i === 0 ? "now" : `-${(11 - i) * 2}h`,
      mean: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
      critical: scores.filter((s) => s > 80).length,
    };
  });

  return {
    tick,
    generatedAt: new Date().toISOString(),
    zones,
    roads,
    sensors,
    reports,
    alerts,
    priorities,
    summary: {
      monitoredZones: zones.length,
      critical: countLevel("CRITICAL"),
      veryHigh: countLevel("VERY HIGH"),
      high: countLevel("HIGH"),
      moderate: countLevel("MODERATE"),
      low: countLevel("LOW"),
      activeAlerts: alerts.length,
      blockedRoads: roads.filter(
        (r) => r.status === "BLOCKED" || r.status === "CLOSED" || r.status === "DANGEROUS",
      ).length,
      openReports: reports.filter((r) => r.status === "OPEN").length,
      activeSensors: sensors.filter((s) => s.status !== "OFFLINE").length,
      totalSensors: sensors.length,
      rainfallAnomalies: zones.filter((z) => z.rainfallAnomalyPct > 60).length,
      vulnerablePopulation: zones
        .filter((z) => z.assessment.score > 60)
        .reduce((s, z) => s + z.district.exposedPopulation, 0),
      infrastructureAtRisk: roads.filter((r) => r.riskScore > 60).length,
      meanScore: Math.round(
        zones.reduce((s, z) => s + z.assessment.score, 0) / Math.max(1, zones.length),
      ),
    },
    rainfallTrend,
    riskTrend,
  };
}
