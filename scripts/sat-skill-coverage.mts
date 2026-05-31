/**
 * SAT per-skill MC question coverage report.
 * Run: npm run sat:coverage
 * Strict (CI): npm run sat:coverage -- --strict
 * Math only: npm run sat:coverage -- --section=math
 */
import { loadSubjectResult } from "../src/curriculum/index.ts";
import {
  buildSatSkillCoverageReport,
  formatCoverageTable,
  gapDrillMcCounts,
  getCoverageFailures,
  SAT_COVERAGE_STRETCH_TARGET,
  SAT_COVERAGE_TARGET,
  unmappedSatNodes,
} from "../src/lib/satSkillCoverage.ts";
import type { SatSection } from "../src/lib/satSkills.ts";

// Re-export for script-only; satSkillCoverage uses relative imports (no @/) for tsx CLI.

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const sectionArg = args.find((a) => a.startsWith("--section="));
const sectionFilter = sectionArg?.split("=")[1] as SatSection | undefined;
const targetArg = args.find((a) => a.startsWith("--target="));
const reportTarget = targetArg
  ? Number(targetArg.split("=")[1])
  : strict
    ? SAT_COVERAGE_TARGET
    : SAT_COVERAGE_TARGET;
const stretchMode = reportTarget === SAT_COVERAGE_STRETCH_TARGET && !strict;

const result = await loadSubjectResult("sat-prep");
if (result.status !== "ok") {
  console.error("Failed to load sat-prep:", result.status);
  process.exit(1);
}

const unmapped = unmappedSatNodes(result.subject);
if (unmapped.length > 0) {
  console.warn("Unmapped nodes:", unmapped.join(", "));
}

let rows = buildSatSkillCoverageReport(result.subject, reportTarget);
if (sectionFilter === "math" || sectionFilter === "rw") {
  rows = rows.filter((r) => r.section === sectionFilter);
}

const label = stretchMode ? "stretch" : "minimum";
console.log(`\nSAT skill MC coverage (${label} target ≥${reportTarget} per content skill)\n`);
console.log(formatCoverageTable(rows));

const gaps = gapDrillMcCounts(result.subject);
console.log("\nGap drills (st76–st80):");
for (const g of gaps) {
  const ok = g.count >= SAT_COVERAGE_TARGET ? "✓" : g.count >= 2 ? "~" : "✗";
  console.log(`  ${ok} ${g.nodeId}: ${g.count} MC`);
}

const failures = getCoverageFailures(rows, reportTarget);
const totalDeficit = failures.reduce((n, r) => n + r.deficit, 0);
console.log(
  `\n${failures.length} skill(s) below target${sectionFilter ? ` (${sectionFilter})` : ""}; ${totalDeficit} MC items needed.`,
);

if (strict) {
  const gapFails = gaps.filter((g) => g.count < SAT_COVERAGE_TARGET);
  if (failures.length > 0 || gapFails.length > 0) {
    console.error("\nStrict mode: coverage gate failed.");
    process.exit(1);
  }
  console.log("\nStrict mode: all content skills and gap drills meet target.");
} else if (stretchMode && failures.length > 0) {
  console.log(`\nStretch report: ${failures.length} skill(s) still below ${reportTarget} (non-blocking).`);
}
