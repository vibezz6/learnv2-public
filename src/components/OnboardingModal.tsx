import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { hasV1Data } from "@/lib/migrate-v1";
import {
  PLACEMENT_OPTIONS,
  type PlacementGoal,
} from "@/lib/placement";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/stores/preferences";

const STEP_COUNT = 3;

export function OnboardingModal() {
  const navigate = useNavigate();
  const onboardingCompleted = usePreferences((s) => s.onboardingCompleted);
  const completeOnboarding = usePreferences((s) => s.completeOnboarding);
  const completeOnboardingWithPlacement = usePreferences(
    (s) => s.completeOnboardingWithPlacement,
  );
  const [hydrated, setHydrated] = useState(() => usePreferences.persist.hasHydrated());
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<PlacementGoal>("sat");
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const fromV1 = hasV1Data();

  useEffect(() => {
    if (hydrated) return;
    return usePreferences.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  if (!hydrated || onboardingCompleted) return null;

  const finishExplore = () => {
    completeOnboarding();
    navigate("/subjects");
  };

  const finishWithPlacement = () => {
    completeOnboardingWithPlacement(selectedGoal);
    navigate("/");
  };

  const selectedOption = PLACEMENT_OPTIONS.find((o) => o.goal === selectedGoal);
  const isLast = step === STEP_COUNT - 1;

  const handleOptionKeyDown = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const count = PLACEMENT_OPTIONS.length;
    const currentIndex = PLACEMENT_OPTIONS.findIndex((o) => o.goal === selectedGoal);
    let nextIndex: number;
    if (e.key === "ArrowDown") nextIndex = (currentIndex + 1) % count;
    else if (e.key === "ArrowUp") nextIndex = (currentIndex - 1 + count) % count;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = count - 1;
    else return;
    e.preventDefault();
    setSelectedGoal(PLACEMENT_OPTIONS[nextIndex]!.goal);
    optionRefs.current[nextIndex]?.focus();
  };

  return (
    <Modal
      open
      onClose={finishExplore}
      closeOnBackdrop={false}
      labelledBy="onboarding-title"
      initialFocus="container"
      panelClassName="max-h-[90vh] overflow-y-auto"
    >
      <div className="mb-6 flex justify-center gap-2">
        <span className="sr-only">
          Step {step + 1} of {STEP_COUNT}
        </span>
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "h-2 w-2 rounded-full transition",
              i === step ? "bg-[var(--accent)]" : "bg-[var(--border)]",
            )}
          />
        ))}
      </div>

      {fromV1 && step === 0 && (
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Learn v1 data found.{" "}
          <Link
            to="/settings"
            onClick={() => completeOnboarding()}
            className="font-medium text-[var(--accent)] hover:underline"
          >
            Go to Settings to run full v1 migration
          </Link>
        </p>
      )}

      {step === 0 && (
        <>
          <h2 id="onboarding-title" className="text-lg font-semibold text-[var(--text-heading)]">
            Welcome to Learn v2
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            Your college-style study app: tracks, lessons, SAT prep, notes, and a transcript of
            your work. A short placement picks your default degree plan.
          </p>
        </>
      )}

      {step === 1 && (
        <>
          <h2 id="onboarding-title" className="text-lg font-semibold text-[var(--text-heading)]">
            What&apos;s your main focus?
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            We&apos;ll enroll you in a track on the campus home dashboard. Change focus later in{" "}
            <Link to="/settings#campus-focus" className="font-medium text-[var(--accent)] hover:underline">
              Settings
            </Link>
            .
          </p>
          <ul
            className="mt-4 space-y-2"
            role="listbox"
            aria-label="Placement goal"
            onKeyDown={handleOptionKeyDown}
          >
            {PLACEMENT_OPTIONS.map((option, index) => {
              const selected = selectedGoal === option.goal;
              return (
                <li key={option.goal}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    onClick={() => setSelectedGoal(option.goal)}
                    className={cn(
                      "w-full rounded-[var(--radius)] border p-4 text-left transition touch-manipulation",
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent-bg)]"
                        : "border-[var(--border)] hover:border-[var(--border-strong)]",
                    )}
                  >
                    <p className="text-sm font-medium text-[var(--text-heading)]">
                      {option.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                      {option.description}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                      Track: {option.trackName}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {step === 2 && selectedOption && (
        <>
          <h2 id="onboarding-title" className="text-lg font-semibold text-[var(--text-heading)]">
            You&apos;re set
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Focus: <span className="font-medium text-[var(--text-heading)]">{selectedOption.title}</span>
            {selectedOption.goal !== "explore" && (
              <>
                {" "}
                · enrolled in <span className="font-medium">{selectedOption.trackName}</span>
              </>
            )}
          </p>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Your dashboard shows this week&apos;s plan, daily assignments, and SAT next steps when
            relevant.
          </p>
          <Button className="mt-4 min-h-11 w-full touch-manipulation" onClick={finishWithPlacement}>
            Go to campus home
          </Button>
          {selectedGoal === "sat" && (
            <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
              Also open{" "}
              <Link
                to="/campus/college-checklist"
                onClick={() => {
                  completeOnboardingWithPlacement(selectedGoal);
                }}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                college checklist
              </Link>{" "}
              for FAFSA and applications.
            </p>
          )}
        </>
      )}

      <div className="mt-6 flex items-center justify-between gap-2">
        <div>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {!isLast && (
            <>
              <Button variant="ghost" onClick={finishExplore}>
                Skip
              </Button>
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            </>
          )}
          {isLast && (
            <Button variant="ghost" onClick={finishExplore}>
              Browse subjects instead
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
