import { describe, expect, it, vi } from "vitest";
import { manifest, loadSubjectResult } from "@/curriculum";

describe("curriculum", () => {
  it("loads manifest with all subjects including SAT prep", () => {
    expect(manifest.length).toBe(11);
    expect(manifest.find((m) => m.id === "sat-prep")?.nodeCount).toBe(75);
    expect(manifest.find((m) => m.id === "math")?.nodeCount).toBe(55);
    expect(manifest.find((m) => m.id === "algo-lab")?.nodeCount).toBe(8);
    expect(manifest.reduce((n, m) => n + m.nodeCount, 0)).toBe(321);
  });
});

describe("manifest integrity", () => {
  it("loads every listed subject with a node count that matches its data file", async () => {
    for (const entry of manifest) {
      const result = await loadSubjectResult(entry.id);
      expect(result.status, `${entry.id} should load`).toBe("ok");
      if (result.status !== "ok") continue;
      expect(result.subject.id, entry.id).toBe(entry.id);
      expect(result.subject.nodes.length, entry.id).toBe(entry.nodeCount);
    }
  });
});

describe("loadSubjectResult", () => {
  it("returns not_listed for ids absent from the manifest", async () => {
    await expect(loadSubjectResult("not-a-real-subject")).resolves.toEqual({
      status: "not_listed",
    });
  });

  it("returns missing_file when a listed subject has no data file on disk", async () => {
    vi.resetModules();
    vi.doMock("./data/manifest.json", () => ({
      default: [
        {
          id: "ghost-subject",
          name: "Ghost Subject",
          description: "Listed in manifest but file missing",
          color: "#000000",
          icon: "book",
          nodeCount: 1,
        },
      ],
    }));

    const { loadSubjectResult: loadGhostSubject } = await import("./loader");
    await expect(loadGhostSubject("ghost-subject")).resolves.toEqual({
      status: "missing_file",
    });
  });
});
