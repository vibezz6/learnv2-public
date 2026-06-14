import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { Card, Meter, Tag } from "@/components/ui";
import type { Stats } from "@/stores/progress";
import { getDailyMinimumStatus } from "@/lib/dailyMinimum";
import { formatCountdownLabel, getSatCountdown } from "@/lib/satCountdown";
import { subscribeActivityUpdated } from "@/lib/studyActivity";
import { usePreferences } from "@/stores/preferences";
import { ROUTES } from "@/app/navigation";
import { includeSat } from "@/lib/buildFeatures";

interface Props {
  stats: Stats;
}

/**
 * The accountability anchor on Today: is the minimum done, how's the streak,
 * and how many days until the SAT. One glance tells you whether you can rest.
 */
export function TodayMinimumStrip({ stats }: Props) {
  const satTestDate = usePreferences((s) => s.satTestDate);
  const [minimum, setMinimum] = useState(() => getDailyMinimumStatus());

  useEffect(() => subscribeActivityUpdated(() => setMinimum(getDailyMinimumStatus())), []);

  const countdown = includeSat ? getSatCountdown(satTestDate) : null;
  const todayMinutes = Math.round(stats.todayMinutes);
  const goal = stats.dailyGoal;

  return (
    <Card variant="quiet" density="compact" className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          {minimum.met ? (
            <CheckCircle2 size={18} className="shrink-0 text-[var(--success)]" aria-hidden />
          ) : (
            <Circle size={18} className="shrink-0 text-[var(--warning)]" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-heading)]">
              {minimum.met ? "Today's minimum is done" : "Today's minimum: one real study action"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {includeSat && countdown?.past
                ? "SAT date passed — update your test date in Settings if you are retesting."
                : minimum.met
                  ? `${minimum.actionsToday} action${minimum.actionsToday === 1 ? "" : "s"} logged — streak protected.`
                  : "Finish one lesson, quiz, or review to keep the chain alive."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Tag tone={stats.streakCurrent > 0 ? "accent" : "muted"} size="sm" mono className="gap-1">
            <Flame size={11} aria-hidden />
            {stats.streakCurrent}d
          </Tag>
          {includeSat ? (
            countdown ? (
              <Tag tone={countdown.past ? "danger" : "warning"} size="sm" mono>
                {formatCountdownLabel(countdown)}
              </Tag>
            ) : (
              <Link to={ROUTES.settings} title="Set your SAT date">
                <Tag tone="muted" size="sm" mono>
                  Set SAT date
                </Tag>
              </Link>
            )
          ) : null}
        </div>
      </div>
      <div className="mt-3">
        <Meter
          value={todayMinutes}
          max={goal}
          tone={todayMinutes >= goal ? "success" : "accent"}
          size="xs"
          label="Today"
          hint={`${todayMinutes}/${goal}m`}
        />
      </div>
    </Card>
  );
}
