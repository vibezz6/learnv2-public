import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, GraduationCap, Moon } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { getSatDailyStudyCommand, shouldShowSatTodayCard } from "@/lib/satDailyStudy";
import { getTopMistakeCategories } from "@/lib/satMistakeTriage";
import { getReadinessNudge, getTodayReadinessEntry } from "@/lib/satReadiness";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";

interface Props {
  subjects: Subject[];
  /** Single primary CTA when used inside Today's focus (no competing primary card). */
  compact?: boolean;
}

export function SatTodayCard({ subjects, compact = false }: Props) {
  const placementGoal = usePreferences((s) => s.placementGoal);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const study = getSatDailyStudyCommand({ subjects, getNodeStatus });
  const topMistakes = getTopMistakeCategories(3);
  const readinessNudge = getReadinessNudge();
  const todayReadiness = getTodayReadinessEntry();

  if (!shouldShowSatTodayCard(placementGoal, subjects, getNodeStatus)) return null;

  const showDiagnosticLink =
    study.kind === "start_draft1" ||
    study.kind === "resume_draft1" ||
    study.kind === "resume_draft2" ||
    !!study.diagnosticNote;

  return (
    <Card variant="primary" className="min-w-0 p-5">
      <div className="flex items-start gap-3">
        <GraduationCap size={18} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-2)]">
              SAT today
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--text-heading)]">{study.headline}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{study.detail}</p>
            {readinessNudge ? (
              <p className="mt-2 flex items-start gap-2 text-sm text-[var(--text-heading)]">
                <Moon size={14} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
                {readinessNudge}
              </p>
            ) : todayReadiness ? (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Readiness logged for today ({todayReadiness.rating}/5).
              </p>
            ) : null}
            {study.diagnosticNote ? (
              <p className="mt-2 text-xs text-[var(--text-muted)]">{study.diagnosticNote}</p>
            ) : null}
            {topMistakes.length > 0 ? (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Top miss {topMistakes.length === 1 ? "category" : "categories"}:{" "}
                {topMistakes.map((row) => `${row.category} (${row.count})`).join(", ")}
              </p>
            ) : (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                After Bluebook or Khan, log misses so retarget drills stay focused.
              </p>
            )}
          </div>
          {compact ? (
            <div className="space-y-3">
              <Link to={study.href} className="block">
                <Button className="min-h-11 w-full touch-manipulation">
                  {study.buttonLabel}
                  <ArrowRight size={14} />
                </Button>
              </Link>
              <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <Link to="/subjects/sat-prep#mistakes" className="text-[var(--accent-2)] hover:underline">
                  Mistake log
                </Link>
                {showDiagnosticLink ? (
                  <Link
                    to="/subjects/sat-prep#diagnostic"
                    className="text-[var(--accent-2)] hover:underline"
                  >
                    Optional diagnostic
                  </Link>
                ) : (
                  <Link
                    to="/subjects/sat-prep#official"
                    className="text-[var(--accent-2)] hover:underline"
                  >
                    Official practice
                  </Link>
                )}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link to={study.href} className="min-w-0 sm:flex-1">
                <Button className="min-h-11 w-full touch-manipulation">
                  {study.buttonLabel}
                  <ArrowRight size={14} />
                </Button>
              </Link>
              <Link to="/subjects/sat-prep#mistakes" className="min-w-0 sm:flex-1">
                <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
                  <ClipboardList size={14} />
                  Mistake log
                </Button>
              </Link>
              {showDiagnosticLink ? (
                <Link to="/subjects/sat-prep#diagnostic" className="min-w-0 sm:flex-1">
                  <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
                    Optional diagnostic
                  </Button>
                </Link>
              ) : (
                <Link to="/subjects/sat-prep#official" className="min-w-0 sm:flex-1">
                  <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
                    Official practice
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
