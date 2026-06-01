import {
  parseSatPretestDraft2Import,
  type SatPretestQuestion,
} from "@/lib/satPretest";

export const SAT_PRETEST_DRAFT2_POOL_KEY = "learnv2_sat_pretest_draft2_pool_v1";

export function loadImportedDraft2Questions(
  storage: Storage = localStorage,
): SatPretestQuestion[] {
  try {
    const raw = storage.getItem(SAT_PRETEST_DRAFT2_POOL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    const result = parseSatPretestDraft2Import({ questions: parsed });
    return result.ok ? result.questions : [];
  } catch {
    return [];
  }
}

export function saveImportedDraft2Questions(
  questions: SatPretestQuestion[],
  storage: Storage = localStorage,
): void {
  storage.setItem(SAT_PRETEST_DRAFT2_POOL_KEY, JSON.stringify(questions));
}

export function clearImportedDraft2Questions(storage: Storage = localStorage): void {
  storage.removeItem(SAT_PRETEST_DRAFT2_POOL_KEY);
}
