import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nodeIdFromHref, useFocusSession } from "@/stores/focusSession";
import { useProgress, getToday } from "@/stores/progress";

describe("focusSession", () => {
  beforeEach(() => {
    useProgress.getState().resetProgress();
    useFocusSession.setState({ active: null, summary: null });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("nodeIdFromHref extracts a lesson node id, ignores hubs", () => {
    expect(nodeIdFromHref("/subjects/sat-prep/st4")).toBe("st4");
    expect(nodeIdFromHref("/subjects/sat-prep#mistakes")).toBeUndefined();
    expect(nodeIdFromHref("/subjects/sat-prep")).toBeUndefined();
  });

  it("start sets an active session", () => {
    useFocusSession.getState().startSession({ label: "SAT focus", href: "/subjects/sat-prep/st1", nodeId: "st1", focus: false });
    const active = useFocusSession.getState().active;
    expect(active?.label).toBe("SAT focus");
    expect(active?.nodeId).toBe("st1");
  });

  it("finish logs measured minutes and produces a summary", () => {
    useFocusSession.getState().startSession({ label: "SAT focus", href: "/x", focus: false });
    vi.advanceTimersByTime(25 * 60 * 1000); // 25 minutes
    useFocusSession.getState().finishSession();
    const { active, summary } = useFocusSession.getState();
    expect(active).toBeNull();
    expect(summary?.minutes).toBe(25);
    // measured minutes credited to the day + streak advanced
    expect(useProgress.getState().data.dailyMinutes[getToday()]).toBe(25);
    expect(useProgress.getState().data.streaks.current).toBe(1);
  });

  it("caps absurdly long sessions at 3 hours", () => {
    useFocusSession.getState().startSession({ label: "left open", href: "/x", focus: false });
    vi.advanceTimersByTime(10 * 60 * 60 * 1000); // 10 hours
    useFocusSession.getState().finishSession();
    expect(useFocusSession.getState().summary?.minutes).toBe(180);
  });

  it("cancel clears the session without a summary or minutes", () => {
    useFocusSession.getState().startSession({ label: "SAT focus", href: "/x", focus: false });
    vi.advanceTimersByTime(5 * 60 * 1000);
    useFocusSession.getState().cancelSession();
    expect(useFocusSession.getState().active).toBeNull();
    expect(useFocusSession.getState().summary).toBeNull();
    expect(useProgress.getState().data.dailyMinutes[getToday()] ?? 0).toBe(0);
  });

  it("uses safe persist storage for corrupt focus-session state", async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      get length() {
        return storage.size;
      },
      clear: () => storage.clear(),
      getItem: (k: string) => storage.get(k) ?? null,
      key: (i: number) => [...storage.keys()][i] ?? null,
      removeItem: (k: string) => storage.delete(k),
      setItem: (k: string, v: string) => storage.set(k, v),
    } satisfies Storage);
    localStorage.setItem("learnv2_focus_session_v1", "{ nope");
    vi.resetModules();

    const { useFocusSession: freshStore } = await import("@/stores/focusSession");

    expect(freshStore.getState().active).toBeNull();
    expect(localStorage.getItem("learnv2_focus_session_v1")).toBeNull();
    const corruptKey = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).find(
      (key) => key?.startsWith("learnv2_focus_session_v1_corrupt_"),
    );
    expect(corruptKey).toBeTruthy();
  });
});
