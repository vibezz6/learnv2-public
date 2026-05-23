import type { SkillNode, Subject } from "./types";
import manifest from "./data/manifest.json";

export type SubjectManifest = (typeof manifest)[number];

export { manifest };

const cache = new Map<string, Subject>();

export async function loadSubject(id: string): Promise<Subject | undefined> {
  if (cache.has(id)) return cache.get(id);
  if (!manifest.some((m) => m.id === id)) return undefined;
  const mod = await import(`./data/${id}.json`);
  const subject = mod.default as Subject;
  cache.set(id, subject);
  return subject;
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
