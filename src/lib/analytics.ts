import { getDailyMinimumStatus } from "@/lib/dailyMinimum";
import { getToday } from "@/stores/progress";

const MINIMUM_TRACK_KEY_PREFIX = "learnv2_analytics_minimum_";

export type StudyEventName =
  | "sat_daily_complete"
  | "sat_drill_complete"
  | "minimum_met"
  | "backup_export";

type StudyEventProps = Record<string, string | number | boolean | null>;

/** Public build telemetry is intentionally disabled; keep call sites as no-ops. */
export function isAnalyticsEnabled(): boolean {
  return false;
}

export function trackStudyEvent(
  event: StudyEventName,
  properties?: StudyEventProps,
): void {
  void event;
  void properties;
}

/** Fire `minimum_met` at most once per UTC day when the viable-day threshold is reached. */
export function maybeTrackMinimumMet(storage: Storage = localStorage): void {
  if (!isAnalyticsEnabled()) return;
  const { date, met } = getDailyMinimumStatus(getToday(), storage);
  if (!met) return;
  if (typeof sessionStorage === "undefined") return;

  const key = `${MINIMUM_TRACK_KEY_PREFIX}${date}`;
  if (sessionStorage.getItem(key)) return;

  trackStudyEvent("minimum_met", { date });
  sessionStorage.setItem(key, "1");
}
