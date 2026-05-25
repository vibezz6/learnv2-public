import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, GraduationCap, Target } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { getSatNextLesson } from "@/lib/campusHome";
import { getSatRecommendedLessons } from "@/lib/satRecommendedLessons";
import {
  getActiveSatPretestAttempt,
  getLatestCompletedSatPretestAttempt,
} from "@/lib/satPretest";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";

interface Props {
  subjects: Subject[];
}

export function SatTodayCard({ subjects }: Props) {
  const placementGoal = usePreferences((s) => s.placementGoal);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const satNext = getSatNextLesson(subjects, getNodeStatus);
  const draft1Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID);
  const draft1Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID);
  const recommended = getSatRecommendedLessons(subjects, getNodeStatus);
  const topRecommended = recommended.lessons[0];

  const showSatFocus = placementGoal === "sat" || !!satNext || !!draft1Active || !!draft1Done;
  if (!showSatFocus) return null;

  let pretestLine = "Take Draft 1 to capture how you think before feedback.";
  if (draft1Active) {
    pretestLine = "Draft 1 in progress — resume your diagnostic.";
  } else if (draft1Done?.scoreSummary) {
    pretestLine = `Draft 1 done: ${draft1Done.scoreSummary.correctAnswers}/${draft1Done.scoreSummary.totalQuestions} (${draft1Done.scoreSummary.pct}%). Start Draft 2 or export for Cursor.`;
  }

  return (
    <Card variant="primary" className="min-w-0 p-5">
      <div className="flex items-start gap-3">
        <Target size={18} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-2)]">
              SAT today
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{pretestLine}</p>
            {satNext && satNext.status !== "coming_soon" ? (
              <p className="mt-2 text-sm text-[var(--text-heading)]">
                Next lesson: <span className="font-medium">{satNext.title}</span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link to="/sat/pretest" className="min-w-0 sm:flex-1">
              <Button className="min-h-11 w-full touch-manipulation">
                {draft1Active ? "Resume Draft 1" : draft1Done ? "SAT diagnostic" : "Start Draft 1"}
                <ArrowRight size={14} />
              </Button>
            </Link>
            <Link to="/subjects/sat-prep#mistakes" className="min-w-0 sm:flex-1">
              <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
                <ClipboardList size={14} />
                Mistake log
              </Button>
            </Link>
            {topRecommended ? (
              <Link
                to={`/subjects/${topRecommended.subjectId}/${topRecommended.nodeId}`}
                className="min-w-0 sm:flex-1"
              >
                <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
                  <GraduationCap size={14} />
                  {recommended.source === "pretest_gaps" ? "Gap lesson" : "SAT lesson"}
                </Button>
              </Link>
            ) : (
              <Link to="/subjects/sat-prep#recommended" className="min-w-0 sm:flex-1">
                <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
                  <GraduationCap size={14} />
                  SAT picks
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
