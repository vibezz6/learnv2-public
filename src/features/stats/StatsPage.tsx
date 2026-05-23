import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Flame, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { hasSeen, achievementLabel, type Achievement } from "@/stores/achievements";
import { useProgress } from "@/stores/progress";
import { StreakCalendar } from "@/features/dashboard/widgets/StreakCalendar";
import { EulerQuizMastery } from "@/features/dashboard/widgets/EulerQuizMastery";

function getLast7Days(dailyMinutes: Record<string, number>) {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const days: Array<{ label: string; shortLabel: string; minutes: number; isToday: boolean }> = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(todayUTC);
    date.setUTCDate(date.getUTCDate() - i);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    days.push({
      label: date.toLocaleString("default", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }),
      shortLabel: date.toLocaleString("default", { weekday: "narrow", timeZone: "UTC" }),
      minutes: dailyMinutes[key] ?? 0,
      isToday: i === 0,
    });
  }
  return days;
}

function getWeeklyTrend(dailyMinutes: Record<string, number>) {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const mostRecentMonday = new Date(todayUTC);
  const dayOfWeek = mostRecentMonday.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  mostRecentMonday.setUTCDate(mostRecentMonday.getUTCDate() - diffToMonday);

  const weeks: Array<{ weekLabel: string; totalMinutes: number }> = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(mostRecentMonday);
    weekStart.setUTCDate(weekStart.getUTCDate() - w * 7);
    const weekLabel = weekStart.toLocaleString("default", { month: "short", day: "numeric", timeZone: "UTC" });
    let total = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setUTCDate(date.getUTCDate() + d);
      const label = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
      total += dailyMinutes[label] || 0;
    }
    weeks.push({ weekLabel, totalMinutes: total });
  }
  return weeks;
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  "first_lesson",
  "first_streak",
  "week_streak",
  "level_5",
  "level_10",
  "first_hour",
  "ten_lessons",
];

