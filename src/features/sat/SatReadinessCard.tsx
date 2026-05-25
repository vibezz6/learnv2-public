import { useMemo, useState } from "react";
import { Moon } from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  getReadinessNudge,
  getTodayReadinessEntry,
  logSatReadiness,
  type SatReadinessRating,
} from "@/lib/satReadiness";

const RATINGS: { value: SatReadinessRating; label: string }[] = [
  { value: 1, label: "Exhausted" },
  { value: 2, label: "Tired" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Rested" },
  { value: 5, label: "Sharp" },
];

export function SatReadinessCard() {
  const [revision, setRevision] = useState(0);
  const [rating, setRating] = useState<SatReadinessRating | null>(null);
  const [bedTime, setBedTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [saved, setSaved] = useState(false);

  const todayEntry = useMemo(() => {
    void revision;
    return getTodayReadinessEntry();
  }, [revision]);

  const nudge = useMemo(() => {
    void revision;
    return getReadinessNudge();
  }, [revision]);

  const handleSave = () => {
    if (!rating) return;
    logSatReadiness({
      rating,
      bedTime: bedTime || undefined,
      wakeTime: wakeTime || undefined,
    });
    setSaved(true);
    setRevision((r) => r + 1);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="min-w-0 space-y-4 p-5">
      <div className="flex items-start gap-3">
        <Moon size={18} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-2)]">
            Test readiness
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            One quick check-in — no graphs, local only. Helps you pick realistic study for test week.
          </p>
          {nudge ? (
            <p className="text-sm font-medium text-[var(--text-heading)]">{nudge}</p>
          ) : null}
          {todayEntry ? (
            <p className="text-xs text-[var(--text-muted)]">
              Today: {RATINGS.find((r) => r.value === todayEntry.rating)?.label ?? todayEntry.rating}
              {todayEntry.bedTime ? ` · bed ${todayEntry.bedTime}` : ""}
              {todayEntry.wakeTime ? ` · wake ${todayEntry.wakeTime}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {RATINGS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setRating(item.value)}
            className={`min-h-10 rounded-full border px-3 py-1.5 text-sm touch-manipulation ${
              rating === item.value
                ? "border-[var(--accent-2)] bg-[var(--accent-bg)] text-[var(--text-heading)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-[var(--text-muted)]">
          Bedtime (optional)
          <input
            type="time"
            value={bedTime}
            onChange={(e) => setBedTime(e.target.value)}
            className="mt-1 min-h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 text-sm"
          />
        </label>
        <label className="text-xs text-[var(--text-muted)]">
          Wake (optional)
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="mt-1 min-h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 text-sm"
          />
        </label>
      </div>

      <Button
        variant="secondary"
        className="min-h-11 touch-manipulation"
        disabled={!rating}
        onClick={handleSave}
      >
        {saved ? "Saved for today" : "Save check-in"}
      </Button>
    </Card>
  );
}
