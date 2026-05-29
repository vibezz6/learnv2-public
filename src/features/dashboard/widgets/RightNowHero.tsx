import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, GraduationCap, Moon, Play } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { SkillNode, Subject } from "@/curriculum/types";
import { getSatDailyStudyCommand } from "@/lib/satDailyStudy";
import { getTopMistakeCategories } from "@/lib/satMistakeTriage";
import { getReadinessNudge } from "@/lib/satReadiness";
import { isDailySatQuizDone } from "@/lib/satDailyQuiz";
import { resolveContinueKind, continueHref } from "@/lib/continuePresentation";
import { useProgress } from "@/stores/progress";
import { nodeIdFromHref, useFocusSession } from "@/stores/focusSession";
import { ROUTES } from "@/app/navigation";

interface Props {
  subjects: Subject[];
  /** An in-progress lesson to offer as a quick "pick up where you left off". */
  resume?: { subject: Subject; node: SkillNode } | null;
}

/**
 * The single dominant action on Today. One headline, one primary button that
 * drops you straight into a focused, timed session — no menu, no deciding.
 */
export function RightNowHero({ subjects, resume }: Props) {
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const startSession = useFocusSession((s) => s.startSession);
  const navigate = useNavigate();

  const study = getSatDailyStudyCommand({ subjects, getNodeStatus });
  const topMistakes = getTopMistakeCategories(2);
  const readinessNudge = getReadinessNudge();
  const dailyQuizDone = isDailySatQuizDone();

  const handleStart = () => {
    const nodeId = nodeIdFromHref(study.href);
    // Only drop into deep-focus mode for a real lesson page — hubs (mistake log,
    // official practice, diagnostic) are meant to be browsed with chrome visible.
    startSession({
      label: study.detail,
      href: study.href,
      nodeId,
      focus: Boolean(nodeId),
    });
    navigate(study.href);
  };

  const resumeKind = resume ? resolveContinueKind(resume.node.id) : null;

  return (
    <Card variant="primary" density="roomy" className="min-w-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--accent-bg)] text-[var(--accent)]">
          <GraduationCap size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="eyebrow-mono text-[var(--accent)]">{study.headline}</p>
            <h2 className="mt-1 text-[clamp(1.15rem,2.4vw,1.4rem)] font-semibold leading-snug tracking-tight text-[var(--text-heading)]">
              {study.detail}
            </h2>
          </div>

          {readinessNudge ? (
            <p className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
              <Moon size={14} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
              {readinessNudge}
            </p>
          ) : null}

          {topMistakes.length > 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              Top miss {topMistakes.length === 1 ? "area" : "areas"}:{" "}
              {topMistakes.map((row) => `${row.category} (${row.count})`).join(", ")}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
            <Button onClick={handleStart} className="w-full touch-manipulation sm:w-auto">
              <Play size={14} aria-hidden />
              Start focus session
            </Button>
            <Link to={study.href} className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full touch-manipulation sm:w-auto">
                {study.buttonLabel}
                <ArrowRight size={14} aria-hidden />
              </Button>
            </Link>
          </div>

          {!dailyQuizDone ? (
            <p className="text-xs text-[var(--text-muted)]">
              Short on time?{" "}
              <Link to={ROUTES.satDailyQuiz} className="font-medium text-[var(--accent)] hover:underline">
                Take the Daily 5
              </Link>{" "}
              — a 2-minute SAT warm-up that still counts.
            </p>
          ) : null}

          {study.diagnosticNote ? (
            <p className="text-xs text-[var(--text-subtle)]">{study.diagnosticNote}</p>
          ) : null}

          {resume && resumeKind ? (
            <p className="flex flex-wrap items-center gap-1.5 border-t border-[var(--rule)] pt-3 text-xs text-[var(--text-muted)]">
              <span>Or pick up where you left off:</span>
              <Link
                to={continueHref(resume.subject.id, resume.node.id, resumeKind)}
                className="inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:underline"
              >
                {resume.node.name}
                <ArrowRight size={11} aria-hidden />
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
