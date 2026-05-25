import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Brain,
  CalendarClock,
  ClipboardList,
  Clock,
  Command,
  FileText,
  FlaskConical,
  GraduationCap,
  Home,
  LayoutGrid,
  Moon,
  Search,
  SearchX,
  Settings,
  Shuffle,
  Sparkles,
  Star,
  Sun,
  Timer,
} from "lucide-react";
import { getUrgentCollegeDeadlines } from "@/lib/admissionsSummary";
import { formatActivityLabel, listActivities } from "@/lib/studyActivity";
import { getSatRecommendedLessons } from "@/lib/satRecommendedLessons";
import { useProgress } from "@/stores/progress";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import {
  addRecentCommandAction,
  getRecentCommandActions,
} from "@/features/search/recentCommandActions";
import {
  addRecentSearch,
  getRecentSearches,
  fuzzyMatch,
  scoreCommandMatch,
} from "@/features/search/searchHelpers";
import { usePreferences } from "@/stores/preferences";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  section:
    | "Recent actions"
    | "Recent searches"
    | "Navigate"
    | "Campus"
    | "SAT"
    | "Subjects"
    | "Lessons"
    | "Actions"
    | "Theme";
  groupKey?: string;
  subjectColor?: string;
  recentPath?: string;
  icon: React.ComponentType<{ size?: number }>;
  action: () => void;
}

