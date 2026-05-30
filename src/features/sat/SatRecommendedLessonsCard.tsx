import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Button, Card, Row, Tag } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import type { SkillNode } from "@/curriculum/types";
import type { NodeStatus } from "@/lib/campusHome";
import { buildSatGapLessonManifest } from "@/lib/satGapLessonManifest";
import { getSatRecommendedLessons } from "@/lib/satRecommendedLessons";

interface Props {
  subjects: Subject[];
  getNodeStatus: (node: SkillNode) => NodeStatus;
}

export function SatRecommendedLessonsCard({ subjects, getNodeStatus }: Props) {
  const plan = getSatRecommendedLessons(subjects, getNodeStatus);
  const gapManifest = buildSatGapLessonManifest(subjects);
  const proposedRows = gapManifest?.rows.filter((row) => row.status === "proposed_new") ?? [];

  const heading =
    plan.source === "lesson_plan"
      ? "Recommended from Cursor lesson plan"
      : plan.source === "pretest_gaps"
        ? "From your baseline misses"
        : plan.source === "track_next"
          ? "Recommended next"
          : "SAT lesson suggestions";

  const subcopy =
    plan.source === "lesson_plan"
      ? "Imported on the Draft 2 tab — study these before or after Draft 2."
      : plan.source === "pretest_gaps"
        ? "These lessons map to questions you missed on the optional baseline."
        : plan.source === "track_next"
          ? plan.draft1Complete
            ? "No open gap lessons — continue the August SAT track."
            : "Follow the track now; optional baseline adds gap targeting when you are ready."
          : plan.emptyMessage;

  return (
    <Card id="recommended" variant="default" density="normal" className="min-w-0 scroll-mt-6 space-y-3">
      <div className="flex items-start gap-3 border-b border-[var(--rule)] pb-3">
        <Sparkles size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-[var(--text-heading)]">{heading}</p>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">{subcopy}</p>
        </div>
      </div>

      {plan.lessons.length > 0 ? (
        <ul className="space-y-2">
          {plan.lessons.map((lesson) => (
            <li key={lesson.nodeId}>
              <Row
                to={`/subjects/${lesson.subjectId}/${lesson.nodeId}`}
                title={lesson.title}
                detail={lesson.reason}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Link to="#diagnostic" className="inline-block">
          <Button variant="secondary" size="sm">
            <BookOpen size={13} aria-hidden />
            Optional diagnostic
          </Button>
        </Link>
      )}

      {proposedRows.length > 0 ? (
        <section className="space-y-2 rounded-[var(--radius)] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-3">
          <div className="flex items-center gap-2">
            <ArrowRight size={12} aria-hidden className="text-[var(--warning-fg)]" />
            <p className="eyebrow-mono text-[var(--warning-fg)]">Pending curriculum gaps</p>
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            These node ids are in your imported lesson plan but not in sat-prep.json yet. See{" "}
            <code className="font-mono text-[11px]">docs/sat-gap-lesson-authoring.md</code>.
          </p>
          <ul className="space-y-2 text-sm">
            {proposedRows.map((row) => (
              <li
                key={row.nodeId}
                className="rounded-[var(--radius-sm)] border border-[var(--rule)] bg-[var(--bg-panel)] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[var(--accent)]">{row.nodeId}</span>
                  <Tag tone="warning" size="sm" mono>
                    Proposed
                  </Tag>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{row.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Card>
  );
}
