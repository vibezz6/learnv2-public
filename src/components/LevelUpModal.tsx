import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useProgress } from "@/stores/progress";
import { playLevelUpSound } from "@/stores/sound";

const XP_PER_LEVEL = 500;

export function LevelUpModal() {
  const levelUpPending = useProgress((s) => s.data.levelUpPending);
  const totalXp = useProgress((s) => s.data.totalXp);
  const clearLevelUpPending = useProgress((s) => s.clearLevelUpPending);

  useEffect(() => {
    if (levelUpPending) playLevelUpSound();
  }, [levelUpPending]);

  if (!levelUpPending) return null;

  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  const progressPct = Math.min(100, Math.round((xpIntoLevel / XP_PER_LEVEL) * 100));

  return (
    <Modal
      open
      onClose={clearLevelUpPending}
      labelledBy="level-up-title"
      overlayClassName="z-[var(--z-modal-top)]"
      panelClassName="border-[var(--accent-border)]"
    >
      <div className="mb-3 flex items-center gap-2 text-[var(--accent)]">
        <Sparkles size={20} aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-widest">Level up</span>
      </div>
      <h2 id="level-up-title" className="text-2xl font-bold text-[var(--text-heading)]">
        Level {levelUpPending}
      </h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Your study loop is paying off — keep the momentum on Today.
      </p>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
          <span>XP this level</span>
          <span className="tabular-nums">
            {xpIntoLevel} / {XP_PER_LEVEL}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
      <Button className="mt-6 min-h-11 w-full" onClick={() => clearLevelUpPending()}>
        Continue studying
      </Button>
    </Modal>
  );
}
