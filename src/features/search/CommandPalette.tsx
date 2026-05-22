import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Brain,
  Command,
  GraduationCap,
  Home,
  Moon,
  SearchX,
  Settings,
  Shuffle,
  Sun,
  Timer,
} from "lucide-react";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { usePreferences } from "@/stores/preferences";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  section: string;
  icon: React.ComponentType<{ size?: number }>;
  action: () => void;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { setTheme } = usePreferences();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) loadAllSubjects().then(setSubjects);
  }, [open]);

  const go = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose],
  );

  const lessonCommands = useMemo((): CommandItem[] => {
    const q = query.trim();
    if (!q) return [];
    const results: CommandItem[] = [];
    for (const sub of subjects) {
      for (const node of sub.nodes) {
        const haystack = [node.name, node.description, ...node.keyConcepts].join(" ");
        if (fuzzyMatch(q, haystack)) {
          results.push({
            id: `lesson-${sub.id}-${node.id}`,
            label: node.name,
            description: sub.name,
            section: "Lessons",
            icon: GraduationCap,
            action: () => go(`/subjects/${sub.id}/${node.id}`),
          });
        }
      }
    }
    return results.slice(0, 15);
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

    return [
      { id: "home", label: "Dashboard", section: "Navigate", icon: Home, action: () => go("/") },
      { id: "subjects", label: "Subjects", section: "Navigate", icon: BookOpen, action: () => go("/subjects") },
      { id: "review", label: "Review queue", section: "Navigate", icon: Brain, action: () => go("/review") },
      { id: "timer", label: "Timer", section: "Navigate", icon: Timer, action: () => go("/timer") },
      { id: "settings", label: "Settings", section: "Navigate", icon: Settings, action: () => go("/settings") },
      ...subjects.map((sub) => ({
        id: `sub-${sub.id}`,
        label: sub.name,
        description: `${sub.nodes.length} lessons`,
        section: "Subjects",
        icon: BookOpen,
        action: () => go(`/subjects/${sub.id}`),
      })),
      { id: "surprise", label: "Random lesson", section: "Actions", icon: Shuffle, action: surprise },
      { id: "theme-dark", label: "Theme: Dark", section: "Theme", icon: Moon, action: () => { setTheme("dark"); onClose(); } },
      { id: "theme-light", label: "Theme: Light", section: "Theme", icon: Sun, action: () => { setTheme("light"); onClose(); } },
    ];
  }, [subjects, go, setTheme, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim();
    const all = q ? [...staticCommands, ...lessonCommands] : staticCommands;
    if (!q) return all;
    return all.filter(
      (cmd) =>
        cmd.id.startsWith("lesson-") ||
        fuzzyMatch(q, cmd.label) ||
        (cmd.description ? fuzzyMatch(q, cmd.description) : false),
    );
  }, [query, staticCommands, lessonCommands]);

  useEffect(() => {
    setSelected(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filtered[selected]) {
        e.preventDefault();
        filtered[selected].action();
      }
    };
    window.addEventListener("keydown", handler);
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, filtered, selected]);

  if (!open) return null;

  const sections = ["Lessons", "Navigate", "Subjects", "Actions", "Theme"];

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
          <Command size={18} className="text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons or jump to a page…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
            esc
          </kbd>
        </div>

        <ul className="max-h-96 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-[var(--text-muted)]">
              <SearchX className="mx-auto mb-2 opacity-50" size={24} />
              No results
            </li>
          ) : (
            sections.map((section) => {
              const cmds = filtered.filter((c) => c.section === section);
              if (cmds.length === 0) return null;
              let offset = filtered.indexOf(cmds[0]);
              return (
                <li key={section}>
                  <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {section}
                  </div>
                  {cmds.map((cmd) => {
                    const idx = offset++;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        onClick={() => cmd.action()}
                        onMouseEnter={() => setSelected(idx)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition ${
                          idx === selected ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text)]"
                        }`}
                      >
                        <Icon size={16} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className="truncate text-xs text-[var(--text-muted)]">{cmd.description}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </li>
              );
            })
          )}
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
