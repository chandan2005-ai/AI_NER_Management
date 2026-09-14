import { Info } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { DataQualityDot, RiskBadge, ScoreMeter, TrendIndicator } from "./bits";
import type { RiskZone } from "@/lib/ner/demo-data";

export function ZoneDetail({ zone }: { zone: RiskZone }) {
  const { district: d, observation: o, assessment: a } = zone;

  const rows: [string, string][] = [
    ["Rainfall (24 h)", `${o.rainfall24h} mm`],
    ["Rainfall (72 h)", `${o.rainfall72h} mm`],
    ["Rain intensity", `${o.rainfallIntensity} mm/h`],
    ["Soil moisture", `${o.soilMoisture} %`],
    ["Slope", `${d.slope}°`],
    ["Elevation", `${d.elevation} m`],
    ["Soil class", d.soilClass],
    ["Historical landslides", `${d.historicalEvents}`],
    ["Ground movement", `${o.groundMovement} mm / 24 h`],
    ["Satellite anomaly", `${Math.round(o.satelliteIndicator * 100)} %`],
    ["Exposed population", d.exposedPopulation.toLocaleString()],
    ["Affected roads", `${zone.affectedRoads}`],
    ["Nearby shelters", `${zone.nearbyShelters}`],
    ["Rainfall anomaly", `${zone.rainfallAnomalyPct > 0 ? "+" : ""}${zone.rainfallAnomalyPct} %`],
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{d.name}</h3>
            <p className="text-xs text-muted-foreground">{d.state}</p>
          </div>
          <RiskBadge level={a.level} />
        </div>
        <div className="mt-3 flex items-end justify-between">
          <span className="metric text-4xl font-bold">
            {a.score}
            <span className="text-base font-normal text-muted-foreground">/100</span>
          </span>
          <TrendIndicator trend={zone.trend} />
        </div>
        <div className="mt-2">
          <ScoreMeter score={a.score} level={a.level} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Hazard probability (24 h):{" "}
            <span className="metric text-foreground">{Math.round(a.probability * 100)} %</span>
          </span>
          <span>
            Confidence:{" "}
            <span className="metric text-foreground">{Math.round(a.confidence * 100)} %</span>
          </span>
          <DataQualityDot ageMinutes={o.dataAgeMinutes} />
        </div>
      </div>

      <div>
        <p className="label-eyebrow mb-2">Why this score — factor contributions</p>
        <div className="space-y-2">
          {a.factors.map((f) => (
            <div key={f.key} title={f.note}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span>{f.label}</span>
                <span className="metric text-primary">+{f.points}</span>
              </div>
              <Progress value={(f.points / 26) * 100} className="mt-1 h-1.5" />
              <p className="mt-0.5 text-[0.68rem] text-muted-foreground">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {a.triggeredRules.length > 0 ? (
        <div>
          <p className="label-eyebrow mb-2">Rule layer triggered</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {a.triggeredRules.map((r) => (
              <li key={r} className="flex gap-1.5">
                <span className="text-primary">▸</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="label-eyebrow mb-2">Monitored parameters</p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {rows.map(([k, v]) => (
            <div
              key={k}
              className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-1"
            >
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="metric">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded border border-primary/30 bg-primary/10 p-3">
        <p className="label-eyebrow mb-1 text-primary">Recommended action</p>
        <p className="text-xs leading-relaxed">
          {a.score > 80
            ? "Immediate field inspection, halt traffic on vulnerable cut sections and prepare exposed households for precautionary relocation."
            : a.score > 60
              ? "Restrict traffic on vulnerable road sections and initiate field inspection within 6 hours."
              : a.score > 40
                ? "Increase monitoring frequency; pre-position road-clearance machinery."
                : "Continue routine monitoring."}
        </p>
      </div>

      <p className="flex gap-1.5 text-[0.68rem] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3 shrink-0" />
        The model estimates elevated landslide risk from current environmental and historical
        indicators; it does not predict that a landslide will certainly occur. Verification by an
        authorised field team is required before enforcement action.
      </p>
    </div>
  );
}
