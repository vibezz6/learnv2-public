import { useNavigate } from "react-router-dom";
import { CheckCircle2, Flame, Target } from "lucide-react";
import { Button, Tag } from "@/components/ui";
import { useFocusSession } from "@/stores/focusSession";
import { useProgress } from "@/stores/progress";
import { getDailyMinimumStatus } from "@/lib/dailyMinimum";
import { useEscapeKey } from "@/hooks/useEscapeKey";

/** Reward + reinforce screen shown right after a focus session is logged. */
export function SessionCompleteModal() {
  const summary = useFocusSession((s) => s.summary);
  const dismissSummary = useFocusSession((s) => s.dismissSummary);
  const streak = useProgress((s) => s.data.streaks.current);
  const navigate = useNavigate();

  useEscapeKey(dismissSummary, summary != null);

  if (!summary) return null;

  const minimum = getDailyMinimumStatus();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-complete-title"
    >
      <div className="modal-in w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-overlay)]">
        <div className="flex items-center gap-2 text-[var(--success)]">
          <CheckCircle2 size={18} aria-hidden />
          <h2
            id="session-complete-title"
            className="text-lg font-semibold text-[var(--text-heading)]"
          >
            Session logged
          </h2>
        </div>
        <p className="mt-1 truncate text-sm text-[var(--text-muted)]">{summary.label}</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-panel)] p-3 text-center">
            <p className="font-mono text-xl tabular-nums text-[var(--text-heading)]">
              {summary.minutes}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">minutes</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-panel)] p-3 text-center">
            <p className="flex items-center justify-center gap-1 font-mono text-xl tabular-nums text-[var(--text-heading)]">
              <Flame size={15} className="text-[var(--accent)]" aria-hidden />
              {streak}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">day streak</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-panel)] p-3 text-center">
            <p className="flex items-center justify-center gap-1 text-xl text-[var(--text-heading)]">
              <Target
                size={16}
                className={minimum.met ? "text-[var(--success)]" : "text-[var(--text-subtle)]"}
                aria-hidden
              />
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {minimum.met ? "minimum met" : "keep going"}
            </p>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          {minimum.met ? (
            <>
              <Tag tone="success" size="sm" mono>
                chain alive
              </Tag>
              <span>Today counts. Come back tomorrow to keep the streak.</span>
            </>
          ) : (
            <span>One more action locks in today and protects your streak.</span>
          )}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              dismissSummary();
              navigate("/");
            }}
          >
            Back to Today
          </Button>
          <Button onClick={dismissSummary}>Done</Button>
        </div>
      </div>
    </div>
  );
}
