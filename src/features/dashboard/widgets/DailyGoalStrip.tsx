import { Meter } from "@/components/ui";
import type { Stats } from "@/stores/progress";

export function DailyGoalStrip({ stats }: { stats: Stats }) {
  const goalPct = Math.min(100, Math.round((stats.todayMinutes / stats.dailyGoal) * 100));

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-panel)] px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] tabular-nums text-[var(--text-muted)]">
        {stats.streakCurrent > 0 && (
          <span>
            <span className="text-[var(--text-heading)]">{stats.streakCurrent}d</span> streak
          </span>
        )}
        <span>
          <span className="text-[var(--text-heading)]">{stats.todayMinutes}</span>
          /{stats.dailyGoal} min today
        </span>
        <span>Lv {stats.level}</span>
      </div>
      <div className="min-w-0 flex-1">
        <Meter value={goalPct} size="xs" hint={`${goalPct}%`} ariaLabel="Today minute goal" />
      </div>
    </div>
  );
}
