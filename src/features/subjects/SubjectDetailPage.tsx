import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Lock, CheckCircle2 } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { loadSubject } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";

export function SubjectDetailPage() {
  const { subjectId = "" } = useParams();
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const [subject, setSubject] = useState<Subject | null>(null);

  useEffect(() => {
    loadSubject(subjectId).then((s) => setSubject(s ?? null));
  }, [subjectId]);

  if (!subject) {
    return <div className="p-8 text-[var(--text-muted)]">Loading subject…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <Link
        to="/subjects"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ChevronLeft size={16} />
        Subjects
      </Link>
      <div>
        <Badge>{subject.id}</Badge>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-heading)]">{subject.name}</h1>
        <p className="text-[var(--text-muted)]">{subject.description}</p>
      </div>
      <div className="space-y-2">
        {subject.nodes.map((node) => {
          const status = getNodeStatus(node);
          return (
            <Link
              key={node.id}
              to={status === "locked" ? "#" : `/subjects/${subject.id}/${node.id}`}
              className={status === "locked" ? "pointer-events-none opacity-50" : ""}
            >
              <Card className="stagger-item flex items-start justify-between gap-4 transition hover:border-[var(--accent)]/30">
                <div>
                  <h2 className="font-semibold text-[var(--text-heading)]">{node.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{node.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-xs text-[var(--accent)]">{node.xpValue} XP</span>
                  {status === "completed" && (
                    <CheckCircle2 size={16} className="text-[var(--success)]" />
                  )}
                  {status === "locked" && <Lock size={16} className="text-[var(--warning)]" />}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      <Link to="/subjects">
        <Button variant="secondary">All subjects</Button>
      </Link>
    </div>
  );
}
