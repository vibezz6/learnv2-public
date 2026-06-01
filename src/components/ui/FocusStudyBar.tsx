import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { KeyHint } from "./KeyHint";

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
      className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
      style={{
        borderColor: accentColor ? `${accentColor}40` : "var(--rule)",
      }}
    >
      <Link
        to={backTo}
        className="inline-flex min-w-0 items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)]"
      >
        <span aria-hidden>←</span>
        <span className="truncate">{backLabel}</span>
      </Link>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {(subjectName || elapsedLabel) && (
          <span className="eyebrow-mono">
            {subjectName}
            {subjectName && elapsedLabel ? " · " : ""}
            {elapsedLabel} elapsed
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={onExitFocus}>
          Exit focus
          <KeyHint size="sm">F</KeyHint>
        </Button>
      </div>
    </div>
  );
}
