import { NavLink, Outlet } from "react-router-dom";
import {
  Brain,
  BookOpen,
  Home,
  Moon,
  Settings,
  Sun,
  Timer,
  BarChart3,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { usePreferences } from "@/stores/preferences";
import { cn } from "@/lib/cn";
import { useEffect } from "react";

const nav = [
  { to: "/", label: "Command", icon: Home, end: true },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/review", label: "Review", icon: Brain },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/timer", label: "Timer", icon: Timer },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const { theme, setTheme, focusMode, toggleFocusMode } = usePreferences();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm transition",
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]",
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--border)] p-3">
          <Badge>Batch 1 scaffold</Badge>
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

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
