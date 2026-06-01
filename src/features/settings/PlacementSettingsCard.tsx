import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Tag } from "@/components/ui";
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
    onMessage(`Study focus set to ${title}.`);
  };

  return (
    <Card id="campus-focus" variant="default" density="normal" className="min-w-0 scroll-mt-24 space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
        <div className="min-w-0">
          <p className="eyebrow-mono">Study focus</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Same choice as onboarding. Updates your default track and which admissions reminders
            appear.
          </p>
        </div>
        {currentLabel ? (
          <Tag tone="accent" size="sm" mono className="shrink-0">
            {currentLabel}
          </Tag>
        ) : null}
      </div>

      <ul className="space-y-2" role="listbox" aria-label="Study focus">
        {PLACEMENT_OPTIONS.map((option) => {
          const selected = placementGoal === option.goal;
          return (
            <li key={option.goal}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(
                  "w-full rounded-[var(--radius-md)] border px-3 py-3 text-left transition touch-manipulation",
                  selected
                    ? "border-[var(--accent-border)] bg-[var(--accent-bg)]"
                    : "border-[var(--rule)] bg-[var(--bg-panel)] hover:border-[var(--rule-strong)] hover:bg-[var(--bg-hover)]",
                )}
                onClick={() => handleSelect(option.goal)}
              >
                <span className="block text-sm font-medium text-[var(--text-heading)]">
                  {option.title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--text-muted)]">
                  {option.description}
                </span>
                <Tag tone="mono" size="sm" className="mt-2">
                  Track · {option.trackName}
                </Tag>
              </button>
            </li>
          );
        })}
      </ul>

      <Link to="/" className="block">
        <Button variant="secondary" size="sm" className="w-full">
          View Today
        </Button>
      </Link>
    </Card>
  );
}
