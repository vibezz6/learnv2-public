import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SkillNode, Subject } from "@/curriculum/types";
import { findNodeAcrossSubjects } from "@/curriculum/loader";
import { findLatestInProgressQuizNodeId } from "@/features/quiz/quizProgress";
import {
  type BackupImportReport,
  clearManagedStorage,
  exportManagedStorage,
  restoreManagedStorageBackup,
} from "@/lib/backupFormat";
import { notifyDataUpdated } from "@/lib/dataSync";
import {
  BACKUP_EXCLUDED_OPENROUTER_KEYS,
  BACKUP_STORAGE_PREFIXES,
  V1_STORAGE_KEY,
  V2_STORAGE_KEY,
} from "@/lib/storageRegistry";
import { getLastActivity, recordStudyActivity } from "@/lib/studyActivity";
import { canAccessReview, getSession } from "@/stores/noteSessions";
import {
  mergeBookmarksFromV1,
  mergeLegacyNotes,
  mergeTakeawaysFromV1,
  migrateAchievementsFromV1,
  migrateThemeFromV1,
  normalizeV1Progress,
  V1_MIGRATION_DONE_AT,
  verifySrsDates,
  type MigrationResult,
} from "@/lib/migrate-v1";

export const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30, 60, 120, 240] as const;
export const DEFAULT_DAILY_GOAL = 60;
export { BACKUP_EXCLUDED_OPENROUTER_KEYS, BACKUP_STORAGE_PREFIXES, V1_STORAGE_KEY, V2_STORAGE_KEY };

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
  scheduledReviews: Array<{ scheduledDate: string; completedDate: string | null; confidence?: ReviewConfidence }>;
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
const DAILY_RETENTION_DAYS = 90;

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

function isEmptyProgress(data: ProgressData): boolean {
  return Object.keys(data.nodes).length === 0 && data.totalXp === 0;
}

function latestDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function mergeNumberRecords(
  current: Record<string, number>,
  incoming: Record<string, number>,
): Record<string, number> {
  const merged = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    merged[key] = Math.max(merged[key] ?? 0, value);
  }
  return merged;
}

function mergeProgressData(current: ProgressData, incoming: ProgressData): ProgressData {
  if (isEmptyProgress(current)) {
    const merged = { ...defaultProgress(), ...incoming };
    pruneDailyMaps(merged);
    return merged;
  }

  const nodes = { ...current.nodes };
  for (const [nodeId, incomingNode] of Object.entries(incoming.nodes)) {
    const currentNode = nodes[nodeId] ?? emptyNodeProgress();
    nodes[nodeId] = {
      completedAt: currentNode.completedAt ?? incomingNode.completedAt,
      startedAt: currentNode.startedAt ?? incomingNode.startedAt,
      timeSpentMinutes: Math.max(currentNode.timeSpentMinutes, incomingNode.timeSpentMinutes),
      quizScores: uniqueBy([...currentNode.quizScores, ...incomingNode.quizScores], String),
      quizHistory: uniqueBy(
        [...currentNode.quizHistory, ...incomingNode.quizHistory],
        (attempt) => JSON.stringify(attempt),
      ),
    };
  }

  const spacedRepetition = { ...current.spacedRepetition };
  for (const [nodeId, incomingItem] of Object.entries(incoming.spacedRepetition)) {
    const currentItem = spacedRepetition[nodeId];
    spacedRepetition[nodeId] = currentItem
      ? {
          nodeId,
          currentIntervalIndex: Math.max(currentItem.currentIntervalIndex, incomingItem.currentIntervalIndex),
          scheduledReviews: uniqueBy(
            [...currentItem.scheduledReviews, ...incomingItem.scheduledReviews],
            (review) => `${review.scheduledDate}:${review.completedDate ?? ""}:${review.confidence ?? ""}`,
          ),
        }
      : incomingItem;
  }

  const merged = {
    ...current,
    nodes,
    spacedRepetition,
    totalXp: Math.max(current.totalXp, incoming.totalXp),
    totalStudyMinutes: Math.max(current.totalStudyMinutes, incoming.totalStudyMinutes),
    streaks: {
      current: Math.max(current.streaks.current, incoming.streaks.current),
      longest: Math.max(current.streaks.longest, incoming.streaks.longest),
      lastStudyDate: latestDate(current.streaks.lastStudyDate, incoming.streaks.lastStudyDate),
    },
    dailyGoal: current.dailyGoal || incoming.dailyGoal,
    dailyMinutes: mergeNumberRecords(current.dailyMinutes, incoming.dailyMinutes),
    levelUpPending: current.levelUpPending ?? incoming.levelUpPending,
    recentlyVisited: uniqueBy(
      [...current.recentlyVisited, ...incoming.recentlyVisited].sort((a, b) => b.visitedAt - a.visitedAt),
      (visit) => visit.nodeId,
    ).slice(0, 10),
    dailyReviews: mergeNumberRecords(current.dailyReviews, incoming.dailyReviews),
    reviewStreak: {
      current: Math.max(current.reviewStreak.current, incoming.reviewStreak.current),
      longest: Math.max(current.reviewStreak.longest, incoming.reviewStreak.longest),
      lastReviewDate: latestDate(current.reviewStreak.lastReviewDate, incoming.reviewStreak.lastReviewDate),
    },
    dailyChallenges: { ...incoming.dailyChallenges, ...current.dailyChallenges },
  };
  pruneDailyMaps(merged);
  return merged;
}

