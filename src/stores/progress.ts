import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SkillNode, Subject } from "@/curriculum/types";
import { findNodeAcrossSubjects } from "@/curriculum/loader";
import {
  mergeLegacyNotes,
  migrateThemeFromV1,
  normalizeV1Progress,
  verifySrsDates,
  type MigrationResult,
} from "@/lib/migrate-v1";

export const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30, 60, 120, 240] as const;
export const DEFAULT_DAILY_GOAL = 60;
export const V1_STORAGE_KEY = "learnapp_progress_v1";
export const V2_STORAGE_KEY = "learnv2_progress";

export interface QuizAttempt {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  date: string;
  timeTakenSeconds: number;
}

export interface NodeProgress {
  completedAt: string | null;
  startedAt: string | null;
  timeSpentMinutes: number;
  quizScores: number[];
  quizHistory: QuizAttempt[];
}

export interface SpacedRepetitionItem {
  nodeId: string;
  scheduledReviews: Array<{ scheduledDate: string; completedDate: string | null }>;
  currentIntervalIndex: number;
}

export interface ProgressData {
  nodes: Record<string, NodeProgress>;
  spacedRepetition: Record<string, SpacedRepetitionItem>;
  totalXp: number;
  totalStudyMinutes: number;
  streaks: { current: number; longest: number; lastStudyDate: string | null };
  dailyGoal: number;
  dailyMinutes: Record<string, number>;
  levelUpPending: number | null;
  recentlyVisited: Array<{ nodeId: string; visitedAt: number }>;
  dailyReviews: Record<string, number>;
  reviewStreak: { current: number; longest: number; lastReviewDate: string | null };
  dailyChallenges: Record<string, boolean>;
}

export const MAX_DAILY_REVIEWS = 10;

export type ReviewConfidence = "easy" | "normal" | "hard" | "forgot";

export interface ReviewItem {
  subject: Subject;
  node: SkillNode;
  completedAt: string;
  daysAgo: number;
  reviewInterval: number;
  nextReviewDate: string;
}

export interface ReviewStats {
  totalReviews: number;
  passCount: number;
  failCount: number;
  passRate: number;
}
export interface Stats {
  totalXp: number;
  level: number;
  xpToNext: number;
  completedNodes: number;
  totalNodes: number;
  streakCurrent: number;
  streakLongest: number;
  totalStudyMinutes: number;
  dailyGoal: number;
  todayMinutes: number;
  dailyMinutes: Record<string, number>;
}

