export const SAT_PRETEST_DRAFT_1_ID = "draft-1";
export const SAT_PRETEST_DRAFT_2_ID = "draft-2";
export const SAT_PRETEST_DRAFT_3_ID = "draft-3";

export type SatPretestDraftKind = "baseline" | "gaps" | "retest";

export interface SatPretestDraftConfig {
  id: string;
  label: string;
  shortLabel: string;
  kind: SatPretestDraftKind;
  requiresCompletedDraftId?: string;
}

export const SAT_PRETEST_DRAFT_CONFIGS: SatPretestDraftConfig[] = [
  {
    id: SAT_PRETEST_DRAFT_1_ID,
    label: "Draft 1",
    shortLabel: "Diagnostic",
    kind: "baseline",
  },
  {
    id: SAT_PRETEST_DRAFT_2_ID,
    label: "Draft 2",
    shortLabel: "Gap follow-up",
    kind: "gaps",
    requiresCompletedDraftId: SAT_PRETEST_DRAFT_1_ID,
  },
  {
    id: SAT_PRETEST_DRAFT_3_ID,
    label: "Draft 3",
    shortLabel: "Retest",
    kind: "retest",
    requiresCompletedDraftId: SAT_PRETEST_DRAFT_1_ID,
  },
];

export function getSatPretestDraftConfig(draftId: string): SatPretestDraftConfig | undefined {
  return SAT_PRETEST_DRAFT_CONFIGS.find((draft) => draft.id === draftId);
}

export function getSatPretestDraftLabel(draftId: string): string {
  return getSatPretestDraftConfig(draftId)?.label ?? draftId;
}

export function isSatPretestFollowUpDraft(draftId: string): boolean {
  const kind = getSatPretestDraftConfig(draftId)?.kind;
  return kind === "gaps" || kind === "retest";
}
