import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, ConfirmDialog } from "@/components/ui";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { SAT_PRETEST_DRAFT_2_ID } from "@/data/satPretestDraft2";
import { SAT_PRETEST_DRAFT_3_ID } from "@/data/satPretestDrafts";
import { clearSatLessonPlan, loadSatLessonPlan } from "@/lib/satLessonPlan";
import {
  clearAllSatPretestData,
  getLatestCompletedSatPretestAttempt,
  listSatPretestAttempts,
} from "@/lib/satPretest";

interface Props {
  onMessage: (text: string) => void;
}

export function SatPretestSettingsCard({ onMessage }: Props) {
  const [revision, setRevision] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);

  const summary = useMemo(() => {
    void revision;
    const attempts = listSatPretestAttempts();
    const draft1 = attempts.filter((attempt) => attempt.draftId === SAT_PRETEST_DRAFT_1_ID);
    const draft2 = attempts.filter((attempt) => attempt.draftId === SAT_PRETEST_DRAFT_2_ID);
    const draft3 = attempts.filter((attempt) => attempt.draftId === SAT_PRETEST_DRAFT_3_ID);
    const draft1Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID);
    const lessonPlan = loadSatLessonPlan();
    return {
      hasData: attempts.length > 0 || !!lessonPlan,
      draft1Count: draft1.length,
      draft2Count: draft2.length,
      draft3Count: draft3.length,
      draft1Score: draft1Done?.scoreSummary
        ? `${draft1Done.scoreSummary.correctAnswers}/${draft1Done.scoreSummary.totalQuestions} (${draft1Done.scoreSummary.pct}%)`
        : null,
      lessonPlanCount: lessonPlan?.entries.length ?? 0,
    };
  }, [revision]);

  const handleResetConfirm = () => {
    clearAllSatPretestData();
    clearSatLessonPlan();
    setResetOpen(false);
    setRevision((r) => r + 1);
    onMessage("SAT diagnostic attempts and imported lesson plan cleared.");
  };

  const handleClearLessonPlan = () => {
    clearSatLessonPlan();
    setRevision((r) => r + 1);
    onMessage("Imported SAT lesson plan cleared.");
  };

  return (
    <Card id="sat-pretest-backup" className="min-w-0 scroll-mt-24 space-y-4">
      <div>
        <h2 className="break-words font-semibold text-[var(--text-heading)]">SAT diagnostic</h2>
        <p className="mt-1 break-words text-sm text-[var(--text-muted)]">
          Draft 1–3 attempts, rationales, and exports live in localStorage on this device.
        </p>
      </div>

      {summary.hasData ? (
        <ul className="space-y-1 text-sm text-[var(--text-muted)]">
          <li>
            Draft 1 attempts:{" "}
            <span className="font-medium text-[var(--text-heading)]">{summary.draft1Count}</span>
            {summary.draft1Score ? (
              <>
                {" "}
                · latest score{" "}
                <span className="font-medium text-[var(--text-heading)]">{summary.draft1Score}</span>
              </>
            ) : null}
          </li>
          <li>
            Draft 2 attempts:{" "}
            <span className="font-medium text-[var(--text-heading)]">{summary.draft2Count}</span>
          </li>
          <li>
            Draft 3 attempts:{" "}
            <span className="font-medium text-[var(--text-heading)]">{summary.draft3Count}</span>
          </li>
          {summary.lessonPlanCount > 0 ? (
            <li>
              Cursor lesson plan:{" "}
              <span className="font-medium text-[var(--text-heading)]">
                {summary.lessonPlanCount} items
              </span>
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No diagnostic attempts saved yet.</p>
      )}

      <div className="flex flex-col gap-2 min-[481px]:flex-row min-[481px]:flex-wrap">
        <Link to="/sat/pretest" className="min-w-0 min-[481px]:flex-1">
          <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
            Open SAT diagnostic
          </Button>
        </Link>
        <Button
          variant="secondary"
          className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
          onClick={handleClearLessonPlan}
          disabled={summary.lessonPlanCount === 0}
        >
          Clear lesson plan
        </Button>
        <Button
          variant="secondary"
          className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
          onClick={() => setResetOpen(true)}
          disabled={!summary.hasData}
        >
          Clear all SAT diagnostic data
        </Button>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Clear SAT diagnostic data?"
        message="Removes Draft 1–3 attempts, responses, scores, and the imported lesson plan on this device. Study progress and the mistake log are not affected."
        confirmLabel="Clear"
        danger
        onConfirm={handleResetConfirm}
        onCancel={() => setResetOpen(false)}
      />
    </Card>
  );
}
