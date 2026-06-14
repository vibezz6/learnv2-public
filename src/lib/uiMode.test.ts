import { describe, expect, it } from "vitest";
import { isSimpleMode } from "@/lib/uiMode";

describe("uiMode", () => {
  it("isSimpleMode is true only for simple", () => {
    expect(isSimpleMode("simple")).toBe(true);
    expect(isSimpleMode("full")).toBe(false);
  });
});
