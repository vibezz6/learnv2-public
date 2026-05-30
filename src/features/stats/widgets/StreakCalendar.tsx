import { useEffect, useMemo, useState } from "react";
import { loadStudyActivities, subscribeActivityUpdated } from "@/lib/studyActivity";

interface Props {
  dailyMinutes: Record<string, number>;
  selectedDate?: string | null;
  onSelectDate?: (date: string | null) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getColor(minutes: number): string {
  if (minutes <= 0) return "var(--cal-empty)";
  if (minutes < 15) return "var(--cal-l1)";
  if (minutes < 30) return "var(--cal-l2)";
  if (minutes < 60) return "var(--cal-l3)";
  return "var(--cal-l4)";
}

export function StreakCalendar({ dailyMinutes, selectedDate, onSelectDate }: Props) {
  const [anchorMs] = useState(() => Date.now());
  const [activityRevision, setActivityRevision] = useState(0);

  useEffect(() => subscribeActivityUpdated(() => setActivityRevision((r) => r + 1)), []);

  const { weeks, displayedMonthLabels } = useMemo(() => {
    const now = new Date(anchorMs);
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const days: { date: string; minutes: number }[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(todayUTC);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      days.push({ date: dateStr, minutes: dailyMinutes[dateStr] || 0 });
    }

    const weekRows: { date: string; minutes: number }[][] = [];
    const firstDate = new Date(todayUTC);
    firstDate.setUTCDate(firstDate.getUTCDate() - 364);
    let currentWeek: { date: string; minutes: number }[] = [];
    for (let i = 0; i < firstDate.getUTCDay(); i++) {
      currentWeek.push({ date: "", minutes: -1 });
    }
    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weekRows.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length) weekRows.push(currentWeek);

    const monthLabels = weekRows.map((week) => {
      const first = week.find((d) => d.date);
      if (!first) return "";
      const date = new Date(first.date + "T00:00:00Z");
      return MONTHS[date.getUTCMonth()];
    });
    let lastMonth = "";
    const labels = monthLabels.map((label) => {
      if (label && label !== lastMonth) {
        lastMonth = label;
        return label;
      }
      return "";
    });

    return { weeks: weekRows, displayedMonthLabels: labels };
  }, [anchorMs, dailyMinutes]);

  const eventCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of loadStudyActivities()) {
      counts.set(event.date, (counts.get(event.date) ?? 0) + 1);
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `activityRevision` is the recompute trigger for the non-reactive loadStudyActivities() read
  }, [activityRevision]);

  const cellSize = 11;
  const cellGap = 3;
  const selectable = !!onSelectDate;

  const handleDayClick = (date: string) => {
    if (!onSelectDate || !date) return;
    onSelectDate(selectedDate === date ? null : date);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-[var(--text-heading)]">Study calendar</div>
        {selectable && (
          <span className="text-xs text-[var(--text-muted)]">Click a day to filter activity</span>
        )}
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex">
          <div className="mr-1.5 mt-4 flex flex-col" style={{ gap: cellGap }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="flex items-center text-[9px] text-[var(--text-muted)]"
                style={{ height: cellSize }}
              >
                {label}
              </div>
            ))}
          </div>
          <div>
            <div className="mb-0.5 flex" style={{ gap: cellGap }}>
              {displayedMonthLabels.map((label, wi) => (
                <div
                  key={wi}
                  className="text-center text-[9px] font-medium text-[var(--text-muted)]"
                  style={{ width: cellSize, visibility: label ? "visible" : "hidden" }}
                >
                  {label}
                </div>
              ))}
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, ${cellSize}px)`,
                gap: cellGap,
              }}
              role="grid"
              aria-label="Study activity calendar"
            >
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: cellGap }}>
                  {week.map((d, di) => {
                    const isSelected = d.date && d.date === selectedDate;
                    const eventCount = d.date ? (eventCountByDate.get(d.date) ?? 0) : 0;
                    const title = d.date
                      ? `${d.date}: ${d.minutes > 0 ? `${d.minutes} min` : "No timer minutes"}${eventCount > 0 ? ` · ${eventCount} action${eventCount === 1 ? "" : "s"}` : ""}`
                      : "";
                    const CellTag = selectable && d.date ? "button" : "div";
                    return (
                      <CellTag
                        key={di}
                        type={selectable && d.date ? "button" : undefined}
                        title={title}
                        role="gridcell"
                        aria-pressed={isSelected || undefined}
                        aria-label={d.date ? title : undefined}
                        onClick={d.date ? () => handleDayClick(d.date) : undefined}
                        className="rounded-[2px] p-0"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: d.minutes === -1 ? "transparent" : getColor(d.minutes),
                          outline: isSelected ? "2px solid var(--accent)" : undefined,
                          outlineOffset: 1,
                          cursor: selectable && d.date ? "pointer" : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span>Less</span>
        <div className="flex gap-1">
          {["var(--cal-empty)", "var(--cal-l1)", "var(--cal-l2)", "var(--cal-l3)", "var(--cal-l4)"].map((c) => (
            <div key={c} className="rounded-[2px]" style={{ width: 11, height: 11, backgroundColor: c }} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
