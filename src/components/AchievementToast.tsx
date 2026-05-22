import { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";
import { loadAllSubjects } from "@/curriculum/loader";
import {
  achievementLabel,
  checkAchievements,
  markSeen,
  type Achievement,
} from "@/stores/achievements";
import { useProgress } from "@/stores/progress";
import { playAchievementSound, playLevelUpSound } from "@/stores/sound";

export function AchievementToast() {
  const data = useProgress((s) => s.data);
  const getStats = useProgress((s) => s.getStats);
  const clearLevelUpPending = useProgress((s) => s.clearLevelUpPending);
  const [queue, setQueue] = useState<Array<{ id: string; message: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    loadAllSubjects().then((subjects) => {
      if (cancelled) return;
      const stats = getStats(subjects);
      const newAchievements = checkAchievements(stats);
      if (newAchievements.length) {
        playAchievementSound();
        newAchievements.forEach((a: Achievement) => markSeen(a));
        setQueue((q) => [
          ...q,
          ...newAchievements.map((a) => ({ id: a, message: achievementLabel(a) })),
        ]);
      }
      if (data.levelUpPending) {
        playLevelUpSound();
        setQueue((q) => [
          ...q,
          {
            id: `level-${data.levelUpPending}`,
            message: `Level up! You're now level ${data.levelUpPending}.`,
          },
        ]);
        clearLevelUpPending();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    data.totalXp,
    data.streaks.current,
    data.totalStudyMinutes,
    data.levelUpPending,
    getStats,
    clearLevelUpPending,
  ]);

  const current = queue[0];
  if (!current) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-sm animate-[stagger-in_0.35s_ease-out] md:bottom-6">
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-md)]">
        <Trophy className="shrink-0 text-[var(--warning)]" size={20} />
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
