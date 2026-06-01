import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Flame, Target } from "lucide-react";
import { ROUTES } from "@/app/navigation";
import { Button, Modal, Tag } from "@/components/ui";
import { getCollegeSessionNextSteps, isCollegeFocusHref } from "@/lib/collegeFocus";
import { getDailyMinimumStatus } from "@/lib/dailyMinimum";
import { getDrillQueue } from "@/lib/satDrillQueue";
import { isSatFocusHref } from "@/lib/todayHero";
import { useFocusSession } from "@/stores/focusSession";
import { useProgress } from "@/stores/progress";

/** Reward + reinforce screen shown right after a focus session is logged. */
export function SessionCompleteModal() {
  const summary = useFocusSession((s) => s.summary);
  const dismissSummary = useFocusSession((s) => s.dismissSummary);
  const streak = useProgress((s) => s.data.streaks.current);
  const navigate = useNavigate();

  const satSession = summary ? isSatFocusHref(summary.href) : false;
  const collegeSession = summary ? isCollegeFocusHref(summary.href) : false;
  const drillTop = useMemo(() => (satSession ? getDrillQueue(1)[0] : undefined), [satSession]);
  const collegeSteps = useMemo(
    () => (summary && collegeSession ? getCollegeSessionNextSteps(summary.href) : []),
    [summary, collegeSession],
  );

  if (!summary) return null;

  const minimum = getDailyMinimumStatus();

  return (
    <Modal
      open
      onClose={dismissSummary}
      labelledBy="session-complete-title"
      panelClassName="border-[var(--accent-border)]"
    >
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
              className={minimum.met ? "text-[var(--success)]" : "text-[var(--text-muted)]"}
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

      {satSession ? (
        <div className="mt-4 space-y-2 border-t border-[var(--rule)] pt-4">
          <p className="eyebrow-mono">What&apos;s next</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                dismissSummary();
                navigate(ROUTES.satMistakes);
              }}
            >
              Log a mistake
            </Button>
            {drillTop ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  dismissSummary();
                  navigate(`${ROUTES.satDrill}?skill=${encodeURIComponent(drillTop.skillId)}`);
                }}
              >
                Drill {drillTop.label}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {collegeSession ? (
        <div className="mt-4 space-y-2 border-t border-[var(--rule)] pt-4">
          <p className="eyebrow-mono">What&apos;s next</p>
          <div className="flex flex-wrap gap-2">
            {collegeSteps.map((step) => (
              <Button
                key={step.href}
                variant="ghost"
                size="sm"
                onClick={() => {
                  dismissSummary();
                  navigate(step.href);
                }}
              >
                {step.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

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
    </Modal>
  );
}
