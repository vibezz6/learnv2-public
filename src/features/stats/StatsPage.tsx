import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Flame, Target, Trophy, Zap } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { hasSeen, achievementLabel, type Achievement } from "@/stores/achievements";
import { useProgress } from "@/stores/progress";
import { StreakCalendar } from "@/features/dashboard/widgets/StreakCalendar";
import { EulerQuizMastery } from "@/features/dashboard/widgets/EulerQuizMastery";

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
  const weeklyTrend = stats ? getWeeklyTrend(stats.dailyMinutes) : [];
  const maxWeek = Math.max(...weeklyTrend.map((w) => w.totalMinutes), 1);

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
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <section className="stagger-item space-y-2">
        <Badge>Batch 4 · Analytics</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">Your stats</h1>
      </section>

      {!stats || stats.completedNodes === 0 ? (
        <Card className="stagger-item py-12 text-center">
          <Trophy className="mx-auto mb-3 text-[var(--accent)]" size={40} />
          <p className="text-[var(--text-muted)]">
            Complete your first lesson and your study data will appear here.
          </p>
        </Card>
      ) : (
        <>
          <Card className="stagger-item text-center">
            <Zap className="mx-auto mb-2 text-[var(--accent)]" size={28} />
            <div className="text-4xl font-extrabold text-[var(--text-heading)]">{stats.level}</div>
            <div className="text-sm text-[var(--text-muted)]">Current level</div>
            <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${((500 - stats.xpToNext) / 500) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-[var(--text-muted)]">
              {500 - stats.xpToNext} / 500 XP to next level
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="stagger-item">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
                <Trophy size={16} className="text-[var(--warning)]" /> Total XP
              </div>
              <div className="text-2xl font-bold">{stats.totalXp}</div>
            </Card>
            <Card className="stagger-item">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
                <Flame size={16} className="text-[var(--danger)]" /> Streak
              </div>
              <div className="text-2xl font-bold">{stats.streakCurrent} days</div>
              <div className="text-xs text-[var(--text-muted)]">Best: {stats.streakLongest}</div>
            </Card>
            <Card className="stagger-item">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
                <Clock size={16} className="text-[var(--info)]" /> Study time
              </div>
              <div className="text-2xl font-bold">{Math.round(stats.totalStudyMinutes)}m</div>
              <div className="text-xs text-[var(--text-muted)]">{Math.round(stats.todayMinutes)}m today</div>
            </Card>
            <Card className="stagger-item">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
                <Target size={16} className="text-[var(--accent)]" /> Lessons
              </div>
              <div className="text-2xl font-bold">
                {stats.completedNodes}/{stats.totalNodes}
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {Math.round((stats.completedNodes / stats.totalNodes) * 100)}% complete
              </div>
            </Card>
          </div>

          <Card className="stagger-item">
            <StreakCalendar dailyMinutes={stats.dailyMinutes} />
          </Card>

          <Card className="stagger-item">
            <div className="mb-4 font-semibold text-[var(--text-heading)]">Weekly trend</div>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {weeklyTrend.map((w) => (
                <div key={w.weekLabel} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-[var(--radius-sm)] bg-[var(--accent)] transition-all"
                    style={{ height: `${(w.totalMinutes / maxWeek) * 100}%`, minHeight: w.totalMinutes > 0 ? 4 : 0 }}
                    title={`${w.weekLabel}: ${Math.round(w.totalMinutes)}m`}
                  />
                  <span className="text-[9px] text-[var(--text-muted)]">{w.weekLabel}</span>
                </div>
              ))}
            </div>
          </Card>

          {xpBySubject.length > 0 && (
            <Card className="stagger-item">
              <div className="mb-3 font-semibold text-[var(--text-heading)]">XP by subject</div>
              <div className="space-y-2">
                {xpBySubject.map(({ subject, xp }) => (
                  <div key={subject.id} className="flex items-center gap-3">
                    <span className="w-28 truncate text-sm">{subject.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(xp / stats.totalXp) * 100}%`,
                          background: subject.color,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-xs">{xp}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <EulerQuizMastery subjects={subjects} />

          <Card className="stagger-item">
            <div className="mb-3 font-semibold text-[var(--text-heading)]">SRS review stats</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold">{reviewStats.totalReviews}</div>
                <div className="text-xs text-[var(--text-muted)]">Total reviews</div>
              </div>
              <div>
                <div className="text-xl font-bold text-[var(--success)]">{reviewStats.passRate}%</div>
                <div className="text-xs text-[var(--text-muted)]">On-time rate</div>
              </div>
              <div>
                <div className="text-xl font-bold">{reviewStats.passCount}</div>
                <div className="text-xs text-[var(--text-muted)]">On schedule</div>
              </div>
            </div>
          </Card>

          <Card className="stagger-item">
            <div className="mb-3 font-semibold text-[var(--text-heading)]">Achievements</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_ACHIEVEMENTS.map((a) => (
                <div
                  key={a}
                  className={`flex items-center gap-2 rounded-[var(--radius)] border px-3 py-2 text-sm ${
                    hasSeen(a)
                      ? "border-[var(--accent-border)] text-[var(--text)]"
                      : "border-[var(--border)] text-[var(--text-muted)] opacity-50"
                  }`}
                >
                  {hasSeen(a) ? (
                    <CheckCircle2 size={14} className="text-[var(--success)]" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-[var(--border)]" />
                  )}
                  {achievementLabel(a).split(" — ")[0]}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
