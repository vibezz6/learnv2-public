import { describe, expect, it } from "vitest";
import { labelForPlacement, trackIdForPlacement } from "./placement";

describe("placement", () => {
  it("maps SAT goal to August track", () => {
    expect(trackIdForPlacement("sat")).toBe("sat-august");
  });

  it("maps foundation goal to foundation track", () => {
    expect(trackIdForPlacement("foundation")).toBe("foundation");
  });

  it("leaves track unset for explore", () => {
    expect(trackIdForPlacement("explore")).toBeNull();
  });

  it("labels goals for display", () => {
    expect(labelForPlacement("sat")).toBe("August SAT");
  });
});
