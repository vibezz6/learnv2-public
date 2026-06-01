import { describe, expect, it } from "vitest";
import { formatCountdownLabel, getSatCountdown } from "@/lib/satCountdown";

describe("satCountdown", () => {
  it("returns null for missing or malformed dates", () => {
    expect(getSatCountdown(null)).toBeNull();
    expect(getSatCountdown(undefined)).toBeNull();
    expect(getSatCountdown("not-a-date")).toBeNull();
  });

  it("counts whole days until the test", () => {
    const c = getSatCountdown("2026-08-22", "2026-08-12");
    expect(c?.daysUntil).toBe(10);
    expect(c?.past).toBe(false);
  });

  it("flags a passed date", () => {
    const c = getSatCountdown("2026-05-01", "2026-05-29");
    expect(c?.past).toBe(true);
    expect(c?.daysUntil).toBeLessThan(0);
  });

  it("formats human labels", () => {
    expect(formatCountdownLabel(null)).toBe("Set SAT date");
    expect(formatCountdownLabel(getSatCountdown("2026-05-29", "2026-05-29"))).toBe("SAT is today");
    expect(formatCountdownLabel(getSatCountdown("2026-05-30", "2026-05-29"))).toBe("1 day to SAT");
    expect(formatCountdownLabel(getSatCountdown("2026-06-08", "2026-05-29"))).toBe("10 days to SAT");
    expect(formatCountdownLabel(getSatCountdown("2026-05-01", "2026-05-29"))).toBe("SAT date passed");
  });
});
