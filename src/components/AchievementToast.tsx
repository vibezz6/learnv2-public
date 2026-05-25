import { useCallback, useEffect, useState } from "react";
import { Sparkles, Trophy, X } from "lucide-react";
import { loadAllSubjects } from "@/curriculum/loader";
import {
  ACTIVITY_MILESTONE_EVENT,
  detectNewActivityMilestones,
  type ActivityMilestone,
} from "@/lib/activityMilestones";
import { ACTIVITY_UPDATED_EVENT } from "@/lib/studyActivity";
import {
  achievementLabel,
  checkAchievements,
  markSeen,
  type Achievement,
} from "@/stores/achievements";
import { useProgress } from "@/stores/progress";
import { playAchievementSound } from "@/stores/sound";

export function AchievementToast() {
  const data = useProgress((s) => s.data);
  const getStats = useProgress((s) => s.getStats);
  const [queue, setQueue] = useState<Array<{ id: string; message: string; variant?: "milestone" }>>([]);

  const enqueue = useCallback((items: Array<{ id: string; message: string; variant?: "milestone" }>) => {
    if (items.length === 0) return;
    setQueue((q) => [...q, ...items]);
  }, []);

  const pushMilestones = useCallback(
    (milestones: ActivityMilestone[]) => {
      if (milestones.length === 0) return;
      playAchievementSound();
      enqueue(
        milestones.map((m) => ({
          id: `milestone-${m.id}`,
          message: m.message,
          variant: "milestone",
        })),
      );
    },
    [enqueue],
  );

  useEffect(() => {
    let cancelled = false;
    loadAllSubjects().then((subjects) => {
      if (cancelled) return;
      const stats = getStats(subjects);
      const newAchievements = checkAchievements(stats);
      if (newAchievements.length) {
        playAchievementSound();
        newAchievements.forEach((a: Achievement) => markSeen(a));
        enqueue(newAchievements.map((a) => ({ id: a, message: achievementLabel(a) })));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [data.totalXp, data.totalStudyMinutes, getStats, enqueue]);

  useEffect(() => {
    const onActivity = () => {
      pushMilestones(detectNewActivityMilestones());
    };
    const onMilestoneEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ milestones?: ActivityMilestone[] }>).detail;
      if (detail?.milestones?.length) pushMilestones(detail.milestones);
    };
    window.addEventListener(ACTIVITY_UPDATED_EVENT, onActivity);
    window.addEventListener(ACTIVITY_MILESTONE_EVENT, onMilestoneEvent);
    return () => {
      window.removeEventListener(ACTIVITY_UPDATED_EVENT, onActivity);
      window.removeEventListener(ACTIVITY_MILESTONE_EVENT, onMilestoneEvent);
    };
  }, [pushMilestones]);

  const current = queue[0];
  if (!current) return null;

  const Icon = current.variant === "milestone" ? Sparkles : Trophy;

  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-sm animate-[stagger-in_0.35s_ease-out] md:bottom-6">
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-md)]">
        <Icon className="shrink-0 text-[var(--warning)]" size={20} />
        <div className="flex-1 text-sm text-[var(--text)]">{current.message}</div>
        <button
          type="button"
          className="text-[var(--text-muted)] hover:text-[var(--text)]"
          aria-label="Dismiss"
          onClick={() => setQueue((q) => q.slice(1))}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
