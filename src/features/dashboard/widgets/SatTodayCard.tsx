import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, GraduationCap, Moon, Target } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { SAT_PRETEST_DRAFT_2_ID } from "@/data/satPretestDraft2";
import { SAT_PRETEST_DRAFT_3_ID } from "@/data/satPretestDrafts";
import { getSatNextLesson } from "@/lib/campusHome";
import { getSatRecommendedLessons } from "@/lib/satRecommendedLessons";
import { listMistakes } from "@/lib/satMistakeLog";
import { getReadinessNudge, getTodayReadinessEntry } from "@/lib/satReadiness";
import {
  getActiveSatPretestAttempt,
  getLatestCompletedSatPretestAttempt,
} from "@/lib/satPretest";
import { hasOpenRouterApiKey } from "@/services/llmReview";
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
  const draft2Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_2_ID);
  const draft2Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_2_ID);
  const draft3Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_3_ID);
  const recommended = getSatRecommendedLessons(subjects, getNodeStatus);
  const topRecommended = recommended.lessons[0];
  const mistakeCount = listMistakes().length;
  const readinessNudge = getReadinessNudge();
  const todayReadiness = getTodayReadinessEntry();
  const aiReady = hasOpenRouterApiKey();

  const showSatFocus =
    placementGoal === "sat" || !!satNext || !!draft1Active || !!draft1Done || !!draft2Active;
  if (!showSatFocus) return null;

  let pretestLine = "Take Draft 1 to capture how you think before feedback.";
  if (draft1Active) {
    pretestLine = "Draft 1 in progress — resume your diagnostic.";
  } else if (draft2Active) {
    pretestLine = "Draft 2 in progress — resume gap follow-up.";
  } else if (draft1Done?.scoreSummary) {
    const score = `${draft1Done.scoreSummary.correctAnswers}/${draft1Done.scoreSummary.totalQuestions} (${draft1Done.scoreSummary.pct}%)`;
    if (!draft2Done) {
      pretestLine = `Draft 1: ${score}. Start Draft 2 or export for Cursor.`;
    } else if (draft2Done?.scoreSummary) {
      pretestLine = `Draft 1 ${score} · Draft 2 ${draft2Done.scoreSummary.pct}%`;
      if (draft3Done?.scoreSummary) {
        pretestLine += ` · Draft 3 retest ${draft3Done.scoreSummary.pct}%`;
      }
    } else {
      pretestLine = `Draft 1: ${score}.`;
    }
  }

  return (
    <Card variant="primary" className="min-w-0 p-5">
      <div className="flex items-start gap-3">
        <Target size={18} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-2)]">
              SAT week
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{pretestLine}</p>
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
            {satNext && satNext.status !== "coming_soon" ? (
              <p className="mt-2 text-sm text-[var(--text-heading)]">
                Track lesson: <span className="font-medium">{satNext.title}</span>
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {mistakeCount > 0
                ? `${mistakeCount} mistake-log ${mistakeCount === 1 ? "entry" : "entries"}`
                : "No mistake-log entries yet"}
              {aiReady ? " · OpenRouter ready for rationale review" : " · Add OpenRouter in Settings for AI review"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link to="/sat/pretest" className="min-w-0 sm:flex-1">
              <Button className="min-h-11 w-full touch-manipulation">
                {draft1Active
                  ? "Resume Draft 1"
                  : draft2Active
                    ? "Resume Draft 2"
                    : draft1Done
                      ? "SAT diagnostic"
                      : "Start Draft 1"}
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
