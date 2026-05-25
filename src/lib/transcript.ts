import type { SkillNode, Subject } from "@/curriculum/types";
import {
  buildAdmissionsSummary,
  formatAdmissionsTranscriptSection,
  type AdmissionsSummary,
} from "@/lib/admissionsSummary";
import { loadCollegeChecklist } from "@/lib/collegeChecklist";
import { loadEssayTracker } from "@/lib/essayTracker";
import { listMistakes } from "@/lib/satMistakeLog";
import {
  formatSatPretestTranscriptSection,
  getSatPretestTranscriptSummary,
} from "@/lib/satPretest";
import { summarizeSubjectProgress } from "@/lib/subjectProgress";
import { formatAppVersion } from "@/lib/version";
import type { ReviewStats, Stats } from "@/stores/progress";

export interface SubjectBreakdown {
  subjectId: string;
  subjectName: string;
  completed: number;
  total: number;
  pct: number;
}

export interface TranscriptSummary {
  generatedAt: string;
  studyMinutes: number;
  completedLessons: number;
  totalLessons: number;
  streak: number;
  reviewPassRate: number;
  satMistakesLogged: number;
  satPretest: ReturnType<typeof getSatPretestTranscriptSummary>;
  subjectBreakdown: SubjectBreakdown[];
  narrativeBullets: string[];
  admissions: AdmissionsSummary;
}

export interface TranscriptProgressGetters {
  getStats: (subjects: Subject[]) => Stats;
  getNodeStatus: (node: SkillNode) => "locked" | "available" | "completed";
  getReviewStats: () => ReviewStats;
}

function buildNarrativeBullets(input: {
  studyMinutes: number;
  completedLessons: number;
  totalLessons: number;
  streak: number;
  reviewPassRate: number;
  satMistakesLogged: number;
  subjectBreakdown: SubjectBreakdown[];
}): string[] {
  const bullets: string[] = [];

  if (input.studyMinutes > 0) {
    bullets.push(`Logged ${Math.round(input.studyMinutes)} minutes of focused study time.`);
  } else {
    bullets.push("No study time logged yet — use the timer to start building your record.");
  }

  if (input.totalLessons > 0) {
    const pct = Math.round((input.completedLessons / input.totalLessons) * 100);
    bullets.push(
      `Completed ${input.completedLessons} of ${input.totalLessons} lessons (${pct}% of curriculum).`,
    );
  }

  if (input.streak > 0) {
    bullets.push(`Current study streak: ${input.streak} day${input.streak === 1 ? "" : "s"}.`);
  } else {
    bullets.push("Study today to start or extend your streak.");
  }

  if (input.reviewPassRate > 0) {
    bullets.push(`Spaced review pass rate: ${input.reviewPassRate}%.`);
  }

  if (input.satMistakesLogged > 0) {
    bullets.push(
      `Logged ${input.satMistakesLogged} SAT practice mistake${input.satMistakesLogged === 1 ? "" : "s"} for retargeting.`,
    );
  }

  const activeSubjects = input.subjectBreakdown.filter((subject) => subject.completed > 0);
  if (activeSubjects.length > 0) {
    const top = activeSubjects.slice(0, 3).map((subject) => `${subject.subjectName} (${subject.pct}%)`);
    bullets.push(`Most progress: ${top.join(", ")}.`);
  }

  return bullets;
}

export function buildTranscriptSummary(
  subjects: Subject[],
  getters: TranscriptProgressGetters,
  storage: Storage = localStorage,
): TranscriptSummary {
  const stats = getters.getStats(subjects);
  const reviewStats = getters.getReviewStats();
  const satMistakesLogged = listMistakes(storage).length;

  const subjectBreakdown = subjects
    .map((subject) => {
      const summary = summarizeSubjectProgress(subject, getters.getNodeStatus);
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        completed: summary.completed,
        total: summary.total,
        pct: summary.pct,
      };
    })
    .filter((subject) => subject.total > 0)
    .sort((a, b) => b.pct - a.pct || b.completed - a.completed);

  const studyMinutes = Math.round(stats.totalStudyMinutes);
  const admissions = buildAdmissionsSummary(
    loadCollegeChecklist(storage),
    loadEssayTracker(storage),
  );

  return {
    generatedAt: new Date().toISOString(),
    studyMinutes,
    completedLessons: stats.completedNodes,
    totalLessons: stats.totalNodes,
    streak: stats.streakCurrent,
    reviewPassRate: reviewStats.passRate,
    satMistakesLogged,
    satPretest: getSatPretestTranscriptSummary("draft-1", "draft-2", storage),
    subjectBreakdown,
    admissions,
    narrativeBullets: buildNarrativeBullets({
      studyMinutes,
      completedLessons: stats.completedNodes,
      totalLessons: stats.totalNodes,
      streak: stats.streakCurrent,
      reviewPassRate: reviewStats.passRate,
      satMistakesLogged,
      subjectBreakdown,
    }),
  };
}

export function formatTranscriptMarkdown(summary: TranscriptSummary): string {
  const generatedDate = summary.generatedAt.slice(0, 10);
  const lines: string[] = [
    "# Learn v2 Study Transcript",
    "",
    `Generated: ${summary.generatedAt}`,
    `App: ${formatAppVersion()}`,
    "",
    "## Summary",
    "",
    `- Study time: ${summary.studyMinutes} minutes`,
    `- Lessons completed: ${summary.completedLessons} / ${summary.totalLessons}`,
    `- Study streak: ${summary.streak} day${summary.streak === 1 ? "" : "s"}`,
    `- Review pass rate: ${summary.reviewPassRate}%`,
    `- SAT mistakes logged: ${summary.satMistakesLogged}`,
    "",
  ];

  lines.push(...formatSatPretestTranscriptSection(summary.satPretest));

  if (summary.subjectBreakdown.length > 0) {
    lines.push("## Subject breakdown", "");
    for (const subject of summary.subjectBreakdown) {
      lines.push(
        `- ${subject.subjectName}: ${subject.completed}/${subject.total} (${subject.pct}%)`,
      );
    }
    lines.push("");
  }

  if (summary.narrativeBullets.length > 0) {
    lines.push("## Highlights", "");
    for (const bullet of summary.narrativeBullets) {
      lines.push(`- ${bullet}`);
    }
    lines.push("");
  }

  const admissionsLines = formatAdmissionsTranscriptSection(summary.admissions);
  if (admissionsLines.length > 0) {
    lines.push(...admissionsLines);
  }

  lines.push(`_Exported from Learn v2 on ${generatedDate}._`);
  return lines.join("\n");
}

export async function copyTranscriptToClipboard(
  summary: TranscriptSummary,
  writeText: (text: string) => Promise<void> = (text) => navigator.clipboard.writeText(text),
): Promise<boolean> {
  try {
    await writeText(formatTranscriptMarkdown(summary));
    return true;
  } catch {
    return false;
  }
}
