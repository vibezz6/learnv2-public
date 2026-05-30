import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { CalendarClock, CheckCircle2, Circle, Flame, GraduationCap, RotateCcw } from "lucide-react";
import { resolveCurrentStudyStreak, useProgress } from "@/stores/progress";
import { usePreferences } from "@/stores/preferences";
import { getDailyMinimumStatus } from "@/lib/dailyMinimum";
import { getUrgentCollegeDeadlines } from "@/lib/admissionsSummary";
import { formatCountdownLabel, getSatCountdown } from "@/lib/satCountdown";
import { subscribeActivityUpdated } from "@/lib/studyActivity";
import { ROUTES } from "@/app/navigation";
import { cn } from "@/lib/cn";

interface Props {
  reviewCount: number;
  collapsed: boolean;
}

/**
 * Always-on IDE status bar. The persistent accountability anchor: streak,
 * today's minutes vs goal, whether the minimum is met, reviews due, and the
 * countdown to test day. Hidden in deep-focus mode (it is app chrome).
 */
export function StatusBar({ reviewCount, collapsed }: Props) {
  const streak = useProgress((s) => resolveCurrentStudyStreak(s.data.streaks));
  const todayMinutes = useProgress((s) => Math.round(s.data.dailyMinutes[todayKey()] ?? 0));
  const dailyGoal = useProgress((s) => s.data.dailyGoal);
  const satTestDate = usePreferences((s) => s.satTestDate);
  const [minimum, setMinimum] = useState(() => getDailyMinimumStatus());

  useEffect(() => subscribeActivityUpdated(() => setMinimum(getDailyMinimumStatus())), []);

  const countdown = getSatCountdown(satTestDate);
  const goalMet = todayMinutes >= dailyGoal;
  const urgentDeadline = getUrgentCollegeDeadlines()[0] ?? null;

  return (
    <div
      className="app-chrome fixed inset-x-0 bottom-0 z-[var(--z-chrome)] hidden h-[var(--statusbar-height)] items-center justify-between gap-4 border-t border-[var(--rule)] bg-[var(--bg-rail)] px-3 font-mono text-[11px] tabular-nums text-[var(--text-muted)] md:flex"
      style={{ left: collapsed ? "var(--rail-width)" : "var(--sidebar-expanded-width)" }}
      aria-label="Study status"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn("inline-flex items-center gap-1", streak > 0 && "text-[var(--accent)]")}
          aria-label={streak > 0 ? `${streak}-day study streak` : "No active study streak"}
          title={streak > 0 ? `${streak}-day study streak — don't break the chain` : "No active streak"}
        >
          <Flame size={11} aria-hidden />
          {streak}d
        </span>
        <span className="text-[var(--rule-strong)]" aria-hidden>
          |
        </span>
        <span
          className={cn(goalMet && "text-[var(--success)]")}
          aria-label={`${todayMinutes} of ${dailyGoal} minute daily goal`}
          title="Today's study minutes vs your daily goal"
        >
          {todayMinutes}/{dailyGoal}m
        </span>
        <span className="text-[var(--rule-strong)]" aria-hidden>
          |
        </span>
        <span
          className={cn("inline-flex items-center gap-1", minimum.met && "text-[var(--success)]")}
          aria-label={minimum.met ? "Today's minimum is done" : "Today's minimum is not met yet"}
          title={minimum.met ? "Today's minimum is done" : "Minimum not met yet"}
        >
          {minimum.met ? <CheckCircle2 size={11} aria-hidden /> : <Circle size={11} aria-hidden />}
          {minimum.met ? "min met" : "min open"}
        </span>
        {reviewCount > 0 ? (
          <>
            <span className="text-[var(--rule-strong)]" aria-hidden>
              |
            </span>
            <NavLink
              to={ROUTES.review}
              className="inline-flex items-center gap-1 hover:text-[var(--accent)]"
              aria-label={`${reviewCount} spaced reviews due`}
              title={`${reviewCount} spaced reviews due`}
            >
              <RotateCcw size={11} aria-hidden />
              {reviewCount} due
            </NavLink>
          </>
        ) : null}
        {urgentDeadline ? (
          <>
            <span className="text-[var(--rule-strong)]" aria-hidden>
              |
            </span>
            <NavLink
              to={urgentDeadline.href}
              className="inline-flex items-center gap-1 text-[var(--warning-fg)] hover:text-[var(--accent)]"
              aria-label={`College: ${urgentDeadline.title} ${urgentDeadline.overdue ? "overdue" : urgentDeadline.daysUntil === 0 ? "due today" : "due tomorrow"}`}
              title={`${urgentDeadline.title} — ${urgentDeadline.overdue ? "overdue" : urgentDeadline.daysUntil === 0 ? "due today" : "due tomorrow"}`}
            >
              <CalendarClock size={11} aria-hidden />
              {urgentDeadline.overdue ? "overdue" : urgentDeadline.daysUntil === 0 ? "due today" : "due 1d"}
            </NavLink>
          </>
        ) : null}
      </div>

      <NavLink
        to={ROUTES.settings}
        className={cn(
          "inline-flex items-center gap-1.5 hover:text-[var(--accent)]",
          countdown && !countdown.past ? "text-[var(--warning-fg)]" : undefined,
        )}
        title={countdown ? "Days until your SAT" : "Set your SAT date"}
      >
        <GraduationCap size={11} aria-hidden />
        {formatCountdownLabel(countdown)}
      </NavLink>
    </div>
  );
}

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
