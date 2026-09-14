import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PlusCircle, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice, StatCard } from "@/components/ner/bits";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { mergeReports, useSystem } from "@/lib/ner/store";
import { verifyAll } from "@/lib/ner/citizen-verification";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "Citizen & Field Reports | NER-SAFE" },
      {
        name: "description",
        content:
          "Review citizen and field-officer hazard reports across the North Eastern Region with AI image analysis results and verification status.",
      },
      { property: "og:title", content: "Citizen & Field Reports — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Cracks, slope movement, debris, rockfall and road blockage reports feeding the NER-SAFE risk engine.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { snapshot, localReports, pendingCount, syncNow, online, intelligence } = useSystem();
  const [status, setStatus] = useState("all");

  const all = useMemo(() => mergeReports(snapshot, localReports), [snapshot, localReports]);
  const verifications = useMemo(
    () => verifyAll(snapshot, all, intelligence.changes),
    [snapshot, all, intelligence.changes],
  );
  const rows = all.filter((r) => status === "all" || r.status === status);

  return (
    <AppShell>
      <div className="space-y-4 p-3 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold uppercase">Field reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {all.length} reports · {localReports.length} submitted from this device
            </p>
          </div>
          <div className="flex gap-2">
            {pendingCount > 0 ? (
              <Button variant="secondary" onClick={syncNow} disabled={!online}>
                <RefreshCw className="size-4" /> Sync {pendingCount} pending
              </Button>
            ) : null}
            <Button asChild>
              <Link to="/reports/new">
                <PlusCircle className="size-4" /> New report
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Open"
            value={all.filter((r) => r.status === "OPEN").length}
            tone="high"
          />
          <StatCard
            label="Verified"
            value={all.filter((r) => r.status === "VERIFIED").length}
            tone="accent"
          />
          <StatCard
            label="Resolved"
            value={all.filter((r) => r.status === "RESOLVED").length}
            tone="low"
          />
          <StatCard
            label="With image analysis"
            value={all.filter((r) => r.imageAnalysis).length}
            sub="placeholder CV module"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>

        {rows.length === 0 ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            No reports with this status yet. Submit the first one from{" "}
            <Link to="/reports/new" className="text-primary underline">
              New report
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <article key={r.id} className="panel space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-semibold tracking-wide uppercase">
                      {r.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.district}, {r.state}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[0.65rem] font-semibold",
                      r.severity === "HIGH"
                        ? "border-risk-veryhigh/45 bg-risk-veryhigh/15 text-risk-veryhigh"
                        : r.severity === "MEDIUM"
                          ? "border-risk-moderate/45 bg-risk-moderate/15 text-risk-moderate"
                          : "border-risk-low/45 bg-risk-low/15 text-risk-low",
                    )}
                  >
                    {r.severity}
                  </span>
                </div>
                <p className="text-sm">{r.description}</p>
                {(() => {
                  const v = verifications.get(r.id);
                  if (!v) return null;
                  return (
                    <div className="rounded border border-border bg-surface p-2 text-[0.7rem]">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 font-semibold",
                            v.confidence >= 78
                              ? "border-risk-critical/50 bg-risk-critical/15 text-risk-critical"
                              : v.confidence >= 58
                                ? "border-risk-high/50 bg-risk-high/15 text-risk-high"
                                : "border-border text-muted-foreground",
                          )}
                        >
                          {v.classification}
                        </span>
                        <span className="metric">{v.confidence} % report confidence</span>
                      </div>
                      <ul className="mt-1.5 space-y-0.5">
                        {v.signals
                          .filter((sig) => sig.present)
                          .slice(0, 4)
                          .map((sig) => (
                            <li key={sig.label} className="text-muted-foreground">
                              ✓ {sig.label} — {sig.detail}
                            </li>
                          ))}
                      </ul>
                      <p className="mt-1.5">{v.recommendation}</p>
                      <p className="mt-1 text-muted-foreground">{v.caveat}</p>
                    </div>
                  );
                })()}
                {r.imageAnalysis ? (
                  <div className="rounded border border-border bg-surface p-2 text-[0.7rem]">
                    <span className="text-primary">AI image analysis:</span>{" "}
                    {r.imageAnalysis.detected} ·{" "}
                    <span className="metric">{r.imageAnalysis.confidence} %</span> confidence
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-muted-foreground">
                  <span>{r.reportedBy}</span>
                  <span>·</span>
                  <span className="metric">
                    {r.lat.toFixed(3)}, {r.lng.toFixed(3)}
                  </span>
                  <span>·</span>
                  <span>
                    {r.minutesAgo < 60
                      ? `${r.minutesAgo} min ago`
                      : `${Math.round(r.minutesAgo / 60)} h ago`}
                  </span>
                  <span className="ml-auto font-semibold text-foreground">{r.status}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
