/**
 * Community & lifeline asset register (villages, hospitals, schools, shelters,
 * emergency depots) for every monitored district.
 *
 * DEMO MODE: entries are deterministically synthesised from the district
 * reference table so the platform is demonstrable without a licensed GIS
 * asset layer. In LIVE MODE these are produced by the `AssetAdapter`
 * (see `adapters.ts`) from state GIS / NRSC village and facility datasets.
 */

import { DISTRICTS, type DistrictRef } from "./districts";
import { seeded, seededInt } from "./seed";

export type AssetKind = "VILLAGE" | "HOSPITAL" | "SCHOOL" | "SHELTER" | "EMERGENCY DEPOT";

export interface CommunityAsset {
  id: string;
  kind: AssetKind;
  name: string;
  districtId: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  /** Residents served / enrolled / bed capacity depending on kind. */
  population: number;
  /** Number of road links physically connecting the asset to the network. */
  connectingRoads: number;
  /** Road km to the nearest functioning hospital. */
  hospitalDistanceKm: number;
  /** Road km to the nearest emergency response depot. */
  emergencyDistanceKm: number;
}

const VILLAGE_SUFFIX = ["Basti", "Village", "Tolla", "Gaon", "Khel", "Hamlet", "Colony"];

function assetsForDistrict(d: DistrictRef): CommunityAsset[] {
  const out: CommunityAsset[] = [];
  const villageCount = d.slope > 32 ? 4 : d.slope > 22 ? 3 : 2;

  const place = (i: number, tag: string) => ({
    lat: d.lat + (seeded(`${d.id}-${tag}-${i}-la`) - 0.5) * 0.26,
    lng: d.lng + (seeded(`${d.id}-${tag}-${i}-ln`) - 0.5) * 0.26,
  });

  for (let i = 0; i < villageCount; i++) {
    const suffix = VILLAGE_SUFFIX[seededInt(`${d.id}-vs-${i}`, 0, VILLAGE_SUFFIX.length - 1)]!;
    const remoteness = seeded(`${d.id}-remote-${i}`);
    out.push({
      id: `VIL-${d.id}-${i + 1}`,
      kind: "VILLAGE",
      name: `${d.name.split(" ")[0]} ${suffix} ${i + 1}`,
      districtId: d.id,
      district: d.name,
      state: d.state,
      ...place(i, "vil"),
      population: Math.round((d.exposedPopulation / villageCount) * (0.6 + remoteness * 0.9)),
      // Steep, remote hill settlements are far more likely to be single-access.
      connectingRoads: remoteness > 0.55 && d.slope > 28 ? 1 : seededInt(`${d.id}-cr-${i}`, 1, 3),
      hospitalDistanceKm: Math.round(6 + remoteness * (d.slope > 30 ? 68 : 34)),
      emergencyDistanceKm: Math.round(4 + remoteness * (d.slope > 30 ? 52 : 26)),
    });
  }

  const hospitalCount = d.exposedPopulation > 2200 ? 2 : 1;
  for (let i = 0; i < hospitalCount; i++) {
    out.push({
      id: `HOS-${d.id}-${i + 1}`,
      kind: "HOSPITAL",
      name: i === 0 ? `${d.name} District Hospital` : `${d.name} CHC`,
      districtId: d.id,
      district: d.name,
      state: d.state,
      ...place(i, "hos"),
      population: seededInt(`${d.id}-beds-${i}`, 30, 220),
      connectingRoads: seededInt(`${d.id}-hcr-${i}`, 1, 3),
      hospitalDistanceKm: 0,
      emergencyDistanceKm: seededInt(`${d.id}-hem-${i}`, 2, 18),
    });
  }

  const schoolCount = d.slope > 30 ? 3 : 2;
  for (let i = 0; i < schoolCount; i++) {
    out.push({
      id: `SCH-${d.id}-${i + 1}`,
      kind: "SCHOOL",
      name: `${d.name} Govt. School ${i + 1}`,
      districtId: d.id,
      district: d.name,
      state: d.state,
      ...place(i, "sch"),
      population: seededInt(`${d.id}-enr-${i}`, 90, 640),
      connectingRoads: seededInt(`${d.id}-scr-${i}`, 1, 3),
      hospitalDistanceKm: seededInt(`${d.id}-shk-${i}`, 4, 42),
      emergencyDistanceKm: seededInt(`${d.id}-sek-${i}`, 3, 30),
    });
  }

  out.push({
    id: `DEP-${d.id}-1`,
    kind: "EMERGENCY DEPOT",
    name: `${d.name} SDRF / PWD depot`,
    districtId: d.id,
    district: d.name,
    state: d.state,
    ...place(0, "dep"),
    population: 0,
    connectingRoads: 2,
    hospitalDistanceKm: seededInt(`${d.id}-dhk`, 2, 24),
    emergencyDistanceKm: 0,
  });

  return out;
}

export const COMMUNITY_ASSETS: CommunityAsset[] = DISTRICTS.flatMap(assetsForDistrict);

export function assetsOf(districtId: string, kind?: AssetKind): CommunityAsset[] {
  return COMMUNITY_ASSETS.filter(
    (a) => a.districtId === districtId && (kind ? a.kind === kind : true),
  );
}

export function villagesOf(districtId: string) {
  return assetsOf(districtId, "VILLAGE");
}

export function hospitalsOf(districtId: string) {
  return assetsOf(districtId, "HOSPITAL");
}

export function schoolsOf(districtId: string) {
  return assetsOf(districtId, "SCHOOL");
}
