import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Target, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { Button, Card, Section, Stat, Tag } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import { getSatSkillMastery, type SatSkillMasteryRow } from "@/lib/satSkillMastery";
import {
  getSatReadinessSignal,
  getSatWeeklyProgress,
  type SatReadinessTone,
} from "@/lib/satWeeklyProgress";
import { usePreferences } from "@/stores/preferences";
import { ROUTES } from "@/app/navigation";

const READINESS_TONE: Record<SatReadinessTone, "warning" | "success" | "accent" | "muted"> = {
  crunch: "warning",
  strong: "success",
  "on-track": "accent",
  building: "muted",
};

/** Weekly SAT review: readiness signal, effort, diagnostic trend, and a drill. */
export function SatWeeklyProgressCard() {
  const satTestDate = usePreferences((s) => s.satTestDate);
  const p = getSatWeeklyProgress();
  const [weakest, setWeakest] = useState<SatSkillMasteryRow | null>(null);

  useEffect(() => {
    loadAllSubjects().then((subjects) => {
      const sat = subjects.find((s) => s.id === "sat-prep");
      if (!sat) return;
      setWeakest(getSatSkillMastery([sat]).find((r) => r.hasSignal) ?? null);
    });
  }, []);

  if (!p.hasAnySignal) return null;
  const readiness = getSatReadinessSignal(satTestDate);

  return (
    <Section eyebrow="SAT this week" title="Weekly review" divider>
      <Card variant="default" density="normal" className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone={READINESS_TONE[readiness.tone]} size="sm" mono>
            {readiness.label}
          </Tag>
          <span className="text-sm text-[var(--text-muted)]">{readiness.detail}</span>
        </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Active days" value={`${p.activeDays}/7`} size="sm" />
        <Stat label="SAT lessons" value={p.satLessons} size="sm" />
        <Stat label="Daily 5s" value={p.dailyQuizzes} size="sm" />
        <Stat label="Mistakes" value={p.mistakesLogged} size="sm" />
        <Stat label="Practice" value={p.practiceSessions} size="sm" />
      </div>

      {p.baselinePct != null ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--rule)] pt-3 text-sm">
          <span className="text-[var(--text-muted)]">Diagnostic:</span>
          <Tag tone="muted" size="sm" mono>
            baseline {p.baselinePct}%
          </Tag>
          {p.retestPct != null ? (
            <>
              <ArrowRight size={12} className="text-[var(--text-subtle)]" aria-hidden />
              <Tag tone="muted" size="sm" mono>
                retest {p.retestPct}%
              </Tag>
              {p.deltaPct != null && p.deltaPct !== 0 ? (
                <Tag tone={p.deltaPct > 0 ? "success" : "danger"} size="sm" mono className="gap-1">
                  {p.deltaPct > 0 ? (
                    <TrendingUp size={11} aria-hidden />
                  ) : (
                    <TrendingDown size={11} aria-hidden />
                  )}
                  {p.deltaPct > 0 ? "+" : ""}
                  {p.deltaPct} pts
                </Tag>
              ) : null}
            </>
          ) : (
            <span className="text-xs text-[var(--text-subtle)]">Retake Draft 3 for a fresh read.</span>
          )}
        </div>
      ) : null}

      {weakest ? (
        <div className="hidden border-t border-[var(--rule)] pt-3 md:block">
          <p className="eyebrow-mono mb-2">Weakest skill this week</p>
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="warning" size="sm">
              {weakest.label}
            </Tag>
            {weakest.diagnostic ? (
              <span className="font-mono text-[11px] text-[var(--text-subtle)]">
                diag {weakest.diagnostic.pct}%
              </span>
            ) : null}
            <div className="ml-auto flex flex-wrap gap-2">
              <Link to={`${ROUTES.satDrill}?skill=${weakest.skillId}`}>
                <Button size="sm">
                  <Target size={14} aria-hidden />
                  Drill weakest
                </Button>
              </Link>
              <Link to={ROUTES.satDailyQuiz}>
                <Button variant="secondary" size="sm">
                  <Zap size={14} aria-hidden />
                  Daily 5
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {p.topCategories.length > 0 ? (
        <div className="border-t border-[var(--rule)] pt-3">
          <p className="eyebrow-mono mb-2">Top miss areas</p>
          <div className="flex flex-wrap gap-1.5">
            {p.topCategories.map((cat) => (
              <Tag key={cat.category} tone="warning" size="sm">
                {cat.category} ({cat.count})
              </Tag>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to={ROUTES.satDrill}>
              <Button size="sm">
                <Target size={14} aria-hidden />
                Drill your top miss
              </Button>
            </Link>
            <Link to={ROUTES.satSkills}>
              <Button variant="secondary" size="sm">
                Skill breakdown
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
      </Card>
    </Section>
  );
}
