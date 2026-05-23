export type Achievement =
  | "first_lesson"
  | "first_streak"
  | "week_streak"
  | "level_5"
  | "level_10"
  | "first_hour"
  | "ten_lessons";

import { V2_ACHIEVEMENTS } from "@/lib/migrate-v1";

const LEGACY_STORAGE_KEY = "learnapp_achievements_v1";

let cache: Achievement[] | null = null;

function loadSeen(): Achievement[] {
  if (cache) return cache;
  try {
    const raw =
      localStorage.getItem(V2_ACHIEVEMENTS) ??
      localStorage.getItem(LEGACY_STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function saveSeen(seen: Achievement[]) {
  cache = seen;
  localStorage.setItem(V2_ACHIEVEMENTS, JSON.stringify(seen));
}

export function hasSeen(achievement: Achievement): boolean {
  return loadSeen().includes(achievement);
}

export function markSeen(achievement: Achievement) {
  const seen = loadSeen();
  if (!seen.includes(achievement)) {
    seen.push(achievement);
    saveSeen(seen);
  }
}

export function checkAchievements(stats: {
  completedNodes: number;
  streakCurrent: number;
  level: number;
  totalStudyMinutes: number;
}): Achievement[] {
  const newOnes: Achievement[] = [];
  if (stats.completedNodes >= 1 && !hasSeen("first_lesson")) newOnes.push("first_lesson");
  if (stats.streakCurrent >= 2 && !hasSeen("first_streak")) newOnes.push("first_streak");
  if (stats.streakCurrent >= 7 && !hasSeen("week_streak")) newOnes.push("week_streak");
  if (stats.level >= 5 && !hasSeen("level_5")) newOnes.push("level_5");
  if (stats.level >= 10 && !hasSeen("level_10")) newOnes.push("level_10");
  if (stats.totalStudyMinutes >= 60 && !hasSeen("first_hour")) newOnes.push("first_hour");
  if (stats.completedNodes >= 10 && !hasSeen("ten_lessons")) newOnes.push("ten_lessons");
  return newOnes;
}

export function achievementLabel(a: Achievement): string {
  const labels: Record<Achievement, string> = {
    first_lesson: "First Steps — You completed your first lesson!",
    first_streak: "On Fire — 2 day streak!",
    week_streak: "Unstoppable — 7 day streak!",
    level_5: "Rising Star — Reached level 5!",
    level_10: "Veteran — Reached level 10!",
    first_hour: "Deep Work — 1 hour of study time!",
    ten_lessons: "Scholar — 10 lessons completed!",
  };
  return labels[a];
}
