import type { StudyActivityType } from "@/lib/studyActivity";
import { getWeekActivityMix, loadStudyActivities } from "@/lib/studyActivity";

export const ACTIVITY_MILESTONES_STORAGE_KEY = "learnv2_activity_milestones_v1";
export const ACTIVITY_MILESTONE_EVENT = "learnv2-activity-milestone";

export interface ActivityMilestone {
  id: string;
  message: string;
}

type MilestoneRule = {
  id: string;
  message: string;
  isMet: (storage: Storage) => boolean;
};

const RULES: MilestoneRule[] = [
  {
    id: "first_sat_practice",
    message: "First official SAT practice logged — rhythm started.",
    isMet: (storage) =>
      loadStudyActivities(storage).some((e) => e.type === "sat_practice_logged"),
  },
  {
    id: "first_sat_mistake",
    message: "First SAT mistake logged — triage builds your gap list.",
    isMet: (storage) =>
      loadStudyActivities(storage).some((e) => e.type === "sat_mistake_logged"),
  },
  {
    id: "first_mentor",
    message: "First mentor recall check-in completed.",
    isMet: (storage) =>
      loadStudyActivities(storage).some((e) => e.type === "mentor_completed"),
  },
  {
    id: "week_10_actions",
    message: "10 study actions this week — strong momentum.",
    isMet: (storage) => getWeekActivityMix(storage).totalEvents >= 10,
  },
  {
    id: "five_active_days",
    message: "Five active days this week — consistency unlocked.",
    isMet: (storage) => getWeekActivityMix(storage).daysActive >= 5,
  },
];

function loadSeenIds(storage: Storage): Set<string> {
  try {
    const raw = storage.getItem(ACTIVITY_MILESTONES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function saveSeenIds(seen: Set<string>, storage: Storage): void {
  try {
    storage.setItem(ACTIVITY_MILESTONES_STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // ignore quota
  }
}

/** Returns newly earned milestones and persists their ids. */
export function detectNewActivityMilestones(storage: Storage = localStorage): ActivityMilestone[] {
  const seen = loadSeenIds(storage);
  const earned: ActivityMilestone[] = [];

  for (const rule of RULES) {
    if (seen.has(rule.id)) continue;
    if (!rule.isMet(storage)) continue;
    seen.add(rule.id);
    earned.push({ id: rule.id, message: rule.message });
  }

  if (earned.length > 0) {
    saveSeenIds(seen, storage);
  }

  return earned;
}

export function notifyActivityMilestones(milestones: ActivityMilestone[]): void {
  if (typeof window === "undefined" || milestones.length === 0) return;
  window.dispatchEvent(
    new CustomEvent(ACTIVITY_MILESTONE_EVENT, { detail: { milestones } }),
  );
}

/** Types that can trigger milestone rules (for tests). */
export const MILESTONE_TRIGGER_TYPES: StudyActivityType[] = [
  "sat_practice_logged",
  "sat_mistake_logged",
  "mentor_completed",
];
