import { getToday } from "@/stores/progress";

export interface SatCountdown {
  date: string;
  daysUntil: number;
  /** True when the stored date is in the past. */
  past: boolean;
}

/**
 * Whole days from today (UTC) until the given SAT date. Returns null when no
 * date is set or the value is malformed.
 */
export function getSatCountdown(
  satTestDate: string | null | undefined,
  today: string = getToday(),
): SatCountdown | null {
  if (!satTestDate) return null;
  const target = Date.parse(`${satTestDate}T00:00:00Z`);
  const start = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(target) || Number.isNaN(start)) return null;
  const daysUntil = Math.round((target - start) / 86_400_000);
  return { date: satTestDate, daysUntil, past: daysUntil < 0 };
}

export function formatCountdownLabel(countdown: SatCountdown | null): string {
  if (!countdown) return "Set SAT date";
  if (countdown.past) return "SAT date passed";
  if (countdown.daysUntil === 0) return "SAT is today";
  if (countdown.daysUntil === 1) return "1 day to SAT";
  return `${countdown.daysUntil} days to SAT`;
}
