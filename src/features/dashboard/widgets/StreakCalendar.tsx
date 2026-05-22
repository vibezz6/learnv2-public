interface Props {
  dailyMinutes: Record<string, number>;
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

export function StreakCalendar({ dailyMinutes }: Props) {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const days: { date: string; minutes: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(todayUTC);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    days.push({ date: dateStr, minutes: dailyMinutes[dateStr] || 0 });
  }

  const weeks: { date: string; minutes: number }[][] = [];
  const firstDate = new Date(todayUTC);
  firstDate.setUTCDate(firstDate.getUTCDate() - 364);
  let currentWeek: { date: string; minutes: number }[] = [];
  for (let i = 0; i < firstDate.getUTCDay(); i++) {
    currentWeek.push({ date: "", minutes: -1 });
  }
  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length) weeks.push(currentWeek);

  const monthLabels = weeks.map((week) => {
    const first = week.find((d) => d.date);
    if (!first) return "";
    const date = new Date(first.date + "T00:00:00Z");
    return MONTHS[date.getUTCMonth()];
  });
  let lastMonth = "";
  const displayedMonthLabels = monthLabels.map((label) => {
    if (label && label !== lastMonth) {
      lastMonth = label;
      return label;
    }
    return "";
  });

  const cellSize = 11;
  const cellGap = 3;

  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-[var(--text-heading)]">Study calendar</div>
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
                  {week.map((d, di) => (
                    <div
                      key={di}
                      title={d.date ? `${d.date}: ${d.minutes > 0 ? d.minutes + " min" : "No study"}` : ""}
                      role="gridcell"
                      className="rounded-[2px]"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: d.minutes === -1 ? "transparent" : getColor(d.minutes),
                      }}
                    />
                  ))}
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
