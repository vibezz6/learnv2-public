import { Link } from "react-router-dom";
import { ArrowRight, Target, TrendingDown, TrendingUp } from "lucide-react";
import { Button, Card, Section, Stat, Tag } from "@/components/ui";
import { getSatWeeklyProgress } from "@/lib/satWeeklyProgress";
import { ROUTES } from "@/app/navigation";

/** Weekly SAT review: effort signals, diagnostic trend, and a one-click drill. */
export function SatWeeklyProgressCard() {
  const p = getSatWeeklyProgress();
  if (!p.hasAnySignal) return null;

  return (
    <Section eyebrow="SAT this week" title="Weekly review" divider>
      <Card variant="default" density="normal" className="min-w-0 space-y-4">
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
          <Link to={ROUTES.satDrill} className="mt-3 inline-block">
            <Button size="sm">
              <Target size={14} aria-hidden />
              Drill your top miss
            </Button>
          </Link>
        </div>
      ) : null}
      </Card>
    </Section>
  );
}
