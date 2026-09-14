/**
 * AI TERRAIN CHANGE DETECTION (satellite)
 *
 * DEMO MODE: change candidates below are deterministically synthesised from
 * terrain, rainfall and historical inputs, and the "before / after" tiles are
 * procedurally rendered gradients — NOT real Sentinel/Cartosat imagery and not
 * evidence of an actual landslide.
 *
 * LIVE MODE: implement `SatelliteAdapter.fetchChangeCandidates` in
 * `adapters.ts` against Sentinel-2 / Sentinel-1 coherence or NRSC Bhuvan
 * products; the contract below is unchanged, so no UI redesign is needed.
 *
 * Every result is labelled "AI DETECTED CHANGE — FIELD VERIFICATION REQUIRED".
 */

import type { RiskZone, Snapshot } from "./demo-data";
import { seeded, seededInt } from "./seed";

export type ChangeType =
  | "Possible landslide scar"
  | "Vegetation disturbance"
  | "Road deformation indicator"
  | "Slope surface change"
  | "Debris accumulation";

export interface SatelliteChange {
  id: string;
  districtId: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  changeType: ChangeType;
  /** Estimated area of change in hectares. */
  areaHa: number;
  /** 0-1 detector confidence. */
  confidence: number;
  beforeDate: string;
  afterDate: string;
  /** Procedural visual seeds for the before/after demo tiles. */
  beforeSeed: number;
  afterSeed: number;
  ndviDelta: number;
  coherenceDrop: number;
  note: string;
  verificationStatus: "UNVERIFIED" | "FIELD TEAM ASSIGNED";
}

const CHANGE_TYPES: ChangeType[] = [
  "Possible landslide scar",
  "Vegetation disturbance",
  "Road deformation indicator",
  "Slope surface change",
  "Debris accumulation",
];

function dateOffset(days: number): string {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

export function detectChanges(snapshot: Snapshot, maxResults = 10): SatelliteChange[] {
  const candidates: SatelliteChange[] = [];

  for (const z of snapshot.zones) {
    const o = z.observation;
    // Detection likelihood rises with satellite anomaly index, slope and rain.
    const likelihood =
      o.satelliteIndicator * 0.6 + (z.district.slope / 60) * 0.25 + (o.rainfall24h / 200) * 0.15;
    if (likelihood < 0.5) continue;

    const count = likelihood > 0.75 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const seed = `${z.district.id}-sat-${i}-${Math.floor(snapshot.tick / 4)}`;
      const type = CHANGE_TYPES[seededInt(`${seed}-t`, 0, CHANGE_TYPES.length - 1)]!;
      candidates.push({
        id: `SAT-${z.district.id}-${i + 1}`,
        districtId: z.district.id,
        district: z.district.name,
        state: z.district.state,
        lat: z.district.lat + (seeded(`${seed}-la`) - 0.5) * 0.2,
        lng: z.district.lng + (seeded(`${seed}-ln`) - 0.5) * 0.2,
        changeType: type,
        areaHa: Math.round((0.3 + seeded(`${seed}-a`) * 4.6) * 10) / 10,
        confidence: Math.round(Math.min(0.94, 0.52 + likelihood * 0.4) * 100) / 100,
        beforeDate: dateOffset(12 + seededInt(`${seed}-bd`, 0, 6)),
        afterDate: dateOffset(seededInt(`${seed}-ad`, 0, 2)),
        beforeSeed: seededInt(`${seed}-bs`, 0, 359),
        afterSeed: seededInt(`${seed}-as`, 0, 359),
        ndviDelta: -Math.round(seeded(`${seed}-nd`) * 42) / 100,
        coherenceDrop: Math.round((0.2 + seeded(`${seed}-cd`) * 0.55) * 100) / 100,
        note:
          type === "Possible landslide scar"
            ? "Bare-earth signature with abrupt NDVI loss along a slope facet."
            : type === "Road deformation indicator"
              ? "Linear discontinuity detected near the road alignment."
              : type === "Vegetation disturbance"
                ? "Canopy loss cluster consistent with shallow slope movement."
                : type === "Debris accumulation"
                  ? "New high-backscatter deposit at the slope toe."
                  : "Surface texture change without clear vegetation loss.",
        verificationStatus: seeded(`${seed}-v`) > 0.7 ? "FIELD TEAM ASSIGNED" : "UNVERIFIED",
      });
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence).slice(0, maxResults);
}

export function changesFor(changes: SatelliteChange[], districtId: string) {
  return changes.filter((c) => c.districtId === districtId);
}

/** Zone-level satellite headline used in the evidence panel. */
export function satelliteHeadline(zone: RiskZone, changes: SatelliteChange[]) {
  const mine = changesFor(changes, zone.district.id);
  if (mine.length === 0) return "No change candidate above detection threshold.";
  return `${mine.length} change candidate(s); highest confidence ${Math.round((mine[0]?.confidence ?? 0) * 100)} % (${mine[0]?.changeType}).`;
}
