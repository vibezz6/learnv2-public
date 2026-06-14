import { isMinimumMet } from "@/lib/dailyMinimum";
import { getSatCountdown } from "@/lib/satCountdown";
import { hasActivitySince, REAL_STUDY_ACTIVITY_TYPES } from "@/lib/studyActivity";
import { resolveCurrentStudyStreak, useProgress } from "@/stores/progress";
import { usePreferences } from "@/stores/preferences";
import { includeSat } from "@/lib/buildFeatures";

export const REMINDER_PREFS_KEY = "learnv2_reminders_v1";
const REMINDER_FIRED_KEY = "learnv2_reminders_fired_v1";

export interface ReminderPrefs {
  enabled: boolean;
  /** Local "HH:MM" — the daily "time to study" nudge. */
  dailyTime: string;
  /** Fire an evening "your streak is at risk" nudge if the minimum is unmet. */
  eveningSave: boolean;
  /** Local "HH:MM" — when the evening streak-save fires. */
  eveningTime: string;
}

const DEFAULT_PREFS: ReminderPrefs = {
  enabled: false,
  dailyTime: "16:00",
  eveningSave: true,
  eveningTime: "20:30",
};

export function loadReminderPrefs(storage: Storage = localStorage): ReminderPrefs {
  try {
    const raw = storage.getItem(REMINDER_PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    return {
      enabled: Boolean(parsed.enabled),
      dailyTime: typeof parsed.dailyTime === "string" ? parsed.dailyTime : DEFAULT_PREFS.dailyTime,
      eveningSave: parsed.eveningSave !== false,
      eveningTime:
        typeof parsed.eveningTime === "string" ? parsed.eveningTime : DEFAULT_PREFS.eveningTime,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveReminderPrefs(prefs: ReminderPrefs, storage: Storage = localStorage): void {
  try {
    storage.setItem(REMINDER_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* quota */
  }
}

export function notificationsSupported(): boolean {
  return typeof Notification !== "undefined";
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => Number.parseInt(n, 10));
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

function localDateKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

interface FiredState {
  daily: string | null;
  evening: string | null;
}

function loadFired(storage: Storage = localStorage): FiredState {
  try {
    const raw = storage.getItem(REMINDER_FIRED_KEY);
    if (!raw) return { daily: null, evening: null };
    const parsed = JSON.parse(raw) as Partial<FiredState>;
    return { daily: parsed.daily ?? null, evening: parsed.evening ?? null };
  } catch {
    return { daily: null, evening: null };
  }
}

function saveFired(state: FiredState, storage: Storage = localStorage): void {
  try {
    storage.setItem(REMINDER_FIRED_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

async function showStudyNotification(title: string, body: string): Promise<void> {
  if (getNotificationPermission() !== "granted") return;
  const options: NotificationOptions = {
    body,
    icon: `${import.meta.env.BASE_URL}favicon.svg`,
    badge: `${import.meta.env.BASE_URL}favicon.svg`,
    tag: "learnv2-study-reminder",
  };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return;
      }
    }
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* notifications can throw on some platforms; fail silently */
  }
}

function streakLine(): string {
  const streak = resolveCurrentStudyStreak(useProgress.getState().data.streaks);
  const countdown = getSatCountdown(usePreferences.getState().satTestDate);
  const parts: string[] = [];
  if (streak > 0) parts.push(`${streak}-day streak on the line`);
  if (includeSat && countdown && !countdown.past) {
    parts.push(countdown.daysUntil === 1 ? "1 day to the SAT" : `${countdown.daysUntil} days to the SAT`);
  }
  return parts.join(" · ");
}

export function getReminderFiredState(storage: Storage = localStorage): {
  daily: string | null;
  evening: string | null;
} {
  return loadFired(storage);
}

/** Most recent reminder fire date (YYYY-MM-DD) across types, or null. */
export function getLastReminderDate(storage: Storage = localStorage): string | null {
  const fired = loadFired(storage);
  const dates = [fired.daily, fired.evening].filter((d): d is string => !!d);
  return dates.length ? dates.sort().at(-1)! : null;
}

/** Fire a one-off notification so the user can confirm reminders work. */
export async function sendTestNotification(): Promise<boolean> {
  if (getNotificationPermission() !== "granted") return false;
  await showStudyNotification(
    "Reminders are on",
    "This is a test nudge. Real ones fire while a Learn v2 tab is open.",
  );
  return true;
}

/** Run a single reminder check. Exported for tests; called on an interval. */
export async function runReminderCheck(now: Date = new Date(), storage: Storage = localStorage): Promise<void> {
  const prefs = loadReminderPrefs(storage);
  if (!prefs.enabled || getNotificationPermission() !== "granted") return;
  if (isMinimumMet(undefined, storage)) return; // nothing to nudge once today is done
  // Cross-midnight guard: storage days are UTC but reminders run on local time, so
  // if real study happened in the last 12h, don't nag even if the UTC day rolled over.
  if (hasActivitySince(REAL_STUDY_ACTIVITY_TYPES, now.getTime() - 12 * 60 * 60 * 1000, storage)) {
    return;
  }

  const today = localDateKey(now);
  const fired = loadFired(storage);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const level = usePreferences.getState().accountabilityLevel;
  const sub = streakLine();

  if (fired.daily !== today && nowMin >= toMinutes(prefs.dailyTime)) {
    await showStudyNotification(
      "Time for your SAT rep",
      sub ? `One focused session keeps it going — ${sub}.` : "One focused session is today's win.",
    );
    fired.daily = today;
    saveFired(fired, storage);
    return;
  }

  if (
    prefs.eveningSave &&
    level !== "gentle" &&
    fired.evening !== today &&
    nowMin >= toMinutes(prefs.eveningTime)
  ) {
    await showStudyNotification(
      level === "strict" ? "Don't break the chain" : "Your streak is at risk",
      sub ? `You haven't logged study today — ${sub}.` : "You haven't logged study today. One action saves it.",
    );
    fired.evening = today;
    saveFired(fired, storage);
  }
}

let intervalId: number | null = null;

/** Start the in-app reminder scheduler (fires only while a tab is open). */
export function initReminders(): void {
  if (typeof window === "undefined" || intervalId !== null) return;
  const tick = () => {
    void runReminderCheck();
  };
  window.setTimeout(tick, 12_000);
  intervalId = window.setInterval(tick, 60_000);
}
