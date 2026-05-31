import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Target } from "lucide-react";
import { ROUTES } from "@/app/navigation";
import { Button, Card, Tag } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { getDrillQueue, markSkillDrilled } from "@/lib/satDrillQueue";
import { getSatSkillMastery, type SatSkillMasteryRow } from "@/lib/satSkillMastery";

function masterySubline(row: SatSkillMasteryRow | undefined): string | null {
  if (!row) return null;
  const misses = `${row.mistakeCount} ${row.mistakeCount === 1 ? "miss" : "misses"}`;
  if (!row.diagnostic) return row.mistakeCount > 0 ? misses : null;
  const base = `${row.diagnostic.correct}/${row.diagnostic.total} on diagnostic · ${misses}`;
  return `${base} (last diagnostic)`;
}

export function SatDrillQueueSection({ subject }: { subject: Subject }) {
  const [revision, setRevision] = useState(0);

  const queue = useMemo(() => {
    void revision;
    return getDrillQueue(5);
  }, [revision]);

  const masteryBySkill = useMemo(() => {
    void revision;
    return new Map(getSatSkillMastery([subject]).map((row) => [row.skillId, row]));
  }, [subject, revision]);

  const refresh = useCallback(() => setRevision((r) => r + 1), []);

  if (queue.length === 0) return null;

  return (
    <Card variant="default" density="normal" className="min-w-0">
      <div className="flex items-center gap-2 border-b border-[var(--rule)] pb-3">
        <Target size={14} className="text-[var(--text-muted)]" aria-hidden />
        <p className="eyebrow-mono">Drill queue</p>
        <Tag tone="mono" size="sm" className="ml-auto">
          Top {queue.length}
        </Tag>
      </div>
      <ul className="mt-3 space-y-2">
        {queue.map((row) => {
          const mastery = masteryBySkill.get(row.skillId);
          const subline = masterySubline(mastery);
          return (
            <li
              key={row.skillId}
              className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-sunken)] px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="block font-medium text-[var(--text-heading)]">{row.label}</span>
                {subline ? (
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{subline}</span>
                ) : null}
              </div>
              <Tag tone="warning" size="sm" mono>
                {row.count} {row.count === 1 ? "miss" : "misses"}
              </Tag>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:ml-auto">
                <Link to={`${ROUTES.satDrill}?skill=${row.skillId}`}>
                  <Button variant="secondary" size="sm">
                    Drill
                  </Button>
                </Link>
                {row.nodeId ? (
                  <Link to={`/subjects/sat-prep/${row.nodeId}`}>
                    <Button variant="ghost" size="sm">
                      Lesson
                      <ArrowRight size={12} aria-hidden />
                    </Button>
                  </Link>
                ) : null}
                {mastery && mastery.mistakeCount > 0 ? (
                  <Link to={ROUTES.satMistakes}>
                    <Button variant="ghost" size="sm">
                      Mistakes
                    </Button>
                  </Link>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    markSkillDrilled(row.skillId);
                    refresh();
                  }}
                >
                  <Check size={14} aria-hidden />
                  Mark drilled
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
