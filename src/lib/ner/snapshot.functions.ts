import { createServerFn } from "@tanstack/react-start";

import { buildSnapshot } from "./demo-data";

/**
 * Server-side risk snapshot. Mirrors what a FastAPI `/api/v1/dashboard/summary`
 * endpoint would serve: monitored zones, live risk levels and headline counts.
 */
export const getRegionSummary = createServerFn({ method: "GET" }).handler(async () => {
  const snapshot = buildSnapshot(0);
  return {
    generatedAt: snapshot.generatedAt,
    summary: snapshot.summary,
    topZones: snapshot.zones.slice(0, 5).map((z) => ({
      id: z.district.id,
      district: z.district.name,
      state: z.district.state,
      score: z.assessment.score,
      level: z.assessment.level,
      probability: Math.round(z.assessment.probability * 100),
      rainfall24h: z.observation.rainfall24h,
      soilMoisture: z.observation.soilMoisture,
    })),
  };
});
