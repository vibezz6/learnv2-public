import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import { Button, Card, EmptyState, PageContainer, PageHeader, PageLoading } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { Quiz } from "@/features/quiz/QuizPage";
import { buildSatMicroDrill, skillTargetSummary } from "@/lib/satMicroDrills";
import { getDrillKey, getNextDrillCategory, markCategoryDrilled } from "@/lib/satDrillSchedule";
import { isSatSkillId } from "@/lib/satSkills";
import { getToday } from "@/stores/progress";
import { ROUTES } from "@/app/navigation";
import { trackStudyEvent } from "@/lib/analytics";

/**
 * Plays a 5-question micro-drill targeted at the next mistake category due for
 * re-drill (spaced), marking it drilled on completion so the rotation advances.
 */
export function SatDrillPage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [done, setDone] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  const [searchParams] = useSearchParams();
  const skillParam = searchParams.get("skill");
  const target = useMemo(() => {
    if (skillParam && isSatSkillId(skillParam)) {
      const skillTarget = skillTargetSummary(skillParam);
      if (skillTarget) return skillTarget;
    }
    return getNextDrillCategory();
  }, [skillParam]);
  const drill = useMemo(
    () => (subjects ? buildSatMicroDrill(subjects, localStorage, 5, target) : null),
    [subjects, target],
  );

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
        <div className="space-y-3">
          {drill.thin ? (
            <p className="rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-panel)] px-3 py-2 text-xs text-[var(--text-muted)]">
              Limited questions for this skill right now — drilling the closest available items.
            </p>
          ) : null}
          <Quiz
            questions={drill.questions.map((q) => q.question)}
            nodeId={`sat-drill-${getToday()}`}
            subjectId="sat-prep"
            accentColor="var(--accent)"
            persistAttempt={false}
            onComplete={(score, total) => {
              if (target) markCategoryDrilled(getDrillKey(target));
              trackStudyEvent("sat_drill_complete", {
                score,
                total,
                skillId: target?.skillId ?? "auto",
                thin: drill.thin,
              });
              setDone({ score, total });
            }}
          />
        </div>
      )}
    </PageContainer>
  );
}
