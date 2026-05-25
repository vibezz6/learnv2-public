import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("SAT pretest entry IA", () => {
  it("does not link to /sat/pretest from the Today dashboard", () => {
    const hits = execSync('rg -l "/sat/pretest" src/features/dashboard 2>/dev/null || true', {
      encoding: "utf8",
      cwd: new URL("../..", import.meta.url).pathname,
    }).trim();
    expect(hits).toBe("");
  });

  it("exposes optional diagnostic on SAT Prep subject page", () => {
    const src = execSync('rg -l "SatDiagnosticSection|#diagnostic" src/features/subjects src/features/sat 2>/dev/null', {
      encoding: "utf8",
      cwd: new URL("../..", import.meta.url).pathname,
    });
    expect(src).toContain("SatDiagnosticSection");
  });
});
