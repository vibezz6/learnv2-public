import { useCallback, useEffect, useMemo, useState } from "react";
import { Flame, Sparkles, Star, Target, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import { useProgress } from "@/stores/progress";

interface StudySessionSummaryProps {
  sessionSeconds: number;
  onClose: () => void;
  onLogSession: () => void;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export function StudySessionSummary({ sessionSeconds, onClose, onLogSession }: StudySessionSummaryProps) {
  const getStats = useProgress((s) => s.getStats);
  const [stats, setStats] = useState({ streak: 0, level: 1, todayMinutes: 0 });

  useEffect(() => {
    loadAllSubjects().then((subjects) => {
      const s = getStats(subjects);
      setStats({ streak: s.streakCurrent, level: s.level, todayMinutes: s.todayMinutes });
    });
  }, [getStats]);

  const sessionMinutes = sessionSeconds / 60;
  const studyXp = Math.round(sessionMinutes * 2);

  const motivationalMessage = useMemo(() => {
    if (sessionMinutes < 5) return { text: "Every minute counts!", icon: <Sparkles size={16} /> };
    if (sessionMinutes < 15) return { text: "Nice study session!", icon: <Star size={16} className="text-[var(--warning)]" /> };
    if (sessionMinutes < 30) return { text: "Great focus!", icon: <Target size={16} className="text-[var(--success)]" /> };
    if (sessionMinutes < 45) return { text: "Deep work mode!", icon: <Zap size={16} className="text-[var(--accent)]" /> };
    if (sessionMinutes < 60) return { text: "Beast mode!", icon: <TrendingUp size={16} className="text-[var(--accent)]" /> };
    return { text: "Legendary session!", icon: <Flame size={16} className="text-[var(--warning)]" /> };
  }, [sessionMinutes]);

  const handleLog = useCallback(() => {
    onLogSession();
    onClose();
  }, [onLogSession, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleLog();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, handleLog]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center shadow-[var(--shadow-md)]"
    >
      <div className="mb-2 flex items-center justify-center gap-2 text-[var(--accent)]">
        {motivationalMessage.icon}
        <span className="font-semibold">{motivationalMessage.text}</span>
      </div>
      <div className="font-mono text-4xl font-bold text-[var(--text-heading)]">{formatTime(sessionSeconds)}</div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        ~{studyXp} study XP · Level {stats.level} · {stats.streak} day streak
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button variant="secondary" onClick={onClose}>
          Discard
        </Button>
        <Button onClick={handleLog}>Log session</Button>
      </div>
    </div>
  );
}
