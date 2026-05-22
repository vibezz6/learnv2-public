import { StudyTimer } from "./StudyTimer";
import { Badge, Card } from "@/components/ui";

export function TimerPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 md:p-8">
      <section className="stagger-item space-y-2">
        <Badge>Batch 4 · Study timer</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">Study timer</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Focus session timer — logs study minutes to your streak and daily goal.
        </p>
      </section>
      <Card className="stagger-item">
        <StudyTimer estimatedMinutes={25} />
      </Card>
    </div>
  );
}
