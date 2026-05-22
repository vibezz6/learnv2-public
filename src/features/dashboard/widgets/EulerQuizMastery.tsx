import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";

interface Props {
  subjects: Subject[];
}

export function EulerQuizMastery({ subjects }: Props) {
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

  if (subjectQuizData.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2 py-4 text-center text-sm text-[var(--text-muted)]">
          <BookOpen size={24} className="text-[var(--accent)]" />
          <p>Take quizzes in lessons to see mastery scores here.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold text-[var(--text-heading)]">Quiz mastery</div>
        <div className="font-mono text-xs text-[var(--text-muted)]" title="Euler mastery index">
          e^(-π(1-x)) = {eulerMastery.toFixed(3)}
        </div>
      </div>
      <div className="mb-3 border-y border-[var(--border)] py-2 text-center text-[11px] text-[var(--text-muted)]">
        e<sup>iπ</sup> + 1 = 0
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
    </Card>
  );
}
