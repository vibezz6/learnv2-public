import { useRef, useState } from "react";
import { Download, TriangleAlert, Upload } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  PageContainer,
  PageHeader,
  Section,
  Splitter,
  Tag,
  Toolbar,
} from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";
import {
  BACKUP_EXCLUDED_OPENROUTER_KEYS,
  BACKUP_STORAGE_PREFIXES,
} from "@/lib/storageRegistry";
import { isSoundEnabled, setSoundEnabled } from "@/stores/sound";
import { formatAppVersion } from "@/lib/version";
import { AdmissionsSettingsCard } from "@/features/settings/AdmissionsSettingsCard";
import { ActivityLogPanel } from "@/features/settings/widgets/ActivityLogPanel";
import { StorageHealthPanel } from "@/features/settings/widgets/StorageHealthPanel";
import { SatPretestSettingsCard } from "@/features/settings/SatPretestSettingsCard";
import { PlacementSettingsCard } from "@/features/settings/PlacementSettingsCard";
import { RemindersSettingsCard } from "@/features/settings/RemindersSettingsCard";
import { LessonDraftWorkspace } from "@/features/settings/LessonDraftWorkspace";
import { OPENROUTER_KEY } from "@/services/llmReview";
import { formatCountdownLabel, getSatCountdown } from "@/lib/satCountdown";
import { getDaysSinceBackup, isBackupOverdue, markBackupDone } from "@/lib/backupReminder";
import { cn } from "@/lib/cn";

const LEGACY_OPENROUTER_KEY = "learnapp_openrouter_key";

