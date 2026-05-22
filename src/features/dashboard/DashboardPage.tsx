import { Badge, Button, Card } from "@/components/ui";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Target, Zap } from "lucide-react";

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <section className="stagger-item space-y-2">
        <Badge>Neural Command Center</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
          Upgrade session ready
        </h1>
        <p className="max-w-2xl text-[var(--text-muted)]">
          Learn v2 scaffold is live. Batch 1: shell, tokens, focus mode, math subject stub.
          Your v1 progress migrates in Batch 2.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card glow className="stagger-item md:col-span-2">
          <div className="mb-3 flex items-center gap-2 text-[var(--accent)]">
            <Target size={18} />
            <span className="font-medium">Today</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-heading)]">
            Continue Mathematics
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Number Sense & Arithmetic · ~45 min · placeholder until curriculum split
          </p>
          <Link to="/subjects/math" className="mt-4 inline-block">
            <Button>
              Enter subject
              <ArrowRight size={16} />
            </Button>
          </Link>
        </Card>

        <Card className="stagger-item">
          <div className="mb-3 flex items-center gap-2 text-[var(--accent-2)]">
            <Zap size={18} />
            <span className="font-medium">Focus</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Press <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs">F</kbd>{" "}
            anywhere to hide chrome and deep-focus.
          </p>
        </Card>
      </section>

      <Card className="stagger-item">
        <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
          <Sparkles size={16} />
          <span className="text-sm font-medium">Salvage pipeline</span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Ported from v1: curriculum types, stagger animations, focus mode pattern.
          Next batches port LessonContent, Notes 2.0, progress store, math widgets.
        </p>
      </Card>
    </div>
  );
}
