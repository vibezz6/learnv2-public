import { Link } from "react-router-dom";
import { manifest } from "@/curriculum";
import { Badge, Card } from "@/components/ui";

export function SubjectsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div>
        <Badge>{manifest.length} subjects</Badge>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-heading)]">Subjects</h1>
        <p className="text-[var(--text-muted)]">Full curriculum ported from Learn-v1.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {manifest.map((subject) => (
          <Link key={subject.id} to={`/subjects/${subject.id}`}>
            <Card className="stagger-item h-full transition hover:border-[var(--accent)]/40">
              <div
                className="mb-2 h-1 w-12 rounded-full"
                style={{ background: subject.color }}
              />
              <h2 className="text-lg font-semibold text-[var(--text-heading)]">{subject.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{subject.description}</p>
              <p className="mt-3 font-mono text-xs text-[var(--accent)]">
                {subject.nodeCount} lessons
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
