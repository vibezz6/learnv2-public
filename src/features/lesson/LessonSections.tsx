import { useState, useEffect, useCallback, useRef, memo, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Eye, EyeOff, Lightbulb, BookOpen, RotateCcw } from 'lucide-react';

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
  accentColor,
  children,
}: CollapsibleSectionProps) {
  const storageKey = `learnapp_section_collapsed_v1_${id}`;
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      // stored='true' means collapsed, stored='false' or null means open
      return stored !== null ? stored !== 'true' : defaultOpen;
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
    if (isOpen) {
      const el = contentRef.current;
      if (el) {
        setMaxHeight(`${el.scrollHeight}px`);
        const timeout = setTimeout(() => {
          setMaxHeight('2000px');
        }, 300);
        return () => clearTimeout(timeout);
      } else {
        setMaxHeight('2000px');
      }
    } else {
      const el = contentRef.current;
      if (el) {
        setMaxHeight(`${el.scrollHeight}px`);
        requestAnimationFrame(() => {
          setMaxHeight('0px');
        });
      } else {
        setMaxHeight('0px');
      }
    }
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const accent = accentColor || 'var(--accent)';

  return (
    <div
      style={{
        borderLeft: `3px solid ${accent}`,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      <div
        id={`section-header-${id}`}
        onClick={toggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.15s ease',
        }}
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
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={{ color: accent, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span className="font-semibold" style={{ flex: 1, color: 'var(--text-h)' }}>{title}</span>
        {count !== undefined && count > 0 && (
          <span
            className="badge"
            style={{
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
              fontSize: 11,
            }}
          >
            {count}
          </span>
        )}
        {isOpen ? (
          <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
      <div
        id={`section-content-${id}`}
        role="region"
        aria-labelledby={`section-header-${id}`}
        ref={contentRef}
        style={{
          maxHeight: maxHeight,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        <div style={{ padding: '0 16px 12px 16px' }}>{children}</div>
      </div>
    </div>
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
      className="card"
      style={{
        overflow: 'hidden',
        marginBottom: 12,
        borderRadius: 'var(--radius-md)',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Problem header — always visible */}
      <div
        style={{
          borderLeft: `4px solid ${accent}`,
          padding: '14px 16px',
          background: 'var(--warning-bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <BookOpen size={16} style={{ color: accent, flexShrink: 0 }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>
            Problem {index + 1}
          </span>
          {state.phase !== 'thinking' && (
            <span
              className="badge text-xs"
              style={{
                background: allStepsRevealed ? 'var(--success-bg)' : 'var(--accent-bg)',
                color: allStepsRevealed ? 'var(--success)' : 'var(--accent)',
                border: `1px solid ${allStepsRevealed ? 'var(--success)' : 'var(--accent-border)'}`,
                marginLeft: 'auto',
              }}
            >
              {allStepsRevealed ? 'Complete' : `${state.stepsRevealed}/${totalSteps} steps`}
            </span>
          )}
        </div>
        <div style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '160%', fontSize: 'var(--fs-base)' }}>{problem}</div>
      </div>

      {/* Phase: Thinking — "Try it yourself" prompt */}
      {state.phase === 'thinking' && (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              marginBottom: 12,
            }}
          >
            <Lightbulb size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-h)', marginBottom: 4 }}>
                Try it yourself first
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Think about how you would solve this before revealing the answer.
              </div>
            </div>
            <div
              className="text-xs"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--mono)',
                background: 'var(--bg)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                whiteSpace: 'nowrap',
              }}
            >
              {formatTime(thinkSeconds)}
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={startSolving}
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, startSolving)}
            aria-label="Start solving - show solution steps"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              justifyContent: 'center',
              minHeight: 44,
            }}
          >
            <Eye size={16} />
            I'm ready — show me the solution
          </button>
        </div>
      )}

      {/* Phase: Solving / Complete — Step-by-step reveal with SVG progress ring */}
      {(state.phase === 'solving' || state.phase === 'complete') && (
        <div style={{ padding: '0 16px 16px' }}>
          {/* SVG Progress ring + step counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <svg
              viewBox="0 0 44 44"
              style={{ width: 44, height: 44, flexShrink: 0 }}
              aria-label={`Progress: ${state.stepsRevealed} of ${totalSteps} steps revealed`}
            >
              <circle
                cx="22" cy="22" r={ringRadius}
                fill="none" stroke="var(--border-light)" strokeWidth="3"
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
            <div>
              <div className="text-sm" style={{ color: 'var(--text-h)', fontWeight: 600 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.slice(0, state.stepsRevealed).map((step: string, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--success-bg)',
                  borderLeft: `3px solid ${allStepsRevealed ? 'var(--success)' : accent}`,
                  opacity: 1,
                  transform: 'translateY(0)',
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
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
                <div style={{ color: 'var(--text)', lineHeight: '160%', whiteSpace: 'pre-wrap', flex: 1, fontSize: 'var(--fs-sm)' }}>
                  {step}
                </div>
              </div>
            ))}
          </div>

          {/* Step reveal controls */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!allStepsRevealed && (
              <>
                <button
                  className="btn-primary"
                  onClick={revealNextStep}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, revealNextStep)}
                  aria-label="Reveal next step"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                    justifyContent: 'center',
                    minHeight: 44,
                  }}
                >
                  <ChevronRight size={16} />
                  Next Step
                </button>
                <button
                  className="btn-secondary"
                  onClick={revealAllSteps}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, revealAllSteps)}
                  aria-label="Reveal all steps at once"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    justifyContent: 'center',
                    minHeight: 44,
                  }}
                >
                  <Eye size={16} />
                  Show All
                </button>
              </>
            )}
            {allStepsRevealed && (
              <button
                className="btn-ghost"
                onClick={resetExercise}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, resetExercise)}
                aria-label="Reset worked example"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  justifyContent: 'center',
                  minHeight: 44,
                }}
              >
                <EyeOff size={16} />
                Reset
              </button>
            )}
          </div>

          {/* Explanation toggle — only when all steps revealed */}
          {allStepsRevealed && explanation && (
            <div style={{ marginTop: 12 }}>
              <button
                className="btn-secondary"
                onClick={toggleExplanation}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, toggleExplanation)}
                aria-label={state.explanationOpen ? 'Hide explanation' : 'Show explanation'}
                aria-expanded={state.explanationOpen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  justifyContent: 'center',
                  minHeight: 44,
                }}
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
                  style={{
                    borderLeft: '3px solid var(--info)',
                    padding: '12px 14px',
                    background: 'var(--info-bg)',
                    marginTop: 8,
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <BookOpen size={16} style={{ color: 'var(--info)' }} />
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>
                      Explanation
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '160%' }}>
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
        className="btn-ghost"
        onClick={onExpandAll}
        aria-label="Expand all worked examples"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          fontSize: 'var(--fs-xs)',
          minHeight: 'auto',
        }}
      >
        <ChevronDown size={12} />
        Expand All
      </button>
      <button
        className="btn-ghost"
        onClick={onCollapseAll}
        aria-label="Collapse all worked examples"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          fontSize: 'var(--fs-xs)',
          minHeight: 'auto',
        }}
      >
        <ChevronUp size={12} />
        Collapse All
      </button>
      <button
        className="btn-ghost"
        onClick={onResetAll}
        aria-label="Reset all worked examples"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          fontSize: 'var(--fs-xs)',
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
