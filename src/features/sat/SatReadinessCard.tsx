import { useMemo, useState } from "react";
import { Moon } from "lucide-react";
import { Button, Card, Field, Input, Tag } from "@/components/ui";
import { cn } from "@/lib/cn";
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
    <Card variant="default" density="normal" className="min-w-0 space-y-4">
      <div className="flex items-start gap-3 border-b border-[var(--rule)] pb-3">
        <Moon size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="eyebrow-mono">Test readiness</p>
          <p className="text-sm text-[var(--text-muted)]">
            One quick check-in — no graphs, local only. Helps you pick realistic study for test week.
          </p>
          {nudge ? (
            <p className="text-sm font-medium text-[var(--text-heading)]">{nudge}</p>
          ) : null}
          {todayEntry ? (
            <Tag tone="success" size="sm" mono className="mt-1">
              Today: {RATINGS.find((r) => r.value === todayEntry.rating)?.label ?? todayEntry.rating}
              {todayEntry.bedTime ? ` · bed ${todayEntry.bedTime}` : ""}
              {todayEntry.wakeTime ? ` · wake ${todayEntry.wakeTime}` : ""}
            </Tag>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {RATINGS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setRating(item.value)}
            className={cn(
              "min-h-9 rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm transition touch-manipulation",
              rating === item.value
                ? "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)]"
                : "border-[var(--rule)] text-[var(--text-muted)] hover:border-[var(--rule-strong)] hover:text-[var(--text)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Bedtime" hint="Optional">
          {(id) => (
            <Input id={id} type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} />
          )}
        </Field>
        <Field label="Wake" hint="Optional">
          {(id) => (
            <Input
              id={id}
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
          )}
        </Field>
      </div>

      <Button variant="secondary" size="sm" disabled={!rating} onClick={handleSave}>
        {saved ? "Saved for today" : "Save check-in"}
      </Button>
    </Card>
  );
}
