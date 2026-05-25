import { StudyTimer } from "./StudyTimer";
import { Card, PageContainer, PageHeader } from "@/components/ui";

export function TimerPage() {
  return (
    <PageContainer size="sm" className="space-y-6">
      <PageHeader
        title="Timer"
        subtitle="Focus session timer — logs study minutes to your streak and daily goal."
      />
      <Card className="stagger-item">
        <StudyTimer estimatedMinutes={25} />
      </Card>
    </PageContainer>
  );
}
