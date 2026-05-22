import { useState, useEffect, useRef } from "react";
import { Copy, Check, ChevronDown, Info, AlertTriangle, XCircle, CheckCircle2, ImageOff, WrapText } from "lucide-react";
import MathBlock from "./MathBlock";

interface LessonContentProps {
  content: string;
  subjectColor: string;
}

type CalloutType = "info" | "warning" | "danger" | "success";

interface ParsedBlock {
  type: "heading" | "paragraph" | "code" | "list" | "blockquote" | "image" | "table" | "callout" | "expandable" | "math";
  content: string;
  level?: number;
  language?: string;
  ordered?: boolean;
  variant?: CalloutType;
  title?: string;
  rows?: string[][];
}

const calloutConfig: Record<CalloutType, { icon: React.ReactNode; color: string; bg: string }> = {
  info: { icon: <Info size={18} />, color: "var(--info)", bg: "var(--info-bg)" },
  warning: { icon: <AlertTriangle size={18} />, color: "var(--warning)", bg: "var(--warning-bg)" },
  danger: { icon: <XCircle size={18} />, color: "var(--danger)", bg: "var(--danger-bg)" },
  success: { icon: <CheckCircle2 size={18} />, color: "var(--success)", bg: "var(--success-bg)" },
};

const parseContent = (raw: string): ParsedBlock[] => {
  const blocks: ParsedBlock[] = [];
  const lines = raw.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) { blocks.push({ type: "heading", content: headingMatch[2], level: headingMatch[1].length }); i++; continue; }
    const codeMatch = line.match(/^```(\w*)/);
    if (codeMatch) {
      const lang = codeMatch[1]; const codeLines: string[] = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { codeLines.push(lines[i]); i++; } i++;
      blocks.push({ type: "code", content: codeLines.join("\n"), language: lang || undefined }); continue;
    }
    // Display math: $$...$$
    if (line.trim().startsWith("$$")) {
      const mathLines: string[] = [];
      if (line.trim() === "$$") {
        i++;
        while (i < lines.length && lines[i].trim() !== "$$") { mathLines.push(lines[i]); i++; }
        i++; // skip closing $$
      } else {
        // Single-line $$...$$
        const singleLine = line.trim().replace(/^\$\$/, "").replace(/\$\$$/, "");
        mathLines.push(singleLine);
        i++;
      }
      blocks.push({ type: "math", content: mathLines.join("\n") }); continue;
    }
    const calloutMatch = line.match(/^:::(info|warning|danger|success)(?:\s+"(.+)")?/);
    if (calloutMatch) {
      const variant = calloutMatch[1] as CalloutType; const title = calloutMatch[2]; const cLines: string[] = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith(":::")) { cLines.push(lines[i]); i++; } i++;
      blocks.push({ type: "callout", content: cLines.join("\n"), variant, title }); continue;
    }
    if (line.startsWith("> ")) {
      const qLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { qLines.push(lines[i].substring(2)); i++; }
      blocks.push({ type: "blockquote", content: qLines.join("\n") }); continue;
    }
    if (line.match(/^[-*+]\s+/)) {
      const lLines: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*+]\s+/)) { lLines.push(lines[i].replace(/^[-*+]\s+/, "")); i++; }
      blocks.push({ type: "list", content: lLines.join("\n"), ordered: false }); continue;
    }
    if (line.match(/^\d+\.\s+/)) {
      const lLines: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) { lLines.push(lines[i].replace(/^\d+\.\s+/, "")); i++; }
      blocks.push({ type: "list", content: lLines.join("\n"), ordered: true }); continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!lines[i].match(/^\|[\s-|]+\|$/)) rows.push(lines[i].split("|").filter(c => c.trim() !== "").map(c => c.trim()));
        i++;
      }
      blocks.push({ type: "table", content: "", rows }); continue;
    }
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) { blocks.push({ type: "image", content: imgMatch[2], title: imgMatch[1] }); i++; continue; }
    const pLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].match(/^(#{1,6}\s|```|:::|> |[-*+]\s|\d+\.\s|\||!)/)) { pLines.push(lines[i]); i++; }
    if (pLines.length) blocks.push({ type: "paragraph", content: pLines.join("\n") });
  }
  return blocks;
};

const inlineStyle = (text: string, subjectColor?: string): React.ReactNode => {
  // Split on bold, italic, code, links, and inline math ($...$)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`|\[.*?\]\(.*?\)|\$[^$]+\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} style={{ background: "var(--bg-secondary)", padding: "2px 6px", borderRadius: "var(--radius-sm)", fontSize: "0.9em", fontFamily: "var(--mono)" }}>{part.slice(1, -1)}</code>;
    // Inline math: $...$
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) return <MathBlock key={i} math={part.slice(1, -1)} displayMode={false} subjectColor={subjectColor} />;
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) return <a key={i} href={linkMatch[2]} style={{ color: "var(--accent)", textDecoration: "underline" }}>{linkMatch[1]}</a>;
    return part;
  });
};

