import type { Resource } from "@/curriculum/types";
import { ExternalLink, BookOpen, Video, FileText, GraduationCap, Dumbbell } from "lucide-react";

const typeConfig: Record<
  Resource["type"],
  { label: string; icon: typeof Video; color: string }
> = {
  video: { label: "Video", icon: Video, color: "var(--danger)" },
  course: { label: "Course", icon: GraduationCap, color: "var(--info)" },
  practice: { label: "Practice", icon: Dumbbell, color: "var(--success)" },
  article: { label: "Article", icon: FileText, color: "var(--warning)" },
  book: { label: "Book", icon: BookOpen, color: "var(--accent)" },
};

export function ResourceCard({ resource }: { resource: Resource }) {
  const config = typeConfig[resource.type];
  const Icon = config.icon;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition hover:border-[var(--accent)]/30 hover:-translate-y-0.5">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold"
          style={{ color: config.color, border: `1px solid ${config.color}33`, background: `${config.color}11` }}
        >
          <Icon size={12} />
          {config.label}
        </span>
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
