import { memo, useEffect, useMemo, useRef, useState } from "react";

interface MathBlockProps {
  math: string;
  displayMode?: boolean;
  subjectColor?: string;
}

let katexModulePromise: Promise<{ renderToString: (tex: string, options?: object) => string }> | null =
  null;
let katexCssLoaded = false;

function loadKatex() {
  if (!katexModulePromise) {
    katexModulePromise = import("katex").then((mod) => {
      if (!katexCssLoaded) {
        katexCssLoaded = true;
        void import("katex/dist/katex.min.css");
      }
      const katex = "default" in mod && mod.default ? mod.default : mod;
      return katex as { renderToString: (tex: string, options?: object) => string };
    });
  }
  return katexModulePromise;
}

const MathBlock = memo(function MathBlock({ math, displayMode = true, subjectColor }: MathBlockProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const defer = displayMode;
  const [visible, setVisible] = useState(!defer);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!defer || visible) return;
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [defer, visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    loadKatex()
      .then((katex) => {
        if (cancelled) return;
        try {
          setHtml(
            katex.renderToString(math, {
              displayMode,
              throwOnError: true,
            }),
          );
          setError(false);
        } catch {
          setHtml(null);
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, math, displayMode]);

  const placeholderStyle = useMemo(
    () => ({
      textAlign: displayMode ? ("center" as const) : undefined,
      padding: displayMode ? "1rem 1.5rem" : "2px 4px",
      margin: displayMode ? "1rem 0" : 0,
      minHeight: displayMode ? "3rem" : undefined,
      backgroundColor: "var(--bg-secondary)",
      borderRadius: "var(--radius-md)",
      border: subjectColor ? `1px solid ${subjectColor}` : "1px solid var(--border)",
      color: "var(--text-muted)",
      fontSize: displayMode ? "0.85rem" : "0.9em",
    }),
    [displayMode, subjectColor],
  );

  if (!visible) {
    return (
      <div ref={rootRef} style={placeholderStyle} aria-hidden>
        {displayMode ? "…" : math}
      </div>
    );
  }

  if (error || html === null) {
    return (
      <div ref={rootRef}>
        <code style={placeholderStyle}>{math}</code>
      </div>
    );
  }

  if (!displayMode) {
    return (
      <span
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ color: subjectColor ?? "var(--text)" }}
      />
    );
  }

  return (
    <div
      ref={rootRef}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        textAlign: "center",
        padding: "1rem 1.5rem",
        margin: "1rem 0",
        backgroundColor: "var(--bg-secondary)",
        borderRadius: "var(--radius-md)",
        border: subjectColor ? `1px solid ${subjectColor}` : "1px solid var(--border)",
        overflowX: "auto",
        color: subjectColor ?? "var(--text)",
        fontSize: "1.1em",
      }}
    />
  );
});

MathBlock.displayName = "MathBlock";

export default MathBlock;
