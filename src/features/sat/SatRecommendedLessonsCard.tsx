import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import type { SkillNode } from "@/curriculum/types";
import type { NodeStatus } from "@/lib/campusHome";
import { getSatRecommendedLessons } from "@/lib/satRecommendedLessons";

interface Props {
  subjects: Subject[];
  getNodeStatus: (node: SkillNode) => NodeStatus;
}

export function SatRecommendedLessonsCard({ subjects, getNodeStatus }: Props) {
  const plan = getSatRecommendedLessons(subjects, getNodeStatus);

  const heading =
    plan.source === "pretest_gaps"
      ? "Recommended from Draft 1 gaps"
      : plan.source === "track_next"
        ? "Recommended next"
        : "SAT lesson suggestions";

  const subcopy =
    plan.source === "pretest_gaps"
      ? "These lessons map to questions you missed on the diagnostic."
      : plan.source === "track_next"
        ? plan.draft1Complete
          ? "No open gap lessons — continue the August SAT track."
          : "Follow the track now; Draft 1 adds gap targeting when you are ready."
        : plan.emptyMessage;

  return (
    <Card id="recommended" className="min-w-0 scroll-mt-6 space-y-4 p-5">
      <div className="flex items-start gap-3">
        <Sparkles size={18} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-semibold text-[var(--text-heading)]">{heading}</h2>
          <p className="text-sm text-[var(--text-muted)]">{subcopy}</p>
        </div>
      </div>

      {plan.lessons.length > 0 ? (
        <ul className="space-y-2">
          {plan.lessons.map((lesson) => (
            <li key={lesson.nodeId}>
              <Link
                to={`/subjects/${lesson.subjectId}/${lesson.nodeId}`}
                className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm transition-colors hover:border-[var(--accent)]"
              >
                <span className="min-w-0">
                  <span className="font-medium text-[var(--text-heading)]">{lesson.title}</span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                    {lesson.reason}
                  </span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-[var(--text-muted)]" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Link to="/sat/pretest" className="inline-block">
          <Button variant="secondary" className="min-h-11 touch-manipulation">
            <BookOpen size={14} />
            Open SAT diagnostic
          </Button>
        </Link>
      )}
    </Card>
  );
}
