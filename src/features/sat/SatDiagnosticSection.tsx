import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { SAT_PRETEST_DRAFT_2_ID } from "@/data/satPretestDraft2";
import {
  getActiveSatPretestAttempt,
  getLatestCompletedSatPretestAttempt,
} from "@/lib/satPretest";

/** Primary in-app entry for the optional SAT baseline (second entry: ⌘K). */
export function SatDiagnosticSection() {
  const draft1Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID);
  const draft1Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID);
  const draft2Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_2_ID);
  const draft2Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_2_ID);

  let detail =
    "One optional in-app baseline — not an official score. Daily study is the August track, mistake log, and Bluebook/Khan practice.";
  let buttonLabel = "Open optional diagnostic";
  if (draft1Active) {
    detail = "Draft 1 is in progress. Finish when you have 15–20 minutes, then return to track lessons.";
    buttonLabel = "Resume Draft 1";
  } else if (draft2Active) {
    detail = "Draft 2 gap follow-up is in progress.";
    buttonLabel = "Resume Draft 2";
  } else if (draft1Done?.scoreSummary) {
    const score = `${draft1Done.scoreSummary.correctAnswers}/${draft1Done.scoreSummary.totalQuestions} (${draft1Done.scoreSummary.pct}%)`;
    detail = `Baseline complete: ${score}. Draft 2 and Draft 3 are optional follow-ups when you want tighter gap targeting.`;
    buttonLabel = draft2Done ? "Review diagnostic" : "Start Draft 2 (optional)";
  }

  return (
    <Card id="diagnostic" variant="quiet" className="scroll-mt-6 space-y-4 p-5">
      <div className="flex items-start gap-3">
        <BookOpen size={18} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-semibold text-[var(--text-heading)]">Optional diagnostic</h2>
          <p className="text-sm text-[var(--text-muted)]">{detail}</p>
        </div>
      </div>
      <Link to="/sat/pretest" className="inline-block">
        <Button className="min-h-11 w-full touch-manipulation sm:w-auto">
          {buttonLabel}
          <ArrowRight size={14} />
        </Button>
      </Link>
    </Card>
  );
}
