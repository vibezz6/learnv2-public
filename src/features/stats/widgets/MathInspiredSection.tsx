import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui";
import { FibonacciProgress } from "./FibonacciProgress";
import { GoldenRatioProgress } from "./GoldenRatioProgress";
import { MathConstants } from "./MathConstants";
import { PascalTriangleProgress } from "./PascalTriangleProgress";
import { PrimeProgress } from "./PrimeProgress";
import { PrimeSpiral } from "./PrimeSpiral";

interface Props {
  completedNodes: number;
  totalNodes: number;
}

export function MathInspiredSection({ completedNodes, totalNodes }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="stagger-item">
      <button
        type="button"
        className="flex min-h-11 w-full touch-manipulation items-center justify-between gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg text-[var(--accent)]">Σ</span>
          <span className="font-semibold text-[var(--text-heading)]">Progress visualizations</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          {completedNodes}/{totalNodes}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-1 gap-4 min-[481px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <FibonacciProgress completedNodes={completedNodes} />
          <MathConstants />
          <PrimeProgress completedNodes={completedNodes} />
          <GoldenRatioProgress completed={completedNodes} total={totalNodes} />
          <PascalTriangleProgress completedNodes={completedNodes} totalNodes={totalNodes} />
          <PrimeSpiral completedNodes={completedNodes} totalNodes={totalNodes} />
        </div>
      )}
    </Card>
  );
}
