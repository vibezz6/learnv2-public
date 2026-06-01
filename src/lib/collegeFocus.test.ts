import { describe, expect, it } from "vitest";
import { ROUTES } from "@/app/navigation";
import {
  collegeNameFromPackageHref,
  getCollegeSessionNextSteps,
  isCollegeFocusHref,
} from "./collegeFocus";

describe("collegeFocus", () => {
  it("detects campus hrefs but not SAT", () => {
    expect(isCollegeFocusHref(ROUTES.college)).toBe(true);
    expect(isCollegeFocusHref(`${ROUTES.applicationPackage}?college=MIT`)).toBe(true);
    expect(isCollegeFocusHref(ROUTES.satDrill)).toBe(false);
    expect(isCollegeFocusHref(ROUTES.sat)).toBe(false);
  });

  it("parses college from package href", () => {
    expect(collegeNameFromPackageHref(`${ROUTES.applicationPackage}?college=Stanford`)).toBe(
      "Stanford",
    );
  });

  it("returns package next step when college known", () => {
    const steps = getCollegeSessionNextSteps(
      `${ROUTES.applicationPackage}?college=MIT`,
    );
    expect(steps[0]?.label).toContain("MIT");
    expect(steps[0]?.href).toContain("college=");
  });
});
