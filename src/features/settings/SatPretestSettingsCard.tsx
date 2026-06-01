import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button, Card, ConfirmDialog, Stat, Toolbar } from "@/components/ui";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { SAT_PRETEST_DRAFT_2_ID } from "@/data/satPretestDraft2";
import { SAT_PRETEST_DRAFT_3_ID } from "@/data/satPretestDrafts";
import { clearSatLessonPlan, loadSatLessonPlan } from "@/lib/satLessonPlan";
import { clearImportedDraft2Questions } from "@/lib/satPretestDraft2Pool";
import {
  clearAllSatPretestData,
  getLatestCompletedSatPretestAttempt,
  listSatPretestAttempts,
  parseSatPretestExportRestoreJson,
} from "@/lib/satPretest";

interface Props {
  onMessage: (text: string) => void;
}

export function SatPretestSettingsCard({ onMessage }: Props) {
  const [revision, setRevision] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => {
    void revision;
    const attempts = listSatPretestAttempts();
    const draft1 = attempts.filter((attempt) => attempt.draftId === SAT_PRETEST_DRAFT_1_ID);
    const draft2 = attempts.filter((attempt) => attempt.draftId === SAT_PRETEST_DRAFT_2_ID);
    const draft3 = attempts.filter((attempt) => attempt.draftId === SAT_PRETEST_DRAFT_3_ID);
    const draft1Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID);
    const lessonPlan = loadSatLessonPlan();
    return {
      hasData: attempts.length > 0 || !!lessonPlan,
      draft1Count: draft1.length,
      draft2Count: draft2.length,
      draft3Count: draft3.length,
      draft1Score: draft1Done?.scoreSummary
        ? `${draft1Done.scoreSummary.correctAnswers}/${draft1Done.scoreSummary.totalQuestions} (${draft1Done.scoreSummary.pct}%)`
        : null,
      lessonPlanCount: lessonPlan?.entries.length ?? 0,
    };
  }, [revision]);

  const handleResetConfirm = () => {
    clearAllSatPretestData();
    clearImportedDraft2Questions();
    clearSatLessonPlan();
    setResetOpen(false);
    setRevision((r) => r + 1);
    onMessage("SAT diagnostic attempts and imported lesson plan cleared.");
  };

  const handleClearLessonPlan = () => {
    clearSatLessonPlan();
    setRevision((r) => r + 1);
    onMessage("Imported SAT lesson plan cleared.");
  };

  const handleRestoreFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseSatPretestExportRestoreJson(String(reader.result ?? ""));
      if (!result.ok) {
        onMessage(result.error);
        return;
      }
      setRevision((r) => r + 1);
      const verb = result.replaced ? "updated" : "restored";
      onMessage(
        `Draft ${result.draftId} attempt ${verb} on this device (${result.attemptId.slice(0, 8)}…).`,
      );
    };
    reader.readAsText(file);
  };

  return (
    <Card id="sat-pretest-backup" variant="default" density="normal" className="min-w-0 scroll-mt-24 space-y-4">
      <div className="border-b border-[var(--rule)] pb-3">
        <p className="eyebrow-mono">SAT diagnostic backup</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Draft 1–3 attempts, rationales, and exports live in localStorage on this device.
        </p>
      </div>

      {summary.hasData ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            label="Draft 1"
            value={summary.draft1Count}
            sub={summary.draft1Score ?? "no score"}
            size="sm"
          />
          <Stat label="Draft 2" value={summary.draft2Count} size="sm" />
          <Stat label="Draft 3" value={summary.draft3Count} size="sm" />
          <Stat label="Plan items" value={summary.lessonPlanCount} size="sm" />
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No diagnostic attempts saved yet.</p>
      )}

      <div className="space-y-2 border-t border-[var(--rule)] pt-3">
        <p className="eyebrow-mono">Restore export</p>
        <p className="text-xs text-[var(--text-muted)]">
          Re-import a JSON file you downloaded from the diagnostic results screen (Draft 1–3). Replaces
          the same attempt id if it already exists on this device.
        </p>
        <Toolbar density="tight">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => restoreInputRef.current?.click()}
          >
            <Upload size={13} aria-hidden />
            Restore from export
          </Button>
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleRestoreFile(file);
              e.target.value = "";
            }}
          />
          <Link to="/subjects/sat-prep#diagnostic">
            <Button variant="ghost" size="sm">
              Open SAT diagnostic
            </Button>
          </Link>
        </Toolbar>
      </div>

      <div className="border-t border-[var(--rule)] pt-3">
        <Toolbar density="tight">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearLessonPlan}
            disabled={summary.lessonPlanCount === 0}
          >
            Clear lesson plan
          </Button>
          <Button
            variant="ghost"
            tone="danger"
            size="sm"
            onClick={() => setResetOpen(true)}
            disabled={!summary.hasData}
          >
            Clear all diagnostic data
          </Button>
        </Toolbar>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Clear SAT diagnostic data?"
        message="Removes Draft 1–3 attempts, responses, scores, imported Draft 2 questions, and the imported lesson plan on this device. Study progress and the mistake log are not affected."
        confirmLabel="Clear"
        danger
        onConfirm={handleResetConfirm}
        onCancel={() => setResetOpen(false)}
      />
    </Card>
  );
}
