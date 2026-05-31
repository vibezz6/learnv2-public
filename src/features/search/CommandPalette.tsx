import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  Clock,
  Command,
  FileText,
  FlaskConical,
  GraduationCap,
  LayoutGrid,
  Moon,
  Search,
  SearchX,
  Shuffle,
  Sparkles,
  Sun,
  Target,
  Zap,
} from "lucide-react";
import { getUrgentCollegeDeadlines } from "@/lib/admissionsSummary";
import { listColleges } from "@/lib/colleges";
import { formatActivityLabel, listActivities } from "@/lib/studyActivity";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { getLatestCompletedSatPretestAttempt } from "@/lib/satPretest";
import { getSatRecommendedLessons } from "@/lib/satRecommendedLessons";
import { getSatSkillMastery } from "@/lib/satSkillMastery";
import { getSubjectAccent } from "@/lib/subjectAccent";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useProgress } from "@/stores/progress";
import { KeyHint } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { getCommandNavItems, ROUTES } from "@/app/navigation";
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
import { useFocusSession } from "@/stores/focusSession";

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
  const startFocusSession = useFocusSession((s) => s.startSession);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentActions, setRecentActions] = useState(() => getRecentCommandActions());
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Trap Tab inside the palette (options are tabIndex=-1, so focus stays on the input).
  const panelRef = useFocusTrap<HTMLDivElement>(open, "none");

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
            subjectColor: getSubjectAccent(sub.id),
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

    const navigateItems: CommandItem[] = getCommandNavItems().map((item) => {
      const label = item.commandLabel ?? item.label;
      return {
        id: item.id,
        label,
        description: item.hint,
        section: "Navigate" as const,
        icon: item.icon,
        recentPath: item.to,
        action: () => go(item.to, { id: item.id, label }),
      };
    });

    const campusItems: CommandItem[] = [
      {
        id: "campus",
        label: "College hub",
        section: "Campus",
        icon: LayoutGrid,
        recentPath: ROUTES.college,
        action: () => go(ROUTES.college, { id: "campus", label: "College hub" }),
      },
      {
        id: "college-checklist",
        label: "College checklist",
        description: "FAFSA, essays, deadlines",
        section: "Campus",
        icon: ClipboardList,
        recentPath: ROUTES.collegeChecklist,
        action: () =>
          go(ROUTES.collegeChecklist, { id: "college-checklist", label: "College checklist" }),
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
        recentPath: urgentDeadlines[0]?.href ?? ROUTES.collegeChecklist,
        action: () => {
          const path = urgentDeadlines[0]?.href ?? ROUTES.collegeChecklist;
          go(path, { id: "college-deadlines", label: "College deadlines" });
        },
      },
      {
        id: "essay-tracker",
        label: "Essay tracker",
        description: "Draft status and due dates",
        section: "Campus",
        icon: FileText,
        recentPath: ROUTES.essayTracker,
        action: () => go(ROUTES.essayTracker, { id: "essay-tracker", label: "Essay tracker" }),
      },
      {
        id: "campus-focus",
        label: "Change campus focus",
        description: "SAT, foundations, or explore",
        section: "Campus",
        icon: GraduationCap,
        recentPath: ROUTES.settings,
        action: () => go(`${ROUTES.settings}#campus-focus`, { id: "campus-focus", label: "Change campus focus" }),
      },
      {
        id: "trading-lab",
        label: "Trading Lab",
        section: "Campus",
        icon: FlaskConical,
        recentPath: ROUTES.tradingLab,
        action: () => go(ROUTES.tradingLab, { id: "trading-lab", label: "Trading Lab" }),
      },
      {
        id: "log-mistake",
        label: "Log SAT mistake",
        description: "Open mistake log",
        section: "Actions",
        icon: ClipboardList,
        recentPath: ROUTES.satMistakes,
        action: () => go(ROUTES.satMistakes, { id: "log-mistake", label: "Log SAT mistake" }),
      },
      {
        id: "start-focus",
        label: "Start focus session",
        description: "Timer on SAT hub (no deep-focus chrome)",
        section: "Actions",
        icon: Target,
        recentPath: ROUTES.sat,
        action: () => {
          startFocusSession({
            label: "SAT focus",
            href: ROUTES.sat,
            focus: false,
          });
          go(ROUTES.sat, { id: "start-focus", label: "Start focus session" });
        },
      },
      ...listColleges().map((college) => ({
        id: `app-package-${college.id}`,
        label: `Open application package — ${college.name}`,
        description: college.deadline ? `Deadline ${college.deadline}` : "Campus school",
        section: "Campus" as const,
        icon: GraduationCap,
        recentPath: `${ROUTES.applicationPackage}?college=${encodeURIComponent(college.name)}`,
        action: () =>
          go(`${ROUTES.applicationPackage}?college=${encodeURIComponent(college.name)}`, {
            id: `app-package-${college.id}`,
            label: `Application package — ${college.name}`,
          }),
      })),
      {
        id: "sat-daily-5",
        label: "SAT Daily 5",
        description: "Today's five-question warm-up",
        section: "SAT",
        icon: Zap,
        recentPath: ROUTES.satDailyQuiz,
        action: () => go(ROUTES.satDailyQuiz, { id: "sat-daily-5", label: "SAT Daily 5" }),
      },
      {
        id: "sat-drill-weakest",
        label: "Drill weakest skill",
        description:
          getSatSkillMastery(subjects).find((r) => r.hasSignal)?.label ??
          "Log mistakes or finish a diagnostic first",
        section: "SAT",
        icon: Target,
        recentPath: ROUTES.satDrill,
        action: () => {
          const weakest = getSatSkillMastery(subjects).find((r) => r.hasSignal);
          if (weakest?.questionCount) {
            go(`${ROUTES.satDrill}?skill=${weakest.skillId}`, {
              id: "sat-drill-weakest",
              label: "Drill weakest skill",
            });
          } else {
            go(ROUTES.satDrill, { id: "sat-drill-weakest", label: "Drill weakest skill" });
          }
        },
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
            go(ROUTES.satRecommended, {
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
        recentPath: ROUTES.satMistakes,
        action: () => go(ROUTES.satMistakes, { id: "sat-mistake-log", label: "SAT mistake log" }),
      },
      {
        id: "sat-skills",
        label: "SAT skill mastery",
        description: "Per-skill diagnostic and drill links",
        section: "SAT",
        icon: Target,
        recentPath: ROUTES.satSkills,
        action: () => go(ROUTES.satSkills, { id: "sat-skills", label: "SAT skill mastery" }),
      },
      {
        id: "sat-prep",
        label: "SAT Prep",
        description: "Study hub — lessons, mistakes, drills",
        section: "SAT",
        icon: BookOpen,
        recentPath: ROUTES.sat,
        action: () => go(ROUTES.sat, { id: "sat-prep", label: "SAT Prep" }),
      },
      ...(getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID)
        ? []
        : [
            {
              id: "sat-pretest",
              label: "SAT optional baseline (Draft 1)",
              description: "In-app diagnostic when you want a baseline",
              section: "SAT" as const,
              icon: GraduationCap,
              recentPath: ROUTES.satPretest,
              action: () =>
                go(ROUTES.satPretest, {
                  id: "sat-pretest",
                  label: "SAT optional baseline (Draft 1)",
                }),
            },
          ]),
    ];

    const subjectItems: CommandItem[] = subjects.map((sub) => ({
      id: `sub-${sub.id}`,
      label: sub.name,
      description: `${sub.nodes.length} lessons`,
      section: "Subjects",
      groupKey: sub.name,
      subjectColor: getSubjectAccent(sub.id),
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
  }, [
    subjects,
    go,
    setTheme,
    onClose,
    recentSearches,
    recentActions,
    fillQuery,
    satRecommended,
    urgentDeadlines,
    startFocusSession,
  ]);

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
      className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center bg-black/55 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        ref={panelRef}
        className="w-full max-w-xl overflow-hidden rounded-[var(--radius-md)] border border-[var(--rule-strong)] bg-[var(--bg-panel)] shadow-[var(--shadow-overlay)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--rule)] px-4 py-3">
          <Command size={16} className="shrink-0 text-[var(--text-muted)]" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quick open — type to search lessons, campus, commands"
            aria-label="Search lessons, campus, and commands"
            role="combobox"
            aria-expanded={flatItems.length > 0}
            aria-controls="command-palette-listbox"
            aria-activedescendant={
              flatItems.length > 0 && selected >= 0 ? `cmd-option-${selected}` : undefined
            }
            className="min-w-0 flex-1 rounded-[var(--radius-sm)] bg-transparent text-sm outline-none placeholder:text-[var(--text-subtle)] focus-visible:shadow-[var(--focus-ring)]"
          />
          <KeyHint size="sm">esc</KeyHint>
        </div>

        {q && (
          <div className="border-b border-[var(--rule)] px-4 py-1.5 font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
            {flatItems.length} result{flatItems.length === 1 ? "" : "s"}
            {lessonCount > 0 && ` · ${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`}
          </div>
        )}

        <ul
          ref={listRef}
          id="command-palette-listbox"
          role="listbox"
          aria-label="Search results"
          className="max-h-[min(60vh,28rem)] overflow-y-auto py-2"
        >
          {!q && recentSearches.length === 0 && recentActions.length === 0 && (
            <li className="border-b border-[var(--rule)] px-6 py-4 text-center">
              <Search className="mx-auto mb-2 text-[var(--text-muted)]" size={20} aria-hidden />
              <p className="text-sm font-medium text-[var(--text-heading)]">
                Type to search subjects and lessons
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Or pick a shortcut below</p>
            </li>
          )}

          {q && flatItems.length === 0 && (
            <li className="px-6 py-10 text-center">
              <SearchX className="mx-auto mb-3 text-[var(--text-subtle)]" size={24} aria-hidden />
              <p className="text-sm font-medium text-[var(--text-heading)]">No results for &ldquo;{q}&rdquo;</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Try a lesson name, &ldquo;essay&rdquo;, &ldquo;checklist&rdquo;, or &ldquo;timer&rdquo;.
              </p>
            </li>
          )}

          {displayBlocks.map((block) => (
            <li key={block.key}>
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                {block.subjectColor && (
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: block.subjectColor }}
                  />
                )}
                <span className="eyebrow-mono">{block.title}</span>
              </div>
              {block.items.map((cmd) => {
                flatIndex++;
                const idx = flatIndex;
                const Icon = cmd.icon;
                const isSelected = idx === selected;

                return (
                  <button
                    key={cmd.id}
                    id={`cmd-option-${idx}`}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setSelected(idx)}
                    className={`flex w-full items-center gap-3 border-l-2 py-2 pr-4 pl-3 text-left text-sm transition ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--bg-hover)] text-[var(--text-heading)]"
                        : "border-transparent text-[var(--text)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <span
                      className={isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}
                      aria-hidden
                    >
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{cmd.label}</div>
                      {cmd.description && (
                        <div className="truncate text-xs text-[var(--text-muted)]">{cmd.description}</div>
                      )}
                    </div>
                    {isSelected && (
                      <KeyHint size="sm" className="shrink-0">
                        ↵
                      </KeyHint>
                    )}
                  </button>
                );
              })}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-4 border-t border-[var(--rule)] px-4 py-2 font-mono text-[10px] text-[var(--text-subtle)]">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>⌘K toggle</span>
        </div>
      </div>
    </div>
  );
}
