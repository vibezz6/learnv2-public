import { Card, EmptyState } from "@/components/ui";
import { getToday } from "@/stores/progress";

const VARIANTS = [
  {
    title: "Start your first lesson",
    description: "Pick a subject and complete one lesson today — the streak and activity log begin there.",
    actionLabel: "Browse subjects",
    actionTo: "/subjects",
    icon: "◎",
  },
  {
    title: "Log a SAT practice miss",
    description: "Even one mistake in the log gives Today and week plan something real to retarget.",
    actionLabel: "SAT mistake log",
    actionTo: "/subjects/sat-prep#mistakes",
    icon: "△",
  },
  {
    title: "Check college deadlines",
    description: "Campus checklist and essays surface on Today when something is due soon.",
    actionLabel: "Open Campus",
    actionTo: "/campus",
    icon: "◇",
  },
] as const;

function variantIndex(): number {
  const day = getToday();
  let hash = 0;
  for (let i = 0; i < day.length; i++) hash = (hash + day.charCodeAt(i)) % VARIANTS.length;
  return hash;
}

export function TodayEmptyFocus() {
  const v = VARIANTS[variantIndex()];
  return (
    <Card variant="primary">
      <EmptyState
        icon={<span aria-hidden>{v.icon}</span>}
        title={v.title}
        description={v.description}
        actionLabel={v.actionLabel}
        actionTo={v.actionTo}
      />
    </Card>
  );
}
