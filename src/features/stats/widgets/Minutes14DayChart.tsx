import { useMemo } from "react";
import { Card } from "@/components/ui";
import { useProgress } from "@/stores/progress";

function getLast14Days(dailyMinutes: Record<string, number>) {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const days: Array<{ label: string; minutes: number; isToday: boolean }> = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(todayUTC);
    date.setUTCDate(date.getUTCDate() - i);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    days.push({
      label: date.toLocaleString("default", { month: "short", day: "numeric", timeZone: "UTC" }),
      minutes: dailyMinutes[key] ?? 0,
      isToday: i === 0,
    });
  }
  return days;
}

export function Minutes14DayChart() {
  const dailyMinutes = useProgress((s) => s.data.dailyMinutes);
  const days = useMemo(() => getLast14Days(dailyMinutes), [dailyMinutes]);
  const max = Math.max(...days.map((d) => d.minutes), 1);

  return (
    <Card variant="default" density="normal" className="min-w-0">
      <p className="eyebrow-mono">Study minutes — last 14 days</p>
      <div className="mt-4 flex items-end gap-1.5" style={{ minHeight: "7rem" }}>
        {days.map((day) => (
          <div key={day.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm bg-[var(--accent)]"
              style={{
                height: `${Math.max(4, Math.round((day.minutes / max) * 96))}px`,
                opacity: day.isToday ? 1 : 0.75,
              }}
              title={`${day.minutes} min`}
            />
            <span className="truncate text-[9px] text-[var(--text-muted)]">{day.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
