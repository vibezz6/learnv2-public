import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Pause, Play, RotateCcw, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import { useProgress } from "@/stores/progress";
import { StudySessionSummary } from "./StudySessionSummary";

interface StudyTimerProps {
  estimatedMinutes?: number;
}

export function StudyTimer({ estimatedMinutes = 25 }: StudyTimerProps) {
  const addStudyTime = useProgress((s) => s.addStudyTime);
  const getStats = useProgress((s) => s.getStats);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [todayMinutes, setTodayMinutes] = useState(0);

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [sessionLogged, setSessionLogged] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadAllSubjects().then((subjects) => {
      setTodayMinutes(getStats(subjects).todayMinutes);
      setSubjectsLoaded(true);
    });
  }, [getStats]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setIsStopped(true);
    setSessionLogged(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsStopped(false);
    setSeconds(0);
    setSessionLogged(false);
  }, []);

  const handleLog = useCallback(() => {
    addStudyTime(seconds);
    setSessionLogged(true);
    setTodayMinutes((m) => m + seconds / 60);
  }, [seconds, addStudyTime]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (isStopped) return;
        setIsRunning((r) => !r);
      } else if ((e.key === "r" || e.key === "R") && !isStopped) {
        e.preventDefault();
        handleReset();
      } else if (e.key === "Enter" && isStopped && !sessionLogged) {
        e.preventDefault();
        handleLog();
        handleReset();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isStopped, sessionLogged, handleReset, handleLog]);

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const estSec = estimatedMinutes * 60;
  const progress = Math.min(seconds / estSec, 1);
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - progress);
  const ringColor =
    seconds > estSec * 1.25 ? "var(--danger)" : seconds > estSec ? "var(--warning)" : "var(--accent)";

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <div className="relative h-[180px] w-[180px]">
        {isRunning && (
          <div
            className="absolute inset-[-15px] rounded-full opacity-[0.08] blur-[15px]"
            style={{ background: ringColor }}
          />
        )}
        <svg width={180} height={180} className="-rotate-90">
          <circle cx={90} cy={90} r={radius} fill="none" stroke="var(--border)" strokeWidth={6} />
          <circle
            cx={90}
            cy={90}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={6}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-1000 linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold tabular-nums text-[var(--text-heading)]">
            {format(seconds)}
          </span>
          <span className="mt-0.5 text-xs text-[var(--text-muted)]">of ~{estimatedMinutes} min</span>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <Clock size={13} /> {format(seconds)} elapsed
        </span>
        <span className="flex items-center gap-1">
          <Target size={13} /> {format(estSec)} est.
        </span>
        {subjectsLoaded && (
          <span className="flex items-center gap-1">
            <Zap size={13} /> {Math.round(todayMinutes)}m today
          </span>
        )}
      </div>

      {!isStopped ? (
        <div className="flex items-center gap-2">
          <Button
            variant={isRunning ? "secondary" : "primary"}
            className="px-7"
            onClick={() => setIsRunning((r) => !r)}
            aria-pressed={isRunning}
          >
            {isRunning ? (
              <>
                <Pause size={16} /> Pause
              </>
            ) : (
              <>
                <Play size={16} /> Start
              </>
            )}
          </Button>
          {seconds > 0 && (
            <>
              <Button variant="secondary" onClick={handleStop} aria-label="Stop timer">
                <Clock size={16} />
              </Button>
              <Button variant="ghost" onClick={handleReset} aria-label="Reset timer">
                <RotateCcw size={16} />
              </Button>
            </>
          )}
        </div>
      ) : (
        <StudySessionSummary
          sessionSeconds={seconds}
          onLogSession={() => {
            handleLog();
            handleReset();
          }}
          onClose={handleReset}
        />
      )}

      <div className="flex gap-4 text-[11px] text-[var(--text-muted)] opacity-60">
        <span>⎵ Play/Pause</span>
        <span>R Reset</span>
        {isStopped && !sessionLogged && <span>↵ Log</span>}
      </div>
    </div>
  );
}
