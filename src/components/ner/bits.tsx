import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronsUp } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { riskBgClass, type RiskLevel, type RiskTrend } from "@/lib/ner/risk-engine";

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-display text-[0.7rem] font-semibold uppercase tracking-wider",
        riskBgClass(level),
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {level}
    </span>
  );
}

export function TrendIndicator({ trend }: { trend: RiskTrend }) {
  const map: Record<RiskTrend, { icon: ReactNode; cls: string; label: string }> = {
    DECREASING: {
      icon: <ArrowDownRight className="size-3.5" />,
      cls: "text-risk-low",
      label: "Decreasing",
    },
    STABLE: {
      icon: <ArrowRight className="size-3.5" />,
      cls: "text-muted-foreground",
      label: "Stable",
    },
    INCREASING: {
      icon: <ArrowUpRight className="size-3.5" />,
      cls: "text-risk-high",
      label: "Increasing",
    },
    "RAPIDLY INCREASING": {
      icon: <ChevronsUp className="size-3.5" />,
      cls: "text-risk-veryhigh",
      label: "Rapidly increasing",
    },
  };
  const it = map[trend];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", it.cls)}>
      {it.icon}
      {it.label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "low" | "moderate" | "high" | "veryhigh" | "critical" | "accent";
  icon?: ReactNode;
}) {
  const tones: Record<string, string> = {
    default: "text-foreground",
    low: "text-risk-low",
    moderate: "text-risk-moderate",
    high: "text-risk-high",
    veryhigh: "text-risk-veryhigh",
    critical: "text-risk-critical",
    accent: "text-accent",
  };
  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="label-eyebrow">{label}</span>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <div className={cn("metric mt-2 text-3xl font-semibold", tones[tone])}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="label-eyebrow mb-1">{eyebrow}</p> : null}
        <h2 className="text-xl font-semibold tracking-wide uppercase">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {action}
    </div>
  );
}

export function ScoreMeter({ score, level }: { score: number; level: RiskLevel }) {
  const color = {
    LOW: "bg-risk-low",
    MODERATE: "bg-risk-moderate",
    HIGH: "bg-risk-high",
    "VERY HIGH": "bg-risk-veryhigh",
    CRITICAL: "bg-risk-critical",
  }[level];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export function DataQualityDot({ ageMinutes }: { ageMinutes: number }) {
  const stale = ageMinutes > 60;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[0.7rem]",
        stale ? "text-risk-moderate" : "text-muted-foreground",
      )}
      title={stale ? "Stale input — verify before acting" : "Fresh input"}
    >
      <span className={cn("size-1.5 rounded-full", stale ? "bg-risk-moderate" : "bg-risk-low")} />
      {ageMinutes} min old
    </span>
  );
}

export function DemoDataNotice({ className }: { className?: string }) {
  return (
    <p className={cn("text-[0.7rem] leading-relaxed text-muted-foreground", className)}>
      DEMO DATA — synthetic, deterministic values generated locally for demonstration. Not
      Government of India observations. Decision support only; final emergency decisions remain with
      authorised disaster-management authorities.
    </p>
  );
}
