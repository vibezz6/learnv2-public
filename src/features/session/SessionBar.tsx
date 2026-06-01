import { useEffect, useState } from "react";
import { CheckCircle2, Timer, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useFocusSession } from "@/stores/focusSession";
import { usePreferences } from "@/stores/preferences";
import { cn } from "@/lib/cn";

function formatElapsed(startedAt: number, now: number): string {
  const total = Math.max(0, Math.floor((now - startedAt) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Persistent, always-visible bar for an in-progress focus session. Lives outside
 * `.app-chrome` so it stays put in deep-focus mode — it is the one control that
 * turns "studying" into a deliberate, finishable ritual.
 */
export function SessionBar() {
  const active = useFocusSession((s) => s.active);
  const finishSession = useFocusSession((s) => s.finishSession);
  const cancelSession = useFocusSession((s) => s.cancelSession);
  const focusMode = usePreferences((s) => s.focusMode);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[var(--z-action-bar)] flex justify-center px-3",
        focusMode
          ? "bottom-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]"
          : "bottom-[calc(var(--mobile-nav-height)+0.5rem)] md:bottom-[calc(var(--statusbar-height)+0.5rem)]",
      )}
    >
      <div className="pointer-events-auto flex w-full max-w-3xl items-center gap-3 rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--bg-glass)] px-4 py-2.5 shadow-[var(--shadow-overlay)] backdrop-blur">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-bg)] text-[var(--accent)]">
          <Timer size={15} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-[var(--text-heading)]">
            {active.label}
          </p>
          <p className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
            Focus session · {formatElapsed(active.startedAt, now)}
          </p>
        </div>
        <Button size="sm" onClick={finishSession} className="shrink-0">
          <CheckCircle2 size={14} aria-hidden />
          Finish &amp; log
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={cancelSession}
          aria-label="Cancel session without logging"
          className="min-h-11 min-w-11 shrink-0"
        >
          <X size={14} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
