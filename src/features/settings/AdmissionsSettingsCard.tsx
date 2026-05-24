import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "@/components/ui";
import { buildAdmissionsExportPayload, buildAdmissionsSummary } from "@/lib/admissionsSummary";
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

  return (
    <Card className="min-w-0 space-y-4">
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
          Campus home hides each reminder for {DEFAULT_SNOOZE_DAYS} days when you tap dismiss.
        </p>
      </div>

      <Button
        className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
        onClick={handleExport}
      >
        Export admissions JSON
      </Button>
    </Card>
  );
}
