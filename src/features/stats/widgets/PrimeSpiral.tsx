const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19];

interface Props {
  completedNodes: number;
  totalNodes: number;
  size?: number;
}

export function PrimeSpiral({ completedNodes, totalNodes, size = 140 }: Props) {
  const percent = totalNodes > 0 ? completedNodes / totalNodes : 0;
  const center = size / 2;
  const points: Array<{ x: number; y: number }> = [];
  const stepsPerTurn = 40;

  for (let i = 0; i <= PRIMES.length * stepsPerTurn; i++) {
    const turn = Math.floor(i / stepsPerTurn);
    const prime = PRIMES[Math.min(turn, PRIMES.length - 1)];
    const theta = (i / stepsPerTurn) * 2 * Math.PI;
    const r = prime * (theta / (2 * Math.PI)) * 0.7;
    points.push({ x: center + r * Math.cos(theta), y: center - r * Math.sin(theta) });
  }

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-medium text-[var(--text-muted)]">Prime spiral</div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path d={pathD} fill="none" stroke="var(--accent-2)" strokeWidth={2} strokeLinecap="round" />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[var(--text-heading)] text-lg font-bold"
        >
          {Math.round(percent * 100)}%
        </text>
      </svg>
    </div>
  );
}
