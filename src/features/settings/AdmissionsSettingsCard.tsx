import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Printer, Upload } from "lucide-react";
import { ROUTES } from "@/app/navigation";
import { Button, Card, ConfirmDialog, Stat, Toolbar } from "@/components/ui";
import { buildAdmissionsExportPayload, buildAdmissionsSummary } from "@/lib/admissionsSummary";
import { ImportOverwriteConfirm } from "@/components/ImportOverwriteConfirm";
import {
  ADMISSIONS_IMPORT_OVERWRITE_KEYS,
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
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
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
      const text = String(reader.result ?? "");
      const result = parseAdmissionsImportJson(text);
      if (!result.ok) {
        onMessage(result.error);
        return;
      }
      setPendingImportJson(text);
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
    <Card id="admissions-backup" variant="default" density="normal" className="min-w-0 scroll-mt-24 space-y-4">
      <div className="border-b border-[var(--rule)] pb-3">
        <p className="eyebrow-mono">College applications</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Checklist, essay tracker, and dashboard reminders live in localStorage on this device.
        </p>
      </div>

      {summary.hasActivity ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat
            label="Checklist"
            value={`${summary.checklistDone}/${summary.checklistTotal}`}
            sub={`${summary.checklistPct}% complete`}
            size="sm"
          />
          <Stat label="Essays tracked" value={summary.essaysTracked} size="sm" />
          <Stat label="Essays final" value={summary.essaysFinal} size="sm" />
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          No checklist or essay data yet. Start on{" "}
          <Link to="/campus" className="font-medium text-[var(--accent)] hover:underline">
            campus services
          </Link>
          .
        </p>
      )}

      <Toolbar density="tight" className="border-t border-[var(--rule)] pt-3">
        <Link to="/campus/college-checklist">
          <Button variant="secondary" size="sm">
            College checklist
          </Button>
        </Link>
        <Link to="/campus/essay-tracker">
          <Button variant="secondary" size="sm">
            Essay tracker
          </Button>
        </Link>
        <Link to={ROUTES.campusPrintSummary}>
          <Button variant="ghost" size="sm">
            <Printer size={13} aria-hidden />
            Print summary
          </Button>
        </Link>
      </Toolbar>

      <div className="space-y-2 border-t border-[var(--rule)] pt-3">
        <p className="eyebrow-mono">Dashboard reminders</p>
        {activeSnoozes.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No dismissed reminders right now.</p>
        ) : (
          <ul className="max-h-32 space-y-1 overflow-y-auto font-mono text-[11px] text-[var(--text-muted)]">
            {activeSnoozes.map((s) => (
              <li key={s.id} className="break-all">
                {s.id} · returns in {s.daysLeft} day{s.daysLeft === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        )}
        <Button
          variant="secondary"
          size="sm"
          disabled={activeSnoozes.length === 0}
          onClick={handleClearSnoozes}
        >
          Restore dismissed reminders
        </Button>
        <p className="text-xs text-[var(--text-muted)]">
          Today hides each reminder for {DEFAULT_SNOOZE_DAYS} days when you tap dismiss.
        </p>
      </div>

      <div className="space-y-2 border-t border-[var(--rule)] pt-3">
        <p className="eyebrow-mono">Backup on this device</p>
        <p className="text-xs text-[var(--text-muted)]">
          Export saves checklist and essays. Import replaces both (same format as export). Full
          progress backup in the section below also includes all{" "}
          <code className="font-mono text-[11px]">learnv2_</code> keys.
        </p>
        <Toolbar density="tight">
          <Button size="sm" onClick={handleExport}>
            <Download size={13} aria-hidden />
            Export
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload size={13} aria-hidden />
            Import
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
          <Button variant="ghost" tone="danger" size="sm" onClick={() => setResetOpen(true)}>
            Clear all admissions
          </Button>
        </Toolbar>
      </div>

      <ImportOverwriteConfirm
        open={!!pendingImportJson}
        title="Import admissions backup?"
        keys={[...ADMISSIONS_IMPORT_OVERWRITE_KEYS]}
        onConfirm={() => {
          if (!pendingImportJson) return;
          const result = parseAdmissionsImportJson(pendingImportJson);
          setPendingImportJson(null);
          if (!result.ok) {
            onMessage(result.error);
            return;
          }
          applyAdmissionsImport(result);
          setRevision((r) => r + 1);
          onMessage("Admissions data imported — checklist and essays replaced on this device.");
        }}
        onCancel={() => setPendingImportJson(null)}
      />

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
