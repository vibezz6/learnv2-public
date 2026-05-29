import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadReminderPrefs,
  REMINDER_PREFS_KEY,
  runReminderCheck,
  saveReminderPrefs,
} from "@/lib/reminders";
import { recordStudyActivity } from "@/lib/studyActivity";

function mockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => map.set(k, v),
  } as Storage;
}

describe("reminders", () => {
  let storage: Storage;
  let shown: Array<{ title: string; body: string }>;

  beforeEach(() => {
    storage = mockStorage();
    shown = [];
    vi.stubGlobal("localStorage", storage);
    // Minimal granted Notification stub that records each notification.
    class FakeNotification {
      static permission: NotificationPermission = "granted";
      static requestPermission = async () => "granted" as NotificationPermission;
      onclick: (() => void) | null = null;
      constructor(public title: string, public options?: NotificationOptions) {
        shown.push({ title, body: options?.body ?? "" });
      }
      close() {}
    }
    vi.stubGlobal("Notification", FakeNotification);
    // Pretend there is no service worker registration so it uses `new Notification`.
    vi.stubGlobal("navigator", { serviceWorker: { getRegistration: async () => undefined } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to disabled", () => {
    expect(loadReminderPrefs(storage).enabled).toBe(false);
  });

  it("does not notify when disabled", async () => {
    await runReminderCheck(new Date("2026-05-29T17:00:00"), storage);
    expect(shown).toHaveLength(0);
  });

  it("fires the daily nudge after the study time when the minimum is unmet", async () => {
    saveReminderPrefs(
      { enabled: true, dailyTime: "16:00", eveningSave: true, eveningTime: "20:30" },
      storage,
    );
    await runReminderCheck(new Date("2026-05-29T16:30:00"), storage);
    expect(shown).toHaveLength(1);
    expect(shown[0].title).toContain("SAT");
  });

  it("does not fire once the minimum is met", async () => {
    saveReminderPrefs(
      { enabled: true, dailyTime: "16:00", eveningSave: true, eveningTime: "20:30" },
      storage,
    );
    recordStudyActivity({ type: "lesson_completed", nodeId: "st1" }, storage);
    await runReminderCheck(new Date("2026-05-29T16:30:00"), storage);
    expect(shown).toHaveLength(0);
  });

  it("only fires the daily nudge once per day", async () => {
    saveReminderPrefs(
      { enabled: true, dailyTime: "16:00", eveningSave: false, eveningTime: "20:30" },
      storage,
    );
    await runReminderCheck(new Date("2026-05-29T16:30:00"), storage);
    await runReminderCheck(new Date("2026-05-29T16:45:00"), storage);
    expect(shown).toHaveLength(1);
  });

  it("does not fire before the configured study time", async () => {
    saveReminderPrefs(
      { enabled: true, dailyTime: "16:00", eveningSave: false, eveningTime: "20:30" },
      storage,
    );
    await runReminderCheck(new Date("2026-05-29T09:00:00"), storage);
    expect(shown).toHaveLength(0);
    expect(storage.getItem(REMINDER_PREFS_KEY)).toContain("16:00");
  });
});
