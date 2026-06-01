import { describe, expect, it } from "vitest";
import {
  lockedStepHint,
  OFFICE_HOURS_STEPS,
  OFFICE_HOURS_TAGLINE,
} from "./notesOfficeHours";

describe("notesOfficeHours", () => {
  it("defines three office-hours steps", () => {
    expect(OFFICE_HOURS_STEPS.map((s) => s.id)).toEqual(["editor", "review", "mentor"]);
  });

  it("lockedStepHint explains gating", () => {
    expect(lockedStepHint("review")).toContain("prompt");
    expect(lockedStepHint("mentor")).toContain("TA feedback");
  });

  it("tagline mentions on-device save", () => {
    expect(OFFICE_HOURS_TAGLINE).toContain("device");
  });
});
