import {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Eye,
  EyeOff,
  Lightbulb,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, Card, Tag } from "@/components/ui";

/* ───────── CollapsibleSection ───────── */
interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: ReactNode;
  count?: number;
  defaultOpen?: boolean;
  accentColor?: string;
  children: ReactNode;
}

const CollapsibleSection = memo(function CollapsibleSection({
  id,
  title,
  icon,
  count,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const storageKey = `learnv2_section_collapsed_${id}`;
  const legacyStorageKey = `learnapp_section_collapsed_v1_${id}`;
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) return stored !== "true";
      const legacyStored = localStorage.getItem(legacyStorageKey);
      if (legacyStored !== null) {
        localStorage.setItem(storageKey, legacyStored);
        localStorage.removeItem(legacyStorageKey);
        return legacyStored !== "true";
      }
      return defaultOpen;
    } catch {
      return defaultOpen;
    }
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>(isOpen ? "2000px" : "0px");

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, isOpen ? "false" : "true");
    } catch {
      /* ignore */
    }
  }, [isOpen, storageKey]);

  useEffect(() => {
    const el = contentRef.current;
    if (!isOpen) {
      if (el) {
        setMaxHeight(`${el.scrollHeight}px`);
        requestAnimationFrame(() => setMaxHeight("0px"));
      } else {
        setMaxHeight("0px");
      }
      return;
    }
    if (!el) {
      setMaxHeight("9999px");
      return;
    }
    const syncHeight = () => setMaxHeight(`${el.scrollHeight}px`);
    syncHeight();
    const timeout = setTimeout(syncHeight, 300);
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <Card variant="default" density="normal" className="min-w-0 overflow-hidden p-0">
      <div
        id={`section-header-${id}`}
        onClick={toggle}
        className={cn(
          "flex min-h-11 cursor-pointer touch-manipulation select-none items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-hover)] sm:px-5",
          isOpen && "border-b border-[var(--rule)]",
        )}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={`section-content-${id}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <span aria-hidden className="flex shrink-0 items-center text-[var(--text-muted)]">
          {icon}
        </span>
        <span className="eyebrow-mono min-w-0 flex-1 break-words">{title}</span>
        {count !== undefined && count > 0 ? (
          <Tag tone="mono" size="sm" className="shrink-0">
            {count}
          </Tag>
        ) : null}
        {isOpen ? (
          <ChevronUp size={16} className="shrink-0 text-[var(--text-subtle)]" aria-hidden />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-[var(--text-subtle)]" aria-hidden />
        )}
      </div>
      <div
        id={`section-content-${id}`}
        role="region"
        aria-labelledby={`section-header-${id}`}
        ref={contentRef}
        className="min-w-0 overflow-hidden"
        style={{
          maxHeight,
          transition: "max-height 0.3s ease-in-out",
        }}
      >
        <div className="min-w-0 break-words px-4 pb-5 sm:px-5 sm:pb-6">{children}</div>
      </div>
    </Card>
  );
});

export { CollapsibleSection };

/* ───────── SectionHeader ───────── */
interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  badge?: string;
  onClick?: () => void;
}

const SectionHeader = memo(function SectionHeader({
  icon,
  title,
  badge,
  onClick,
}: SectionHeaderProps) {
  const clickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 transition-colors",
        clickable && "cursor-pointer hover:bg-[var(--bg-hover)]",
      )}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <span className="flex items-center text-[var(--accent)]" aria-hidden>
        {icon}
      </span>
      <span className="font-semibold text-[var(--text-heading)]">{title}</span>
      {badge ? (
        <Tag tone="accent" size="sm" mono>
          {badge}
        </Tag>
      ) : null}
      {clickable ? (
        <ChevronRight size={14} className="ml-auto text-[var(--text-subtle)]" aria-hidden />
      ) : null}
    </div>
  );
});

export { SectionHeader };

/* ───────── WorkedExampleCard — teaching block with mono numbered steps ───────── */
interface WorkedExampleCardProps {
  problem: string;
  solution: string;
  explanation: string;
  index: number;
  accentColor?: string;
  nodeId: string;
}

interface RevealState {
  phase: "thinking" | "solving" | "complete";
  stepsRevealed: number;
  explanationOpen: boolean;
}

const WorkedExampleCard = memo(function WorkedExampleCard({
  problem,
  solution,
  explanation,
  index,
  accentColor,
  nodeId,
}: WorkedExampleCardProps) {
  const storageKey = `learnapp_we_v2_${nodeId}_${index}`;
  const [state, setState] = useState<RevealState>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed.phase &&
          typeof parsed.stepsRevealed === "number" &&
          typeof parsed.explanationOpen === "boolean"
        ) {
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
    return { phase: "thinking", stepsRevealed: 0, explanationOpen: false };
  });
  const [thinkSeconds, setThinkSeconds] = useState(0);
  const thinkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = solution.split(/\n+/).filter((s) => s.trim().length > 0);
  const totalSteps = steps.length;
  const allStepsRevealed = state.stepsRevealed >= totalSteps;

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, storageKey]);

  useEffect(() => {
    if (state.phase === "thinking") {
      thinkTimerRef.current = setInterval(() => {
        setThinkSeconds((prev) => prev + 1);
      }, 1000);
      return () => {
        if (thinkTimerRef.current) clearInterval(thinkTimerRef.current);
      };
    } else if (thinkTimerRef.current) {
      clearInterval(thinkTimerRef.current);
    }
  }, [state.phase]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const startSolving = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "solving" }));
  }, []);

  const revealNextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      stepsRevealed: Math.min(prev.stepsRevealed + 1, totalSteps),
      phase: prev.stepsRevealed + 1 >= totalSteps ? "complete" : "solving",
    }));
  }, [totalSteps]);

  const revealAllSteps = useCallback(() => {
    setState((prev) => ({ ...prev, stepsRevealed: totalSteps, phase: "complete" }));
  }, [totalSteps]);

  const resetExercise = useCallback(() => {
    setState({ phase: "thinking", stepsRevealed: 0, explanationOpen: false });
    setThinkSeconds(0);
  }, []);

  const toggleExplanation = useCallback(() => {
    setState((prev) => ({ ...prev, explanationOpen: !prev.explanationOpen }));
  }, []);

  const accent = accentColor || "var(--accent)";
  const exampleNumber = String(index + 1).padStart(2, "0");

  return (
    <article
      className="min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-panel)]"
      aria-label={`Worked example ${index + 1}`}
    >
      <div className="border-b border-[var(--rule)] bg-[var(--bg-canvas)]">
        <div
          className="flex items-center gap-3 border-l-2 px-4 py-3 sm:px-5"
          style={{ borderLeftColor: accent }}
        >
          <BookOpen size={14} className="shrink-0 text-[var(--text-muted)]" aria-hidden />
          <span className="eyebrow-mono">Example {exampleNumber}</span>
          {state.phase !== "thinking" ? (
            <Tag tone={allStepsRevealed ? "success" : "accent"} size="sm" mono className="ml-auto">
              {allStepsRevealed ? "Complete" : `${state.stepsRevealed}/${totalSteps} steps`}
            </Tag>
          ) : null}
        </div>
        <div className="px-4 pb-4 pt-1 text-[15px] leading-relaxed text-[var(--text)] sm:px-5">
          <p className="whitespace-pre-wrap break-words">{problem}</p>
        </div>
      </div>

      {state.phase === "thinking" ? (
        <div className="space-y-3 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3 sm:flex-row sm:items-center">
            <Lightbulb size={18} className="shrink-0 text-[var(--accent)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[var(--text-heading)]">
                Try it yourself first
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Sketch your approach before revealing the solution.
              </div>
            </div>
            <Tag tone="mono" size="sm" className="shrink-0 self-start sm:self-center">
              {formatTime(thinkSeconds)}
            </Tag>
          </div>
          <Button onClick={startSolving} className="w-full">
            <Eye size={14} aria-hidden />
            Show me the solution
          </Button>
        </div>
      ) : null}

      {(state.phase === "solving" || state.phase === "complete") && (
        <div className="space-y-4 px-4 pb-5 pt-4 sm:px-5">
          <div className="flex items-center gap-3">
            <Tag tone={allStepsRevealed ? "success" : "accent"} size="sm" mono>
              Step {state.stepsRevealed}/{totalSteps}
            </Tag>
            {thinkSeconds > 0 ? (
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                Thought for {formatTime(thinkSeconds)}
              </span>
            ) : null}
          </div>

          <ol className="relative ml-2 space-y-3 border-l border-[var(--rule)] pl-5">
            {steps.slice(0, state.stepsRevealed).map((step, i) => (
              <li key={i} className="relative">
                <span
                  aria-hidden
                  className={cn(
                    "absolute -left-[26px] top-0 inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] border font-mono text-[10px] font-medium tabular-nums",
                    allStepsRevealed
                      ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-fg)]"
                      : "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)]",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="whitespace-pre-wrap break-words text-sm leading-[1.65] text-[var(--text)]">
                  {step}
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2">
            {!allStepsRevealed ? (
              <>
                <Button onClick={revealNextStep} size="sm">
                  Next step
                  <ChevronRight size={14} aria-hidden />
                </Button>
                <Button variant="secondary" size="sm" onClick={revealAllSteps}>
                  <Eye size={14} aria-hidden />
                  Show all
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={resetExercise}>
                <EyeOff size={14} aria-hidden />
                Reset
              </Button>
            )}
          </div>

          {allStepsRevealed && explanation ? (
            <details
              open={state.explanationOpen}
              className="rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-sunken)]"
            >
              <summary
                onClick={(e) => {
                  e.preventDefault();
                  toggleExplanation();
                }}
                className="flex min-h-10 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text-heading)]"
              >
                <Lightbulb size={14} aria-hidden className="text-[var(--text-muted)]" />
                <span>{state.explanationOpen ? "Hide why it works" : "Why it works"}</span>
                <ChevronRight
                  size={14}
                  aria-hidden
                  className={cn(
                    "ml-auto text-[var(--text-subtle)] transition-transform",
                    state.explanationOpen && "rotate-90",
                  )}
                />
              </summary>
              {state.explanationOpen ? (
                <div className="border-t border-[var(--rule)] px-3 py-3 text-sm leading-[1.65] text-[var(--text-muted)]">
                  <p className="whitespace-pre-wrap break-words">{explanation}</p>
                </div>
              ) : null}
            </details>
          ) : null}
        </div>
      )}
    </article>
  );
});

/* ───────── WorkedExampleControls ───────── */
interface WorkedExampleControlsProps {
  total: number;
  completed: number;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onResetAll: () => void;
}

const WorkedExampleControls = memo(function WorkedExampleControls({
  total,
  completed,
  onExpandAll,
  onCollapseAll,
  onResetAll,
}: WorkedExampleControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-canvas)] px-3 py-2">
      <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
        {completed}/{total} complete
      </span>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onExpandAll}>
          <ChevronDown size={12} aria-hidden />
          Expand all
        </Button>
        <Button variant="ghost" size="sm" onClick={onCollapseAll}>
          <ChevronUp size={12} aria-hidden />
          Collapse all
        </Button>
        <Button variant="ghost" size="sm" onClick={onResetAll}>
          <RotateCcw size={12} aria-hidden />
          Reset
        </Button>
      </div>
    </div>
  );
});

export { WorkedExampleCard, WorkedExampleControls };
