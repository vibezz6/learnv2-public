import { describe, expect, it } from "vitest";
import { getToday } from "@/stores/progress";

describe("progress", () => {
  it("getToday uses UTC", () => {
    const d = new Date();
    const expected = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    expect(getToday()).toBe(expected);
  });
});
