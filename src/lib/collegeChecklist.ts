import { notifyAdmissionsUpdated } from "./admissionsSync";
import { readJson, writeJson } from "@/lib/storageJson";

export const COLLEGE_CHECKLIST_KEY = "learnv2_college_checklist_v1";

export interface ChecklistItemDef {
  id: string;
  category: string;
  title: string;
  hint?: string;
  link?: string;
  linkLabel?: string;
}

export interface CustomChecklistItem {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
  createdAt: number;
}

export interface CollegeChecklistState {
  completed: Record<string, boolean>;
  customItems: CustomChecklistItem[];
}

export const DEFAULT_COLLEGE_CHECKLIST: ChecklistItemDef[] = [
  {
    id: "counselor-intro",
    category: "School",
    title: "Talk with your school counselor",
    hint: "CC transfer options, transcript requests, and realistic deadlines.",
  },
  {
    id: "college-list",
    category: "Research",
    title: "Research at least 3 colleges",
    hint: "Safety, match, and reach — note cost and aid.",
    link: "https://bigfuture.collegeboard.org/college-search",
    linkLabel: "BigFuture search",
  },
  {
    id: "fafsa-account",
    category: "Financial aid",
    title: "Create your StudentAid.gov account",
    link: "https://studentaid.gov/",
    linkLabel: "StudentAid.gov",
  },
  {
    id: "fafsa-submit",
    category: "Financial aid",
    title: "Submit FAFSA when the window opens",
    hint: "Use your parent's tax info if required — counselor can help.",
    link: "https://studentaid.gov/h/apply-for-aid/fafsa",
    linkLabel: "FAFSA overview",
  },
  {
    id: "sat-register",
    category: "SAT",
    title: "Register for your target SAT date",
    link: "https://satsuite.collegeboard.org/sat/registration",
    linkLabel: "College Board registration",
  },
  {
    id: "sat-prep-rhythm",
    category: "SAT",
    title: "Follow your August SAT track in Learn",
    hint: "Daily drills + Bluebook timed practice — log misses on SAT Prep.",
  },
  {
    id: "sat-send-scores",
    category: "SAT",
    title: "Send SAT scores to colleges on your list",
    link: "https://satsuite.collegeboard.org/sat/scores/send-scores",
    linkLabel: "Send scores",
  },
  {
    id: "essay-outline",
    category: "Applications",
    title: "Outline your personal statement (bullet draft)",
    hint: "One story that shows growth — not a résumé list.",
  },
  {
    id: "essay-draft",
    category: "Applications",
    title: "First full draft of main essay",
    hint: "Ask a teacher or counselor for one round of feedback.",
  },
  {
    id: "transcript-export",
    category: "Proof",
    title: "Export your Learn study transcript",
    hint: "Stats → Copy transcript — shows consistency for applications.",
  },
];

function emptyState(): CollegeChecklistState {
  return { completed: {}, customItems: [] };
}

function isValidState(value: unknown): value is CollegeChecklistState {
  if (!value || typeof value !== "object") return false;
  const o = value as CollegeChecklistState;
  return typeof o.completed === "object" && o.completed !== null && Array.isArray(o.customItems);
}

export function loadCollegeChecklist(storage: Storage = localStorage): CollegeChecklistState {
  const parsed = readJson(storage, COLLEGE_CHECKLIST_KEY, emptyState(), isValidState);
  return {
    completed: { ...parsed.completed },
    customItems: parsed.customItems.filter(
      (c) => typeof c.id === "string" && typeof c.title === "string",
    ),
  };
}

export function saveCollegeChecklist(
  state: CollegeChecklistState,
  storage: Storage = localStorage,
): void {
  if (writeJson(storage, COLLEGE_CHECKLIST_KEY, state)) {
    notifyAdmissionsUpdated();
  }
}

export function toggleBuiltInItem(
  state: CollegeChecklistState,
  id: string,
  completed: boolean,
): CollegeChecklistState {
  return {
    ...state,
    completed: { ...state.completed, [id]: completed },
  };
}

export function addCustomItem(
  state: CollegeChecklistState,
  title: string,
  dueDate?: string,
): CollegeChecklistState {
  const trimmed = title.trim();
  if (!trimmed) return state;
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `custom-${Date.now()}`;
  return {
    ...state,
    customItems: [
      ...state.customItems,
      {
        id,
        title: trimmed,
        dueDate: dueDate?.trim() || undefined,
        completed: false,
        createdAt: Date.now(),
      },
    ],
  };
}

export function toggleCustomItem(
  state: CollegeChecklistState,
  id: string,
  completed: boolean,
): CollegeChecklistState {
  return {
    ...state,
    customItems: state.customItems.map((c) => (c.id === id ? { ...c, completed } : c)),
  };
}

export function removeCustomItem(state: CollegeChecklistState, id: string): CollegeChecklistState {
  return {
    ...state,
    customItems: state.customItems.filter((c) => c.id !== id),
  };
}

export function getChecklistProgress(state: CollegeChecklistState): {
  done: number;
  total: number;
  pct: number;
} {
  const builtInDone = DEFAULT_COLLEGE_CHECKLIST.filter((i) => state.completed[i.id]).length;
  const customDone = state.customItems.filter((c) => c.completed).length;
  const done = builtInDone + customDone;
  const total = DEFAULT_COLLEGE_CHECKLIST.length + state.customItems.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

export function groupBuiltInByCategory(
  items: ChecklistItemDef[] = DEFAULT_COLLEGE_CHECKLIST,
): Map<string, ChecklistItemDef[]> {
  const map = new Map<string, ChecklistItemDef[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}
