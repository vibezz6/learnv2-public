import type { ComponentType } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  GraduationCap,
  Home,
  LayoutGrid,
  Route,
  Settings,
  Star,
  Timer,
} from "lucide-react";

export const ROUTES = {
  today: "/",
  sat: "/subjects/sat-prep",
  college: "/campus",
  collegeChecklist: "/campus/college-checklist",
  applicationPackage: "/campus/application",
  campusPrintSummary: "/campus/print-summary",
  essayTracker: "/campus/essay-tracker",
  subjects: "/subjects",
  tracks: "/tracks",
  saved: "/bookmarks",
  review: "/review",
  timer: "/timer",
  stats: "/stats",
  settings: "/settings",
  satMistakes: "/subjects/sat-prep#mistakes",
  satSkills: "/subjects/sat-prep#skills",
  satRecommended: "/subjects/sat-prep#recommended",
  satOfficial: "/subjects/sat-prep#official",
  satDiagnostic: "/subjects/sat-prep#diagnostic",
  satPretest: "/sat/pretest",
  satDailyQuiz: "/sat/daily-quiz",
  satDrill: "/sat/drill",
  tradingLab: "/lab/trading",
} as const;

export type AppRouteId = keyof typeof ROUTES;

export interface AppNavItem {
  id: AppRouteId;
  to: string;
  label: string;
  commandLabel?: string;
  hint: string;
  section: "Study" | "Applications" | "Library" | "System";
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  end?: boolean;
  mobilePriority?: number;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    id: "today",
    to: ROUTES.today,
    label: "Today",
    hint: "Next action and short study block",
    section: "Study",
    icon: Home,
    end: true,
    mobilePriority: 1,
  },
  {
    id: "sat",
    to: ROUTES.sat,
    label: "SAT",
    commandLabel: "SAT Prep",
    hint: "August track, mistakes, and official practice",
    section: "Study",
    icon: GraduationCap,
    mobilePriority: 2,
  },
  {
    id: "college",
    to: ROUTES.college,
    label: "College",
    commandLabel: "College hub",
    hint: "Checklist, essays, deadlines, and college tools",
    section: "Applications",
    icon: LayoutGrid,
    mobilePriority: 3,
  },
  {
    id: "subjects",
    to: ROUTES.subjects,
    label: "Subjects",
    hint: "Skill trees and lessons",
    section: "Library",
    icon: BookOpen,
    end: true,
  },
  {
    id: "tracks",
    to: ROUTES.tracks,
    label: "Tracks",
    commandLabel: "Tracks",
    hint: "Guided multi-subject learning paths",
    section: "Library",
    icon: Route,
  },
  {
    id: "review",
    to: ROUTES.review,
    label: "Review",
    commandLabel: "Review queue",
    hint: "Spaced repetition queue",
    section: "Study",
    icon: Brain,
    mobilePriority: 4,
  },
  {
    id: "stats",
    to: ROUTES.stats,
    label: "Stats",
    commandLabel: "Stats & transcript",
    hint: "Progress proof and activity history",
    section: "Study",
    icon: BarChart3,
    mobilePriority: 5,
  },
  {
    id: "saved",
    to: ROUTES.saved,
    label: "Saved",
    hint: "Bookmarked lessons and resources",
    section: "Library",
    icon: Star,
  },
  {
    id: "timer",
    to: ROUTES.timer,
    label: "Timer",
    hint: "Timed study sessions",
    section: "Study",
    icon: Timer,
  },
  {
    id: "settings",
    to: ROUTES.settings,
    label: "Settings",
    hint: "Backup, theme, and keys",
    section: "System",
    icon: Settings,
  },
];

export const NAV_SECTION_LABELS: Record<AppNavItem["section"], string> = {
  Study: "Study",
  Applications: "Applications",
  Library: "Library",
  System: "System",
};

