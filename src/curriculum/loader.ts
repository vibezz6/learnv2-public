import type { SkillNode, Subject } from "./types";
import manifest from "./data/manifest.json";

export type SubjectManifest = (typeof manifest)[number];

export type LoadSubjectResult =
  | { status: "ok"; subject: Subject }
  | { status: "not_listed" }
  | { status: "missing_file" }
  | { status: "invalid_data"; error: string };

export { manifest };

const cache = new Map<string, Subject>();

export function getManifestEntry(id: string): SubjectManifest | undefined {
  return manifest.find((m) => m.id === id);
}

function isValidSubject(data: unknown): data is Subject {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as Subject).nodes)
  );
}

export async function loadSubjectResult(id: string): Promise<LoadSubjectResult> {
  if (cache.has(id)) {
    return { status: "ok", subject: cache.get(id)! };
  }

  if (!getManifestEntry(id)) {
    return { status: "not_listed" };
  }

  try {
    const mod = await import(`./data/${id}.json`);
    const subject = mod.default;

    if (!isValidSubject(subject)) {
      return { status: "invalid_data", error: "Subject missing nodes array" };
    }

    cache.set(id, subject);
    return { status: "ok", subject };
  } catch {
    return { status: "missing_file" };
  }
}

export async function loadSubject(id: string): Promise<Subject | undefined> {
  const result = await loadSubjectResult(id);
  return result.status === "ok" ? result.subject : undefined;
}

export async function loadAllSubjects(): Promise<Subject[]> {
  return Promise.all(manifest.map((m) => loadSubject(m.id))).then((s) =>
    s.filter((x): x is Subject => x !== undefined),
  );
}

export function getNode(subject: Subject, nodeId: string): SkillNode | undefined {
  return subject.nodes.find((n) => n.id === nodeId);
}

export function getAdjacentLessonNodes(
  subject: Subject,
  nodeId: string,
): { prev: SkillNode; next: SkillNode } | null {
  const currentIdx = subject.nodes.findIndex((n) => n.id === nodeId);
  if (currentIdx === -1 || subject.nodes.length === 0) return null;

  const prev =
    currentIdx > 0
      ? subject.nodes[currentIdx - 1]
      : subject.nodes[subject.nodes.length - 1];
  const next =
    currentIdx < subject.nodes.length - 1
      ? subject.nodes[currentIdx + 1]
      : subject.nodes[0];

  return { prev, next };
}

export function findNodeAcrossSubjects(
  subjects: Subject[],
  nodeId: string,
): { subject: Subject; node: SkillNode } | undefined {
  for (const subject of subjects) {
    const node = getNode(subject, nodeId);
    if (node) return { subject, node };
  }
  return undefined;
}
