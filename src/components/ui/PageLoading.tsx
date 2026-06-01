import { Card } from "./Card";
import { PageContainer } from "./PageContainer";

type PageContainerSize = "sm" | "md" | "narrow" | "wide" | "lg" | "xl";

interface PageLoadingProps {
  size?: PageContainerSize;
}

/** Skeleton placeholder while route data loads — matches Notes office-hours pattern. */
export function PageLoading({ size = "narrow" }: PageLoadingProps) {
  return (
    <PageContainer size={size} className="space-y-8 md:space-y-10">
      <div className="h-4 w-32 animate-pulse rounded bg-[var(--bg-elevated)]" />
      <Card className="space-y-3">
        <div className="h-5 w-2/3 animate-pulse rounded bg-[var(--bg-elevated)]" />
        <div className="h-32 animate-pulse rounded bg-[var(--bg-elevated)]" />
      </Card>
    </PageContainer>
  );
}
