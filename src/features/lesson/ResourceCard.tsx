import type { Resource } from "@/curriculum/types";
import { useBookmarks } from "@/stores/bookmarks";
import {
  BookOpen,
  Dumbbell,
  ExternalLink,
  FileText,
  GraduationCap,
  Star,
  Video,
} from "lucide-react";
import { Card, Tag } from "@/components/ui";

const typeConfig: Record<
  Resource["type"],
  { label: string; icon: typeof Video; tone: "danger" | "info" | "success" | "warning" | "muted" }
> = {
  video: { label: "Video", icon: Video, tone: "danger" },
  course: { label: "Course", icon: GraduationCap, tone: "info" },
  practice: { label: "Practice", icon: Dumbbell, tone: "success" },
  article: { label: "Article", icon: FileText, tone: "warning" },
  book: { label: "Book", icon: BookOpen, tone: "muted" },
};

export function ResourceCard({
  resource,
  nodeId,
  resourceIndex,
}: {
  resource: Resource;
  nodeId: string;
  resourceIndex: number;
}) {
  const config = typeConfig[resource.type];
  const Icon = config.icon;
  const isBookmarked = useBookmarks((s) => s.isResourceBookmarked(nodeId, resourceIndex));
  const toggleResourceBookmark = useBookmarks((s) => s.toggleResourceBookmark);

  return (
    <Card variant="default" density="compact" hover className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Tag tone={config.tone} size="sm" className="gap-1">
          <Icon size={11} aria-hidden />
          {config.label}
        </Tag>
        <button
          type="button"
          onClick={() => toggleResourceBookmark(nodeId, resourceIndex)}
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          aria-pressed={isBookmarked}
          className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-subtle)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--warning)]"
        >
          <Star
            size={14}
            fill={isBookmarked ? "currentColor" : "none"}
            className={isBookmarked ? "text-[var(--warning)]" : undefined}
            aria-hidden
          />
        </button>
      </div>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start justify-between gap-2 text-sm font-medium text-[var(--text-heading)] no-underline underline-offset-2 hover:underline"
      >
        <span>{resource.title}</span>
        <ExternalLink size={13} className="mt-0.5 shrink-0 text-[var(--text-subtle)]" aria-hidden />
      </a>
      {resource.whyHelpful ? (
        <p className="mt-2 text-sm italic leading-relaxed text-[var(--text-muted)]">
          {resource.whyHelpful}
        </p>
      ) : null}
    </Card>
  );
}
