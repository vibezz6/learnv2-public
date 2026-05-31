import type { SatPretestQuestion } from "@/lib/satPretest";
import { satPretestDraft1Questions } from "@/data/satPretestDraft1";
import { SAT_PRETEST_DRAFT_3_ID } from "@/data/satPretestDrafts";

/** Draft 3 retest — same skill coverage as Draft 1 with unique ids for a clean second pass. */
export const satPretestDraft3Questions: SatPretestQuestion[] = satPretestDraft1Questions.map(
  (question) => ({
    ...question,
    id: question.id.replace(/^draft1-/, "draft3-"),
    draftId: SAT_PRETEST_DRAFT_3_ID,
  }),
);
