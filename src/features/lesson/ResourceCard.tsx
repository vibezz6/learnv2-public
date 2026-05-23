import type { Resource } from "@/curriculum/types";
import { useBookmarks } from "@/stores/bookmarks";
import { ExternalLink, BookOpen, Video, FileText, GraduationCap, Dumbbell, Star } from "lucide-react";

const typeConfig: Record<
  Resource["type"],
  { label: string; icon: typeof Video; color: string }
> = {
  video: { label: "Video", icon: Video, color: "var(--danger)" },
  course: { label: "Course", icon: GraduationCap, color: "var(--info)" },
  practice: { label: "Practice", icon: Dumbbell, color: "var(--success)" },
  article: { label: "Article", icon: FileText, color: "var(--warning)" },
  book: { label: "Book", icon: BookOpen, color: "var(--text-muted)" },
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
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--border-strong)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold"
          style={{ color: config.color, border: `1px solid ${config.color}33`, background: `${config.color}11` }}
        >
          <Icon size={12} />
          {config.label}
        </span>
        <button
          type="button"
          onClick={() => toggleResourceBookmark(nodeId, resourceIndex)}
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          aria-pressed={isBookmarked}
          className="rounded-[var(--radius)] p-1.5 text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--warning)]"
        >
          <Star
            size={16}
            fill={isBookmarked ? "currentColor" : "none"}
            className={isBookmarked ? "text-[var(--warning)]" : undefined}
          />
        </button>
      </div>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start justify-between gap-2 text-sm font-medium text-[var(--text-heading)] no-underline hover:text-[var(--accent)]"
      >
        <span>{resource.title}</span>
        <ExternalLink size={14} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
      </a>
      {resource.whyHelpful && (
        <p className="mt-2 text-sm italic text-[var(--text-muted)]">{resource.whyHelpful}</p>
      )}
    </div>
  );
}
