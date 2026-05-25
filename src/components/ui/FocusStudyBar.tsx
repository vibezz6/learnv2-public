import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";

interface FocusStudyBarProps {
  backTo: string;
  backLabel: string;
  onExitFocus: () => void;
  accentColor?: string;
  subjectName?: string;
}

function formatElapsedMinutes(startedAt: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - startedAt) / 60_000));
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

/** Compact chrome shown in focus mode instead of PageHeader. */
export function FocusStudyBar({
  backTo,
  backLabel,
  onExitFocus,
  accentColor,
  subjectName,
}: FocusStudyBarProps) {
  const [startedAt] = useState(() => Date.now());
  const [elapsedLabel, setElapsedLabel] = useState(() => formatElapsedMinutes(startedAt));

  useEffect(() => {
    const tick = () => setElapsedLabel(formatElapsedMinutes(startedAt));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"
      style={{
        borderColor: accentColor ? `${accentColor}40` : "var(--border)",
      }}
    >
      <Link
        to={backTo}
        className="min-w-0 text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)]"
      >
        ← <span className="truncate">{backLabel}</span>
      </Link>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {(subjectName || elapsedLabel) && (
          <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
            {subjectName}
            {subjectName && elapsedLabel ? " · " : ""}
            {elapsedLabel} elapsed
          </span>
        )}
        <Button variant="ghost" onClick={onExitFocus}>
          Exit focus
        </Button>
      </div>
    </div>
  );
}
