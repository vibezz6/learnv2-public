import { StudyTimer } from "./StudyTimer";
import { Card, PageContainer, PageHeader, Section } from "@/components/ui";

export function TimerPage() {
  return (
    <PageContainer size="sm" className="space-y-6">
      <PageHeader
        title="Timer"
        subtitle="Focus session timer — logs study minutes to your streak and daily goal."
      />
      <Section eyebrow="Session" title="Focus timer">
        <Card className="stagger-item">
          <StudyTimer estimatedMinutes={25} />
        </Card>
      </Section>
    </PageContainer>
  );
}