export function StatsPage() {
  const getStats = useProgress((s) => s.getStats);
  const getNodeProgress = useProgress((s) => s.getNodeProgress);
  const getReviewStats = useProgress((s) => s.getReviewStats);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  const stats = subjects.length ? getStats(subjects) : null;
  const reviewStats = getReviewStats();
  const last7Days = stats ? getLast7Days(stats.dailyMinutes) : [];
  const maxDay = Math.max(...last7Days.map((d) => d.minutes), 1);
  const weeklyTrend = stats ? getWeeklyTrend(stats.dailyMinutes) : [];
  const maxWeek = Math.max(...weeklyTrend.map((w) => w.totalMinutes), 1);
  const xpProgress = stats ? ((500 - stats.xpToNext) / 500) * 100 : 0;
  const unlockedCount = ALL_ACHIEVEMENTS.filter((a) => hasSeen(a)).length;

  const xpBySubject = subjects
    .map((subject) => ({
      subject,
      xp: subject.nodes.reduce((sum, node) => {
        const prog = getNodeProgress(node.id);
        return prog.completedAt ? sum + node.xpValue : sum;
      }, 0),
    }))
    .filter((item) => item.xp > 0)
    .sort((a, b) => b.xp - a.xp);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:space-y-8 md:p-8">
      <section className="stagger-item space-y-1.5">
        <Badge>Progress</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
          Your progress
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Level up by studying consistently — XP, streaks, and reviews compound over time.
        </p>
      </section>

      {!stats || stats.completedNodes === 0 ? (
        <Card className="stagger-item py-14 text-center">
          <Trophy className="mx-auto mb-4 text-[var(--accent)]" size={40} />
          <p className="font-medium text-[var(--text-heading)]">Start your journey</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-muted)]">
            Complete your first lesson and your level, streak, and achievements will show up here.
          </p>
          <Link to="/subjects" className="mt-6 inline-block">
            <Button>Pick a subject</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <Card glow className="stagger-item border-l-2 border-l-[var(--accent)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2">
                    <Zap size={14} className="text-[var(--accent)]" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                      Level
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tabular-nums text-[var(--text-heading)]">
                      {stats.level}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">
                      {stats.totalXp.toLocaleString()} XP total
                    </span>
                  </div>
                  <div className="mt-5">
                    <div className="mb-1.5 flex justify-between text-xs text-[var(--text-muted)]">
                      <span>Progress to level {stats.level + 1}</span>
                      <span className="tabular-nums">{500 - stats.xpToNext} / 500 XP</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-all duration-700"
                        style={{
                          width: `${xpProgress}%`,
                          boxShadow: "0 0 16px rgba(0,212,170,0.35)",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="hidden shrink-0 rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-3 text-center md:block">
                  <Target size={20} className="mx-auto text-[var(--accent)]" />
                  <div className="mt-1 text-2xl font-bold tabular-nums">{stats.xpToNext}</div>
                  <div className="text-[0.65rem] uppercase tracking-wide text-[var(--text-muted)]">
                    XP to go
                  </div>
                </div>
              </div>
            </Card>

            <Card
              glow={stats.streakCurrent >= 7}
              className={`stagger-item ${
                stats.streakCurrent >= 7
                  ? "border-l-2 border-l-[var(--warning)]"
                  : "border-l-2 border-l-[var(--danger)]"
              }`}
            >
              <div className="flex h-full flex-col justify-center">
                <div className="mb-2 flex items-center gap-2">
                  <Flame
                    size={14}
                    className={stats.streakCurrent > 0 ? "text-[var(--warning)]" : "text-[var(--text-muted)]"}
                  />
                  <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Study streak
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tabular-nums text-[var(--text-heading)]">
                    {stats.streakCurrent}
                  </span>
                  <span className="text-lg text-[var(--text-muted)]">days</span>
                </div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Personal best: <span className="font-semibold text-[var(--text-heading)]">{stats.streakLongest} days</span>
                </p>
                {stats.streakCurrent === 0 && (
                  <p className="mt-2 text-xs text-[var(--accent)]">Study today to start a streak.</p>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="stagger-item">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
                <Trophy size={16} className="text-[var(--warning)]" /> Lessons
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {stats.completedNodes}
                <span className="text-base font-normal text-[var(--text-muted)]"> / {stats.totalNodes}</span>
              </div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">
                {Math.round((stats.completedNodes / stats.totalNodes) * 100)}% curriculum
              </div>
            </Card>
            <Card className="stagger-item">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
                <Clock size={16} className="text-[var(--info)]" /> Study time
              </div>
              <div className="text-2xl font-bold tabular-nums">{Math.round(stats.totalStudyMinutes)}m</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{Math.round(stats.todayMinutes)}m today</div>
            </Card>
            <Card className="stagger-item">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
                <Sparkles size={16} className="text-[var(--success)]" /> Reviews
              </div>
              <div className="text-2xl font-bold tabular-nums text-[var(--success)]">{reviewStats.passRate}%</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">
                {reviewStats.totalReviews} total · {reviewStats.passCount} on schedule
              </div>
            </Card>
            <Card className="stagger-item">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
                <CheckCircle2 size={16} className="text-[var(--accent)]" /> Achievements
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {unlockedCount}
                <span className="text-base font-normal text-[var(--text-muted)]"> / {ALL_ACHIEVEMENTS.length}</span>
              </div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">Unlocked badges</div>
            </Card>
          </div>

          <Card className="stagger-item">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold text-[var(--text-heading)]">Last 7 days</div>
              <span className="text-xs text-[var(--text-muted)]">Study minutes per day</span>
            </div>
            <div className="flex items-end gap-2" style={{ height: 128 }}>
              {last7Days.map((d) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[0.65rem] tabular-nums text-[var(--text-muted)]">
                    {d.minutes > 0 ? `${Math.round(d.minutes)}m` : ""}
                  </span>
                  <div
                    className={`w-full rounded-t-[var(--radius-sm)] transition-all ${
                      d.isToday ? "bg-[var(--accent)]" : "bg-[var(--accent)]/70"
                    }`}
                    style={{
                      height: `${(d.minutes / maxDay) * 100}%`,
                      minHeight: d.minutes > 0 ? 6 : 2,
                      boxShadow: d.isToday && d.minutes > 0 ? "0 0 10px rgba(0,212,170,0.4)" : undefined,
                    }}
                    title={`${d.label}: ${Math.round(d.minutes)}m`}
                  />
                  <span
                    className={`text-[0.65rem] font-medium ${
                      d.isToday ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {d.shortLabel}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="stagger-item">
            <StreakCalendar dailyMinutes={stats.dailyMinutes} />
          </Card>

          {xpBySubject.length > 0 && (
            <Card className="stagger-item">
              <div className="mb-3 font-semibold text-[var(--text-heading)]">XP by subject</div>
              <div className="space-y-3">
                {xpBySubject.map(({ subject, xp }) => (
                  <div key={subject.id} className="flex items-center gap-3">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: subject.color }}
                    />
                    <span className="w-28 truncate text-sm">{subject.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(xp / stats.totalXp) * 100}%`,
                          background: subject.color,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-xs tabular-nums">{xp}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="stagger-item">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold text-[var(--text-heading)]">Achievements</div>
              <span className="text-xs text-[var(--text-muted)]">
                {unlockedCount} of {ALL_ACHIEVEMENTS.length} unlocked
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_ACHIEVEMENTS.map((a) => {
                const unlocked = hasSeen(a);
                return (
                  <div
                    key={a}
                    className={`flex items-center gap-3 rounded-[var(--radius)] border px-3 py-3 text-sm transition ${
                      unlocked
                        ? "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--text)] shadow-[var(--accent-glow)]"
                        : "border-[var(--border)] text-[var(--text-muted)] opacity-60"
                    }`}
                  >
                    {unlocked ? (
                      <CheckCircle2 size={16} className="shrink-0 text-[var(--success)]" />
                    ) : (
                      <div className="h-4 w-4 shrink-0 rounded-full border border-dashed border-[var(--border)]" />
                    )}
                    <span className={unlocked ? "font-medium" : ""}>
                      {achievementLabel(a).split(" — ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="stagger-item">
            <div className="mb-4 font-semibold text-[var(--text-heading)]">Weekly trend</div>
            <div className="flex items-end gap-2" style={{ height: 100 }}>
              {weeklyTrend.map((w) => (
                <div key={w.weekLabel} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-[var(--radius-sm)] bg-[var(--accent-2)]/80 transition-all"
                    style={{ height: `${(w.totalMinutes / maxWeek) * 100}%`, minHeight: w.totalMinutes > 0 ? 4 : 0 }}
                    title={`${w.weekLabel}: ${Math.round(w.totalMinutes)}m`}
                  />
                  <span className="text-[9px] text-[var(--text-muted)]">{w.weekLabel}</span>
                </div>
              ))}
            </div>
          </Card>

          <EulerQuizMastery subjects={subjects} />
        </>
      )}
    </div>
  );
}
