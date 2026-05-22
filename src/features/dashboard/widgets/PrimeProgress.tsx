const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19];

interface Props {
  completedNodes: number;
}

export function PrimeProgress({ completedNodes }: Props) {
  let primeIndex = 0;
  let primeSum = 0;
  for (let i = 0; i < PRIMES.length; i++) {
    primeSum += PRIMES[i];
    if (primeSum > completedNodes) {
      primeIndex = i;
      break;
    }
  }
  const prevSum = PRIMES.slice(0, primeIndex).reduce((a, b) => a + b, 0);
  const currentPrime = PRIMES[primeIndex] ?? PRIMES[PRIMES.length - 1];
  const segmentProgress = Math.min((completedNodes - prevSum) / currentPrime, 1);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="text-xs font-medium text-[var(--text-muted)]">Prime</div>
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-xs font-bold text-[var(--text-heading)]"
        style={{
          background: `conic-gradient(var(--accent-2) ${segmentProgress * 360}deg, var(--border) ${segmentProgress * 360}deg)`,
        }}
      >
        {currentPrime}
      </div>
      <div className="text-[10px] text-[var(--text-muted)]">{Math.round(segmentProgress * 100)}%</div>
    </div>
  );
}
