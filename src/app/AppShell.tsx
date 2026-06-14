import { NavLink, useLocation } from "react-router-dom";
import { RoutePageTransition } from "@/app/RoutePageTransition";
import {
  Brain,
  ChevronRight,
  Flame,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sun,
} from "lucide-react";
import { Button, KeyHint } from "@/components/ui";
import { StatusBar } from "@/components/StatusBar";
import { MobileStudyStrip } from "@/components/MobileStudyStrip";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import { CommandPalette } from "@/features/search/CommandPalette";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";
import { cn } from "@/lib/cn";
import { formatAppVersion } from "@/lib/version";
import { useIsSimpleMode } from "@/lib/uiMode";
import { useEffect, useMemo, useState } from "react";
import {
  getMobileNavItems,
  getNavSections,
  resolveBreadcrumb,
  ROUTES,
} from "@/app/navigation";

const SIDEBAR_PREF_KEY = "learnv2_sidebar_collapsed_v1";

function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_PREF_KEY);
    if (raw === null) {
      return window.matchMedia("(max-width: 1279px)").matches;
    }
    return raw === "1";
  } catch {
    return false;
  }
}

export function AppShell() {
  const { theme, setTheme, focusMode, toggleFocusMode } = usePreferences();
  const simpleMode = useIsSimpleMode();
  const getNodesNeedingReview = useProgress((s) => s.getNodesNeedingReview);
  const getStats = useProgress((s) => s.getStats);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => readSidebarCollapsed());
  const reviewCount = subjects.length ? getNodesNeedingReview(subjects).length : 0;
  const stats = subjects.length ? getStats(subjects) : null;
  const navSections = useMemo(() => getNavSections({ simple: simpleMode }), [simpleMode]);
  const mobileNav = getMobileNavItems();
  const location = useLocation();
  const breadcrumb = useMemo(() => resolveBreadcrumb(location.pathname), [location.pathname]);

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_PREF_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (isTyping) return;
      if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleFocusMode();
        return;
      }
      if (e.key === "[" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setSidebarCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFocusMode]);

  const sidebarLabelsVisible = !sidebarCollapsed;

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)]">
      <aside
        aria-label="Workspace navigation"
        className={cn(
          "app-chrome hidden shrink-0 flex-col border-r border-[var(--rule)] bg-[var(--bg-rail)] md:flex",
          "transition-[width] duration-200",
          sidebarLabelsVisible ? "w-[var(--sidebar-expanded-width)]" : "w-[var(--rail-width)]",
          focusMode && "hidden",
        )}
      >
        <div className="flex h-[var(--topbar-height)] items-center gap-2 border-b border-[var(--rule)] px-3">
          <NavLink
            to={ROUTES.today}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-panel)] text-[var(--accent)]"
            aria-label="Learn v2 — Today"
            title="Learn v2"
          >
            <Brain size={16} aria-hidden />
          </NavLink>
          {sidebarLabelsVisible ? (
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-semibold text-[var(--text-heading)]">
                Learn v2
              </div>
              <div className="truncate font-mono text-[10px] text-[var(--text-subtle)]">
                {formatAppVersion()}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarLabelsVisible ? "Collapse sidebar ([)" : "Expand sidebar ([)"}
            aria-label={sidebarLabelsVisible ? "Collapse sidebar" : "Expand sidebar"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          >
            {sidebarLabelsVisible ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          </button>
        </div>

        <nav
          aria-label="Primary navigation"
          className={cn(
            "flex flex-1 flex-col gap-5 overflow-y-auto py-3",
            sidebarLabelsVisible ? "px-2" : "px-1.5",
          )}
        >
          {navSections.map((section) => (
            <div key={section.label}>
              {sidebarLabelsVisible ? (
                <p className="eyebrow-mono mb-1.5 px-2">{section.label}</p>
              ) : null}
              <ul className="flex flex-col gap-0.5">
                {section.items.map(({ to, label, hint, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      title={hint}
                      aria-label={
                        to === ROUTES.review && reviewCount > 0
                          ? `${label} — ${hint}, ${reviewCount} due`
                          : `${label} — ${hint}`
                      }
                      className={({ isActive }) =>
                        cn(
                          "group relative flex min-h-9 items-center gap-2.5 rounded-[var(--radius)] text-[13px] transition-colors",
                          sidebarLabelsVisible ? "pl-3 pr-2 py-1.5" : "justify-center px-1 py-2",
                          isActive
                            ? "font-semibold text-[var(--text-heading)] bg-[var(--bg-panel)] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-full before:bg-[var(--accent)]"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
                          {sidebarLabelsVisible ? <span className="truncate">{label}</span> : null}
                          {to === ROUTES.review && reviewCount > 0 ? (
                            sidebarLabelsVisible ? (
                              <span className="ml-auto rounded-[var(--radius-sm)] border border-[var(--accent-border)] bg-[var(--accent-bg)] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[var(--accent)]">
                                {reviewCount}
                              </span>
                            ) : (
                              <span
                                aria-hidden
                                className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                              />
                            )
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className={cn(
            "border-t border-[var(--rule)] px-3 py-2 font-mono text-[11px] tabular-nums text-[var(--text-subtle)]",
            !sidebarLabelsVisible && "px-1.5 text-center",
          )}
          aria-label="Workspace status"
        >
          {sidebarLabelsVisible ? (
            <div className="flex items-center justify-between gap-2">
              <span title="Today minutes">{stats?.todayMinutes ?? 0}m today</span>
              <span className="inline-flex items-center gap-1" title="Current streak">
                <Flame size={11} aria-hidden />
                {stats?.streakCurrent ?? 0}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span title={`${stats?.todayMinutes ?? 0} minutes today`}>{stats?.todayMinutes ?? 0}</span>
              <span
                className="inline-flex items-center"
                title={`Streak: ${stats?.streakCurrent ?? 0}`}
              >
                <Flame size={10} aria-hidden />
              </span>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-[var(--bg-canvas)]">
        <header
          className={cn(
            "app-chrome sticky top-0 z-10 flex h-[var(--topbar-height)] items-center gap-3 border-b border-[var(--rule)] bg-[var(--bg-app)] px-4 md:px-6",
            focusMode && "hidden",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <NavLink
              to={ROUTES.today}
              className="md:hidden inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--rule)] bg-[var(--bg-panel)] text-[var(--accent)]"
              aria-label="Today"
            >
              <Brain size={14} aria-hidden />
            </NavLink>
            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex min-w-0 items-center gap-1 text-[13px]">
                {breadcrumb.map((crumb, idx) => {
                  const isLast = idx === breadcrumb.length - 1;
                  return (
                    <li key={`${crumb.label}-${idx}`} className="flex min-w-0 items-center gap-1">
                      {idx > 0 ? (
                        <ChevronRight
                          size={12}
                          className="shrink-0 text-[var(--text-subtle)]"
                          aria-hidden
                        />
                      ) : null}
                      {!isLast && crumb.to ? (
                        <NavLink
                          to={crumb.to}
                          className="truncate text-[var(--text-muted)] hover:text-[var(--text)]"
                        >
                          {crumb.label}
                        </NavLink>
                      ) : (
                        <span
                          className={cn(
                            "truncate",
                            isLast
                              ? "font-semibold text-[var(--text-heading)]"
                              : "text-[var(--text-muted)]",
                          )}
                        >
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPaletteOpen(true)}
              className="hidden md:inline-flex"
              title="Open command palette"
            >
              <Search size={14} />
              <span>Quick open</span>
              <KeyHint size="sm">⌘K</KeyHint>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPaletteOpen(true)}
              aria-label="Quick open"
              className="md:hidden"
            >
              <Search size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFocusMode}
              title="Toggle focus mode (F)"
              aria-label="Toggle focus mode"
              className="hidden sm:inline-flex"
            >
              Focus
              <KeyHint size="sm">F</KeyHint>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")
              }
              aria-label={`Theme: ${theme}. Click to change.`}
              title={`Theme: ${theme}`}
            >
              {theme === "dark" ? (
                <Moon size={16} />
              ) : theme === "light" ? (
                <Sun size={16} />
              ) : (
                <Monitor size={16} />
              )}
            </Button>
          </div>
        </header>

        <MobileStudyStrip hidden={simpleMode} />

        <main
          className={cn(
            "flex-1",
            focusMode
              ? "pb-6"
              : cn("pb-[var(--mobile-nav-height)]", !simpleMode && "md:pb-[var(--statusbar-height)]"),
          )}
        >
          <ComponentErrorBoundary scope="page">
            <RoutePageTransition />
          </ComponentErrorBoundary>
        </main>

        <nav
          className={cn(
            "app-chrome fixed inset-x-0 bottom-0 z-[var(--z-chrome)] flex h-[var(--mobile-nav-height)] items-stretch border-t border-[var(--rule)] bg-[var(--bg-rail)] md:hidden",
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
                  "relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] leading-tight transition",
                  isActive
                    ? "font-semibold text-[var(--text-heading)] before:absolute before:left-2 before:right-2 before:top-0 before:h-[2px] before:rounded-full before:bg-[var(--accent)]"
                    : "text-[var(--text-muted)]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon size={18} strokeWidth={isActive ? 2 : 1.6} />
                    {to === ROUTES.review && reviewCount > 0 && (
                      <span className="absolute -right-2 -top-1.5 rounded-[var(--radius-sm)] border border-[var(--accent-border)] bg-[var(--accent-bg)] px-1 font-mono text-[9px] tabular-nums leading-none text-[var(--accent)]">
                        {reviewCount}
                      </span>
                    )}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <StatusBar reviewCount={reviewCount} collapsed={sidebarCollapsed} hidden={simpleMode} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
