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
        className="flex min-h-11 w-full touch-manipulation items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-panel)] px-4 py-3 text-left transition hover:border-[var(--rule-strong)] hover:bg-[var(--bg-hover)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-heading)]">
          <Dumbbell size={14} className="text-[var(--text-muted)]" aria-hidden />
          Daily challenge
        </span>
        <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-muted)]">
          {open ? "Hide" : "Expand"}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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
