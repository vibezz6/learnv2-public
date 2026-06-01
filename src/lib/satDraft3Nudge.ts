import { ROUTES } from "@/app/navigation";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { SAT_PRETEST_DRAFT_2_ID } from "@/data/satPretestDraft2";
import { SAT_PRETEST_DRAFT_3_ID } from "@/data/satPretestDrafts";
import { isNudgeSnoozed, loadNudgeSnooze } from "@/lib/nudgeSnooze";
import {
  getActiveSatPretestAttempt,
  getLatestCompletedSatPretestAttempt,
} from "@/lib/satPretest";

export const DRAFT_3_RETEST_HUB_SNOOZE_ID = "draft-3-retest-hub";

export interface Draft3RetestNudge {
  detail: string;
  href: string;
  buttonLabel: string;
  resume: boolean;
}

/** Summary line when Draft 3 retest is complete (score vs Draft 1 baseline). */
export function formatDraft3HubSummary(storage: Storage = localStorage): string | null {
  const draft1 = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  const draft3 = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_3_ID, storage);
  if (!draft1?.scoreSummary || !draft3?.scoreSummary) return null;

  const baseline = draft1.scoreSummary.correctAnswers;
  const retest = draft3.scoreSummary.correctAnswers;
  const total = draft3.scoreSummary.totalQuestions;
  const delta = retest - baseline;
  const deltaLabel =
    delta === 0 ? "same as baseline" : delta > 0 ? `+${delta} vs baseline` : `${delta} vs baseline`;
  return `Draft 3 retest: ${retest}/${total} (${deltaLabel})`;
}

/** SAT hub nudge for Draft 3 retest — not suppressed when SAT test date has passed. */
export function getDraft3RetestNudge(
  storage: Storage = localStorage,
  now = Date.now(),
): Draft3RetestNudge | null {
  const snooze = loadNudgeSnooze(storage);
  if (isNudgeSnoozed(DRAFT_3_RETEST_HUB_SNOOZE_ID, snooze, now)) return null;

  const draft1Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  if (!draft1Done) return null;

  const draft3Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_3_ID, storage);
  if (draft3Done) return null;

  const draft1Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  const draft2Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_2_ID, storage);
  if (draft1Active || draft2Active) return null;

  const href = `${ROUTES.satPretest}?draft=${SAT_PRETEST_DRAFT_3_ID}`;
  const draft3Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_3_ID, storage);

  if (draft3Active) {
    return {
      detail: "Draft 3 retest is in progress. Finish when you have 15–20 minutes.",
      href,
      buttonLabel: "Resume Draft 3 retest",
      resume: true,
    };
  }

  return {
    detail:
      "Draft 3 is a full retest (~20 min) with fresh questions — compare to your baseline.",
    href,
    buttonLabel: "Start Draft 3 retest",
    resume: false,
  };
}
