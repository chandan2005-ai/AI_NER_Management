import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, SectionHeading } from "@/components/ner/bits";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, useI18n, type Lang } from "@/lib/ner/i18n";
import { useSystem } from "@/lib/ner/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "System Settings | NER-SAFE" },
      {
        name: "description",
        content:
          "Configure NER-SAFE: language, demo mode, live simulation, alert thresholds, offline data and export of the current regional snapshot.",
      },
      { property: "og:title", content: "System Settings — NER-SAFE" },
      {
        property: "og:description",
        content: "Language, simulation, alert thresholds and offline data controls for NER-SAFE.",
      },
    ],
  }),
  component: SettingsPage,
});

const THRESHOLDS = [
  {
    level: "Level 1 — Information",
    range: "Risk score 25–44",
    action: "Monitor, publish advisory",
  },
  { level: "Level 2 — Watch", range: "Risk score 45–59", action: "Field verification, inform PWD" },
  {
    level: "Level 3 — Warning",
    range: "Risk score 60–79",
    action: "Restrict night travel, ready teams",
  },
  {
    level: "Level 4 — Critical",
    range: "Risk score ≥ 80",
    action: "Evacuate, close roads, deploy NDRF/SDRF",
  },
];

function SettingsPage() {
  const { lang, setLang } = useI18n();
  const {
    demoMode,
    setDemoMode,
    simulating,
    setSimulating,
    snapshot,
    localReports,
    pendingCount,
    syncNow,
  } = useSystem();

  const exportSnapshot = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ner-safe-snapshot-tick-${snapshot.tick}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Snapshot exported as JSON");
  };

  const clearLocal = () => {
    window.localStorage.removeItem("ner-safe-reports");
    window.localStorage.removeItem("ner-safe-report-queue");
    toast.success("Local reports cleared", { description: "Reload the page to see the change." });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4 p-3 sm:p-5">
        <h1 className="text-2xl font-semibold uppercase">Settings</h1>

        <section className="panel space-y-4 p-4">
          <SectionHeading title="Interface" eyebrow="Preferences" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="lang-select">Language</Label>
              <p className="text-xs text-muted-foreground">
                Alerts and key labels are localised for field and community use.
              </p>
            </div>
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger id="lang-select" className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.native} — {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="demo-switch">Demo mode</Label>
              <p className="text-xs text-muted-foreground">
                Uses the synthetic data generator instead of live feeds.
              </p>
            </div>
            <Switch id="demo-switch" checked={demoMode} onCheckedChange={setDemoMode} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="sim-switch">Live simulation</Label>
              <p className="text-xs text-muted-foreground">
                Advances the regional state every few seconds so conditions evolve.
              </p>
            </div>
            <Switch id="sim-switch" checked={simulating} onCheckedChange={setSimulating} />
          </div>
        </section>

        <section className="panel p-4">
          <SectionHeading
            title="Alert thresholds"
            eyebrow="Escalation matrix"
            description="Fixed thresholds keep escalation auditable. Changing them requires an authorised administrator in a production deployment."
          />
          <ul className="divide-y divide-border text-sm">
            {THRESHOLDS.map((t) => (
              <li key={t.level} className="flex flex-wrap items-baseline gap-x-3 py-2">
                <span className="font-medium">{t.level}</span>
                <span className="metric text-xs text-muted-foreground">{t.range}</span>
                <span className="ml-auto text-xs text-muted-foreground">{t.action}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel space-y-3 p-4">
          <SectionHeading title="Offline data" eyebrow="Device" />
          <p className="text-sm text-muted-foreground">
            {localReports.length} report(s) stored on this device · {pendingCount} waiting to sync.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={syncNow} disabled={pendingCount === 0}>
              Sync pending reports
            </Button>
            <Button variant="secondary" onClick={exportSnapshot}>
              <Download className="size-4" /> Export snapshot JSON
            </Button>
            <Button variant="destructive" onClick={clearLocal}>
              <Trash2 className="size-4" /> Clear local reports
            </Button>
          </div>
        </section>

        <section className="panel p-4">
          <SectionHeading title="Data sources" eyebrow="Provenance" />
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>Rainfall: IMD gridded rainfall / AWS network (simulated in demo mode)</li>
            <li>Soil moisture: in-situ probes + SMAP-class satellite retrievals (simulated)</li>
            <li>
              Terrain: SRTM/Cartosat-derived slope and elevation (approximate district values)
            </li>
            <li>Satellite change indicators: Sentinel-1/2-class differencing (simulated)</li>
            <li>Historical inventory: GSI landslide records (demo counts)</li>
            <li>Citizen and field reports: submitted through this application</li>
          </ul>
        </section>

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
