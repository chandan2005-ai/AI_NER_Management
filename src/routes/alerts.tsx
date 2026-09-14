import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BellRing, Mail, MessageSquare, Smartphone } from "lucide-react";

import { AppShell } from "@/components/ner/AppShell";
import { DataQualityDot, DemoDataNotice, RiskBadge, StatCard } from "@/components/ner/bits";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/ner/i18n";
import { useSystem } from "@/lib/ner/store";
import { LastMileAlert } from "@/components/ner/LastMileAlert";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Early Warning Alerts | NER-SAFE" },
      {
        name: "description",
        content:
          "Four-level landslide early warning alerts with probability, contributing factors, data freshness, recipients and recommended action.",
      },
      { property: "og:title", content: "Early Warning Alerts — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Information, Watch, Warning and Critical alerts routed to district administration, police, PWD and community channels.",
      },
    ],
  }),
  component: AlertsPage,
});

const LEVEL_CLASS: Record<number, string> = {
  1: "border-risk-low/40 bg-risk-low/10 text-risk-low",
  2: "border-risk-moderate/40 bg-risk-moderate/10 text-risk-moderate",
  3: "border-risk-veryhigh/45 bg-risk-veryhigh/10 text-risk-veryhigh",
  4: "border-risk-critical/55 bg-risk-critical/15 text-risk-critical",
};

function AlertsPage() {
  const { snapshot } = useSystem();
  const { t } = useI18n();
  const [filter, setFilter] = useState("all");

  const alerts = snapshot.alerts.filter((a) => filter === "all" || String(a.level) === filter);

  const dispatch = (channel: string, district: string) =>
    toast.success(`${channel} dispatch simulated`, {
      description: `Alert for ${district} queued in the notification simulator log (no external SMS/email credentials configured).`,
    });

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <h1 className="text-2xl font-semibold uppercase">Early warning alerts</h1>

        <LastMileAlert />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[4, 3, 2, 1].map((lvl) => (
            <StatCard
              key={lvl}
              label={`Level ${lvl} — ${t(`alert.level${lvl}`)}`}
              value={snapshot.alerts.filter((a) => a.level === lvl).length}
              tone={
                lvl === 4 ? "critical" : lvl === 3 ? "veryhigh" : lvl === 2 ? "moderate" : "low"
              }
              icon={<BellRing className="size-4" />}
            />
          ))}
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="4">Level 4</TabsTrigger>
            <TabsTrigger value="3">Level 3</TabsTrigger>
            <TabsTrigger value="2">Level 2</TabsTrigger>
            <TabsTrigger value="1">Level 1</TabsTrigger>
          </TabsList>
        </Tabs>

        {alerts.length === 0 ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            No alerts at this level right now. Conditions are within monitoring thresholds.
          </div>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className="panel p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 font-display text-[0.7rem] font-bold tracking-wider uppercase",
                      LEVEL_CLASS[a.level],
                    )}
                  >
                    Level {a.level} — {t(`alert.level${a.level}`)}
                  </span>
                  <span className="font-semibold">
                    {a.district}, {a.state}
                  </span>
                  <RiskBadge level={a.riskLevel} />
                  <span className="metric ml-auto text-sm">{a.riskScore}/100</span>
                </div>

                <p className="mt-2 text-sm">{a.message}</p>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Probability:{" "}
                    <span className="metric text-foreground">
                      {Math.round(a.probability * 100)} %
                    </span>
                  </span>
                  <span>
                    Confidence:{" "}
                    <span className="metric text-foreground">
                      {Math.round(a.confidence * 100)} %
                    </span>
                  </span>
                  <span>Issued {a.minutesAgo} min ago</span>
                  <DataQualityDot ageMinutes={a.dataAgeMinutes} />
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {a.topFactors.map((f) => (
                    <span
                      key={f}
                      className="rounded border border-border bg-surface px-1.5 py-0.5 text-[0.68rem]"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <p className="mt-2 text-xs">
                  <span className="text-primary">{t("common.action")}:</span> {a.recommendedAction}
                </p>
                <p className="mt-1 text-[0.7rem] text-muted-foreground">
                  Recipients: {a.recipients.join(" · ")}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => dispatch("SMS", a.district)}>
                    <MessageSquare className="size-3.5" /> SMS
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => dispatch("Email", a.district)}
                  >
                    <Mail className="size-3.5" /> Email
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => dispatch("Push", a.district)}
                  >
                    <Smartphone className="size-3.5" /> Push
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-[0.7rem] text-muted-foreground">{t("alert.disclaimer")}</p>
        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