export function SettingsPage() {
  const { theme, setTheme, satTestDate, setSatTestDate } = usePreferences();
  const dailyGoal = useProgress((s) => s.data.dailyGoal);
  const setDailyGoal = useProgress((s) => s.setDailyGoal);
  const importFromV1 = useProgress((s) => s.importFromV1);
  const migrateAllFromV1 = useProgress((s) => s.migrateAllFromV1);
  const exportData = useProgress((s) => s.exportData);
  const importData = useProgress((s) => s.importData);
  const resetProgress = useProgress((s) => s.resetProgress);
  const [message, setMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [goalInput, setGoalInput] = useState(String(dailyGoal));
  const [backupTick, setBackupTick] = useState(0);
  const hasProgress = useProgress(
    (s) => s.data.totalXp > 0 || Object.keys(s.data.nodes).length > 0,
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const satCountdown = getSatCountdown(satTestDate);
  void backupTick; // recompute backup status after an export
  const daysSinceBackup = getDaysSinceBackup();
  const backupOverdue = hasProgress && isBackupOverdue();
  const [apiKey, setApiKey] = useState(() => {
    try {
      return (
        localStorage.getItem(OPENROUTER_KEY) ?? localStorage.getItem(LEGACY_OPENROUTER_KEY) ?? ""
      );
    } catch {
      return "";
    }
  });
  const hasSavedKey = Boolean(apiKey.trim());

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learnv2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    markBackupDone();
    setBackupTick((t) => t + 1);
    setMessage("Progress exported. Keep the file somewhere safe.");
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importData(reader.result as string);
      if (result.success) {
        const report = result.importReport;
        const summary = report
          ? ` Restored ${report.restored.length} key${report.restored.length === 1 ? "" : "s"}${report.skipped.length ? `; skipped ${report.skipped.length}` : ""}.`
          : "";
        setMessage(
          (result.reloadRequired
            ? "Import successful — reload the page so all stores pick up restored data."
            : "Import successful.") + summary,
        );
        if (result.reloadRequired) setTimeout(() => window.location.reload(), 500);
      } else {
        setMessage(result.error ?? "Import failed.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <PageContainer size="md" className="space-y-7">
      <PageHeader
        title="Settings"
        subtitle="Theme, placement, backups, and optional integrations — all stored locally on this device."
      />

      {message ? (
        <Card variant="quiet" density="compact" className="min-w-0 text-sm text-[var(--accent)]">
          {message}
        </Card>
      ) : null}

      {/* ─────────────── Workspace ─────────────── */}
      <Section eyebrow="Workspace" title="Theme & sounds" divider>
        <Card variant="default" density="normal" className="min-w-0 space-y-4">
          <Field label="Theme" inline hint="Light, dark, or follow system.">
            {() => (
              <div className="flex flex-wrap gap-1.5">
                {(["dark", "light", "system"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={theme === t ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setTheme(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            )}
          </Field>
          <div className="border-t border-[var(--rule)] pt-3">
            <Field label="Sounds" inline hint="Subtle audio for achievements and level-ups.">
              {() => (
                <Button
                  variant={soundOn ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => {
                    const next = !soundOn;
                    setSoundEnabled(next);
                    setSoundOn(next);
                  }}
                >
                  {soundOn ? "On" : "Off"}
                </Button>
              )}
            </Field>
          </div>
        </Card>
      </Section>

      {/* ─────────────── Study targets ─────────────── */}
      <Section
        eyebrow="Study targets"
        title="Daily goal & SAT date"
        description="Your daily minute goal drives the Today progress, and the SAT date powers the countdown in the status bar."
        divider
      >
        <Card variant="default" density="normal" className="min-w-0 space-y-4">
          <Field
            label="Daily goal"
            inline
            hint="Minutes of focused study per day (5–600)."
          >
            {(id) => (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id={id}
                  type="number"
                  min={5}
                  max={600}
                  step={5}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-24"
                />
                <span className="text-xs text-[var(--text-muted)]">min/day</span>
                <Button
                  size="sm"
                  onClick={() => {
                    const next = Number(goalInput);
                    if (Number.isFinite(next) && next > 0) {
                      setDailyGoal(next);
                      setGoalInput(String(Math.max(5, Math.min(600, Math.round(next)))));
                      setMessage("Daily goal updated.");
                    }
                  }}
                >
                  Save goal
                </Button>
              </div>
            )}
          </Field>
          <div className="border-t border-[var(--rule)] pt-3">
            <Field
              label="SAT date"
              inline
              hint="The day you sit the test. Drives the countdown."
            >
              {(id) => (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id={id}
                    type="date"
                    value={satTestDate ?? ""}
                    onChange={(e) => {
                      setSatTestDate(e.target.value || null);
                      setMessage(e.target.value ? "SAT date saved." : "SAT date cleared.");
                    }}
                    className="w-44"
                  />
                  <Tag tone={satCountdown && !satCountdown.past ? "accent" : "muted"} size="sm" mono>
                    {formatCountdownLabel(satCountdown)}
                  </Tag>
                  {satTestDate ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSatTestDate(null);
                        setMessage("SAT date cleared.");
                      }}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
              )}
            </Field>
          </div>
        </Card>
        <div className="mt-4">
          <RemindersSettingsCard onMessage={setMessage} />
        </div>
      </Section>

      {/* ─────────────── AI ─────────────── */}
      <Section
        eyebrow="AI integrations"
        title="OpenRouter API key"
        description="Optional. Powers office-hours TA feedback and post-completion SAT rationale review on diagnostic misses (not live tutoring)."
        divider
      >
        <Card variant="default" density="normal" className="min-w-0 space-y-3">
          <Field
            label="API key"
            hint={
              <>
                Stored locally as{" "}
                <code className="font-mono text-[11px]">{OPENROUTER_KEY}</code>. Use{" "}
                <code className="font-mono text-[11px]">npm run openrouter:check</code> with{" "}
                <code className="font-mono text-[11px]">.env.local</code> to smoke-test the key.
              </>
            }
          >
            {(id) => (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id={id}
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-…"
                  className="flex-1"
                />
                {hasSavedKey ? (
                  <Tag tone="success" size="sm" mono>
                    Saved
                  </Tag>
                ) : null}
              </div>
            )}
          </Field>
          <Toolbar density="tight">
            <Button
              size="sm"
              onClick={() => {
                if (apiKey.trim()) {
                  localStorage.setItem(OPENROUTER_KEY, apiKey.trim());
                } else {
                  localStorage.removeItem(OPENROUTER_KEY);
                  localStorage.removeItem(LEGACY_OPENROUTER_KEY);
                }
                setMessage("OpenRouter key saved locally.");
              }}
            >
              Save key
            </Button>
            {hasSavedKey ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem(OPENROUTER_KEY);
                  localStorage.removeItem(LEGACY_OPENROUTER_KEY);
                  setApiKey("");
                  setMessage("OpenRouter key cleared.");
                }}
              >
                Clear key
              </Button>
            ) : null}
          </Toolbar>
        </Card>
      </Section>

      {/* ─────────────── Admissions & SAT ─────────────── */}
      <Section eyebrow="Admissions & SAT" title="Placement, college, diagnostic" divider>
        <div className="space-y-4">
          <PlacementSettingsCard onMessage={setMessage} />
          <AdmissionsSettingsCard onMessage={setMessage} />
          <SatPretestSettingsCard onMessage={setMessage} />
        </div>
      </Section>

      {/* ─────────────── Lesson drafts ─────────────── */}
      <Section eyebrow="Lesson drafts" title="Author + review tool" divider>
        <LessonDraftWorkspace onMessage={setMessage} />
      </Section>

      {/* ─────────────── Local data ─────────────── */}
      <Section eyebrow="Local data" title="Activity log + storage health" divider>
        <div className="space-y-4">
          <ActivityLogPanel />
          <StorageHealthPanel />
        </div>
      </Section>

      {/* ─────────────── Backup ─────────────── */}
      <Section eyebrow="Backup" title="Export, import, migrate" divider>
        <Card variant="default" density="normal" className="min-w-0 space-y-4">
          {backupOverdue ? (
            <div className="flex items-start gap-2 rounded-[var(--radius)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2 text-sm text-[var(--text)]">
              <TriangleAlert size={15} className="mt-0.5 shrink-0 text-[var(--warning)]" aria-hidden />
              <span>
                {daysSinceBackup == null
                  ? "You haven't backed up yet."
                  : `Your last backup was ${daysSinceBackup} day${daysSinceBackup === 1 ? "" : "s"} ago.`}{" "}
                Export now so a cleared browser can't wipe your progress.
              </span>
            </div>
          ) : daysSinceBackup != null ? (
            <p className="text-xs text-[var(--text-subtle)]">
              Last backup: {daysSinceBackup === 0 ? "today" : `${daysSinceBackup} day${daysSinceBackup === 1 ? "" : "s"} ago`}.
            </p>
          ) : null}
          <p className="text-sm text-[var(--text-muted)]">
            Backup every localStorage key whose name starts with{" "}
            {BACKUP_STORAGE_PREFIXES.map((prefix, index) => (
              <span key={prefix}>
                {index > 0 ? " or " : null}
                <code className="font-mono text-[11px]">{prefix}</code>
              </span>
            ))}
            . OpenRouter credentials are never included.
          </p>
          <details className="min-w-0 text-sm text-[var(--text-muted)]">
            <summary className="flex min-h-9 cursor-pointer touch-manipulation items-center font-medium text-[var(--text-heading)]">
              Included and excluded keys
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              <li>
                Included:{" "}
                {BACKUP_STORAGE_PREFIXES.map((prefix) => (
                  <code key={prefix} className="mr-1 font-mono text-[11px]">
                    {prefix}*
                  </code>
                ))}
              </li>
              <li>
                Excluded:{" "}
                {BACKUP_EXCLUDED_OPENROUTER_KEYS.map((key) => (
                  <code key={key} className="mr-1 font-mono text-[11px]">
                    {key}
                  </code>
                ))}
              </li>
              <li>After import, the page reloads automatically so every store reads restored data.</li>
            </ul>
          </details>
          <Toolbar>
            <Button onClick={handleExport}>
              <Download size={14} aria-hidden />
              Export progress
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={14} aria-hidden />
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
          </Toolbar>
        </Card>

        <Card variant="primary" density="normal" className="mt-4 min-w-0 space-y-3">
          <p className="eyebrow-mono">Migrate from Learn-v1 (full)</p>
          <p className="text-sm text-[var(--text-muted)]">
            Imports progress + SRS, merges legacy v1 notes into Notes 2.0, and copies theme if needed.
          </p>
          <Button
            onClick={() => {
              const result = migrateAllFromV1();
              const srsNote = result.details.srsDatesPreserved
                ? ""
                : " Warning: some SRS dates look invalid.";
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

        <Card variant="quiet" density="normal" className="mt-3 min-w-0 space-y-2">
          <p className="eyebrow-mono">Import progress only</p>
          <p className="text-sm text-[var(--text-muted)]">
            Reads <code className="font-mono text-[11px]">learnapp_progress_v1</code> from this
            browser.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const result = importFromV1();
              setMessage(result.message);
            }}
          >
            Import progress only
          </Button>
        </Card>
      </Section>

      {/* ─────────────── Danger zone ─────────────── */}
      <Splitter label="Danger zone" tone="danger" />
      <Card
        variant="default"
        density="normal"
        className={cn(
          "min-w-0 space-y-3 border-[var(--danger-border)] bg-[var(--danger-bg)]",
        )}
      >
        <p className="eyebrow-mono text-[var(--danger-fg)]">Reset progress</p>
        <p className="text-sm text-[var(--text)]">
          Clears all Learn v2 progress data — XP, streaks, completions, SRS schedules. Export first
          if you want a backup.
        </p>
        <Button tone="danger" variant="secondary" onClick={() => setShowResetConfirm(true)}>
          Reset all progress
        </Button>
      </Card>

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

      <p className="pt-2 text-center font-mono text-[11px] text-[var(--text-subtle)]">
        Learn {formatAppVersion()} · local-first, your data stays in this browser
      </p>
    </PageContainer>
  );
}