function toDateString(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function yesterdayString(): string {
  return toDateString(addUtcDays(new Date(), -1));
}

function resolveCurrentStudyStreak(streaks: ProgressData["streaks"]): number {
  if (!streaks.lastStudyDate) return 0;
  const today = getToday();
  if (streaks.lastStudyDate === today || streaks.lastStudyDate === yesterdayString()) return streaks.current;
  return 0;
}

function pruneDailyMaps(data: ProgressData) {
  const cutoff = toDateString(addUtcDays(new Date(), -DAILY_RETENTION_DAYS));
  data.dailyMinutes = Object.fromEntries(Object.entries(data.dailyMinutes).filter(([date]) => date >= cutoff));
  data.dailyReviews = Object.fromEntries(Object.entries(data.dailyReviews).filter(([date]) => date >= cutoff));
  data.dailyChallenges = Object.fromEntries(Object.entries(data.dailyChallenges).filter(([key]) => key.slice(0, 10) >= cutoff));
}

function getEarliestPendingReview(item: SpacedRepetitionItem) {
  return item.scheduledReviews.filter((review) => review.completedDate === null).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];
}

function reschedulePendingReview(data: ProgressData, nodeId: string, intervalIndex: number) {
  const nodeProgress = data.nodes[nodeId];
  let adjustedIndex = intervalIndex;
  if (nodeProgress?.quizScores.length) {
    const avg = nodeProgress.quizScores.reduce((a, b) => a + b, 0) / nodeProgress.quizScores.length;
    if (avg >= 80) adjustedIndex = Math.min(intervalIndex + 1, SPACED_REPETITION_INTERVALS.length - 1);
    else if (avg < 60) adjustedIndex = Math.max(intervalIndex - 1, 0);
  }
  const interval = SPACED_REPETITION_INTERVALS[adjustedIndex];
  if (!interval) return;
  const dateStr = toDateString(addUtcDays(new Date(), interval));
  if (!data.spacedRepetition[nodeId]) data.spacedRepetition[nodeId] = { nodeId, scheduledReviews: [], currentIntervalIndex: 0 };
  const pendingReview = getEarliestPendingReview(data.spacedRepetition[nodeId]);
  if (pendingReview) pendingReview.scheduledDate = dateStr;
  else data.spacedRepetition[nodeId].scheduledReviews.push({ scheduledDate: dateStr, completedDate: null });
  data.spacedRepetition[nodeId].currentIntervalIndex = adjustedIndex;
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
  getNextScheduledReview: () => { date: string; daysUntil: number } | null;
  getReviewStreak: () => ProgressData["reviewStreak"];
  getReviewStats: () => ReviewStats;
  getQuizScoreForNode: (nodeId: string) => number | null;
  addStudyTime: (seconds: number, nodeId?: string) => void;
  isDailyChallengeCompleted: (challengeId: string) => boolean;
  completeDailyChallenge: (challengeId: string, xpReward: number) => void;
  exportData: () => string;
  importData: (json: string) => {
    success: boolean;
    error?: string;
    reloadRequired?: boolean;
    importReport?: BackupImportReport;
  };
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
          if (!data.nodes[nodeId].startedAt) {
            data.nodes[nodeId].startedAt = new Date().toISOString();
            recordStudyActivity({ type: "lesson_started", nodeId });
          }
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
            recordStudyActivity({
              type: "lesson_completed",
              nodeId,
              meta: { xp: xpValue },
            });
          }
          return { data };
        }),

      saveQuizAttempt: (nodeId, attempt) =>
        set((state) => {
          const data = structuredClone(state.data);
          if (!data.nodes[nodeId]) data.nodes[nodeId] = emptyNodeProgress();
          data.nodes[nodeId].quizHistory.push(attempt);
          data.nodes[nodeId].quizScores.push(attempt.score);
          if (data.nodes[nodeId].completedAt) {
            reschedulePendingReview(data, nodeId, data.spacedRepetition[nodeId]?.currentIntervalIndex ?? 0);
          }
          recordStudyActivity({
            type: "quiz_completed",
            nodeId,
            meta: {
              score: attempt.score,
              correct: attempt.correctAnswers,
              total: attempt.totalQuestions,
            },
          });
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
          streakCurrent: resolveCurrentStudyStreak(d.streaks),
          streakLongest: d.streaks.longest,
          totalStudyMinutes: d.totalStudyMinutes,
          dailyGoal: d.dailyGoal,
          todayMinutes: d.dailyMinutes[getToday()] ?? 0,
          dailyMinutes: d.dailyMinutes,
        };
      },

      getContinueTarget: (subjects) => {
        const findTargetInSubject = (subject: Subject) => {
          for (const node of subject.nodes) {
            const prog = get().getNodeProgress(node.id);
            if (
              prog.startedAt &&
              !prog.completedAt &&
              get().getNodeStatus(node) === "available"
            ) {
              return { subject, node };
            }
          }
          for (const node of subject.nodes) {
            if (get().getNodeStatus(node) === "available") return { subject, node };
          }
          return null;
        };

        for (const subject of subjects) {
          for (const node of subject.nodes) {
            if (get().getNodeStatus(node) === "locked") continue;
            const prog = get().getNodeProgress(node.id);
            if (prog.startedAt && !prog.completedAt) {
              return { subject, node };
            }
          }
        }

        const lastNotes = getLastActivity(["notes_updated"]);
        if (lastNotes?.nodeId) {
          const session = getSession(lastNotes.nodeId);
          if (session && canAccessReview(session) && !session.review?.completedAt) {
            const found = findNodeAcrossSubjects(subjects, lastNotes.nodeId);
            if (found && get().getNodeStatus(found.node) !== "locked") {
              return found;
            }
          }
        }

        const quizNodeId = findLatestInProgressQuizNodeId();
        if (quizNodeId) {
          const found = findNodeAcrossSubjects(subjects, quizNodeId);
          if (found && get().getNodeStatus(found.node) !== "locked") {
            return found;
          }
        }

        const satSubject = subjects.find((s) => s.id === "sat-prep");
        if (satSubject) {
          const satTarget = findTargetInSubject(satSubject);
          if (satTarget) return satTarget;
        }

        const recent = get().data.recentlyVisited[0];
        if (recent) {
          const found = findNodeAcrossSubjects(subjects, recent.nodeId);
          if (found && get().getNodeStatus(found.node) === "available") return found;
        }

        for (const subject of subjects) {
          if (subject.id === "sat-prep") continue;
          const target = findTargetInSubject(subject);
          if (target) return target;
        }
        return null;
      },

      completeReviewWithConfidence: (nodeId, confidence) =>
        set((state) => {
          const data = structuredClone(state.data);
          const item = data.spacedRepetition[nodeId];
          if (!item) return { data: state.data };

          const pendingReview = getEarliestPendingReview(item);
          if (!pendingReview) return { data: state.data };

          const todayStr = getToday();
          pendingReview.completedDate = todayStr;
          pendingReview.confidence = confidence;
          data.dailyReviews[todayStr] = (data.dailyReviews[todayStr] || 0) + 1;

          if (data.reviewStreak.lastReviewDate !== todayStr) {
            if (data.reviewStreak.lastReviewDate === yesterdayString()) data.reviewStreak.current += 1;
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
              nextIntervalIndex = Math.min(item.currentIntervalIndex + 1, SPACED_REPETITION_INTERVALS.length - 1);
              break;
            case "hard":
              nextIntervalIndex = item.currentIntervalIndex;
              break;
            case "forgot":
              nextIntervalIndex = 0;
              break;
          }

          scheduleReviewAtIndex(data, nodeId, nextIntervalIndex);
          pruneDailyMaps(data);
          recordStudyActivity({ type: "review_done", nodeId, meta: { confidence } });
          return { data };
        }),

      getNodesNeedingReview: (subjects) => {
        const d = get().data;
        const today = getToday();
        const now = new Date();
        const items: ReviewItem[] = [];

        for (const [nodeId, srItem] of Object.entries(d.spacedRepetition)) {
          const pendingReview = getEarliestPendingReview(srItem);
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

      getNextScheduledReview: () => {
        const today = getToday();
        let earliest: string | null = null;
        for (const srItem of Object.values(get().data.spacedRepetition)) {
          for (const review of srItem.scheduledReviews) {
            if (review.completedDate !== null || review.scheduledDate <= today) continue;
            if (!earliest || review.scheduledDate < earliest) {
              earliest = review.scheduledDate;
            }
          }
        }
        if (!earliest) return null;
        const start = new Date(`${today}T00:00:00Z`).getTime();
        const end = new Date(`${earliest}T00:00:00Z`).getTime();
        const daysUntil = Math.max(1, Math.round((end - start) / 86_400_000));
        return { date: earliest, daysUntil };
      },

      getReviewStreak: () => get().data.reviewStreak,

      getReviewStats: () => {
        const d = get().data;
        let totalReviews = 0;
        let passCount = 0;
        let failCount = 0;

        for (const srItem of Object.values(d.spacedRepetition)) {
          for (const review of srItem.scheduledReviews) {
            if (review.completedDate === null || !review.confidence) continue;
            totalReviews++;
            if (review.confidence === "forgot") failCount++;
            else passCount++;
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
            if (data.streaks.lastStudyDate === yesterdayString()) data.streaks.current += 1;
            else data.streaks.current = 1;
            if (data.streaks.current > data.streaks.longest) {
              data.streaks.longest = data.streaks.current;
            }
            data.streaks.lastStudyDate = today;
          }
          if (minutes >= 1) {
            recordStudyActivity({
              type: "timer_minutes",
              nodeId,
              meta: { minutes: Math.round(minutes) },
            });
          }
          pruneDailyMaps(data);
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
            recordStudyActivity({
              type: "daily_challenge_done",
              meta: { challengeId, xp: xpReward },
            });
          }
          pruneDailyMaps(data);
          return { data };
        }),

      exportData: () => {
        return exportManagedStorage(localStorage);
      },

      importData: (json) => {
        const result = restoreManagedStorageBackup(json, localStorage);
        if (!result.success) return { success: false, error: result.error };
        try {
          if (result.progressRaw) {
            const data = JSON.parse(result.progressRaw) as { state?: { data?: ProgressData } };
            if (data.state?.data) {
              const imported = { ...defaultProgress(), ...data.state.data };
              pruneDailyMaps(imported);
              set({ data: imported });
            }
          }
          notifyDataUpdated();
          return { success: true, reloadRequired: true, importReport: result.importReport };
        } catch {
          return { success: false, error: "Failed to parse import file." };
        }
      },

      resetProgress: () => {
        if (typeof localStorage !== "undefined") {
          clearManagedStorage(localStorage);
        }
        set({ data: defaultProgress() });
      },

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
          set((state) => ({ data: mergeProgressData(state.data, parsed) }));
          return { success: true, message: "Imported Learn-v1 progress successfully." };
        } catch {
          return { success: false, message: "Failed to parse Learn-v1 progress data." };
        }
      },

      migrateAllFromV1: () => {
        const progressResult = get().importFromV1();
        const notesMerged = mergeLegacyNotes();
        const takeawaysMerged = mergeTakeawaysFromV1();
        const { resourceMerged, lessonMerged } = mergeBookmarksFromV1();
        const achievementsMerged = migrateAchievementsFromV1();
        const themeMigrated = migrateThemeFromV1(localStorage);
        const srsDatesPreserved = verifySrsDates();

        const parts: string[] = [];
        if (progressResult.success) parts.push("progress");
        if (notesMerged > 0) parts.push(`${notesMerged} legacy notes`);
        if (takeawaysMerged > 0) parts.push(`${takeawaysMerged} takeaways`);
        if (resourceMerged > 0 || lessonMerged > 0) {
          parts.push(`${resourceMerged + lessonMerged} bookmarks`);
        }
        if (themeMigrated) parts.push("theme");
        if (achievementsMerged > 0) parts.push(`${achievementsMerged} achievements`);

        const success =
          progressResult.success ||
          notesMerged > 0 ||
          takeawaysMerged > 0 ||
          resourceMerged > 0 ||
          lessonMerged > 0 ||
          achievementsMerged > 0 ||
          themeMigrated;
        const message = success
          ? `Migration complete: ${parts.join(", ") || "shared keys already present"}.`
          : "No Learn-v1 data found in this browser.";

        if (success) {
          localStorage.setItem(V1_MIGRATION_DONE_AT, new Date().toISOString());
        }

        return {
          success,
          message,
          details: {
            progress: progressResult.success,
            notesMerged,
            takeawaysMerged,
            themeMigrated,
            srsDatesPreserved,
            resourceBookmarksMerged: resourceMerged,
            lessonBookmarksMerged: lessonMerged,
            achievementsMerged,
          },
        };
      },
    }),
    { name: V2_STORAGE_KEY },
  ),
);
