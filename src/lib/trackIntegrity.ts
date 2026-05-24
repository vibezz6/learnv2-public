import type { LearningTrack, TrackLesson } from "@/data/tracks";
import type { SkillNode, Subject } from "@/curriculum/types";

export const COMING_SOON_TITLE = "Coming soon";

export function resolveTrackLesson(
  subjectId: string,
  nodeId: string,
  subjects: Subject[],
): { subject: Subject; node: SkillNode } | null {
  const subject = subjects.find((s) => s.id === subjectId);
  const node = subject?.nodes.find((n) => n.id === nodeId);
  if (!subject || !node) return null;
  return { subject, node };
}

export function isTrackLessonAvailable(lesson: TrackLesson, subjects: Subject[]): boolean {
  return resolveTrackLesson(lesson.subjectId, lesson.nodeId, subjects) !== null;
}

export function countAvailableTrackLessons(track: LearningTrack, subjects: Subject[]): number {
  return track.lessons.filter((lesson) => isTrackLessonAvailable(lesson, subjects)).length;
}
