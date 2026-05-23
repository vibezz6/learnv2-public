import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";

interface Props {
  subjects: Subject[];
}

export function EulerQuizMastery({ subjects }: Props) {
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
        mastery: scoreCount > 0 ? totalScore / scoreCount / 100 : 0,
      };
    })
    .filter((s) => s.quizCount > 0);

  const overallPct =
    subjectQuizData.length > 0
      ? subjectQuizData.reduce((a, b) => a + b.mastery, 0) / subjectQuizData.length
      : 0;
  const eulerMastery = Math.exp(-Math.PI * (1 - overallPct));
  const sorted = [...subjectQuizData].sort((a, b) => b.mastery - a.mastery);

  const hasData = subjectQuizData.length > 0;

  return (
    <Card>
      <button
        type="button"
        className="flex min-h-11 w-full touch-manipulation items-center justify-between gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-[var(--accent-2)]" />
          <span className="font-semibold text-[var(--text-heading)]">Quiz Mastery</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          {hasData ? (
            <span className="font-mono text-xs">{Math.round(overallPct * 100)}% avg</span>
          ) : (
            <span className="text-xs">no data</span>
          )}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        hasData ? (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-mono text-xs text-[var(--text-muted)]" title="Euler mastery index">
                e^(-π(1-x)) = {eulerMastery.toFixed(3)}
              </div>
              <div className="border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                e<sup>iπ</sup> + 1 = 0
              </div>
            </div>
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
              {subjectQuizData.length}/{subjects.length} subjects · {Math.round(overallPct * 100)}% avg
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-2 py-2 text-center text-sm text-[var(--text-muted)]">
            <p>Take quizzes in lessons to see mastery scores here.</p>
          </div>
        )
      )}
    </Card>
  );
}