export function getNavSections(): Array<{ label: string; items: AppNavItem[] }> {
  return (Object.keys(NAV_SECTION_LABELS) as AppNavItem["section"][])
    .map((section) => ({
      label: NAV_SECTION_LABELS[section],
      items: APP_NAV_ITEMS.filter((item) => item.section === section),
    }))
    .filter((section) => section.items.length > 0);
}

export function getMobileNavItems(): AppNavItem[] {
  return APP_NAV_ITEMS
    .filter((item) => typeof item.mobilePriority === "number")
    .sort((a, b) => (a.mobilePriority ?? 99) - (b.mobilePriority ?? 99));
}

export function getCommandNavItems(): AppNavItem[] {
  return APP_NAV_ITEMS;
}

interface BreadcrumbCrumb {
  label: string;
  to?: string;
}

/**
 * Resolves a top-level breadcrumb for the workspace top bar.
 * Returns ordered crumbs (last is current). Single-crumb paths still return
 * one entry so the top bar is never blank.
 */
export function resolveBreadcrumb(pathname: string): BreadcrumbCrumb[] {
  const path = pathname.split("?")[0];

  if (path === "/" || path === "") return [{ label: "Today" }];
  if (path === ROUTES.subjects) return [{ label: "Subjects" }];
  if (path.startsWith("/subjects/sat-prep/")) {
    return [
      { label: "SAT Prep", to: ROUTES.sat },
      { label: "Lesson" },
    ];
  }
  if (path === ROUTES.sat || path.startsWith("/subjects/sat-prep")) {
    return [{ label: "SAT Prep" }];
  }
  if (path.startsWith("/subjects/")) {
    const segments = path.split("/").filter(Boolean);
    const subjectId = segments[1];
    if (segments.length >= 3) {
      return [
        { label: "Subjects", to: ROUTES.subjects },
        { label: subjectId, to: `/subjects/${subjectId}` },
        { label: "Lesson" },
      ];
    }
    return [
      { label: "Subjects", to: ROUTES.subjects },
      { label: subjectId },
    ];
  }
  if (path === ROUTES.tracks || path.startsWith("/tracks/")) return [{ label: "Tracks" }];
  if (path === ROUTES.review) return [{ label: "Review" }];
  if (path === ROUTES.stats) return [{ label: "Stats" }];
  if (path === ROUTES.settings) return [{ label: "Settings" }];
  if (path === ROUTES.timer) return [{ label: "Timer" }];
  if (path === ROUTES.saved) return [{ label: "Saved" }];
  if (path === ROUTES.college) return [{ label: "College" }];
  if (path === ROUTES.collegeChecklist) {
    return [{ label: "College", to: ROUTES.college }, { label: "Checklist" }];
  }
  if (path === ROUTES.essayTracker) {
    return [{ label: "College", to: ROUTES.college }, { label: "Essays" }];
  }
  if (path === ROUTES.applicationPackage) {
    return [{ label: "College", to: ROUTES.college }, { label: "Application package" }];
  }
  if (path === ROUTES.campusPrintSummary) {
    return [{ label: "College", to: ROUTES.college }, { label: "Print summary" }];
  }
  if (path.startsWith("/campus/calculators")) {
    return [{ label: "College", to: ROUTES.college }, { label: "Calculators" }];
  }
  if (path.startsWith("/campus")) return [{ label: "College" }];
  if (path.startsWith("/lab/trading")) {
    return [{ label: "College", to: ROUTES.college }, { label: "Trading lab" }];
  }
  if (path.startsWith("/sat/pretest")) {
    return [{ label: "SAT Prep", to: ROUTES.sat }, { label: "Diagnostic" }];
  }
  if (path.startsWith("/sat/daily-quiz")) {
    return [{ label: "SAT Prep", to: ROUTES.sat }, { label: "Daily 5" }];
  }
  if (path.startsWith("/sat/drill")) {
    return [{ label: "SAT Prep", to: ROUTES.sat }, { label: "Drill" }];
  }
  return [{ label: "Learn v2" }];
}
