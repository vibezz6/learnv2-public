import { useMemo, useState } from "react";
import { listPracticeSessions } from "@/lib/satPracticeLog";

const WEEK_MS = 7 * 86_400_000;

export function SatPracticeWeekCard() {
  const [anchorMs] = useState(() => Date.now());
  const sessions = useMemo(
    () => listPracticeSessions().filter((s) => s.createdAt >= anchorMs - WEEK_MS),
    [anchorMs],
  );

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Log Bluebook or Khan sessions in the mistake log section to track weekly rhythm.
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {sessions.slice(0, 5).map((s) => (
        <li key={s.id} className="flex justify-between gap-2 text-[var(--text)]">
          <span className="min-w-0 truncate">{s.label}</span>
          <span className="shrink-0 text-xs text-[var(--text-muted)]">{s.date}</span>
        </li>
      ))}
    </ul>
  );
}
