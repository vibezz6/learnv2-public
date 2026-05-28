import type { ComponentType } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  GraduationCap,
  Home,
  LayoutGrid,
  Settings,
  Star,
  Timer,
} from "lucide-react";

export const ROUTES = {
  today: "/",
  sat: "/subjects/sat-prep",
  college: "/campus",
  collegeChecklist: "/campus/college-checklist",
  essayTracker: "/campus/essay-tracker",
  subjects: "/subjects",
  tracks: "/tracks",
  saved: "/bookmarks",
  review: "/review",
  timer: "/timer",
  stats: "/stats",
  settings: "/settings",
  satMistakes: "/subjects/sat-prep#mistakes",
  satRecommended: "/subjects/sat-prep#recommended",
  satOfficial: "/subjects/sat-prep#official",
  satDiagnostic: "/subjects/sat-prep#diagnostic",
  satPretest: "/sat/pretest",
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
    hint: "Checklist, essays, deadlines, and campus tools",
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