type TokenType = "keyword" | "string" | "comment" | "number" | "function" | "decorator" | "plain";

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: "var(--code-keyword)",
  string: "var(--code-string)",
  comment: "var(--code-comment)",
  number: "var(--code-number)",
  function: "var(--code-function)",
  decorator: "var(--code-decorator)",
  plain: "var(--code-text)",
};

const KEYWORDS_JS = /\b(if|else|for|while|return|const|let|var|function|class|import|from|export|default|new|this|typeof|instanceof|async|await|try|catch|finally|throw|switch|case|break|continue|do|in|of|yield|void|delete|true|false|null|undefined|super|extends|static|get|set)\b/;
const KEYWORDS_PY = /\b(if|else|elif|for|while|return|def|class|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|is|in|global|nonlocal|assert|del|True|False|None|self|async|await)\b/;

function highlightCode(code: string, language?: string): Array<{ type: TokenType; text: string }> {
  const tokens: Array<{ type: TokenType; text: string }> = [];
  const isPython = language?.toLowerCase() === "python" || language?.toLowerCase() === "py";
  const keywordRegex = isPython ? KEYWORDS_PY : KEYWORDS_JS;

  const patterns: Array<{ regex: RegExp; type: TokenType }> = [
    { regex: isPython ? /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/ : /(`[\s\S]*?`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/, type: "string" },
    { regex: isPython ? /(#.*$)/m : /(\/\/.*$|\/\*[\s\S]*?\*\/)/m, type: "comment" },
    { regex: /(@\w+)/, type: "decorator" },
    { regex: /\b(\d+\.?\d*(?:e[+-]?\d+)?)\b/i, type: "number" },
    { regex: /\b([a-zA-Z_]\w*)\s*(?=\()/, type: "function" },
    { regex: keywordRegex, type: "keyword" },
  ];

  const combinedRegex = new RegExp(patterns.map(p => `(${p.regex.source})`).join("|"), "gm");
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = combinedRegex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "plain", text: code.slice(lastIndex, match.index) });
    }

    let matchedType: TokenType = "plain";
    for (let i = 0; i < patterns.length; i++) {
      const group = match[i + 1];
      if (group !== undefined) {
        matchedType = patterns[i].type;
        break;
      }
    }

    tokens.push({ type: matchedType, text: match[0] });
    lastIndex = match.index + match[0].length;

    if (match[0].length === 0) {
      combinedRegex.lastIndex++;
    }
  }

  if (lastIndex < code.length) {
    tokens.push({ type: "plain", text: code.slice(lastIndex) });
  }

  return tokens;
}

