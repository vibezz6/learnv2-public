import { useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePreferences } from "@/stores/preferences";
import {
  BACKUP_EXCLUDED_OPENROUTER_KEYS,
  BACKUP_STORAGE_PREFIXES,
  useProgress,
} from "@/stores/progress";
import { isSoundEnabled, setSoundEnabled } from "@/stores/sound";
import { AdmissionsSettingsCard } from "@/features/settings/AdmissionsSettingsCard";

const OPENROUTER_KEY = "learnapp_openrouter_key";

export function SettingsPage() {
  const { theme, setTheme } = usePreferences();
  const importFromV1 = useProgress((s) => s.importFromV1);
  const migrateAllFromV1 = useProgress((s) => s.migrateAllFromV1);
  const exportData = useProgress((s) => s.exportData);
  const importData = useProgress((s) => s.importData);
  const resetProgress = useProgress((s) => s.resetProgress);
  const [message, setMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const fileRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem(OPENROUTER_KEY) ?? "";
    } catch {
      return "";
    }
  });

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learnv2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Progress exported.");
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importData(reader.result as string);
      if (result.success) {
        setMessage(
          result.reloadRequired
            ? "Import successful — reload the page so all stores pick up restored data."
            : "Import successful.",
        );
        if (result.reloadRequired) setTimeout(() => window.location.reload(), 500);
      } else {
        setMessage(result.error ?? "Import failed.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-6 overflow-x-hidden px-3 py-4 pb-24 sm:px-4 md:p-8 md:pb-8">
      <h1 className="break-words text-[clamp(1.5rem,6vw,1.875rem)] font-bold text-[var(--text-heading)] min-[481px]:text-3xl">
        Settings
      </h1>

      <Card className="min-w-0 space-y-3">
        <h2 className="break-words font-semibold text-[var(--text-heading)]">Theme</h2>
        <div className="flex flex-col gap-2 min-[481px]:flex-row min-[481px]:flex-wrap">
          {(["dark", "light", "system"] as const).map((t) => (
            <Button
              key={t}
              variant={theme === t ? "primary" : "secondary"}
              className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
              onClick={() => setTheme(t)}
            >
              {t}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="min-w-0 space-y-3">
        <h2 className="break-words font-semibold text-[var(--text-heading)]">Sounds</h2>
        <p className="break-words text-sm text-[var(--text-muted)]">
          Subtle audio for achievements and level-ups.
        </p>
        <Button
          variant={soundOn ? "primary" : "secondary"}
          className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
          onClick={() => {
            const next = !soundOn;
            setSoundEnabled(next);
            setSoundOn(next);
          }}
        >
          {soundOn ? "Sounds on" : "Sounds off"}
        </Button>
      </Card>

      <Card className="min-w-0 space-y-3">
        <h2 className="break-words font-semibold text-[var(--text-heading)]">OpenRouter API key (office hours)</h2>
        <p className="break-words text-sm text-[var(--text-muted)]">
          Optional. Powers AI TA feedback and recall check-in on lesson office hours. Stored locally as{" "}
          <code className="break-all font-mono text-xs">{OPENROUTER_KEY}</code>.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-…"
          className="min-h-11 w-full touch-manipulation rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <Button
          className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
          onClick={() => {
            if (apiKey.trim()) localStorage.setItem(OPENROUTER_KEY, apiKey.trim());
            else localStorage.removeItem(OPENROUTER_KEY);
            setMessage("OpenRouter key saved locally.");
          }}
        >
          Save API key
        </Button>
      </Card>

      <AdmissionsSettingsCard onMessage={setMessage} />

      <Card className="min-w-0 space-y-3">
        <h2 className="break-words font-semibold text-[var(--text-heading)]">Export / import</h2>
        <p className="break-words text-sm text-[var(--text-muted)]">
          Backup every localStorage key whose name starts with{" "}
          {BACKUP_STORAGE_PREFIXES.map((prefix, index) => (
            <span key={prefix}>
              {index > 0 ? " or " : null}
              <code className="break-all font-mono text-xs">{prefix}</code>
            </span>
          ))}
          . That covers progress, preferences, bookmarks, notes, achievements, quiz state, search
          recents, and per-lesson UI state. OpenRouter credentials are never included.
        </p>
        <details className="min-w-0 text-sm text-[var(--text-muted)]">
          <summary className="flex min-h-11 cursor-pointer touch-manipulation items-center font-medium text-[var(--text-heading)]">
            Included and excluded keys
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li className="break-words">
              Included: all keys matching{" "}
              {BACKUP_STORAGE_PREFIXES.map((prefix) => (
                <code key={prefix} className="break-all font-mono text-xs">
                  {prefix}*
                </code>
              ))}
              , such as <code className="break-all font-mono text-xs">learnv2_progress</code>,{" "}
              <code className="break-all font-mono text-xs">learnv2_preferences</code>,{" "}
              <code className="break-all font-mono text-xs">learnv2_bookmarks</code>,{" "}
              <code className="break-all font-mono text-xs">learnapp_note_sessions_v2</code>, and dynamic keys
              like <code className="break-all font-mono text-xs">learnapp_quiz_progress_v1_*</code>.
            </li>
            <li className="break-words">
              Excluded:{" "}
              {BACKUP_EXCLUDED_OPENROUTER_KEYS.map((key) => (
                <code key={key} className="mr-1 break-all font-mono text-xs">
                  {key}
                </code>
              ))}
            </li>
            <li className="break-words">After import, the page reloads automatically so every store reads restored data.</li>
          </ul>
        </details>
        <div className="flex flex-col gap-2 min-[481px]:flex-row min-[481px]:flex-wrap">
          <Button className="min-h-11 w-full touch-manipulation min-[481px]:w-auto" onClick={handleExport}>
            Export progress
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
            onClick={() => fileRef.current?.click()}
          >
            Import from file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </Card>

      <Card className="min-w-0 space-y-3 border-[var(--accent-border)] bg-[var(--accent-bg)]">
        <h2 className="break-words font-semibold text-[var(--text-heading)]">Migrate from Learn-v1 (full)</h2>
        <p className="break-words text-sm text-[var(--text-muted)]">
          Imports progress + SRS, merges legacy v1 notes into Notes 2.0, and copies theme if needed.
        </p>
        <Button
          className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
          onClick={() => {
            const result = migrateAllFromV1();
            const srsNote = result.details.srsDatesPreserved ? "" : " Warning: some SRS dates look invalid.";
            if (result.success) {
              setMessage(`${result.message}${srsNote} Reloading…`);
              setTimeout(() => window.location.reload(), 500);
              return;
            }
            setMessage(result.message + srsNote);
          }}
        >
          Run full v1 migration
        </Button>
      </Card>

      <Card className="min-w-0 space-y-3">
        <h2 className="break-words font-semibold text-[var(--text-heading)]">Import progress only</h2>
        <p className="break-words text-sm text-[var(--text-muted)]">
          Reads <code className="break-all font-mono text-xs">learnapp_progress_v1</code> from this browser.
        </p>
        <Button
          variant="secondary"
          className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
          onClick={() => {
            const result = importFromV1();
            setMessage(result.message);
          }}
        >
          Import progress only
        </Button>
      </Card>

      <Card className="min-w-0 space-y-3 border-[var(--danger)]/30">
        <h2 className="break-words font-semibold text-[var(--text-heading)]">Reset progress</h2>
        <p className="break-words text-sm text-[var(--text-muted)]">
          Clears all Learn v2 progress data. Export first if you want a backup.
        </p>
        <Button
          variant="secondary"
          className="min-h-11 w-full touch-manipulation border-[var(--danger)] text-[var(--danger)] min-[481px]:w-auto"
          onClick={() => setShowResetConfirm(true)}
        >
          Reset all progress
        </Button>
      </Card>

      {message && <p className="break-words text-sm text-[var(--accent)]">{message}</p>}

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset all progress?"
        message="This permanently clears your XP, streaks, completions, and SRS schedules in Learn v2. This cannot be undone."
        confirmLabel="Reset everything"
        danger
        onConfirm={() => {
          resetProgress();
          setShowResetConfirm(false);
          setMessage("Progress reset.");
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