interface DisplayBlock {
  key: string;
  title: string;
  subjectColor?: string;
  items: CommandItem[];
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { setTheme } = usePreferences();
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentActions, setRecentActions] = useState(() => getRecentCommandActions());
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (open) {
      loadAllSubjects().then(setSubjects);
      setRecentSearches(getRecentSearches());
      setRecentActions(getRecentCommandActions());
    } else {
      setQuery("");
      setSelected(0);
    }
  }, [open]);

  const go = useCallback(
    (path: string, record?: { id: string; label: string }) => {
      if (record) addRecentCommandAction(record.id, record.label, path);
      navigate(path);
      onClose();
    },
    [navigate, onClose],
  );

  const fillQuery = useCallback((term: string) => {
    setQuery(term);
    setSelected(0);
    inputRef.current?.focus();
  }, []);

  const lessonCommands = useMemo((): CommandItem[] => {
    const q = query.trim();
    if (!q) return [];

    const results: Array<{ item: CommandItem; score: number }> = [];
    for (const sub of subjects) {
      for (const node of sub.nodes) {
        const haystack = [node.name, node.description, ...node.keyConcepts].join(" ");
        const { match, score } = fuzzyMatch(q, haystack);
        if (!match) continue;

        results.push({
          score,
          item: {
            id: `lesson-${sub.id}-${node.id}`,
            label: node.name,
            description: node.description.slice(0, 90) + (node.description.length > 90 ? "…" : ""),
            section: "Lessons",
            groupKey: sub.name,
            subjectColor: sub.color,
            icon: GraduationCap,
            recentPath: `/subjects/${sub.id}/${node.id}`,
            action: () =>
              go(`/subjects/${sub.id}/${node.id}`, {
                id: `lesson-${sub.id}-${node.id}`,
                label: node.name,
              }),
          },
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((r) => r.item);
  }, [query, subjects, go]);

  const satRecommended = useMemo(
    () => getSatRecommendedLessons(subjects, getNodeStatus),
    [subjects, getNodeStatus],
  );

  const urgentDeadlines = useMemo(() => getUrgentCollegeDeadlines(), []);

  const staticCommands = useMemo((): CommandItem[] => {
    const surprise = () => {
      const picks: Array<{ subId: string; nodeId: string }> = [];
      for (const sub of subjects) {
        for (const node of sub.nodes) picks.push({ subId: sub.id, nodeId: node.id });
      }
      if (picks.length === 0) return;
      const pick = picks[Math.floor(Math.random() * picks.length)];
      const path = `/subjects/${pick.subId}/${pick.nodeId}`;
      go(path, { id: "surprise", label: "Random lesson" });
    };

    const activityRecent: CommandItem[] = listActivities(5).map((event) => {
      const path = event.nodeId
        ? (() => {
            const sub = subjects.find((s) => s.nodes.some((n) => n.id === event.nodeId));
            return sub ? `/subjects/${sub.id}/${event.nodeId}` : "/";
          })()
        : "/";
      const label = formatActivityLabel(event);
      return {
        id: `activity-${event.id}`,
        label,
        description: event.date,
        section: "Actions" as const,
        icon: Sparkles,
        recentPath: path,
        action: () => go(path, { id: `activity-${event.id}`, label }),
      };
    });

    const recentActionItems: CommandItem[] = recentActions.map((item) => ({
      id: `recent-action-${item.id}`,
      label: item.label,
      description: "Jump back",
      section: "Recent actions" as const,
      icon: Clock,
      action: () => go(item.path, { id: item.id, label: item.label }),
    }));

    const recent: CommandItem[] = recentSearches.map((term, i) => ({
      id: `recent-${i}-${term}`,
      label: term,
      description: "Search again",
      section: "Recent searches",
      icon: Clock,
      action: () => fillQuery(term),
    }));

    const navigateItems: CommandItem[] = [
      { id: "home", label: "Today", section: "Navigate", icon: Home, recentPath: "/", action: () => go("/", { id: "home", label: "Today" }) },
      { id: "bookmarks", label: "Saved", section: "Navigate", icon: Star, recentPath: "/bookmarks", action: () => go("/bookmarks", { id: "bookmarks", label: "Saved" }) },
      { id: "subjects", label: "Subjects", section: "Navigate", icon: BookOpen, recentPath: "/subjects", action: () => go("/subjects", { id: "subjects", label: "Subjects" }) },
      { id: "review", label: "Review queue", section: "Navigate", icon: Brain, recentPath: "/review", action: () => go("/review", { id: "review", label: "Review queue" }) },
      { id: "stats", label: "Stats & transcript", section: "Navigate", icon: BarChart3, recentPath: "/stats", action: () => go("/stats", { id: "stats", label: "Stats & transcript" }) },
      { id: "timer", label: "Timer", section: "Navigate", icon: Timer, recentPath: "/timer", action: () => go("/timer", { id: "timer", label: "Timer" }) },
      { id: "settings", label: "Settings", section: "Navigate", icon: Settings, recentPath: "/settings", action: () => go("/settings", { id: "settings", label: "Settings" }) },
    ];

    const campusItems: CommandItem[] = [
      {
        id: "campus",
        label: "Campus services",
        section: "Campus",
        icon: LayoutGrid,
        recentPath: "/campus",
        action: () => go("/campus", { id: "campus", label: "Campus services" }),
      },
      {
        id: "college-checklist",
        label: "College checklist",
        description: "FAFSA, essays, deadlines",
        section: "Campus",
        icon: ClipboardList,
        recentPath: "/campus/college-checklist",
        action: () =>
          go("/campus/college-checklist", { id: "college-checklist", label: "College checklist" }),
      },
      {
        id: "college-deadlines",
        label: "College deadlines",
        description:
          urgentDeadlines.length > 0
            ? `${urgentDeadlines.length} overdue or due soon`
            : "Checklist and essay due dates",
        section: "Campus",
        icon: CalendarClock,
        recentPath: urgentDeadlines[0]?.href ?? "/campus/college-checklist",
        action: () => {
          const path = urgentDeadlines[0]?.href ?? "/campus/college-checklist";
          go(path, { id: "college-deadlines", label: "College deadlines" });
        },
      },
      {
        id: "essay-tracker",
        label: "Essay tracker",
        description: "Draft status and due dates",
        section: "Campus",
        icon: FileText,
        recentPath: "/campus/essay-tracker",
        action: () => go("/campus/essay-tracker", { id: "essay-tracker", label: "Essay tracker" }),
      },
      {
        id: "campus-focus",
        label: "Change campus focus",
        description: "SAT, foundations, or explore",
        section: "Campus",
        icon: GraduationCap,
        recentPath: "/settings",
        action: () => go("/settings#campus-focus", { id: "campus-focus", label: "Change campus focus" }),
      },
      {
        id: "trading-lab",
        label: "Trading Lab",
        section: "Campus",
        icon: FlaskConical,
        recentPath: "/lab/trading",
        action: () => go("/lab/trading", { id: "trading-lab", label: "Trading Lab" }),
      },
      {
        id: "sat-pretest",
        label: "SAT optional baseline (Draft 1)",
        description: "In-app diagnostic · also under SAT Prep",
        section: "SAT",
        icon: GraduationCap,
        recentPath: "/sat/pretest",
        action: () => go("/sat/pretest", { id: "sat-pretest", label: "SAT optional baseline (Draft 1)" }),
      },
      {
        id: "sat-recommended",
        label: "SAT recommended lessons",
        description:
          satRecommended.lessons[0]?.title ??
          "Next lesson or optional baseline",
        section: "SAT",
        icon: Sparkles,
        action: () => {
          const lesson = satRecommended.lessons[0];
          if (lesson) {
            go(`/subjects/${lesson.subjectId}/${lesson.nodeId}`, {
              id: "sat-recommended",
              label: "SAT recommended lessons",
            });
          } else {
            go("/subjects/sat-prep#recommended", {
              id: "sat-recommended",
              label: "SAT recommended lessons",
            });
          }
        },
      },
      {
        id: "sat-mistake-log",
        label: "SAT mistake log",
        description: "Log misses after Bluebook or Khan",
        section: "SAT",
        icon: ClipboardList,
        recentPath: "/subjects/sat-prep#mistakes",
        action: () => go("/subjects/sat-prep#mistakes", { id: "sat-mistake-log", label: "SAT mistake log" }),
      },
      {
        id: "sat-prep",
        label: "SAT Prep subject",
        description: "75-lesson August track",
        section: "SAT",
        icon: BookOpen,
        recentPath: "/subjects/sat-prep",
        action: () => go("/subjects/sat-prep", { id: "sat-prep", label: "SAT Prep subject" }),
      },
    ];

    const subjectItems: CommandItem[] = subjects.map((sub) => ({
      id: `sub-${sub.id}`,
      label: sub.name,
      description: `${sub.nodes.length} lessons`,
      section: "Subjects",
      groupKey: sub.name,
      subjectColor: sub.color,
      recentPath: `/subjects/${sub.id}`,
      icon: BookOpen,
      action: () => go(`/subjects/${sub.id}`, { id: `sub-${sub.id}`, label: sub.name }),
    }));

    const actionItems: CommandItem[] = [
      { id: "surprise", label: "Random lesson", section: "Actions", icon: Shuffle, action: surprise },
    ];

    const themeItems: CommandItem[] = [
      { id: "theme-dark", label: "Theme: Dark", section: "Theme", icon: Moon, action: () => { setTheme("dark"); onClose(); } },
      { id: "theme-light", label: "Theme: Light", section: "Theme", icon: Sun, action: () => { setTheme("light"); onClose(); } },
    ];

    return [
      ...recentActionItems,
      ...recent,
      ...activityRecent,
      ...navigateItems,
      ...campusItems,
      ...subjectItems,
      ...actionItems,
      ...themeItems,
    ];
  }, [subjects, go, setTheme, onClose, recentSearches, recentActions, fillQuery, satRecommended, urgentDeadlines]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) {
      return staticCommands.filter((cmd) => cmd.section !== "Subjects");
    }

    const combined = [
      ...staticCommands.filter(
        (c) => c.section !== "Recent searches" && c.section !== "Recent actions",
      ),
      ...lessonCommands,
    ];
    return combined
      .map((cmd) => scoreCommandMatch(q, cmd))
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.item);
  }, [query, staticCommands, lessonCommands]);

  const displayBlocks = useMemo((): DisplayBlock[] => {
    const q = query.trim();
    const blocks: DisplayBlock[] = [];

    if (!q) {
      const recentActionsBlock = filtered.filter((c) => c.section === "Recent actions");
      if (recentActionsBlock.length > 0) {
        blocks.push({ key: "recent-actions", title: "Recent actions", items: recentActionsBlock });
      }
      const recentSearchesBlock = filtered.filter((c) => c.section === "Recent searches");
      if (recentSearchesBlock.length > 0) {
        blocks.push({ key: "recent-searches", title: "Recent searches", items: recentSearchesBlock });
      }

      for (const section of ["Navigate", "Campus", "SAT", "Actions", "Theme"] as const) {
        const items = filtered.filter((c) => c.section === section);
        if (items.length > 0) blocks.push({ key: section.toLowerCase(), title: section, items });
      }
      return blocks;
    }

    const lessons = filtered.filter((c) => c.section === "Lessons");
    const bySubject = new Map<string, CommandItem[]>();
    for (const lesson of lessons) {
      const key = lesson.groupKey ?? "Lessons";
      const list = bySubject.get(key) ?? [];
      list.push(lesson);
      bySubject.set(key, list);
    }
    for (const [subjectName, items] of bySubject) {
      blocks.push({
        key: `lesson-${subjectName}`,
        title: subjectName,
        subjectColor: items[0]?.subjectColor,
        items,
      });
    }

    for (const section of ["Navigate", "Campus", "SAT", "Subjects", "Actions", "Theme"] as const) {
      const items = filtered.filter((c) => c.section === section);
      if (items.length > 0) blocks.push({ key: section.toLowerCase(), title: section, items });
    }

    return blocks;
  }, [filtered, query]);

  const flatItems = useMemo(
    () => displayBlocks.flatMap((block) => block.items),
    [displayBlocks],
  );

  useEffect(() => {
    setSelected(0);
  }, [query, open]);

  useEffect(() => {
    itemRefs.current[selected]?.scrollIntoView({ block: "nearest" });
  }, [selected, flatItems.length]);

  const execute = useCallback(
    (cmd: CommandItem) => {
      const q = query.trim();
      if (q && !cmd.id.startsWith("recent-") && cmd.section !== "Recent actions") {
        addRecentSearch(q);
      }
      cmd.action();
    },
    [query],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((i) => Math.min(i + 1, flatItems.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && flatItems[selected]) {
        e.preventDefault();
        execute(flatItems[selected]);
      }
    };
    window.addEventListener("keydown", handler);
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, flatItems, selected, execute]);

  if (!open) return null;

  const q = query.trim();
  const lessonCount = filtered.filter((c) => c.section === "Lessons").length;
  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[15vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Command size={18} className="shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons, campus, commands…"
            aria-label="Search lessons, campus, and commands"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
            esc
          </kbd>
        </div>

        {q && (
          <div className="border-b border-[var(--border)] px-4 py-1.5 text-[11px] text-[var(--text-muted)]">
            {flatItems.length} result{flatItems.length === 1 ? "" : "s"}
            {lessonCount > 0 && ` · ${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`}
          </div>
        )}

        <ul ref={listRef} className="max-h-96 overflow-y-auto py-2">
          {!q && recentSearches.length === 0 && recentActions.length === 0 && (
            <li className="border-b border-[var(--border)] px-6 py-4 text-center">
              <Search className="mx-auto mb-2 text-[var(--accent)]" size={22} />
              <p className="text-sm font-medium text-[var(--text-heading)]">
                Type to search subjects and lessons
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Or pick a shortcut below
              </p>
            </li>
          )}

          {q && flatItems.length === 0 && (
            <li className="px-6 py-10 text-center">
              <SearchX className="mx-auto mb-3 opacity-50" size={28} />
              <p className="text-sm font-medium text-[var(--text-heading)]">No results for &ldquo;{q}&rdquo;</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Try a lesson name, &ldquo;essay&rdquo;, &ldquo;checklist&rdquo;, or &ldquo;timer&rdquo;.
              </p>
            </li>
          )}

          {displayBlocks.map((block) => (
            <li key={block.key}>
              <div className="flex items-center gap-2 px-4 py-1.5">
                {block.subjectColor && (
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: block.subjectColor }}
                  />
                )}
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {block.title}
                </span>
              </div>
              {block.items.map((cmd) => {
                flatIndex++;
                const idx = flatIndex;
                const Icon = cmd.icon;
                const isSelected = idx === selected;

                return (
                  <button
                    key={cmd.id}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setSelected(idx)}
                    className={`flex w-full items-center gap-3 border-l-2 py-2.5 pr-4 pl-3 text-left text-sm transition ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--text)]"
                        : "border-transparent text-[var(--text)] hover:bg-white/5"
                    }`}
                  >
                    <span className={isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}>
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{cmd.label}</div>
                      {cmd.description && (
                        <div className="truncate text-xs text-[var(--text-muted)]">{cmd.description}</div>
                      )}
                    </div>
                    {isSelected && (
                      <kbd className="shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                        ↵
                      </kbd>
                    )}
                  </button>
                );
              })}
            </li>
          ))}
        </ul>

        <div className="flex gap-4 border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--text-muted)]">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>⌘K toggle</span>
        </div>
      </div>
    </div>
  );
}
