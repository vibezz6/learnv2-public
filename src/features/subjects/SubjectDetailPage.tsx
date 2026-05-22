import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card } from "@/components/ui";
import { getSubject } from "@/curriculum";
import { ChevronLeft } from "lucide-react";

export function SubjectDetailPage() {
  const { subjectId = "" } = useParams();
  const subject = getSubject(subjectId);

  if (!subject) {
    return (
      <div className="p-8">
        <p>Subject not found.</p>
        <Link to="/subjects">
          <Button variant="secondary" className="mt-4">
            Back
          </Button>
        </Link>
      </div>
    );
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
      <div className="space-y-3">
        {subject.nodes.map((node) => (
          <Card key={node.id} className="stagger-item">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-[var(--text-heading)]">{node.name}</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{node.description}</p>
              </div>
              <span className="font-mono text-xs text-[var(--accent)]">{node.xpValue} XP</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
