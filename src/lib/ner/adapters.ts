/**
 * DATA SOURCE ADAPTERS — DEMO vs LIVE
 *
 * NER-SAFE never presents simulated values as government observations. Every
 * external data family is expressed as an adapter interface. DEMO MODE uses
 * the deterministic local generators; LIVE MODE expects a real implementation
 * to be registered here (IMD, ISRO/NRSC, state IoT gateways, GSI inventories).
 *
 * Adding a real feed later means implementing one interface — no UI or engine
 * redesign.
 */

import { buildSnapshot, type Snapshot } from "./demo-data";

export type SystemMode = "DEMO" | "LIVE";

export type SourceStatus = "SIMULATED" | "CONNECTED" | "NOT CONFIGURED" | "DEGRADED";

export interface DataSourceDescriptor {
  key: string;
  label: string;
  provider: string;
  /** What the adapter supplies to the engines. */
  supplies: string;
  demoStatus: SourceStatus;
  liveStatus: SourceStatus;
  liveEndpointHint: string;
}

export const DATA_SOURCES: DataSourceDescriptor[] = [
  {
    key: "weather",
    label: "Rainfall & weather",
    provider: "IMD / OpenWeather-compatible",
    supplies: "Rainfall 1/6/24/72 h, intensity, forecast series",
    demoStatus: "SIMULATED",
    liveStatus: "NOT CONFIGURED",
    liveEndpointHint: "WeatherAdapter.fetchObservations() + fetchForecast()",
  },
  {
    key: "satellite",
    label: "Satellite change detection",
    provider: "Sentinel-1/2, NRSC Bhuvan",
    supplies: "NDVI change, coherence loss, scar candidates",
    demoStatus: "SIMULATED",
    liveStatus: "NOT CONFIGURED",
    liveEndpointHint: "SatelliteAdapter.fetchChangeCandidates()",
  },
  {
    key: "sensors",
    label: "IoT ground sensors",
    provider: "State telemetry gateway (MQTT/HTTP)",
    supplies: "Soil moisture, rain gauge, inclinometer, water level",
    demoStatus: "SIMULATED",
    liveStatus: "NOT CONFIGURED",
    liveEndpointHint: "SensorAdapter.fetchDevices()",
  },
  {
    key: "terrain",
    label: "Terrain & slope (DEM)",
    provider: "SRTM / CartoDEM",
    supplies: "Slope, elevation, aspect, road-cut index",
    demoStatus: "SIMULATED",
    liveStatus: "NOT CONFIGURED",
    liveEndpointHint: "TerrainAdapter.fetchTerrain()",
  },
  {
    key: "history",
    label: "Landslide inventory",
    provider: "GSI / SDMA archives",
    supplies: "Historical event counts and blockage records",
    demoStatus: "SIMULATED",
    liveStatus: "NOT CONFIGURED",
    liveEndpointHint: "HistoryAdapter.fetchInventory()",
  },
  {
    key: "assets",
    label: "Villages, hospitals, schools",
    provider: "State GIS asset registers",
    supplies: "Community assets, access links, capacities",
    demoStatus: "SIMULATED",
    liveStatus: "NOT CONFIGURED",
    liveEndpointHint: "AssetAdapter.fetchAssets()",
  },
  {
    key: "reports",
    label: "Citizen & field reports",
    provider: "NER-SAFE field app (local-first)",
    supplies: "Geo-tagged hazard reports and photo triage",
    demoStatus: "SIMULATED",
    liveStatus: "CONNECTED",
    liveEndpointHint: "Local queue + sync service (already implemented)",
  },
];

export interface WeatherAdapter {
  fetchObservations(): Promise<unknown>;
  fetchForecast(): Promise<unknown>;
}
export interface SatelliteAdapter {
  fetchChangeCandidates(): Promise<unknown>;
}
export interface SensorAdapter {
  fetchDevices(): Promise<unknown>;
}
export interface TerrainAdapter {
  fetchTerrain(): Promise<unknown>;
}
export interface HistoryAdapter {
  fetchInventory(): Promise<unknown>;
}
export interface AssetAdapter {
  fetchAssets(): Promise<unknown>;
}

export interface AdapterRegistry {
  weather?: WeatherAdapter;
  satellite?: SatelliteAdapter;
  sensors?: SensorAdapter;
  terrain?: TerrainAdapter;
  history?: HistoryAdapter;
  assets?: AssetAdapter;
}

/** Live adapters are registered here once credentials exist. Empty by design. */
export const LIVE_ADAPTERS: AdapterRegistry = {};

export function sourceStatus(mode: SystemMode, key: string): SourceStatus {
  const src = DATA_SOURCES.find((s) => s.key === key);
  if (!src) return "NOT CONFIGURED";
  return mode === "DEMO" ? src.demoStatus : src.liveStatus;
}

export function connectedSourceCount(mode: SystemMode): { connected: number; total: number } {
  const total = DATA_SOURCES.length;
  const connected = DATA_SOURCES.filter((s) =>
    mode === "DEMO" ? s.demoStatus === "SIMULATED" : s.liveStatus === "CONNECTED",
  ).length;
  return { connected, total };
}

export const MODE_BANNER: Record<SystemMode, { label: string; detail: string }> = {
  DEMO: {
    label: "DEMO MODE — SIMULATED DATA",
    detail:
      "All environmental values are deterministic synthetic demonstration data generated locally. Not Government of India observations.",
  },
  LIVE: {
    label: "LIVE MODE — AWAITING CONNECTED FEEDS",
    detail:
      "Live adapters (IMD, satellite, IoT gateway, GIS registers) are not yet configured for this deployment. Register them in adapters.ts to stream real observations.",
  },
};

/**
 * Single entry point the app uses to obtain a regional snapshot. In LIVE MODE
 * with no adapters registered we keep the simulated snapshot but the UI must
 * (and does) display the LIVE-mode banner stating feeds are unconfigured.
 */
export async function loadSnapshot(mode: SystemMode, tick: number): Promise<Snapshot> {
  if (mode === "LIVE" && LIVE_ADAPTERS.weather) {
    // Real pipeline goes here once an adapter is registered.
    return buildSnapshot(tick);
  }
  return buildSnapshot(tick);
}
