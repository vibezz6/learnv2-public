import { describe, expect, it, beforeEach } from "vitest";
import { getToday, useProgress } from "@/stores/progress";

describe("progress", () => {
  beforeEach(() => {
    useProgress.getState().resetProgress();
  });

  it("getToday uses UTC", () => {
    const d = new Date();
    const expected = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    expect(getToday()).toBe(expected);
  });

  it("addStudyTime updates daily minutes and streak", () => {
    useProgress.getState().addStudyTime(600);
    const data = useProgress.getState().data;
    expect(data.totalStudyMinutes).toBe(10);
    expect(data.dailyMinutes[getToday()]).toBe(10);
    expect(data.streaks.current).toBe(1);
  });

  it("completeDailyChallenge awards XP once per day", () => {
    useProgress.getState().completeDailyChallenge("dc001", 25);
    useProgress.getState().completeDailyChallenge("dc001", 25);
    expect(useProgress.getState().data.totalXp).toBe(25);
  });

  it("exportData returns valid JSON with version", () => {
    const exported = useProgress.getState().exportData();
    const parsed = JSON.parse(exported) as { version: number; keys: Record<string, string | null> };
    expect(parsed.version).toBe(2);
    expect(typeof parsed.keys).toBe("object");
  });

  it("resetProgress clears data", () => {
    useProgress.getState().completeNode("m1", 50);
    useProgress.getState().resetProgress();
    expect(useProgress.getState().data.totalXp).toBe(0);
  });
});