export function getToday(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function emptyNodeProgress(): NodeProgress {
  return {
    completedAt: null,
    startedAt: null,
    timeSpentMinutes: 0,
    quizScores: [],
    quizHistory: [],
  };
}

function defaultProgress(): ProgressData {
  return {
    nodes: {},
    spacedRepetition: {},
    totalXp: 0,
    totalStudyMinutes: 0,
    streaks: { current: 0, longest: 0, lastStudyDate: null },
    dailyGoal: DEFAULT_DAILY_GOAL,
    dailyMinutes: {},
    levelUpPending: null,
    recentlyVisited: [],
    dailyReviews: {},
    reviewStreak: { current: 0, longest: 0, lastReviewDate: null },
    dailyChallenges: {},
  };
}

function scheduleReviewAtIndex(data: ProgressData, nodeId: string, intervalIndex: number) {
  const interval = SPACED_REPETITION_INTERVALS[intervalIndex];
  if (!interval) return;
  const scheduledDate = new Date();
  scheduledDate.setUTCDate(scheduledDate.getUTCDate() + interval);
  const dateStr = `${scheduledDate.getUTCFullYear()}-${String(scheduledDate.getUTCMonth() + 1).padStart(2, "0")}-${String(scheduledDate.getUTCDate()).padStart(2, "0")}`;
  if (!data.spacedRepetition[nodeId]) {
    data.spacedRepetition[nodeId] = { nodeId, scheduledReviews: [], currentIntervalIndex: 0 };
  }
  data.spacedRepetition[nodeId].scheduledReviews.push({ scheduledDate: dateStr, completedDate: null });
  data.spacedRepetition[nodeId].currentIntervalIndex = intervalIndex;
}

function scheduleReview(data: ProgressData, nodeId: string, intervalIndex: number) {
  let adjustedIndex = intervalIndex;
  const nodeProgress = data.nodes[nodeId];
  if (nodeProgress?.quizScores.length) {
    const avg = nodeProgress.quizScores.reduce((a, b) => a + b, 0) / nodeProgress.quizScores.length;
    if (avg >= 80) adjustedIndex = Math.min(intervalIndex + 1, SPACED_REPETITION_INTERVALS.length - 1);
    else if (avg < 60) adjustedIndex = Math.max(intervalIndex - 1, 0);
  }
  const interval = SPACED_REPETITION_INTERVALS[adjustedIndex];
  if (!interval) return;
  const scheduledDate = new Date();
  scheduledDate.setUTCDate(scheduledDate.getUTCDate() + interval);
  const dateStr = `${scheduledDate.getUTCFullYear()}-${String(scheduledDate.getUTCMonth() + 1).padStart(2, "0")}-${String(scheduledDate.getUTCDate()).padStart(2, "0")}`;
  if (!data.spacedRepetition[nodeId]) {
    data.spacedRepetition[nodeId] = { nodeId, scheduledReviews: [], currentIntervalIndex: 0 };
  }
  data.spacedRepetition[nodeId].scheduledReviews.push({ scheduledDate: dateStr, completedDate: null });
  data.spacedRepetition[nodeId].currentIntervalIndex = adjustedIndex;
}

interface ProgressState {
  data: ProgressData;
  getNodeProgress: (nodeId: string) => NodeProgress;
  getNodeStatus: (node: SkillNode) => "locked" | "available" | "completed";
  startNode: (nodeId: string) => void;
  trackVisit: (nodeId: string) => void;
  completeNode: (nodeId: string, xpValue: number) => void;
  saveQuizAttempt: (nodeId: string, attempt: QuizAttempt) => void;
  getStats: (subjects: Subject[]) => Stats;
  getContinueTarget: (
    subjects: Subject[],
  ) => { subject: Subject; node: SkillNode } | null;
  completeReviewWithConfidence: (nodeId: string, confidence: ReviewConfidence) => void;
  getNodesNeedingReview: (subjects: Subject[]) => ReviewItem[];
  getDailyReviewItems: (subjects: Subject[]) => ReviewItem[];
  getDailyReviewCount: () => number;
  getRemainingReviewCount: (subjects: Subject[]) => number;
  getReviewStreak: () => ProgressData["reviewStreak"];
  getReviewStats: () => ReviewStats;
  getQuizScoreForNode: (nodeId: string) => number | null;
  addStudyTime: (seconds: number, nodeId?: string) => void;
  isDailyChallengeCompleted: (challengeId: string) => boolean;
  completeDailyChallenge: (challengeId: string, xpReward: number) => void;
  exportData: () => string;
  importData: (json: string) => { success: boolean; error?: string };
  resetProgress: () => void;
  clearLevelUpPending: () => void;
  migrateAllFromV1: () => MigrationResult;
  importFromV1: () => { success: boolean; message: string };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      data: defaultProgress(),

      getNodeProgress: (nodeId) => get().data.nodes[nodeId] ?? emptyNodeProgress(),

      getNodeStatus: (node) => {
        const prog = get().getNodeProgress(node.id);
        if (prog.completedAt) return "completed";
        if (node.parentIds.length === 0) return "available";
        return node.parentIds.every((pid) => get().getNodeProgress(pid).completedAt)
          ? "available"
          : "locked";
      },

      startNode: (nodeId) =>
        set((state) => {
          const data = structuredClone(state.data);
          if (!data.nodes[nodeId]) data.nodes[nodeId] = emptyNodeProgress();
          if (!data.nodes[nodeId].startedAt) data.nodes[nodeId].startedAt = new Date().toISOString();
          return { data };
        }),

      trackVisit: (nodeId) =>
        set((state) => {
          const data = structuredClone(state.data);
          data.recentlyVisited = [
            { nodeId, visitedAt: Date.now() },
            ...data.recentlyVisited.filter((v) => v.nodeId !== nodeId),
          ].slice(0, 10);
          return { data };
        }),

      completeNode: (nodeId, xpValue) =>
        set((state) => {
          const data = structuredClone(state.data);
          if (!data.nodes[nodeId]) data.nodes[nodeId] = emptyNodeProgress();
          if (!data.nodes[nodeId].completedAt) {
            const oldLevel = Math.floor(data.totalXp / 500) + 1;
            data.nodes[nodeId].completedAt = new Date().toISOString();
            data.totalXp += xpValue;
            const newLevel = Math.floor(data.totalXp / 500) + 1;
            if (newLevel > oldLevel) data.levelUpPending = newLevel;
            scheduleReview(data, nodeId, 0);
          }
          return { data };
        }),

      saveQuizAttempt: (nodeId, attempt) =>
        set((state) => {
          const data = structuredClone(state.data);
          if (!data.nodes[nodeId]) data.nodes[nodeId] = emptyNodeProgress();
          data.nodes[nodeId].quizHistory.push(attempt);
          data.nodes[nodeId].quizScores.push(attempt.score);
          return { data };
        }),

      getStats: (subjects) => {
        const d = get().data;
        let completedNodes = 0;
        let totalNodes = 0;
        for (const sub of subjects) {
          for (const node of sub.nodes) {
            totalNodes++;
            if (get().getNodeStatus(node) === "completed") completedNodes++;
          }
        }
        return {
          totalXp: d.totalXp,
          level: Math.floor(d.totalXp / 500) + 1,
          xpToNext: 500 - (d.totalXp % 500),
          completedNodes,
          totalNodes,
          streakCurrent: d.streaks.current,
          streakLongest: d.streaks.longest,
          totalStudyMinutes: d.totalStudyMinutes,
          dailyGoal: d.dailyGoal,
          todayMinutes: d.dailyMinutes[getToday()] ?? 0,
          dailyMinutes: d.dailyMinutes,
        };
      },

      getContinueTarget: (subjects) => {
        const recent = get().data.recentlyVisited[0];
        if (recent) {
          const found = findNodeAcrossSubjects(subjects, recent.nodeId);
          if (found && get().getNodeStatus(found.node) !== "locked") return found;
        }
        for (const subject of subjects) {
          for (const node of subject.nodes) {
            if (get().getNodeStatus(node) === "available") return { subject, node };
          }
        }
        return null;
      },

      completeReviewWithConfidence: (nodeId, confidence) =>
        set((state) => {
          const data = structuredClone(state.data);
          const item = data.spacedRepetition[nodeId];
          if (!item) return { data: state.data };

          const pendingReview = item.scheduledReviews
            .slice()
            .reverse()
            .find((r) => r.completedDate === null);
          if (!pendingReview) return { data: state.data };

          const todayStr = getToday();
          pendingReview.completedDate = todayStr;
          data.dailyReviews[todayStr] = (data.dailyReviews[todayStr] || 0) + 1;

          if (data.reviewStreak.lastReviewDate !== todayStr) {
            const yesterday = new Date();
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            const yStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, "0")}-${String(yesterday.getUTCDate()).padStart(2, "0")}`;
            if (data.reviewStreak.lastReviewDate === yStr) data.reviewStreak.current += 1;
            else data.reviewStreak.current = 1;
            if (data.reviewStreak.current > data.reviewStreak.longest) {
              data.reviewStreak.longest = data.reviewStreak.current;
            }
            data.reviewStreak.lastReviewDate = todayStr;
          }

          let nextIntervalIndex: number;
          switch (confidence) {
            case "easy":
              nextIntervalIndex = Math.min(item.currentIntervalIndex + 2, SPACED_REPETITION_INTERVALS.length - 1);
              break;
            case "normal":
              nextIntervalIndex = item.currentIntervalIndex + 1;
              break;
            case "hard":
              nextIntervalIndex = item.currentIntervalIndex;
              break;
            case "forgot":
              nextIntervalIndex = 0;
              break;
          }

          if (nextIntervalIndex < SPACED_REPETITION_INTERVALS.length) {
            scheduleReviewAtIndex(data, nodeId, nextIntervalIndex);
          }
          return { data };
        }),

      getNodesNeedingReview: (subjects) => {
        const d = get().data;
        const today = getToday();
        const now = new Date();
        const items: ReviewItem[] = [];

        for (const [nodeId, srItem] of Object.entries(d.spacedRepetition)) {
          const pendingReview = srItem.scheduledReviews
            .slice()
            .reverse()
            .find((r) => r.completedDate === null);
          if (!pendingReview || pendingReview.scheduledDate > today) continue;

          let subject: Subject | undefined;
          let node: SkillNode | undefined;
          for (const sub of subjects) {
            node = sub.nodes.find((n) => n.id === nodeId);
            if (node) {
              subject = sub;
              break;
            }
          }
          if (!subject || !node) continue;

          const prog = get().getNodeProgress(nodeId);
          if (!prog.completedAt) continue;

          const completedDate = new Date(prog.completedAt);
          const daysAgo = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
          const reviewInterval = SPACED_REPETITION_INTERVALS[srItem.currentIntervalIndex] || 0;

          items.push({
            subject,
            node,
            completedAt: prog.completedAt,
            daysAgo,
            reviewInterval,
            nextReviewDate: pendingReview.scheduledDate,
          });
        }

        items.sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));
        return items;
      },

      getDailyReviewItems: (subjects) => {
        const allDue = get().getNodesNeedingReview(subjects);
        const reviewedToday = get().getDailyReviewCount();
        const dailyCap = Math.max(0, MAX_DAILY_REVIEWS - reviewedToday);
        return allDue.slice(0, dailyCap);
      },

      getDailyReviewCount: () => get().data.dailyReviews[getToday()] || 0,

      getRemainingReviewCount: (subjects) => {
        const allDue = get().getNodesNeedingReview(subjects);
        const reviewedToday = get().getDailyReviewCount();
        const dailyCap = Math.max(0, MAX_DAILY_REVIEWS - reviewedToday);
        return Math.max(0, allDue.length - dailyCap);
      },

      getReviewStreak: () => get().data.reviewStreak,

      getReviewStats: () => {
        const d = get().data;
        let totalReviews = 0;
        let passCount = 0;
        let failCount = 0;

        for (const srItem of Object.values(d.spacedRepetition)) {
          for (const review of srItem.scheduledReviews) {
            if (review.completedDate === null) continue;
            totalReviews++;
            if (review.completedDate <= review.scheduledDate) passCount++;
            else failCount++;
          }
        }

        return {
          totalReviews,
          passCount,
          failCount,
          passRate: totalReviews > 0 ? Math.round((passCount / totalReviews) * 100) : 0,
        };
      },

      getQuizScoreForNode: (nodeId) => {
        const scores = get().data.nodes[nodeId]?.quizScores ?? [];
        if (scores.length === 0) return null;
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      },

      addStudyTime: (seconds, nodeId) =>
        set((state) => {
          const data = structuredClone(state.data);
          const minutes = seconds / 60;
          data.totalStudyMinutes += minutes;
          const today = getToday();
          data.dailyMinutes[today] = (data.dailyMinutes[today] || 0) + minutes;
          if (nodeId) {
            if (!data.nodes[nodeId]) data.nodes[nodeId] = emptyNodeProgress();
            data.nodes[nodeId].timeSpentMinutes += minutes;
          }
          if (data.streaks.lastStudyDate !== today) {
            const yesterday = new Date();
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            const yStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, "0")}-${String(yesterday.getUTCDate()).padStart(2, "0")}`;
            if (data.streaks.lastStudyDate === yStr) data.streaks.current += 1;
            else data.streaks.current = 1;
            if (data.streaks.current > data.streaks.longest) {
              data.streaks.longest = data.streaks.current;
            }
            data.streaks.lastStudyDate = today;
          }
          return { data };
        }),

      isDailyChallengeCompleted: (challengeId) => {
        const todayKey = `${getToday()}_${challengeId}`;
        return get().data.dailyChallenges[todayKey] === true;
      },

      completeDailyChallenge: (challengeId, xpReward) =>
        set((state) => {
          const data = structuredClone(state.data);
          const todayKey = `${getToday()}_${challengeId}`;
          if (!data.dailyChallenges[todayKey]) {
            data.dailyChallenges[todayKey] = true;
            const oldLevel = Math.floor(data.totalXp / 500) + 1;
            data.totalXp += xpReward;
            const newLevel = Math.floor(data.totalXp / 500) + 1;
            if (newLevel > oldLevel) data.levelUpPending = newLevel;
          }
          return { data };
        }),

      exportData: () => {
        const keys: Record<string, string | null> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("learnv2_") || key.startsWith("learnapp_"))) {
            keys[key] = localStorage.getItem(key);
          }
        }
        return JSON.stringify({ version: 2, keys }, null, 2);
      },

      importData: (json) => {
        try {
          const parsed = JSON.parse(json) as { version?: number; keys: Record<string, string | null> };
          if (!parsed.keys) return { success: false, error: "Invalid export format." };
          for (const [key, value] of Object.entries(parsed.keys)) {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
          }
          const raw = localStorage.getItem(V2_STORAGE_KEY);
          if (raw) {
            const data = JSON.parse(raw) as { state?: { data?: ProgressData } };
            if (data.state?.data) set({ data: { ...defaultProgress(), ...data.state.data } });
          }
          return { success: true };
        } catch {
          return { success: false, error: "Failed to parse import file." };
        }
      },

      resetProgress: () => set({ data: defaultProgress() }),

      clearLevelUpPending: () =>
        set((state) => ({
          data: { ...state.data, levelUpPending: null },
        })),

      importFromV1: () => {
        try {
          const raw = localStorage.getItem(V1_STORAGE_KEY);
          if (!raw) return { success: false, message: "No Learn-v1 progress found in this browser." };
          const parsed = normalizeV1Progress(
            JSON.parse(raw) as Record<string, unknown>,
          ) as unknown as ProgressData;
          set({
            data: {
              ...defaultProgress(),
              ...parsed,
            },
          });
          return { success: true, message: "Imported Learn-v1 progress successfully." };
        } catch {
          return { success: false, message: "Failed to parse Learn-v1 progress data." };
        }
      },

      migrateAllFromV1: () => {
        const progressResult = get().importFromV1();
        const notesMerged = mergeLegacyNotes();
        const themeMigrated = migrateThemeFromV1(localStorage, { force: true });
        const srsDatesPreserved = verifySrsDates();

        const parts: string[] = [];
        if (progressResult.success) parts.push("progress");
        if (notesMerged > 0) parts.push(`${notesMerged} legacy notes`);
        if (themeMigrated) parts.push("theme");

        const success = progressResult.success || notesMerged > 0 || themeMigrated;
        const message = success
          ? `Migration complete: ${parts.join(", ") || "shared keys already present"}.`
          : "No Learn-v1 data found in this browser.";

        return {
          success,
          message,
          details: {
            progress: progressResult.success,
            notesMerged,
            themeMigrated,
            srsDatesPreserved,
          },
        };
      },
    }),
    { name: V2_STORAGE_KEY },
  ),
);
