import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button, Card, Tag } from "@/components/ui";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { SAT_PRETEST_DRAFT_2_ID } from "@/data/satPretestDraft2";
import {
  getActiveSatPretestAttempt,
  getLatestCompletedSatPretestAttempt,
} from "@/lib/satPretest";
import { getDraft3RetestNudge } from "@/lib/satDraft3Nudge";

/** Primary in-app entry for the optional SAT baseline (second entry: ⌘K). */
export function SatDiagnosticSection() {
  const draft1Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID);
  const draft1Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID);
  const draft2Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_2_ID);
  const draft2Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_2_ID);
  const draft3Nudge = getDraft3RetestNudge();

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
    if (draft3Nudge) {
      detail = `Baseline complete: ${score}. ${draft3Nudge.detail}`;
    } else {
      detail = `Baseline complete: ${score}. Draft 2 and Draft 3 are optional follow-ups when you want tighter gap targeting.`;
    }
    buttonLabel = draft2Done ? "Review diagnostic" : "Start Draft 2 (optional)";
  }

  return (
    <Card id="diagnostic" variant="quiet" density="normal" className="scroll-mt-6 min-w-0 space-y-3">
      <div className="flex items-start gap-3 border-b border-[var(--rule)] pb-3">
        <BookOpen size={14} className="mt-0.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="eyebrow-mono">Optional diagnostic</p>
            <Tag tone="muted" size="sm" mono>
              Optional baseline
            </Tag>
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">{detail}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/sat/pretest" className="inline-block">
          <Button variant="secondary" size="sm">
            {buttonLabel}
            <ArrowRight size={13} aria-hidden />
          </Button>
        </Link>
        {draft3Nudge ? (
          <Link to={draft3Nudge.href} className="inline-block">
            <Button variant="secondary" size="sm">
              {draft3Nudge.buttonLabel}
              <ArrowRight size={13} aria-hidden />
            </Button>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
