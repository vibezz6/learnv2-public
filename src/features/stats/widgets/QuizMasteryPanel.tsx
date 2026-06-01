import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";

interface Props {
  subjects: Subject[];
}

export function QuizMasteryPanel({ subjects }: Props) {
  const [open, setOpen] = useState(false);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const getQuizScoreForNode = useProgress((s) => s.getQuizScoreForNode);

  const subjectQuizData = subjects
    .map((sub) => {
      let totalScore = 0;
      let scoreCount = 0;
      let completedCount = 0;
      sub.nodes.forEach((node) => {
        if (getNodeStatus(node) === "completed") completedCount++;
        const score = getQuizScoreForNode(node.id);
        if (score !== null) {
          totalScore += score;
          scoreCount++;
        }
      });
      return {
        id: sub.id,
        name: sub.name,
        total: sub.nodes.length,
        completed: completedCount,
        avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : null,
        quizCount: scoreCount,
      };
    })
    .filter((s) => s.quizCount > 0);

  const overallPct =
    subjectQuizData.length > 0
      ? Math.round(
          subjectQuizData.reduce((sum, s) => sum + (s.avgScore ?? 0), 0) / subjectQuizData.length,
        )
      : null;
  const sorted = [...subjectQuizData].sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));
  const hasData = subjectQuizData.length > 0;

  return (
    <Card variant="quiet">
      <button
        type="button"
        className="flex min-h-11 w-full touch-manipulation items-center justify-between gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-[var(--text-muted)]" />
          <span className="font-medium text-[var(--text-heading)]">Quiz scores by subject</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          {overallPct !== null ? (
            <span className="font-mono text-xs tabular-nums">{overallPct}% avg</span>
          ) : (
            <span className="text-xs">—</span>
          )}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {!hasData && !open && (
        <div className="mt-2 border-t border-[var(--border)] pt-2">
          <EmptyState
            className="py-10"
            title="No quiz data yet"
            description="Complete lesson quizzes to see average scores by subject."
            actionLabel="Start a quiz"
            actionTo="/subjects"
          />
        </div>
      )}

      {open &&
        (hasData ? (
          <div className="mt-4">
            <div className="flex flex-col gap-2">
              {sorted.map((sub) => {
                const pct = sub.avgScore ?? 0;
                const hue = pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)";
                return (
                  <div key={sub.id} className="flex items-center gap-2">
                    <div className="w-24 truncate text-xs font-medium" title={sub.name}>
                      {sub.name}
                    </div>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: hue }}
                      />
                    </div>
                    <div className="w-10 text-right font-mono text-xs font-semibold" style={{ color: hue }}>
                      {sub.avgScore}%
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {subjectQuizData.length}/{subjects.length} subjects with quiz attempts
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-2 py-2 text-center text-sm text-[var(--text-muted)]">
            <p>Take quizzes in lessons to see scores here.</p>
          </div>
        ))}
    </Card>
  );
}
