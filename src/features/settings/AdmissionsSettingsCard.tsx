import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, ConfirmDialog } from "@/components/ui";
import { buildAdmissionsExportPayload, buildAdmissionsSummary } from "@/lib/admissionsSummary";
import {
  applyAdmissionsImport,
  clearAllAdmissionsData,
  parseAdmissionsImportJson,
} from "@/lib/admissionsImport";
import {
  clearAllNudgeSnoozes,
  DEFAULT_SNOOZE_DAYS,
  getActiveSnoozes,
} from "@/lib/nudgeSnooze";

interface Props {
  onMessage: (text: string) => void;
}

export function AdmissionsSettingsCard({ onMessage }: Props) {
  const [revision, setRevision] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => {
    void revision;
    return buildAdmissionsSummary();
  }, [revision]);

  const activeSnoozes = useMemo(() => {
    void revision;
    return getActiveSnoozes();
  }, [revision]);

  const handleExport = () => {
    const payload = buildAdmissionsExportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learnv2-admissions-${payload.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onMessage("Admissions data exported.");
  };

  const handleClearSnoozes = () => {
    clearAllNudgeSnoozes();
    setRevision((r) => r + 1);
    onMessage("Dismissed admissions reminders restored on campus home.");
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseAdmissionsImportJson(String(reader.result ?? ""));
      if (!result.ok) {
        onMessage(result.error);
        return;
      }
      applyAdmissionsImport(result);
      setRevision((r) => r + 1);
      onMessage("Admissions data imported — checklist and essays replaced on this device.");
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    clearAllAdmissionsData();
    setResetOpen(false);
    setRevision((r) => r + 1);
    onMessage("College checklist, essays, and dismissed reminders cleared.");
  };

  return (
    <Card id="admissions-backup" className="min-w-0 scroll-mt-24 space-y-4">
      <div>
        <h2 className="break-words font-semibold text-[var(--text-heading)]">College applications</h2>
        <p className="mt-1 break-words text-sm text-[var(--text-muted)]">
          Checklist, essay tracker, and dashboard reminders live in localStorage on this device.
        </p>
      </div>

      {summary.hasActivity ? (
        <ul className="space-y-1 text-sm text-[var(--text-muted)]">
          <li>
            Checklist:{" "}
            <span className="font-medium text-[var(--text-heading)]">
              {summary.checklistDone}/{summary.checklistTotal}
            </span>{" "}
            ({summary.checklistPct}%)
          </li>
          <li>
            Essays:{" "}
            <span className="font-medium text-[var(--text-heading)]">
              {summary.essaysTracked} tracked · {summary.essaysFinal} final
            </span>
          </li>
        </ul>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          No checklist or essay data yet. Start on{" "}
          <Link to="/campus" className="font-medium text-[var(--accent)] hover:underline">
            campus services
          </Link>
          .
        </p>
      )}

      <div className="flex flex-col gap-2 min-[481px]:flex-row min-[481px]:flex-wrap">
        <Link to="/campus/college-checklist" className="min-[481px]:flex-1">
          <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
            College checklist
          </Button>
        </Link>
        <Link to="/campus/essay-tracker" className="min-[481px]:flex-1">
          <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
            Essay tracker
          </Button>
        </Link>
      </div>

      <div className="space-y-2 border-t border-[var(--border)] pt-4">
        <h3 className="text-sm font-medium text-[var(--text-heading)]">Dashboard reminders</h3>
        {activeSnoozes.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No dismissed reminders right now.</p>
        ) : (
          <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-[var(--text-muted)]">
            {activeSnoozes.map((s) => (
              <li key={s.id} className="break-all font-mono">
                {s.id} · returns in {s.daysLeft} day{s.daysLeft === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        )}
        <Button
          variant="secondary"
          className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
          disabled={activeSnoozes.length === 0}
          onClick={handleClearSnoozes}
        >
          Restore dismissed reminders
        </Button>
        <p className="text-xs text-[var(--text-muted)]">
          Today hides each reminder for {DEFAULT_SNOOZE_DAYS} days when you tap dismiss.
        </p>
      </div>

      <div className="space-y-2 border-t border-[var(--border)] pt-4">
        <h3 className="text-sm font-medium text-[var(--text-heading)]">Backup on this device</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Export saves checklist and essays. Import replaces both (same format as export). Full progress
          backup in the section below also includes all <code className="font-mono">learnv2_</code> keys.
        </p>
        <div className="flex flex-col gap-2 min-[481px]:flex-row min-[481px]:flex-wrap">
          <Button
            className="min-h-11 w-full touch-manipulation min-[481px]:flex-1"
            onClick={handleExport}
          >
            Export admissions JSON
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 w-full touch-manipulation min-[481px]:flex-1"
            onClick={() => importInputRef.current?.click()}
          >
            Import admissions JSON
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
        <Button
          variant="secondary"
          className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
          onClick={() => setResetOpen(true)}
        >
          Clear all admissions data
        </Button>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Clear admissions data?"
        message="Removes checklist progress, custom checklist items, essay tracker entries, and dismissed dashboard reminders on this device. Placement and study progress are not affected."
        confirmLabel="Clear"
        danger
        onConfirm={handleResetConfirm}
        onCancel={() => setResetOpen(false)}
      />
    </Card>
  );
}
