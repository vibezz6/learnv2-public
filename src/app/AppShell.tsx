import { NavLink, Outlet } from "react-router-dom";
import {
  Brain,
  BookOpen,
  Home,
  Moon,
  Search,
  Settings,
  Star,
  Sun,
  Timer,
  BarChart3,
  Route,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { CommandPalette } from "@/features/search/CommandPalette";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";
import { cn } from "@/lib/cn";
import { formatAppVersion } from "@/lib/version";
import { useEffect, useState, type ComponentType } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  end?: boolean;
};

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Learn",
    items: [
      { to: "/", label: "Command", icon: Home, end: true },
      { to: "/subjects", label: "Subjects", icon: BookOpen },
      { to: "/tracks", label: "Tracks", icon: Route },
      { to: "/bookmarks", label: "Saved", icon: Star },
    ],
  },
  {
    label: "Productivity",
    items: [
      { to: "/review", label: "Review", icon: Brain },
      { to: "/timer", label: "Timer", icon: Timer },
      { to: "/stats", label: "Stats", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [{ to: "/settings", label: "Settings", icon: Settings }],
  },
];

const mobileNav = navSections.flatMap((section) => section.items).slice(0, 5);

export function AppShell() {
  const { theme, setTheme, focusMode, toggleFocusMode } = usePreferences();
  const getNodesNeedingReview = useProgress((s) => s.getNodesNeedingReview);
  const getStats = useProgress((s) => s.getStats);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const reviewCount = subjects.length ? getNodesNeedingReview(subjects).length : 0;
  const stats = subjects.length ? getStats(subjects) : null;

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        toggleFocusMode();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFocusMode]);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "app-chrome hidden w-[var(--sidebar-width)] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-xl md:flex",
          focusMode && "hidden",
        )}
      >
        <div className="border-b border-[var(--border)] px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
              <Brain size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text-heading)]">Learn v2</div>
              <div className="text-xs text-[var(--text-muted)]">Neural Utopia</div>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]/70">
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-[var(--accent)]/10 font-medium text-[var(--accent)] before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[var(--accent)]"
                          : "text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} strokeWidth={isActive ? 2.25 : 1.75} />
                        {label}
                        {to === "/review" && reviewCount > 0 && (
                          <span className="ml-auto rounded-full bg-[var(--accent)]/15 px-2 py-0.5 font-mono text-[10px] tabular-nums text-[var(--accent)]">
                            {reviewCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-[var(--border)] p-3">
          <Badge>{formatAppVersion()}</Badge>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "app-chrome sticky top-0 z-10 flex h-[var(--topbar-height)] items-center justify-between border-b border-[var(--border)] bg-[var(--bg-glass)] px-4 backdrop-blur-xl md:px-6",
            focusMode && "hidden",
          )}
        >
          <div className="text-sm text-[var(--text-muted)]">
            IQ maxxing · deep focus ready
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <span className="hidden rounded-full border border-[var(--border)] px-2.5 py-1 font-mono text-xs tabular-nums text-[var(--text-muted)] sm:inline">
                Lv {stats.level}
              </span>
            )}
            <Button variant="ghost" onClick={() => setPaletteOpen(true)}>
              <Search size={16} />
              ⌘K
            </Button>
            <Button variant="ghost" onClick={toggleFocusMode}>
              Focus (F)
            </Button>
            <Button
              variant="secondary"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </header>

        <main className="flex-1 pb-[var(--mobile-nav-height)] md:pb-0">
          <Outlet />
        </main>

        <nav
          className={cn(
            "app-chrome fixed inset-x-0 bottom-0 z-20 flex h-[var(--mobile-nav-height)] items-stretch border-t border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-xl md:hidden",
            focusMode && "hidden",
          )}
          aria-label="Mobile navigation"
        >
          {mobileNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition",
                  isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]",
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
