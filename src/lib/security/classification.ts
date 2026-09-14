/**
 * Data classification for NER-SAFE.
 *
 * PUBLIC    — safe to release to citizens.
 * AUTHORITY — restricted operational information.
 * ADMIN     — highly restricted administration information.
 *
 * The rule is "restricted by default for operational data": public payloads are
 * built by explicit allow-list projection, never by deleting fields from an
 * authority object.
 */
export type Classification = "PUBLIC" | "AUTHORITY" | "ADMIN";

export type PublicRiskLevel = "LOW" | "MODERATE" | "HIGH" | "VERY HIGH" | "CRITICAL";

/** Public risk record — the only risk shape a citizen response may contain. */
export interface PublicRisk {
  district: string;
  state: string;
  risk_level: PublicRiskLevel;
  public_message: string;
  safety_guidance: string[];
  last_updated: string;
}

const GUIDANCE: Record<PublicRiskLevel, string[]> = {
  LOW: ["No special action needed right now.", "Keep emergency contact numbers saved."],
  MODERATE: ["Stay alert during and after heavy rain.", "Avoid standing below freshly cut slopes."],
  HIGH: [
    "Avoid hill-cut roads where possible.",
    "Stay away from unstable slopes and loose soil.",
    "Keep emergency supplies ready.",
    "Follow official local instructions.",
  ],
  "VERY HIGH": [
    "Avoid all non-essential travel on hill roads.",
    "Move away from slopes showing cracks or seepage.",
    "Keep a go-bag, torch and phone charged.",
    "Follow official local instructions.",
  ],
  CRITICAL: [
    "Do not travel on hill-cut or slope-side roads.",
    "Move to a safe area or public shelter if advised.",
    "Help elderly neighbours and children move first.",
    "Follow instructions from local authorities immediately.",
  ],
};

const MESSAGES: Record<PublicRiskLevel, string> = {
  LOW: "Conditions in your area are currently calm.",
  MODERATE: "Conditions are being watched in your area. Stay aware during rain.",
  HIGH: "Rainfall has increased landslide risk in your area. Take precautions.",
  "VERY HIGH": "Landslide risk in your area is very high. Avoid slopes and hill roads.",
  CRITICAL: "Critical landslide risk in your area. Follow official instructions now.",
};

export function publicGuidance(level: PublicRiskLevel): string[] {
  return GUIDANCE[level] ?? GUIDANCE.MODERATE;
}

export function publicMessage(level: PublicRiskLevel): string {
  return MESSAGES[level] ?? MESSAGES.MODERATE;
}

/**
 * Strips every restricted field from an operational risk record and returns the
 * publicly releasable projection. Restricted inputs such as sensor ids,
 * coordinates, raw soil moisture, ground movement, internal confidence,
 * response priority and internal notes are never copied across.
 */
export function sanitizePublicRiskData(input: {
  district: string;
  state: string;
  level: string;
  generatedAt: string;
}): PublicRisk {
  const level = normalisePublicLevel(input.level);
  return {
    district: input.district,
    state: input.state,
    risk_level: level,
    public_message: publicMessage(level),
    safety_guidance: publicGuidance(level),
    last_updated: input.generatedAt,
  };
}

export function normalisePublicLevel(level: string): PublicRiskLevel {
  const upper = level.toUpperCase().replace(/_/g, " ");
  if (upper.includes("CRITICAL")) return "CRITICAL";
  if (upper.includes("VERY")) return "VERY HIGH";
  if (upper.startsWith("HIGH")) return "HIGH";
  if (upper.startsWith("MOD")) return "MODERATE";
  return "LOW";
}

/** Accessible, colour-independent label + icon for each public level. */
export const PUBLIC_LEVEL_META: Record<
  PublicRiskLevel,
  { label: string; icon: string; tone: string }
> = {
  LOW: { label: "Low risk", icon: "✓", tone: "risk-low" },
  MODERATE: { label: "Moderate risk", icon: "!", tone: "risk-moderate" },
  HIGH: { label: "High risk", icon: "!!", tone: "risk-high" },
  "VERY HIGH": { label: "Very high risk", icon: "!!!", tone: "risk-very-high" },
  CRITICAL: { label: "Critical risk", icon: "⚠", tone: "risk-critical" },
};

export const AUTHORITY_ORG_TYPES = [
  { value: "state_disaster_management_authority", label: "State Disaster Management Authority" },
  {
    value: "district_disaster_management_authority",
    label: "District Disaster Management Authority",
  },
  { value: "police", label: "Police" },
  { value: "fire_and_emergency_services", label: "Fire & Emergency Services" },
  { value: "public_works_department", label: "Public Works Department" },
  { value: "government_administration", label: "Government Administration" },
  { value: "authorized_research_institution", label: "Authorized Research Institution" },
] as const;

export type AuthorityOrgType = (typeof AUTHORITY_ORG_TYPES)[number]["value"];

export const HAZARD_TYPES = [
  "Landslide",
  "Road blockage",
  "Falling rocks",
  "Cracks",
  "Flooding",
  "Damaged road",
  "Fallen tree",
  "Unsafe slope",
  "Other",
] as const;
