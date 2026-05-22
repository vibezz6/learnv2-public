import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Target, Zap } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";

export function DashboardPage() {
  const getContinueTarget = useProgress((s) => s.getContinueTarget);
  const getStats = useProgress((s) => s.getStats);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  const target = subjects.length ? getContinueTarget(subjects) : null;
  const stats = subjects.length ? getStats(subjects) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <section className="stagger-item space-y-2">
        <Badge>Batch 2 · Core loop</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
          Neural Command Center
        </h1>
        {stats && (
          <p className="text-[var(--text-muted)]">
            Level {stats.level} · {stats.completedNodes}/{stats.totalNodes} lessons · {stats.totalXp} XP
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card glow className="stagger-item md:col-span-2">
          <div className="mb-3 flex items-center gap-2 text-[var(--accent)]">
            <Target size={18} />
            <span className="font-medium">Continue</span>
          </div>
          {target ? (
            <>
              <h2 className="text-xl font-semibold text-[var(--text-heading)]">{target.node.name}</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{target.subject.name}</p>
              <Link
                to={`/subjects/${target.subject.id}/${target.node.id}`}
                className="mt-4 inline-block"
              >
                <Button>
                  Open lesson
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Import v1 progress in Settings, or start from Subjects.
            </p>
          )}
        </Card>

        <Card className="stagger-item">
          <div className="mb-3 flex items-center gap-2 text-[var(--accent-2)]">
            <Zap size={18} />
            <span className="font-medium">Focus</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Press <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs">F</kbd>{" "}
            to hide chrome and deep-focus on any lesson.
          </p>
        </Card>
      </section>

      <Card className="stagger-item">
        <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
          <Sparkles size={16} />
          <span className="text-sm font-medium">Batch 2 shipped</span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          9 subjects · 231 lessons · lesson page · quiz · v1 progress import · worked examples from v1.
        </p>
        <Link to="/settings" className="mt-3 inline-block text-sm text-[var(--accent)]">
          Import Learn-v1 progress →
        </Link>
      </Card>
    </div>
  );
}
