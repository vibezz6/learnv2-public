import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { labelForPlacement, PLACEMENT_OPTIONS, type PlacementGoal } from "@/lib/placement";
import { usePreferences } from "@/stores/preferences";

interface Props {
  onMessage: (text: string) => void;
}

export function PlacementSettingsCard({ onMessage }: Props) {
  const placementGoal = usePreferences((s) => s.placementGoal);
  const setPlacementGoal = usePreferences((s) => s.setPlacementGoal);

  const currentLabel = useMemo(() => labelForPlacement(placementGoal), [placementGoal]);

  const handleSelect = (goal: PlacementGoal) => {
    if (goal === placementGoal) return;
    setPlacementGoal(goal);
    const title = PLACEMENT_OPTIONS.find((o) => o.goal === goal)?.title ?? goal;
    onMessage(`Campus focus set to ${title}.`);
  };

  return (
    <Card className="min-w-0 space-y-4">
      <div>
        <h2 className="break-words font-semibold text-[var(--text-heading)]">Campus focus</h2>
        <p className="mt-1 break-words text-sm text-[var(--text-muted)]">
          Same choice as onboarding. Updates your default track on campus home and which admissions
          reminders appear.
        </p>
        {currentLabel ? (
          <p className="mt-2 text-sm text-[var(--text-heading)]">
            Current: <span className="font-medium">{currentLabel}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--text-muted)]">No focus set yet — pick one below.</p>
        )}
      </div>

      <ul className="space-y-2" role="listbox" aria-label="Campus focus">
        {PLACEMENT_OPTIONS.map((option) => {
          const selected = placementGoal === option.goal;
          return (
            <li key={option.goal}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(
                  "w-full rounded-[var(--radius)] border px-3 py-3 text-left transition touch-manipulation",
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] hover:border-[var(--accent)]/50",
                )}
                onClick={() => handleSelect(option.goal)}
              >
                <span className="block font-medium text-[var(--text-heading)]">{option.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--text-muted)]">
                  {option.description}
                </span>
                <span className="mt-1 block text-[11px] text-[var(--text-muted)]">
                  Track: {option.trackName}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Link to="/" className="block">
        <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
          View campus home
        </Button>
      </Link>
    </Card>
  );
}
