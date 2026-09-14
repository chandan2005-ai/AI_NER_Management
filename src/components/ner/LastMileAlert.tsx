import { Languages, Megaphone } from "lucide-react";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n, LANGUAGES, type Lang } from "@/lib/ner/i18n";
import { useSystem } from "@/lib/ner/store";
import { citizenAlert, technicalBulletin } from "@/lib/ner/alert-templates";

/**
 * Two products from one assessment: a plain-language citizen alert in the local
 * language, and the technical bulletin for officers. Shown side by side so the
 * separation is visible.
 */
export function LastMileAlert() {
  const { snapshot, intelligence } = useSystem();
  const { lang } = useI18n();
  const [districtId, setDistrictId] = useState(snapshot.zones[0]?.district.id ?? "");
  const [alertLang, setAlertLang] = useState<Lang>(lang);

  const zone = snapshot.zones.find((z) => z.district.id === districtId) ?? snapshot.zones[0]!;
  const iso = intelligence.isolationById.get(zone.district.id)!;
  const ev = intelligence.evidence.get(zone.district.id)!;
  const citizen = citizenAlert(zone, iso, alertLang);
  const bulletin = technicalBulletin(zone, ev, iso);

  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-eyebrow">Last-mile alert intelligence</p>
          <h2 className="text-lg font-semibold">Citizen alert vs technical bulletin</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The same assessment is issued twice: one short, translated, action-first message for
            residents, and one technical bulletin with scores, confidence and data quality for
            officers.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={districtId} onValueChange={setDistrictId}>
            <SelectTrigger className="h-8 w-[210px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {snapshot.zones.map((z) => (
                <SelectItem key={z.district.id} value={z.district.id} className="text-xs">
                  {z.district.name} — {z.district.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={alertLang} onValueChange={(v) => setAlertLang(v as Lang)}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code} className="text-xs">
                  {l.native}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded border border-risk-critical/40 bg-risk-critical/5 p-3">
          <div className="flex items-center gap-2 text-risk-critical">
            <Megaphone className="size-4" />
            <span className="text-sm font-semibold">{citizen.heading}</span>
          </div>
          <dl className="mt-2 space-y-1.5 text-sm">
            {(
              [
                [citizen.locationLabel, citizen.location],
                [citizen.riskLabel, citizen.risk],
                [citizen.reasonLabel, citizen.reason],
                [citizen.impactLabel, citizen.impact],
                [citizen.actionLabel, citizen.action],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k}>
                <dt className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
            <Languages className="size-3" />
            {citizen.footer}
          </p>
        </div>

        <div className="rounded border border-border p-3">
          <p className="text-sm font-semibold">{bulletin.title}</p>
          <dl className="mt-2 space-y-1 text-xs">
            {bulletin.lines.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="metric">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="label-eyebrow mt-3 mb-1">Score attribution</p>
          <ul className="space-y-0.5 text-xs">
            {bulletin.factors.map((f) => (
              <li key={f} className="metric text-muted-foreground">
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.7rem] text-muted-foreground">{bulletin.caveat}</p>
        </div>
      </div>
    </div>
  );
}
