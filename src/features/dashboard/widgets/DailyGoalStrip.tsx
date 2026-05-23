import type { Stats } from "@/stores/progress";

export function DailyGoalStrip({ stats }: { stats: Stats }) {
  const goalPct = Math.min(100, Math.round((stats.todayMinutes / stats.dailyGoal) * 100));

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {stats.streakCurrent > 0 && (
          <span className="font-medium text-[var(--text-heading)]">
            {stats.streakCurrent}d streak
          </span>
        )}
        <span className="text-[var(--text-muted)]">
          <span className="font-mono tabular-nums text-[var(--text-heading)]">
            {stats.todayMinutes}
          </span>
          /{stats.dailyGoal} min today
        </span>
        <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
          Lv {stats.level}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${goalPct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
          {goalPct}%
        </span>
      </div>
    </div>
  );
}
