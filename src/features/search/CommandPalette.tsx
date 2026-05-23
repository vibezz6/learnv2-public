import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Brain,
  Clock,
  Command,
  GraduationCap,
  Home,
  Moon,
  Search,
  SearchX,
  Settings,
  Shuffle,
  Sun,
  Timer,
} from "lucide-react";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
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
  section: "Recent" | "Navigate" | "Subjects" | "Lessons" | "Actions" | "Theme";
  groupKey?: string;
  subjectColor?: string;
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
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (open) {
      loadAllSubjects().then(setSubjects);
      setRecentSearches(getRecentSearches());
    } else {
      setQuery("");
      setSelected(0);
    }
  }, [open]);

  const go = useCallback(
    (path: string) => {
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
            action: () => go(`/subjects/${sub.id}/${node.id}`),
          },
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((r) => r.item);
  }, [query, subjects, go]);

  const staticCommands = useMemo((): CommandItem[] => {
    const surprise = () => {
      const picks: Array<{ subId: string; nodeId: string }> = [];
      for (const sub of subjects) {
        for (const node of sub.nodes) picks.push({ subId: sub.id, nodeId: node.id });
      }
      if (picks.length === 0) return;
      const pick = picks[Math.floor(Math.random() * picks.length)];
      go(`/subjects/${pick.subId}/${pick.nodeId}`);
    };

    const recent: CommandItem[] = recentSearches.map((term, i) => ({
      id: `recent-${i}-${term}`,
      label: term,
      description: "Recent search",
      section: "Recent",
      icon: Clock,
      action: () => fillQuery(term),
    }));

    const navigateItems: CommandItem[] = [
      { id: "home", label: "Dashboard", section: "Navigate", icon: Home, action: () => go("/") },
      { id: "subjects", label: "Subjects", section: "Navigate", icon: BookOpen, action: () => go("/subjects") },
      { id: "review", label: "Review queue", section: "Navigate", icon: Brain, action: () => go("/review") },
      { id: "timer", label: "Timer", section: "Navigate", icon: Timer, action: () => go("/timer") },
      { id: "settings", label: "Settings", section: "Navigate", icon: Settings, action: () => go("/settings") },
    ];

    const subjectItems: CommandItem[] = subjects.map((sub) => ({
      id: `sub-${sub.id}`,
      label: sub.name,
      description: `${sub.nodes.length} lessons`,
      section: "Subjects",
      groupKey: sub.name,
      subjectColor: sub.color,
      icon: BookOpen,
      action: () => go(`/subjects/${sub.id}`),
    }));

    const actionItems: CommandItem[] = [
      { id: "surprise", label: "Random lesson", section: "Actions", icon: Shuffle, action: surprise },
    ];

    const themeItems: CommandItem[] = [
      { id: "theme-dark", label: "Theme: Dark", section: "Theme", icon: Moon, action: () => { setTheme("dark"); onClose(); } },
      { id: "theme-light", label: "Theme: Light", section: "Theme", icon: Sun, action: () => { setTheme("light"); onClose(); } },
    ];

    return [...recent, ...navigateItems, ...subjectItems, ...actionItems, ...themeItems];
  }, [subjects, go, setTheme, onClose, recentSearches, fillQuery]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) {
      return staticCommands.filter((cmd) => cmd.section !== "Subjects");
    }

    const combined = [...staticCommands.filter((c) => c.section !== "Recent"), ...lessonCommands];
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
      const recent = filtered.filter((c) => c.section === "Recent");
      if (recent.length > 0) blocks.push({ key: "recent", title: "Recent", items: recent });

      for (const section of ["Navigate", "Actions", "Theme"] as const) {
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

    for (const section of ["Navigate", "Subjects", "Actions", "Theme"] as const) {
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
      if (q && !cmd.id.startsWith("recent-")) addRecentSearch(q);
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
            placeholder="Search subjects and lessons…"
            aria-label="Search subjects and lessons"
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
          {!q && (
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
                Try a lesson name, subject, or command like &ldquo;timer&rdquo; or &ldquo;review&rdquo;.
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
