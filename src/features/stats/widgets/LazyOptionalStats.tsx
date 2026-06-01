import { lazy, Suspense } from "react";
import { Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";

const QuizMasteryPanel = lazy(() =>
  import("@/features/stats/widgets/QuizMasteryPanel").then((m) => ({
    default: m.QuizMasteryPanel,
  })),
);

const MathInspiredSection = lazy(() =>
  import("@/features/stats/widgets/MathInspiredSection").then((m) => ({
    default: m.MathInspiredSection,
  })),
);

function OptionalFallback({ label }: { label: string }) {
  return (
    <Card className="stagger-item min-w-0 py-8 text-center text-sm text-[var(--text-muted)]">
      Loading {label}…
    </Card>
  );
}

export function LazyOptionalStats({
  subjects,
  completedNodes,
  totalNodes,
}: {
  subjects: Subject[];
  completedNodes: number;
  totalNodes: number;
}) {
  return (
    <>
      <Suspense fallback={<OptionalFallback label="quiz mastery" />}>
        <QuizMasteryPanel subjects={subjects} />
      </Suspense>
      <Suspense fallback={<OptionalFallback label="visualizations" />}>
        <MathInspiredSection completedNodes={completedNodes} totalNodes={totalNodes} />
      </Suspense>
    </>
  );
}
