import { getBlockingApplicationItem } from "@/lib/admissionsSummary";
import { isNudgeSnoozed, loadNudgeSnooze } from "@/lib/nudgeSnooze";
import { getDrillQueue } from "@/lib/satDrillQueue";

export const DRILL_QUEUE_TODAY_SNOOZE_ID = "drill-queue-today";
const STALE_MS = 14 * 24 * 60 * 60 * 1000;
const MIN_MISTAKES = 3;

export function isCollegeBlockingWeek(storage: Storage = localStorage, now = new Date()): boolean {
  const blocker = getBlockingApplicationItem(now, undefined, undefined, storage);
  return !!blocker && (blocker.overdue || blocker.daysUntil <= 7);
}

export function shouldShowDrillQueueTodayCard(
  storage: Storage = localStorage,
  now = Date.now(),
): boolean {
  if (isCollegeBlockingWeek(storage, new Date(now))) return false;

  const snooze = loadNudgeSnooze(storage);
  if (isNudgeSnoozed(DRILL_QUEUE_TODAY_SNOOZE_ID, snooze, now)) return false;

  const top = getDrillQueue(1, storage, now)[0];
  if (!top || top.count < MIN_MISTAKES) return false;
  return now - top.latestAt <= STALE_MS;
}
