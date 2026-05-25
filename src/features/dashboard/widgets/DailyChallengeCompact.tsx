import { useState } from "react";
import { ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import { DailyChallengeWidget } from "./DailyChallengeWidget";

interface Props {
  defaultCategory?: string | null;
}

export function DailyChallengeCompact({ defaultCategory }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-w-0">
      <button
        type="button"
        className="flex min-h-11 w-full touch-manipulation items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-secondary)]/35 px-4 py-3 text-left transition hover:border-[var(--border-strong)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-heading)]">
          <Dumbbell size={16} className="text-[var(--accent)]" aria-hidden />
          Daily challenge
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          {open ? "Hide" : "Expand"}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open ? (
        <div className="mt-3">
          <DailyChallengeWidget defaultCategory={defaultCategory} />
        </div>
      ) : null}
    </div>
  );
}
