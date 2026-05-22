import { useMemo, memo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathBlockProps {
  math: string;
  displayMode?: boolean;
  subjectColor?: string;
}

const MathBlock = memo(function MathBlock({ math, displayMode = true, subjectColor }: MathBlockProps) {
  const { html, error } = useMemo(() => {
    try {
      const renderedHtml = katex.renderToString(math, {
        displayMode,
        throwOnError: true,
      });
      return { html: renderedHtml, error: false };
    } catch {
      return { html: "", error: true };
    }
  }, [math, displayMode]);

  if (error) {
    return (
      <code
        style={{
          display: displayMode ? "block" : "inline",
          textAlign: displayMode ? "center" : undefined,
          padding: displayMode ? "0.75rem 1rem" : "2px 4px",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "var(--radius-md)",
          border: displayMode ? "1px solid var(--border)" : "none",
          color: "var(--text)",
          fontFamily: "var(--mono)",
          fontSize: displayMode ? "0.95rem" : "0.9em",
          margin: displayMode ? "0.75rem 0" : 0,
        }}
      >
        {math}
      </code>
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
