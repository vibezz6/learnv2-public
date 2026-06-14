import { Card, EmptyState } from "@/components/ui";
import { getToday } from "@/stores/progress";
import { includeSat, includeCollege } from "@/lib/buildFeatures";

const ALL_VARIANTS = [
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
    requiresSat: true,
  },
  {
    title: "Check college deadlines",
    description: "College checklist and essays surface on Today when something is due soon.",
    actionLabel: "Open College",
    actionTo: "/campus",
    icon: "◇",
    requiresCollege: true,
  },
] as const;

function visibleVariants() {
  return ALL_VARIANTS.filter((variant) => {
    if ("requiresSat" in variant && variant.requiresSat && !includeSat) return false;
    if ("requiresCollege" in variant && variant.requiresCollege && !includeCollege) return false;
    return true;
  });
}

function variantIndex(): number {
  const variants = visibleVariants();
  const day = getToday();
  let hash = 0;
  for (let i = 0; i < day.length; i++) hash = (hash + day.charCodeAt(i)) % variants.length;
  return hash;
}

export function TodayEmptyFocus() {
  const variants = visibleVariants();
  const v = variants[variantIndex() % variants.length] ?? variants[0]!;
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
