const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21];

interface Props {
  completedNodes: number;
}

export function FibonacciProgress({ completedNodes }: Props) {
  let fibIndex = 0;
  let fibSum = 0;
  for (let i = 0; i < FIBONACCI.length; i++) {
    fibSum += FIBONACCI[i];
    if (fibSum > completedNodes) {
      fibIndex = i;
      break;
    }
  }
  const prevSum = FIBONACCI.slice(0, fibIndex).reduce((a, b) => a + b, 0);
  const currentFib = FIBONACCI[fibIndex] ?? FIBONACCI[FIBONACCI.length - 1];
  const segmentProgress = Math.min((completedNodes - prevSum) / currentFib, 1);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="text-xs font-medium text-[var(--text-muted)]">Fibonacci</div>
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-xs font-bold text-[var(--text-heading)]"
        style={{
          background: `conic-gradient(var(--accent) ${segmentProgress * 360}deg, var(--border) ${segmentProgress * 360}deg)`,
        }}
      >
        {currentFib}
      </div>
      <div className="text-[10px] text-[var(--text-muted)]">{Math.round(segmentProgress * 100)}%</div>
    </div>
  );
}
