import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

function walkSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkSourceFiles(path));
    } else if (/\.(tsx?|jsx?)$/.test(ent.name)) {
      out.push(path);
    }
  }
  return out;
}

function filesContaining(root: string, needle: string | RegExp): string[] {
  return walkSourceFiles(root).filter((file) => {
    const text = readFileSync(file, "utf8");
    return typeof needle === "string" ? text.includes(needle) : needle.test(text);
  });
}

describe("SAT pretest entry IA", () => {
  it("does not link to /sat/pretest from the Today dashboard", () => {
    const hits = filesContaining(join(repoRoot, "src/features/dashboard"), "/sat/pretest");
    expect(hits).toEqual([]);
  });

  it("exposes optional diagnostic on SAT Prep subject page", () => {
    const subjectsDir = join(repoRoot, "src/features/subjects");
    const satDir = join(repoRoot, "src/features/sat");
    const hits = [
      ...filesContaining(subjectsDir, /SatDiagnosticSection|#diagnostic/),
      ...filesContaining(satDir, /SatDiagnosticSection|#diagnostic/),
    ];
    expect(hits.some((p) => p.includes("SatDiagnosticSection"))).toBe(true);
  });

  it("scrolls to #diagnostic on SAT Prep subject detail", () => {
    const detail = readFileSync(
      join(repoRoot, "src/features/subjects/SubjectDetailPage.tsx"),
      "utf8",
    );
    expect(detail).toContain("diagnostic");
  });
});
