import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileText,
  Flame,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Meter,
  PageContainer,
  PageHeader,
  Section,
  Stat,
  Tag,
  Toolbar,
} from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import {
  buildTranscriptSummary,
  copyTranscriptToClipboard,
  type TranscriptSummary,
} from "@/lib/transcript";
import { hasSeen, achievementLabel, type Achievement } from "@/stores/achievements";
import { useProgress } from "@/stores/progress";
import { AdmissionsTranscriptPreview } from "@/features/stats/AdmissionsTranscriptPreview";
import { LazyOptionalStats } from "@/features/stats/widgets/LazyOptionalStats";
import { SatWeeklyProgressCard } from "@/features/stats/widgets/SatWeeklyProgressCard";
import { StreakCalendar } from "@/features/stats/widgets/StreakCalendar";
import { StudyActivityList } from "@/features/stats/widgets/StudyActivityList";
import { WeekInReviewStrip } from "@/features/stats/widgets/WeekInReviewStrip";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";
import { buildStudyRecommendations } from "@/lib/studyRecommendations";
import { getSubjectAccent } from "@/lib/subjectAccent";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

function downloadTranscriptJson(summary: TranscriptSummary) {
  const json = JSON.stringify(summary, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `learnv2-transcript-${summary.generatedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function getLast7Days(dailyMinutes: Record<string, number>) {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const days: Array<{ label: string; shortLabel: string; minutes: number; isToday: boolean }> = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(todayUTC);
    date.setUTCDate(date.getUTCDate() - i);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    days.push({
      label: date.toLocaleString("default", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
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
    const weekLabel = weekStart.toLocaleString("default", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
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
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const getNodesNeedingReview = useProgress((s) => s.getNodesNeedingReview);
  const getReviewStats = useProgress((s) => s.getReviewStats);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [admissionsRevision, setAdmissionsRevision] = useState(0);
  const [activityFilterDate, setActivityFilterDate] = useState<string | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const clearActivityFilter = useCallback(() => setActivityFilterDate(null), []);

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    const bump = () => setAdmissionsRevision((r) => r + 1);
    window.addEventListener(ADMISSIONS_UPDATED_EVENT, bump);
    return () => window.removeEventListener(ADMISSIONS_UPDATED_EVENT, bump);
  }, []);

  const stats = subjects.length ? getStats(subjects) : null;
  const reviewDueCount = subjects.length ? getNodesNeedingReview(subjects).length : 0;
  const reviewStats = getReviewStats();
  const transcript = useMemo(() => {
    void admissionsRevision;
    if (!stats || !subjects.length) return null;
    return buildTranscriptSummary(subjects, { getStats, getNodeStatus, getReviewStats });
  }, [stats, subjects, admissionsRevision, getStats, getNodeStatus, getReviewStats]);

  const handleCopyTranscript = async () => {
    if (!transcript) return;
    const ok = await copyTranscriptToClipboard(transcript);
    if (ok) {
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  const last7Days = stats ? getLast7Days(stats.dailyMinutes) : [];
  const maxDay = Math.max(...last7Days.map((d) => d.minutes), 1);
  const weeklyTrend = stats ? getWeeklyTrend(stats.dailyMinutes) : [];
  const maxWeek = Math.max(...weeklyTrend.map((w) => w.totalMinutes), 1);
  const xpProgress = stats ? ((500 - stats.xpToNext) / 500) * 100 : 0;
  const unlockedCount = ALL_ACHIEVEMENTS.filter((a) => hasSeen(a)).length;
  const recommendations = useMemo(() => {
    void admissionsRevision;
    if (!subjects.length) return [];
    return buildStudyRecommendations({ subjects, getNodeStatus, reviewDueCount });
  }, [subjects, getNodeStatus, reviewDueCount, admissionsRevision]);

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
    <PageContainer size="lg" className="space-y-7">
      <PageHeader
        title="Stats"
        subtitle="Progress proof, study time, and optional deep dives — Today stays focused on your next lesson."
      />

      {!stats || stats.completedNodes === 0 ? (
        <EmptyState
          icon={<Trophy size={24} className="text-[var(--accent)]" aria-hidden />}
          title="Start your journey"
          description="Complete your first lesson and your level, streak, and achievements will show up here."
          actionLabel="Pick a subject"
          actionTo="/subjects"
        />
      ) : (
        <>
          <Section eyebrow="Proof" title="At a glance">
            <Card variant="default" density="normal" className="min-w-0">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat
                  label="Level"
                  value={stats.level}
                  sub={`${stats.totalXp.toLocaleString()} XP`}
                  size="md"
                />
                <Stat
                  label="Streak"
                  value={`${stats.streakCurrent}d`}
                  sub={`Best ${stats.streakLongest}d`}
                  icon={
                    stats.streakCurrent > 0 ? (
                      <Flame size={11} className="text-[var(--warning)]" aria-hidden />
                    ) : undefined
                  }
                  size="md"
                />
                <Stat
                  label="Lessons"
                  value={`${stats.completedNodes}/${stats.totalNodes}`}
                  sub={`${Math.round((stats.completedNodes / stats.totalNodes) * 100)}% curriculum`}
                  size="md"
                />
                <Stat
                  label="Today"
                  value={`${Math.round(stats.todayMinutes)}m`}
                  sub={`${Math.round(stats.totalStudyMinutes)}m total`}
                  size="md"
                />
              </div>
              <div className="mt-4 border-t border-[var(--rule)] pt-3">
                <Meter
                  value={xpProgress}
                  label={`Progress to level ${stats.level + 1}`}
                  hint={`${500 - stats.xpToNext} / 500 XP`}
                  size="sm"
                />
              </div>
            </Card>
          </Section>

          <SatWeeklyProgressCard />

          {recommendations.length > 0 ? (
            <Section eyebrow="Recommended next" divider>
              <div className="grid gap-3 md:grid-cols-3">
                {recommendations.map((rec) => (
                  <Link
                    key={rec.id}
                    to={rec.href}
                    className="group flex min-h-[5rem] flex-col gap-1.5 rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-panel)] px-3 py-3 transition hover:border-[var(--accent-border)] hover:bg-[var(--bg-hover)]"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="text-[var(--accent)]" aria-hidden />
                      <p className="truncate text-sm font-medium text-[var(--text-heading)] group-hover:text-[var(--accent)]">
                        {rec.title}
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--text-muted)]">{rec.reason}</p>
                    <Tag tone="accent" size="sm" mono className="mt-auto self-start">
                      {rec.label}
                    </Tag>
                  </Link>
                ))}
              </div>
            </Section>
          ) : null}

          {transcript ? (
            <Section eyebrow="Study transcript" divider>
              <Card variant="default" density="normal" className="min-w-0 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-heading)]">
                        Human-readable highlights
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Copy or download as JSON proof of progress.
                      </p>
                    </div>
                  </div>
                  <Toolbar density="tight">
                    <Button onClick={handleCopyTranscript} size="sm">
                      {copiedTranscript ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
                      {copiedTranscript ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadTranscriptJson(transcript)}
                    >
                      <Download size={13} aria-hidden />
                      JSON
                    </Button>
                  </Toolbar>
                </div>
                <ul className="space-y-2 border-t border-[var(--rule)] pt-3">
                  {transcript.narrativeBullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-2 break-words text-sm leading-relaxed text-[var(--text-muted)]"
                    >
                      <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <AdmissionsTranscriptPreview admissions={transcript.admissions} />
              </Card>
            </Section>
          ) : null}

          <Section eyebrow="Achievements" title={`${unlockedCount}/${ALL_ACHIEVEMENTS.length} unlocked`} divider>
            <div className="flex flex-wrap gap-2">
              {ALL_ACHIEVEMENTS.map((a) => {
                const unlocked = hasSeen(a);
                return (
                  <Tag
                    key={a}
                    tone={unlocked ? "success" : "muted"}
                    size="md"
                    className={cn(
                      "gap-1.5",
                      unlocked ? "" : "opacity-70",
                    )}
                  >
                    {unlocked ? (
                      <CheckCircle2 size={11} aria-hidden />
                    ) : (
                      <span
                        aria-hidden
                        className="inline-block h-2 w-2 rounded-full border border-dashed border-[var(--rule-strong)]"
                      />
                    )}
                    {achievementLabel(a).split(" — ")[0]}
                  </Tag>
                );
              })}
            </div>
            <Card variant="quiet" density="compact" className="mt-3 flex items-center gap-3">
              <Sparkles size={14} className="text-[var(--text-muted)]" aria-hidden />
              <div className="min-w-0 flex-1 text-xs text-[var(--text-muted)]">
                Reviews on schedule:{" "}
                <span className="font-mono tabular-nums text-[var(--text-heading)]">
                  {reviewStats.passRate}%
                </span>{" "}
                · {reviewStats.totalReviews} total · {reviewStats.passCount} passed
              </div>
            </Card>
          </Section>

          <section className="space-y-3" aria-label="Deeper analytics">
            <button
              type="button"
              onClick={() => setAnalyticsOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-canvas)] px-4 py-3 text-left transition hover:border-[var(--rule-strong)]"
              aria-expanded={analyticsOpen}
            >
              <div className="min-w-0">
                <p className="eyebrow-mono">Deeper analytics</p>
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                  Heatmap, weekly trend, XP by subject, math visualizations.
                </p>
              </div>
              {analyticsOpen ? (
                <ChevronUp size={16} className="text-[var(--text-subtle)]" aria-hidden />
              ) : (
                <ChevronDown size={16} className="text-[var(--text-subtle)]" aria-hidden />
              )}
            </button>

            {analyticsOpen ? (
              <div className="space-y-4">
                <Card variant="default" density="normal">
                  <WeekInReviewStrip dailyMinutes={stats.dailyMinutes} />
                </Card>

                <Card variant="default" density="normal">
                  <StreakCalendar
                    dailyMinutes={stats.dailyMinutes}
                    selectedDate={activityFilterDate}
                    onSelectDate={setActivityFilterDate}
                  />
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card variant="default" density="normal" className="min-w-0">
                    <div className="mb-3 flex items-baseline justify-between gap-2">
                      <p className="eyebrow-mono">Last 7 days</p>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">minutes</span>
                    </div>
                    <div className="flex min-w-0 items-end gap-2" style={{ height: 96 }}>
                      {last7Days.map((d) => (
                        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                          <span className="font-mono text-[10px] tabular-nums text-[var(--text-subtle)]">
                            {d.minutes > 0 ? Math.round(d.minutes) : ""}
                          </span>
                          <div
                            className={cn(
                              "w-full rounded-t-[var(--radius-sm)] transition-all",
                              d.isToday ? "bg-[var(--accent)]" : "bg-[var(--accent-bg-strong)]",
                            )}
                            style={{
                              height: `${(d.minutes / maxDay) * 100}%`,
                              minHeight: d.minutes > 0 ? 4 : 2,
                            }}
                            title={`${d.label}: ${Math.round(d.minutes)}m`}
                          />
                          <span
                            className={cn(
                              "font-mono text-[10px]",
                              d.isToday ? "text-[var(--accent)]" : "text-[var(--text-subtle)]",
                            )}
                          >
                            {d.shortLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card variant="default" density="normal" className="min-w-0">
                    <div className="mb-3 flex items-baseline justify-between gap-2">
                      <p className="eyebrow-mono">Weekly trend</p>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">
                        last 8 weeks
                      </span>
                    </div>
                    <div className="flex min-w-0 items-end gap-2" style={{ height: 96 }}>
                      {weeklyTrend.map((w) => (
                        <div key={w.weekLabel} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-[var(--radius-sm)] bg-[var(--accent-bg-strong)] transition-all"
                            style={{
                              height: `${(w.totalMinutes / maxWeek) * 100}%`,
                              minHeight: w.totalMinutes > 0 ? 3 : 0,
                            }}
                            title={`${w.weekLabel}: ${Math.round(w.totalMinutes)}m`}
                          />
                          <span className="font-mono text-[9px] text-[var(--text-subtle)]">
                            {w.weekLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {xpBySubject.length > 0 ? (
                  <Card variant="default" density="normal">
                    <p className="eyebrow-mono mb-3">XP by subject</p>
                    <div className="space-y-2.5">
                      {xpBySubject.map(({ subject, xp }) => (
                        <Meter
                          key={subject.id}
                          value={xp}
                          max={stats.totalXp}
                          label={
                            <span className="inline-flex items-center gap-2">
                              <span
                                aria-hidden
                                className="inline-block h-1.5 w-1.5 rounded-full"
                                style={{ background: getSubjectAccent(subject.id) }}
                              />
                              {subject.name}
                            </span>
                          }
                          hint={`${xp} XP`}
                        />
                      ))}
                    </div>
                  </Card>
                ) : null}

                <Card variant="default" density="normal">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="eyebrow-mono">Recent activity</p>
                    {activityFilterDate ? (
                      <Button variant="ghost" size="sm" onClick={clearActivityFilter}>
                        Clear filter ({activityFilterDate})
                      </Button>
                    ) : null}
                  </div>
                  <StudyActivityList subjects={subjects} filterDate={activityFilterDate} />
                </Card>

                <LazyOptionalStats
                  subjects={subjects}
                  completedNodes={stats.completedNodes}
                  totalNodes={stats.totalNodes}
                />
              </div>
            ) : null}
          </section>
        </>
      )}
    </PageContainer>
  );
}
