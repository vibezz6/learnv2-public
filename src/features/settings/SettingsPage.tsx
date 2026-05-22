import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";

export function SettingsPage() {
  const { theme, setTheme } = usePreferences();
  const importFromV1 = useProgress((s) => s.importFromV1);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-bold text-[var(--text-heading)]">Settings</h1>

      <Card className="space-y-3">
        <h2 className="font-semibold text-[var(--text-heading)]">Theme</h2>
        <div className="flex gap-2">
          {(["dark", "light", "system"] as const).map((t) => (
            <Button
              key={t}
              variant={theme === t ? "primary" : "secondary"}
              onClick={() => setTheme(t)}
            >
              {t}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold text-[var(--text-heading)]">Import Learn-v1 progress</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Reads <code className="font-mono text-xs">learnapp_progress_v1</code> from this browser&apos;s
          localStorage (same place v1 saved your XP, streaks, and completions).
        </p>
        <Button
          onClick={() => {
            const result = importFromV1();
            setMessage(result.message);
          }}
        >
          Import from Learn-v1
        </Button>
        {message && <p className="text-sm text-[var(--accent)]">{message}</p>}
      </Card>
    </div>
  );
}
