import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { resolveCurrentStudyStreak, useProgress } from "@/stores/progress";
import { usePreferences } from "@/stores/preferences";
import { getDailyMinimumStatus } from "@/lib/dailyMinimum";
import { formatCountdownLabel, getSatCountdown } from "@/lib/satCountdown";
import { subscribeActivityUpdated } from "@/lib/studyActivity";
import { cn } from "@/lib/cn";

/**
 * Compact accountability row for phones (desktop uses StatusBar).
 */
export function MobileStudyStrip() {
  const focusMode = usePreferences((s) => s.focusMode);
  const satTestDate = usePreferences((s) => s.satTestDate);
  const streak = useProgress((s) => resolveCurrentStudyStreak(s.data.streaks));
  const [minimum, setMinimum] = useState(() => getDailyMinimumStatus());

  useEffect(() => subscribeActivityUpdated(() => setMinimum(getDailyMinimumStatus())), []);

  if (focusMode) return null;

  const countdown = getSatCountdown(satTestDate);

  return (
    <div
      className="app-chrome sticky top-[var(--topbar-height)] z-[var(--z-chrome)] flex items-center justify-between gap-2 border-b border-[var(--rule)] bg-[var(--bg-rail)] px-3 py-1.5 font-mono text-[10px] tabular-nums text-[var(--text-muted)] md:hidden"
      aria-label="Study status"
    >
      <span
        className={cn("inline-flex items-center gap-1", streak > 0 && "text-[var(--accent)]")}
        aria-label={streak > 0 ? `${streak}-day study streak` : "No active study streak"}
      >
        <Flame size={10} aria-hidden />
        {streak}d
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1",
          minimum.met ? "text-[var(--success)]" : "text-[var(--warning)]",
        )}
        aria-label={
          minimum.met
            ? "Daily minimum met"
            : `${minimum.remaining} more action${minimum.remaining === 1 ? "" : "s"} for minimum`
        }
      >
        {minimum.met ? (
          <CheckCircle2 size={10} aria-hidden />
        ) : (
          <Circle size={10} aria-hidden />
        )}
        Min
      </span>
      {countdown ? (
        <span aria-label={`SAT in ${formatCountdownLabel(countdown)}`}>
          SAT {formatCountdownLabel(countdown)}
        </span>
      ) : null}
    </div>
  );
}
