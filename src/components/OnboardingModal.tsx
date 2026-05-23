import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { hasV1Data } from "@/lib/migrate-v1";
import { usePreferences } from "@/stores/preferences";

const STEP_COUNT = 3;

export function OnboardingModal() {
  const navigate = useNavigate();
  const onboardingCompleted = usePreferences((s) => s.onboardingCompleted);
  const completeOnboarding = usePreferences((s) => s.completeOnboarding);
  const [hydrated, setHydrated] = useState(() => usePreferences.persist.hasHydrated());
  const [step, setStep] = useState(0);
  const fromV1 = hasV1Data();

  useEffect(() => {
    if (hydrated) return;
    return usePreferences.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  if (!hydrated || onboardingCompleted) return null;

  const finish = (path?: string) => {
    completeOnboarding();
    if (path) navigate(path);
  };

  const isLast = step === STEP_COUNT - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-md)]">
        <div className="mb-6 flex justify-center gap-2" aria-hidden="true">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition ${
                i === step ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 id="onboarding-title" className="text-lg font-semibold text-[var(--text-heading)]">
              Welcome to Learn v2
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Your curriculum, progress, and study tools in one place. This quick tour covers the
              basics so you can jump in.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h2 id="onboarding-title" className="text-lg font-semibold text-[var(--text-heading)]">
              Coming from Learn v1?
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {fromV1
                ? "We found Learn v1 data in this browser. Open Settings and run the full v1 migration to import progress, notes, bookmarks, and theme."
                : "If you used Learn v1 before, open Settings and run the full v1 migration to import your progress, notes, and bookmarks."}
            </p>
            {fromV1 && (
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => finish("/settings")}
              >
                Go to Settings
              </Button>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h2 id="onboarding-title" className="text-lg font-semibold text-[var(--text-heading)]">
              Pick a track or subject
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Learning tracks guide you through a curated path. Subjects let you browse the full
              curriculum on your own.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => finish("/tracks")}>
                Browse tracks
              </Button>
              <Button className="flex-1" variant="secondary" onClick={() => finish("/subjects")}>
                Browse subjects
              </Button>
            </div>
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
            {isLast ? (
              <Button variant="ghost" onClick={() => finish()}>
                Skip for now
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => finish()}>
                  Skip tour
                </Button>
                <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
