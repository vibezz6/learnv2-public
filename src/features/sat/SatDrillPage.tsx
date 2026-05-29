import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import { Button, Card, EmptyState, PageContainer, PageHeader, PageLoading } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { Quiz } from "@/features/quiz/QuizPage";
import { buildSatMicroDrill } from "@/lib/satMicroDrills";
import { getToday } from "@/stores/progress";
import { ROUTES } from "@/app/navigation";

/** Plays a 5-question micro-drill targeted at your top logged mistake category. */
export function SatDrillPage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [done, setDone] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  const drill = useMemo(() => (subjects ? buildSatMicroDrill(subjects) : null), [subjects]);

  if (!subjects || !drill) return <PageLoading size="md" />;

  return (
    <PageContainer size="md" className="space-y-6">
      <PageHeader
        eyebrow="Targeted drill"
        title={drill.title}
        subtitle={drill.reason}
        backTo={{ to: ROUTES.sat, label: "SAT Prep" }}
      />

      {drill.questions.length === 0 ? (
        <EmptyState
          icon={<Target size={20} />}
          title="No drill questions yet"
          description="Log a few SAT mistakes so drills can target your weak spots."
          actionLabel="Open mistake log"
          actionTo={ROUTES.satMistakes}
        />
      ) : done ? (
        <Card variant="primary" className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--success)]">
            <CheckCircle2 size={18} aria-hidden />
            <h2 className="text-lg font-semibold text-[var(--text-heading)]">Drill complete</h2>
          </div>
          <p className="font-mono text-2xl tabular-nums text-[var(--accent)]">
            {done.score}/{done.total}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            That counts toward today's minimum. Log any new misses to keep drills sharp.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to={ROUTES.satMistakes}>
              <Button variant="secondary">
                Mistake log
                <ArrowRight size={14} aria-hidden />
              </Button>
            </Link>
            <Button onClick={() => setDone(null)}>Drill again</Button>
          </div>
        </Card>
      ) : (
        <Quiz
          questions={drill.questions.map((q) => q.question)}
          nodeId={`sat-drill-${getToday()}`}
          subjectId="sat-prep"
          accentColor="var(--accent)"
          onComplete={(score, total) => setDone({ score, total })}
        />
      )}
    </PageContainer>
  );
}
