export const STUDY_INTENT_STORAGE_KEY = "learnv2_study_intent_v1";

export type StudyIntentFocus = "default" | "sat" | "college" | "catch_up";

export interface StudyIntentState {
  focus: StudyIntentFocus;
  setAt: number;
}

function todayUtc(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function loadStudyIntent(storage: Storage = localStorage): StudyIntentState {
  try {
    const raw = storage.getItem(STUDY_INTENT_STORAGE_KEY);
    if (!raw) return { focus: "default", setAt: 0 };
    const parsed = JSON.parse(raw) as Partial<StudyIntentState & { date?: string }>;
    if (parsed.date && parsed.date !== todayUtc()) {
      return { focus: "default", setAt: 0 };
    }
    const focus = parsed.focus;
    if (focus === "sat" || focus === "college" || focus === "catch_up" || focus === "default") {
      return { focus, setAt: typeof parsed.setAt === "number" ? parsed.setAt : Date.now() };
    }
  } catch {
    // ignore
  }
  return { focus: "default", setAt: 0 };
}

export function setStudyIntent(focus: StudyIntentFocus, storage: Storage = localStorage): void {
  const state: StudyIntentState & { date: string } = {
    focus,
    setAt: Date.now(),
    date: todayUtc(),
  };
  try {
    storage.setItem(STUDY_INTENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota
  }
}

export const STUDY_INTENT_LABELS: Record<StudyIntentFocus, string> = {
  default: "Balanced",
  sat: "SAT focus",
  college: "College deadlines",
  catch_up: "Catch up",
};

export function getStudyIntentSubtitle(focus: StudyIntentFocus): string | null {
  switch (focus) {
    case "sat":
      return "Today’s plan favors SAT prep and mistake retargeting.";
    case "college":
      return "Today’s plan favors checklist and essay deadlines.";
    case "catch_up":
      return "Today’s plan favors finishing in-progress lessons.";
    default:
      return null;
  }
}
