const CONSTANTS = [
  { name: "π", value: "3.14159", color: "var(--danger)" },
  { name: "e", value: "2.71828", color: "var(--info)" },
  { name: "φ", value: "1.61803", color: "var(--warning)" },
  { name: "√2", value: "1.41421", color: "var(--success)" },
];

export function MathConstants() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-medium text-[var(--text-muted)]">Constants</div>
      <div className="grid grid-cols-2 gap-2">
        {CONSTANTS.map((c) => (
          <div
            key={c.name}
            className="rounded-[var(--radius)] border px-2 py-1.5 text-center"
            style={{ borderColor: c.color }}
          >
            <div className="text-sm font-bold" style={{ color: c.color }}>
              {c.name}
            </div>
            <div className="font-mono text-[10px] text-[var(--text-muted)]">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
