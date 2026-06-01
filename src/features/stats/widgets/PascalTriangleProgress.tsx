import { useMemo } from "react";

function pascalValue(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - i + 1)) / i;
  return Math.round(result);
}

interface Props {
  completedNodes: number;
  totalNodes: number;
  size?: number;
}

export function PascalTriangleProgress({ completedNodes, totalNodes, size = 140 }: Props) {
  const percent = totalNodes > 0 ? completedNodes / totalNodes : 0;

  const triangle = useMemo(() => {
    const rows = 6;
    const centerX = size / 2;
    const rowHeight = size / rows;
    const elements: Array<{ x: number; y: number; value: number; filled: boolean }> = [];

    for (let row = 0; row < rows; row++) {
      const cols = row + 1;
      const rowY = row * rowHeight + rowHeight / 2;
      const colWidth = size / (cols + 1);
      for (let col = 0; col < cols; col++) {
        const colX = centerX - (cols * colWidth) / 2 + (col + 0.5) * colWidth;
        const progressPerRow = 1 / rows;
        const rowProgress = row / rows;
        const filled = rowProgress + (col / cols) * progressPerRow <= percent;
        elements.push({ x: colX, y: rowY, value: pascalValue(row, col), filled });
      }
    }
    return elements;
  }, [size, percent]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-medium text-[var(--text-muted)]">Pascal</div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {triangle.map((el, idx) => (
          <circle
            key={idx}
            cx={el.x}
            cy={el.y}
            r={size * 0.035}
            fill={el.filled ? "var(--accent)" : "var(--border)"}
            opacity={el.filled ? 0.9 : 0.35}
          />
        ))}
      </svg>
      <div className="text-[10px] text-[var(--text-muted)]">{Math.round(percent * 100)}%</div>
    </div>
  );
}
