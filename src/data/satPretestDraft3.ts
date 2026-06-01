import type { SatPretestQuestion } from "@/lib/satPretest";
import { satPretestDraft3ExtraQuestions } from "@/data/satPretestDraft3Extra";
import { SAT_PRETEST_DRAFT_3_ID } from "@/data/satPretestDrafts";

export { SAT_PRETEST_DRAFT_3_ID };

/** Draft 3 retest — 24 unique items (same skill coverage as Draft 1, new stems). */
export const satPretestDraft3Questions: SatPretestQuestion[] = satPretestDraft3ExtraQuestions;
