import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, GraduationCap } from "lucide-react";
import { Button, Card, EmptyState, PageContainer, PageHeader, PageLoading, Tag } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { Quiz } from "@/features/quiz/QuizPage";
import {
  getDailySatQuiz,
  getDailySatQuizResult,
  isDailySatQuizDone,
  markDailySatQuizDone,
} from "@/lib/satDailyQuiz";
import { getToday } from "@/stores/progress";
import { ROUTES } from "@/app/navigation";

export function DailySatQuizPage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [done, setDone] = useState(() => isDailySatQuizDone());
  const today = getToday();

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  const quiz = useMemo(() => (subjects ? getDailySatQuiz(subjects, today) : null), [subjects, today]);
  const result = getDailySatQuizResult(today);

  if (!subjects || !quiz) return <PageLoading size="md" />;

  return (
    <PageContainer size="md" className="space-y-6">
      <PageHeader
        eyebrow="SAT warm-up"
        title="Daily 5"
        subtitle="Five mixed SAT questions, fresh every day. A two-minute way to keep the chain alive."
        backTo={{ to: ROUTES.sat, label: "SAT Prep" }}
      />

      {quiz.questions.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={20} />}
          title="No SAT questions available yet"
          description="The SAT question bank could not be loaded. Try the August track instead."
          actionLabel="Open SAT Prep"
          actionTo={ROUTES.sat}
        />
      ) : done ? (
        <Card variant="primary" className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--success)]">
            <CheckCircle2 size={18} aria-hidden />
            <h2 className="text-lg font-semibold text-[var(--text-heading)]">Daily 5 done</h2>
          </div>
          {result ? (
            <p className="font-mono text-2xl tabular-nums text-[var(--accent)]">
              {result.score}/{result.total}
            </p>
          ) : null}
          <p className="text-sm text-[var(--text-muted)]">
            Nice — that counts toward today's minimum. Come back tomorrow for a fresh set.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to={ROUTES.satMistakes}>
              <Button variant="secondary">
                Log a mistake
                <ArrowRight size={14} aria-hidden />
              </Button>
            </Link>
            <Link to={ROUTES.sat}>
              <Button variant="secondary">Next track lesson</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <Tag tone="accent" size="sm" mono>
            {quiz.questions.length} questions
          </Tag>
          <Quiz
            questions={quiz.questions}
            nodeId={quiz.id}
            subjectId="sat-prep"
            accentColor="var(--accent)"
            persistAttempt={false}
            onComplete={(score, total) => {
              markDailySatQuizDone({ date: today, score, total });
              setDone(true);
            }}
          />
        </div>
      )}
    </PageContainer>
  );
}
