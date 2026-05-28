export type StorageDomain =
  | "core"
  | "activity"
  | "sat"
  | "college"
  | "ui"
  | "legacy"
  | "secret";

export interface StorageKeyEntry {
  key: string;
  label: string;
  domain: StorageDomain;
  backup: boolean;
  reset: boolean;
  legacyNamespace?: boolean;
  dynamicPrefix?: boolean;
  note?: string;
}

export const V1_STORAGE_KEY = "learnapp_progress_v1";
export const V2_STORAGE_KEY = "learnv2_progress";
export const V2_PREFERENCES_KEY = "learnv2_preferences";
export const V2_BOOKMARKS_KEY = "learnv2_bookmarks";
export const V2_ACHIEVEMENTS_KEY = "learnv2_achievements_v1";
export const V2_NOTE_SESSIONS_KEY = "learnapp_note_sessions_v2";
export const QUIZ_PROGRESS_PREFIX = "learnapp_quiz_progress_v1_";

export const BACKUP_STORAGE_PREFIXES = ["learnv2_", "learnapp_"] as const;
export const BACKUP_EXCLUDED_OPENROUTER_KEYS = [
  "learnapp_openrouter_key",
  "learnv2_openrouter_key",
  "learnapp_openrouter_model",
  "learnv2_openrouter_model",
] as const;

export const STORAGE_KEYS: StorageKeyEntry[] = [
  { key: V2_STORAGE_KEY, label: "Progress", domain: "core", backup: true, reset: true },
  { key: V2_PREFERENCES_KEY, label: "Preferences", domain: "core", backup: true, reset: true },
  { key: V2_BOOKMARKS_KEY, label: "Bookmarks", domain: "core", backup: true, reset: true },
  { key: V2_ACHIEVEMENTS_KEY, label: "Achievements", domain: "core", backup: true, reset: true },
  {
    key: V2_NOTE_SESSIONS_KEY,
    label: "Office hours",
    domain: "core",
    backup: true,
    reset: true,
    legacyNamespace: true,
    note: "Active v2 notes key kept in the learnapp namespace for migration continuity.",
  },
  { key: "learnv2_activity_v1", label: "Study activity", domain: "activity", backup: true, reset: true },
  { key: "learnv2_activity_milestones_v1", label: "Activity milestones", domain: "activity", backup: true, reset: true },
  { key: "learnv2_study_intent_v1", label: "Study intent", domain: "activity", backup: true, reset: true },
  { key: "learnv2_sat_pretest_v1", label: "SAT diagnostics", domain: "sat", backup: true, reset: true },
  { key: "learnv2_sat_pretest_draft2_pool_v1", label: "SAT Draft 2 pool", domain: "sat", backup: true, reset: true },
  { key: "learnv2_sat_practice_v1", label: "SAT practice log", domain: "sat", backup: true, reset: true },
  { key: "learnv2_sat_mistakes_v1", label: "SAT mistake log", domain: "sat", backup: true, reset: true },
  { key: "learnv2_sat_lesson_plan_v1", label: "SAT lesson plan", domain: "sat", backup: true, reset: true },
  { key: "learnv2_sat_readiness_v1", label: "SAT readiness", domain: "sat", backup: true, reset: true },
  { key: "learnv2_college_checklist_v1", label: "College checklist", domain: "college", backup: true, reset: true },
  { key: "learnv2_essay_tracker_v1", label: "Essays", domain: "college", backup: true, reset: true },
  { key: "learnv2_nudge_snooze_v1", label: "Nudge snoozes", domain: "college", backup: true, reset: true },
  {
    key: QUIZ_PROGRESS_PREFIX,
    label: "Quiz progress",
    domain: "ui",
    backup: true,
    reset: true,
    dynamicPrefix: true,
    legacyNamespace: true,
  },
  {
    key: "learnv2_section_collapsed_",
    label: "Section UI state",
    domain: "ui",
    backup: true,
    reset: true,
    dynamicPrefix: true,
  },
  { key: V1_STORAGE_KEY, label: "Learn-v1 progress", domain: "legacy", backup: true, reset: true, legacyNamespace: true },
  { key: "learnapp_notes_v1", label: "Learn-v1 notes", domain: "legacy", backup: true, reset: true, legacyNamespace: true },
  { key: "learnapp_takeaways_v1", label: "Learn-v1 takeaways", domain: "legacy", backup: true, reset: true, legacyNamespace: true },
  { key: "learnapp_bookmarks_v1", label: "Learn-v1 resource bookmarks", domain: "legacy", backup: true, reset: true, legacyNamespace: true },
  { key: "learnapp_lesson_bookmarks_v1", label: "Learn-v1 lesson bookmarks", domain: "legacy", backup: true, reset: true, legacyNamespace: true },
  { key: "learnapp_theme_v1", label: "Learn-v1 theme", domain: "legacy", backup: true, reset: true, legacyNamespace: true },
  { key: "learnapp_achievements_v1", label: "Learn-v1 achievements", domain: "legacy", backup: true, reset: true, legacyNamespace: true },
  { key: "learnapp_openrouter_key", label: "OpenRouter key", domain: "secret", backup: false, reset: true, legacyNamespace: true },
  { key: "learnv2_openrouter_key", label: "OpenRouter key", domain: "secret", backup: false, reset: true },
  { key: "learnapp_openrouter_model", label: "OpenRouter model", domain: "secret", backup: false, reset: true, legacyNamespace: true },
  { key: "learnv2_openrouter_model", label: "OpenRouter model", domain: "secret", backup: false, reset: true },
];

export function isOpenRouterStorageKey(key: string): boolean {
  return key.endsWith("_openrouter_key") || key.endsWith("_openrouter_model");
}

export function isKnownStorageKey(key: string): boolean {
  return STORAGE_KEYS.some((entry) =>
    entry.dynamicPrefix ? key.startsWith(entry.key) : key === entry.key,
  );
}

export function isBackupKeyAllowed(key: string): boolean {
  return BACKUP_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix)) && !isOpenRouterStorageKey(key);
}

export function isManagedStorageKey(key: string): boolean {
  return key.startsWith("learnv2_") || key.startsWith("learnapp_");
}