export function CodeBlock({ content, language }: { content: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const lineCount = content.split("\n").length;
  const tokens = highlightCode(content, language);

  return (
    <div style={{ position: "relative", margin: "20px 0", borderRadius: "var(--radius)", overflow: "hidden", background: "var(--code-bg)", border: "1px solid var(--border-dark)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", background: "var(--code-header-bg)", borderBottom: "1px solid var(--border-dark)" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--mono)" }}>{language || "code"}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setWrap(!wrap)} style={{ background: "none", border: "none", color: wrap ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <WrapText size={14} /> {wrap ? "Wrap" : "No Wrap"}
          </button>
          <button onClick={handleCopy} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", overflowX: wrap ? "hidden" : "auto" }}>
        <div style={{ padding: "16px 0", textAlign: "right", userSelect: "none", borderRight: "1px solid var(--border-dark)", background: "var(--code-bg)", flexShrink: 0 }}>
          {Array.from({ length: lineCount }, (_, i) => i + 1).map((num) => (
            <div key={num} style={{ padding: "0 12px 0 16px", fontSize: 14, lineHeight: 1.6, fontFamily: "var(--mono)", color: "var(--code-line-numbers)" }}>{num}</div>
          ))}
        </div>
        <pre style={{ margin: 0, padding: "16px", overflowX: wrap ? "hidden" : "visible", whiteSpace: wrap ? "pre-wrap" : "pre", wordBreak: wrap ? "break-all" : "normal", flex: 1 }}>
          <code style={{ fontFamily: "var(--mono)", fontSize: 14, lineHeight: 1.6, color: "var(--code-text)" }}>
            {tokens.map((token, i) => (
              <span key={i} style={{ color: TOKEN_COLORS[token.type] }}>{token.text}</span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

function Expandable({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ margin: "16px 0", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--bg-secondary)", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>
        {inlineStyle(title)} <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
      </button>
      <div style={{ maxHeight: open ? 2000 : 0, overflow: "hidden", transition: "max-height 0.3s ease", padding: open ? "12px 16px" : "0 16px" }}>
        {inlineStyle(content)}
      </div>
    </div>
  );
}

export default function LessonContent({ content, subjectColor }: LessonContentProps) {
  const [progress, setProgress] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setProgress(scrollHeight <= clientHeight ? 100 : (scrollTop / (scrollHeight - clientHeight)) * 100);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [content]);

  const blocks = parseContent(content);

  const renderBlock = (block: ParsedBlock, idx: number): React.ReactNode => {
    switch (block.type) {
      case "heading": {
        const sizes: Record<number, React.CSSProperties> = {
          1: { fontSize: 28, fontWeight: 700, marginTop: 32, marginBottom: 16, lineHeight: 1.3 },
          2: { fontSize: 22, fontWeight: 600, marginTop: 28, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${subjectColor}`, lineHeight: 1.35 },
          3: { fontSize: 18, fontWeight: 600, marginTop: 24, marginBottom: 10, lineHeight: 1.4 },
        };
        const H = `h${block.level || 3}` as "h2";
        return <H key={idx} style={{ color: "var(--text-h)", ...(sizes[block.level || 3] || sizes[3]) }}>{inlineStyle(block.content, subjectColor)}</H>;
      }
      case "paragraph":
        return <p key={idx} style={{ margin: "0 0 16px", color: "var(--text)", lineHeight: 1.7, fontSize: 16 }}>{inlineStyle(block.content, subjectColor)}</p>;
      case "code":
        return <CodeBlock key={idx} content={block.content} language={block.language} />;
      case "math":
        return <MathBlock key={idx} math={block.content} displayMode={true} subjectColor={subjectColor} />;
      case "list":
        return (
          <div key={idx} style={{ margin: "0 0 16px", paddingLeft: 24 }}>
            {block.content.split("\n").map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, color: "var(--text)", lineHeight: 1.7 }}>
                <span style={{ color: subjectColor, fontWeight: 700, flexShrink: 0 }}>{block.ordered ? `${i + 1}.` : "•"}</span>
                <span>{inlineStyle(item, subjectColor)}</span>
              </div>
            ))}
          </div>
        );
      case "blockquote":
        return <blockquote key={idx} style={{ margin: "16px 0", padding: "12px 16px", borderLeft: `4px solid ${subjectColor}`, background: "var(--bg-secondary)", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0", color: "var(--text-muted)", fontStyle: "italic" }}>{inlineStyle(block.content, subjectColor)}</blockquote>;
      case "table":
        if (!block.rows || block.rows.length === 0) return null;
        return (
          <div key={idx} style={{ margin: "16px 0", overflowX: "auto", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead><tr>{block.rows[0].map((c, i) => <th key={i} style={{ padding: "10px 14px", textAlign: "left", background: "var(--bg-secondary)", borderBottom: "2px solid var(--border)", color: "var(--text)", fontWeight: 600 }}>{inlineStyle(c, subjectColor)}</th>)}</tr></thead>
              <tbody>{block.rows.slice(1).map((row, ri) => <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "var(--bg-secondary)" }}>{row.map((c, ci) => <td key={ci} style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-light)", color: "var(--text)" }}>{inlineStyle(c, subjectColor)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
      case "image":
        return (
          <div key={idx} style={{ margin: "20px 0", textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-md)", background: "var(--bg-secondary)" }}>
              {imgErrors.has(idx) ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 40, color: "var(--text-muted)" }}><ImageOff size={32} /><span style={{ fontSize: 13 }}>Image failed to load</span></div>
              ) : (
                <img src={block.content} alt={block.title || ""} loading="lazy" style={{ display: "block", maxWidth: "100%", height: "auto" }} onError={() => setImgErrors(prev => new Set(prev).add(idx))} />
              )}
            </div>
            {block.title && <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>{block.title}</p>}
          </div>
        );
      case "callout": {
        const cfg = calloutConfig[block.variant || "info"];
        return (
          <div key={idx} style={{ margin: "16px 0", padding: "14px 16px", borderLeft: `4px solid ${cfg.color}`, background: cfg.bg, borderRadius: "0 var(--radius-sm) var(--radius-sm) 0", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }}>{cfg.icon}</span>
            <div style={{ flex: 1 }}>
              {block.title && <div style={{ fontWeight: 600, marginBottom: 4, color: cfg.color }}>{block.title}</div>}
              <div style={{ color: "var(--text)", lineHeight: 1.6, fontSize: 15 }}>{inlineStyle(block.content)}</div>
            </div>
          </div>
        );
      }
      case "expandable":
        return <Expandable key={idx} title={block.title || "Details"} content={block.content} />;
      default: return null;
    }
  };

  return (
    <div ref={containerRef} className="lesson-content" style={{ position: "relative", height: "100%", overflowY: "auto", scrollBehavior: "smooth" }}>
      <div style={{ position: "sticky", top: 0, left: 0, right: 0, height: 3, background: "var(--border)", zIndex: 10 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: subjectColor, transition: "width 0.1s ease" }} />
      </div>
      <div className="lesson-well" style={{ maxWidth: 720, margin: "0 auto", padding: "24px 32px 48px", fontSize: 16, fontFamily: "var(--sans)" }}>
        {blocks.map(renderBlock)}
      </div>
    </div>
  );
}