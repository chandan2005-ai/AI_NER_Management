import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Presentation, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSystem } from "@/lib/ner/store";

/**
 * Guided judge walkthrough overlay. Purely presentational — it points at real
 * screens of the running system and never fabricates values.
 */
export function JudgeDemoBar() {
  const { judgeDemo, setJudgeDemo, judgeStep, setJudgeStep, steps } = useSystem();
  const navigate = useNavigate();

  if (!judgeDemo) return null;

  const step = steps.find((s) => s.n === judgeStep) ?? steps[0]!;
  const go = (n: number) => {
    const next = steps.find((s) => s.n === n);
    if (!next) return;
    setJudgeStep(next.n);
    void navigate({ to: next.route });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[950] border-t border-primary/40 bg-sidebar/95 p-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-3">
        <span className="flex items-center gap-2 rounded border border-primary/50 bg-primary/10 px-2 py-1 text-[0.7rem] font-semibold text-primary">
          <Presentation className="size-3.5" />
          JUDGE DEMO {step.n}/{steps.length} · {step.phase}
        </span>

        <div className="min-w-[240px] flex-1">
          <p className="text-sm font-semibold">{step.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{step.script}</p>
          <div className="mt-2 flex gap-1">
            {steps.map((s) => (
              <button
                key={s.n}
                aria-label={`Go to step ${s.n}`}
                onClick={() => go(s.n)}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  s.n === step.n ? "bg-primary" : s.n < step.n ? "bg-primary/40" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" asChild>
            <Link to={step.route}>Open screen</Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Previous step"
            disabled={step.n === 1}
            onClick={() => go(step.n - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Next step"
            disabled={step.n === steps.length}
            onClick={() => go(step.n + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Exit judge demo"
            onClick={() => setJudgeDemo(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
