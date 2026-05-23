import { useState, useEffect, useCallback, useRef, memo, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Eye, EyeOff, Lightbulb, BookOpen, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge, Card } from '@/components/ui';

const touchTarget =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius)] px-4 text-sm font-medium transition touch-manipulation';

const btnStyles = {
  primary: cn(
    touchTarget,
    'bg-[var(--accent)] text-[var(--accent-fg)] hover:brightness-110',
  ),
  secondary: cn(
    touchTarget,
    'border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text)] hover:border-[var(--accent)]',
  ),
  ghost: cn(touchTarget, 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]'),
};

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
      if (stored !== null) {
        // stored='true' means collapsed, stored='false' means open
        return stored !== 'true';
      }
      const legacyStored = localStorage.getItem(legacyStorageKey);
      if (legacyStored !== null) {
        localStorage.setItem(storageKey, legacyStored);
        localStorage.removeItem(legacyStorageKey);
        return legacyStored !== 'true';
      }
      // stored='true' means collapsed, stored='false' or null means open
      return defaultOpen;
    } catch {
      return defaultOpen;
    }
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>(isOpen ? '2000px' : '0px');

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, isOpen ? 'false' : 'true');
    } catch {}
  }, [isOpen, storageKey]);

  useEffect(() => {
    const el = contentRef.current;
    if (!isOpen) {
      if (el) {
        setMaxHeight(`${el.scrollHeight}px`);
        requestAnimationFrame(() => {
          setMaxHeight('0px');
        });
      } else {
        setMaxHeight('0px');
      }
      return;
    }

    if (!el) {
      setMaxHeight('9999px');
      return;
    }

    const syncHeight = () => {
      setMaxHeight(`${el.scrollHeight}px`);
    };

    syncHeight();
    const timeout = setTimeout(syncHeight, 300);
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <Card className="mb-3 min-w-0 overflow-hidden p-0">
      <div
        id={`section-header-${id}`}
        onClick={toggle}
        className={cn(
          'flex min-h-11 cursor-pointer touch-manipulation select-none items-center gap-3 px-6 py-4 transition-colors hover:bg-[var(--bg-hover)]',
          isOpen && 'border-b border-[var(--border)]',
        )}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={`section-content-${id}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <span className="flex shrink-0 items-center text-[var(--text-muted)]">
          {icon}
        </span>
        <span className="min-w-0 flex-1 break-words font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <Badge className="shrink-0">{count}</Badge>
        )}
        {isOpen ? (
          <ChevronUp size={18} className="shrink-0 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-[var(--text-muted)]" />
        )}
      </div>
      <div
        id={`section-content-${id}`}
        role="region"
        aria-labelledby={`section-header-${id}`}
        ref={contentRef}
        className="min-w-0 overflow-hidden"
        style={{
          maxHeight: maxHeight,
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        <div className="min-w-0 break-words px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
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

const SectionHeader = memo(function SectionHeader({ icon, title, badge, onClick }: SectionHeaderProps) {
  const clickable = !!onClick;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (clickable) e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (clickable) e.currentTarget.style.background = 'transparent';
      }}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)' }}>{icon}</span>
      <span className="font-bold" style={{ color: 'var(--text-h)' }}>{title}</span>
      {badge && (
        <span
          className="text-xs badge"
          style={{
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)',
          }}
        >
          {badge}
        </span>
      )}
      {clickable && <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />}
    </div>
  );
});

export { SectionHeader };

/* ───────── WorkedExampleCard (v3 — SVG Progress Ring + nodeId fix) ───────── */
interface WorkedExampleCardProps {
  problem: string;
  solution: string;
  explanation: string;
  index: number;
  accentColor?: string;
  nodeId: string;
}

interface RevealState {
  phase: 'thinking' | 'solving' | 'complete';
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
        if (parsed.phase && typeof parsed.stepsRevealed === 'number' && typeof parsed.explanationOpen === 'boolean') {
          return parsed;
        }
      }
    } catch {}
    return { phase: 'thinking', stepsRevealed: 0, explanationOpen: false };
  });
  const [thinkSeconds, setThinkSeconds] = useState(0);
  const thinkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parse solution into steps (split by double newline or single newline)
  const steps = solution.split(/\n+/).filter((s: string) => s.trim().length > 0);
  const totalSteps = steps.length;
  const allStepsRevealed = state.stepsRevealed >= totalSteps;

  // Persist state
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
  }, [state, storageKey]);

  // Thinking timer
  useEffect(() => {
    if (state.phase === 'thinking') {
      thinkTimerRef.current = setInterval(() => {
        setThinkSeconds(prev => prev + 1);
      }, 1000);
      return () => { if (thinkTimerRef.current) clearInterval(thinkTimerRef.current); };
    } else {
      if (thinkTimerRef.current) clearInterval(thinkTimerRef.current);
    }
  }, [state.phase]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const startSolving = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'solving' }));
  }, []);

  const revealNextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      stepsRevealed: Math.min(prev.stepsRevealed + 1, totalSteps),
      phase: prev.stepsRevealed + 1 >= totalSteps ? 'complete' : 'solving',
    }));
  }, [totalSteps]);

  const revealAllSteps = useCallback(() => {
    setState(prev => ({ ...prev, stepsRevealed: totalSteps, phase: 'complete' }));
  }, [totalSteps]);

  const resetExercise = useCallback(() => {
    setState({ phase: 'thinking', stepsRevealed: 0, explanationOpen: false });
    setThinkSeconds(0);
  }, []);

  const toggleExplanation = useCallback(() => {
    setState(prev => ({ ...prev, explanationOpen: !prev.explanationOpen }));
  }, []);

  const accent = accentColor || 'var(--warning)';
  const progressPct = totalSteps > 0 ? (state.stepsRevealed / totalSteps) * 100 : 0;

  // SVG progress ring
  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progressPct / 100) * ringCircumference;

  const handleKeyDown = useCallback((e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  }, []);

  return (
    <div
      className="mb-3 min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-md)]"
    >
      {/* Problem header — always visible */}
      <div
        className="min-w-0 break-words px-3 py-3 sm:px-4 sm:py-3.5"
        style={{
          borderLeft: `4px solid ${accent}`,
          background: 'var(--warning-bg)',
        }}
      >
        <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
          <BookOpen size={16} style={{ color: accent, flexShrink: 0 }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
            Problem {index + 1}
          </span>
          {state.phase !== 'thinking' && (
            <span
              className="ml-auto shrink-0 rounded px-2 py-0.5 text-xs font-semibold"
              style={{
                background: allStepsRevealed ? 'var(--success-bg)' : 'var(--accent-bg)',
                color: allStepsRevealed ? 'var(--success)' : 'var(--accent)',
                border: `1px solid ${allStepsRevealed ? 'var(--success)' : 'var(--accent-border)'}`,
              }}
            >
              {allStepsRevealed ? 'Complete' : `${state.stepsRevealed}/${totalSteps} steps`}
            </span>
          )}
        </div>
        <div
          className="break-words whitespace-pre-wrap leading-[160%]"
          style={{ color: 'var(--text)', fontSize: 'var(--fs-base, 1rem)' }}
        >
          {problem}
        </div>
      </div>

      {/* Phase: Thinking — "Try it yourself" prompt */}
      {state.phase === 'thinking' && (
        <div className="px-3 py-4 sm:px-4">
          <div
            className="mb-3 flex min-w-0 flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3 sm:flex-row sm:items-center sm:p-4"
          >
            <Lightbulb size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
                Try it yourself first
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Think about how you would solve this before revealing the answer.
              </div>
            </div>
            <div
              className="self-start rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 font-mono text-xs sm:self-center"
              style={{ color: 'var(--accent)' }}
            >
              {formatTime(thinkSeconds)}
            </div>
          </div>
          <button
            className={cn(btnStyles.primary, 'w-full')}
            onClick={startSolving}
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, startSolving)}
            aria-label="Start solving - show solution steps"
          >
            <Eye size={16} />
            I'm ready — show me the solution
          </button>
        </div>
      )}

      {/* Phase: Solving / Complete — Step-by-step reveal with SVG progress ring */}
      {(state.phase === 'solving' || state.phase === 'complete') && (
        <div className="min-w-0 px-3 pb-4 sm:px-4">
          {/* SVG Progress ring + step counter */}
          <div className="mb-5 flex min-w-0 items-center gap-3 py-2 sm:gap-3.5">
            <svg
              viewBox="0 0 44 44"
              style={{ width: 44, height: 44, flexShrink: 0 }}
              aria-label={`Progress: ${state.stepsRevealed} of ${totalSteps} steps revealed`}
            >
              <circle
                cx="22" cy="22" r={ringRadius}
                fill="none" stroke="var(--border)" strokeWidth="3"
              />
              <circle
                cx="22" cy="22" r={ringRadius}
                fill="none"
                stroke={allStepsRevealed ? 'var(--success)' : accent}
                strokeWidth="3"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
              />
              <text
                x="22" y="22"
                textAnchor="middle" dominantBaseline="central"
                fill="var(--text)" fontSize="11" fontWeight="700" fontFamily="var(--mono)"
              >
                {state.stepsRevealed}/{totalSteps}
              </text>
            </svg>
            <div className="min-w-0">
              <div className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
                {allStepsRevealed ? 'All steps revealed' : `Step ${state.stepsRevealed} of ${totalSteps}`}
              </div>
              {thinkSeconds > 0 && (
                <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                  Thought for {formatTime(thinkSeconds)}
                </div>
              )}
            </div>
          </div>

          {/* Revealed steps */}
          <div className="flex flex-col gap-2">
            {steps.slice(0, state.stepsRevealed).map((step: string, i: number) => (
              <div
                key={i}
                className="flex min-w-0 gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 sm:gap-2.5 sm:px-3.5"
                style={{
                  background: 'var(--success-bg)',
                  borderLeft: `3px solid ${allStepsRevealed ? 'var(--success)' : accent}`,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    borderRadius: '50%',
                    background: allStepsRevealed ? 'var(--success)' : accent,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {i + 1}
                </div>
                <div
                  className="min-w-0 flex-1 break-words whitespace-pre-wrap text-sm leading-[160%]"
                  style={{ color: 'var(--text)', fontSize: 'var(--fs-sm, 0.875rem)' }}
                >
                  {step}
                </div>
              </div>
            ))}
          </div>

          {/* Step reveal controls */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {!allStepsRevealed && (
              <>
                <button
                  className={cn(btnStyles.primary, 'w-full sm:min-w-[9rem] sm:flex-1')}
                  onClick={revealNextStep}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, revealNextStep)}
                  aria-label="Reveal next step"
                >
                  <ChevronRight size={16} />
                  Next Step
                </button>
                <button
                  className={cn(btnStyles.secondary, 'w-full sm:w-auto')}
                  onClick={revealAllSteps}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, revealAllSteps)}
                  aria-label="Reveal all steps at once"
                >
                  <Eye size={16} />
                  Show All
                </button>
              </>
            )}
            {allStepsRevealed && (
              <button
                className={cn(btnStyles.ghost, 'w-full sm:w-auto')}
                onClick={resetExercise}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, resetExercise)}
                aria-label="Reset worked example"
              >
                <EyeOff size={16} />
                Reset
              </button>
            )}
          </div>

          {/* Explanation toggle — only when all steps revealed */}
          {allStepsRevealed && explanation && (
            <div className="mt-3">
              <button
                className={cn(btnStyles.secondary, 'w-full')}
                onClick={toggleExplanation}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, toggleExplanation)}
                aria-label={state.explanationOpen ? 'Hide explanation' : 'Show explanation'}
                aria-expanded={state.explanationOpen}
              >
                <Lightbulb size={16} />
                {state.explanationOpen ? 'Hide Explanation' : 'Why it works'}
                <ChevronRight
                  size={16}
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: state.explanationOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              {/* Explanation content */}
              {state.explanationOpen && (
                <div
                  className="mt-2 break-words rounded-[var(--radius-sm)] px-3 py-3 sm:px-3.5"
                  style={{
                    borderLeft: '3px solid var(--info)',
                    background: 'var(--info-bg)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <BookOpen size={16} style={{ color: 'var(--info)' }} />
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>
                      Explanation
                    </span>
                  </div>
                  <div className="break-words text-sm leading-[160%] whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                    {explanation}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        marginBottom: 12,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg)',
        border: '1px solid var(--border-light)',
      }}
    >
      <span
        className="text-xs"
        style={{
          color: 'var(--text-muted)',
          fontFamily: 'var(--mono)',
          marginRight: 'auto',
        }}
      >
        {completed}/{total} complete
      </span>
      <button
        className={cn(btnStyles.ghost, 'min-h-0 px-2.5 py-1 text-xs')}
        onClick={onExpandAll}
        aria-label="Expand all worked examples"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          minHeight: 'auto',
        }}
      >
        <ChevronDown size={12} />
        Expand All
      </button>
      <button
        className={cn(btnStyles.ghost, 'min-h-0 px-2.5 py-1 text-xs')}
        onClick={onCollapseAll}
        aria-label="Collapse all worked examples"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          minHeight: 'auto',
        }}
      >
        <ChevronUp size={12} />
        Collapse All
      </button>
      <button
        className={cn(btnStyles.ghost, 'min-h-0 px-2.5 py-1 text-xs')}
        onClick={onResetAll}
        aria-label="Reset all worked examples"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          minHeight: 'auto',
        }}
      >
        <RotateCcw size={12} />
        Reset All
      </button>
    </div>
  );
});

export { WorkedExampleCard, WorkedExampleControls };
