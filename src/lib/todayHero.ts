import { ROUTES } from "@/app/navigation";
import { getSatNextLesson, type NodeStatus } from "@/lib/campusHome";
import { getDailyMinimumStatus } from "@/lib/dailyMinimum";
import { shouldShowDrillQueueTodayCard } from "@/lib/drillQueueToday";
import { isSatTestDatePast } from "@/lib/satCountdown";
import { isDailySatQuizDone } from "@/lib/satDailyQuiz";
import { getDrillQueue } from "@/lib/satDrillQueue";
import type { SatDailyStudyCommand } from "@/lib/satDailyStudy";
import type { SkillNode, Subject } from "@/curriculum/types";

export type TodayHeroMode = "default" | "drill_after_daily5" | "good_shape";

export interface TodayHeroPresentation {
  mode: TodayHeroMode;
  headline: string;
  detail: string;
  primaryHref: string;
  primaryButtonLabel: string;
  /** When set, replaces default Start focus + secondary for good-shape mode. */
  secondaryActions?: Array<{ label: string; href: string }>;
}

export interface TodayHeroInput {
  study: SatDailyStudyCommand;
  subjects: Subject[];
  getNodeStatus: (node: SkillNode) => NodeStatus;
  storage?: Storage;
}

/**
 * Post–Daily-5 hero overlays. College blocking and incomplete Daily 5 stay on
 * `getSatDailyStudyCommand` only (no override).
 */
export function getTodayHeroPresentation(input: TodayHeroInput): TodayHeroPresentation | null {
  const storage = input.storage ?? localStorage;
  const { study } = input;

  if (study.kind === "college_blocking") return null;
  if (!isDailySatQuizDone(undefined, storage)) return null;
  if (isSatTestDatePast(storage)) return null;

  if (shouldShowDrillQueueTodayCard(storage)) {
    const top = getDrillQueue(1, storage)[0];
    if (top) {
      const drillHref = `${ROUTES.satDrill}?skill=${encodeURIComponent(top.skillId)}`;
      return {
        mode: "drill_after_daily5",
        headline: study.headline,
        detail: `Daily 5 done — drill ${top.label} next`,
        primaryHref: drillHref,
        primaryButtonLabel: `Start focus on drill`,
      };
    }
  }

  const minimum = getDailyMinimumStatus(undefined, storage);
  if (minimum.met) {
    const satNext = getSatNextLesson(input.subjects, input.getNodeStatus);
    const secondaryActions: Array<{ label: string; href: string }> = [
      { label: "Open SAT hub", href: ROUTES.sat },
    ];
    if (satNext?.status === "available") {
      secondaryActions.push({
        label: "Review track lesson",
        href: `/subjects/${satNext.subjectId}/${satNext.nodeId}`,
      });
    }
    return {
      mode: "good_shape",
      headline: "You're in good shape today",
      detail: "Pick your next focus:",
      primaryHref: study.href,
      primaryButtonLabel: "Start focus session",
      secondaryActions,
    };
  }

  return null;
}

export function isSatFocusHref(href: string): boolean {
  return (
    href.startsWith("/subjects/sat-prep") ||
    href.startsWith("/sat/") ||
    href === ROUTES.sat ||
    href.startsWith(`${ROUTES.sat}#`)
  );
}
