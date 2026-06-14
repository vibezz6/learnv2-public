import { Button, Card, Field } from "@/components/ui";
import { usePreferences, type UiMode } from "@/stores/preferences";

const MODES: { id: UiMode; label: string; hint: string }[] = [
  {
    id: "simple",
    label: "Simple",
    hint: "One clear next step on Today. Hides extra cards, status strip, and advanced SAT/College sections.",
  },
  {
    id: "full",
    label: "Full",
    hint: "Everything visible — intent picker, daily challenge, mastery tables, and the full sidebar.",
  },
];

interface Props {
  onMessage: (message: string) => void;
}

export function SimpleModeSettingsCard({ onMessage }: Props) {
  const uiMode = usePreferences((s) => s.uiMode);
  const setUiMode = usePreferences((s) => s.setUiMode);

  return (
    <Card variant="default" density="normal" className="min-w-0 space-y-4">
      <Field
        label="Interface mode"
        hint="Simple mode shows one next step and hides advanced cards. Full mode restores everything."
      >
        {() => (
          <div className="flex flex-col gap-2">
            {MODES.map((mode) => (
              <Button
                key={mode.id}
                variant={uiMode === mode.id ? "primary" : "secondary"}
                size="sm"
                className="h-auto min-h-9 flex-col items-start gap-0.5 py-2 text-left"
                aria-pressed={uiMode === mode.id}
                onClick={() => {
                  setUiMode(mode.id);
                  onMessage(
                    mode.id === "simple"
                      ? "Simple mode on — calmer Today, SAT, and College views."
                      : "Full mode on — all cards and navigation restored.",
                  );
                }}
              >
                <span className="font-medium">{mode.label}</span>
                <span className="text-xs font-normal text-[var(--text-muted)]">{mode.hint}</span>
              </Button>
            ))}
          </div>
        )}
      </Field>
    </Card>
  );
}
