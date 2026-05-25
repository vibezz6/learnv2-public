import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Star } from "lucide-react";
import { Button, Card, PageContainer, PageHeader } from "@/components/ui";
import { findNodeAcrossSubjects, getNode, loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { ResourceCard } from "@/features/lesson/ResourceCard";
import { useBookmarks } from "@/stores/bookmarks";

export function BookmarksPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const resourceBookmarks = useBookmarks((s) => s.resourceBookmarks);
  const lessonBookmarks = useBookmarks((s) => s.lessonBookmarks);
  const toggleLessonBookmark = useBookmarks((s) => s.toggleLessonBookmark);

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  const resolvedResources = resourceBookmarks
    .map((bookmark) => {
      const found = findNodeAcrossSubjects(subjects, bookmark.nodeId);
      if (!found) return null;
      const resource = found.node.resources[bookmark.resourceIndex];
      if (!resource) return null;
      return { bookmark, subject: found.subject, node: found.node, resource };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const resolvedLessons = lessonBookmarks
    .map((bookmark) => {
      const subject = subjects.find((s) => s.id === bookmark.subjectId);
      if (!subject) return null;
      const node = getNode(subject, bookmark.nodeId);
      if (!node) return null;
      return { bookmark, subject, node };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const isEmpty = resolvedResources.length === 0 && resolvedLessons.length === 0;

  if (isEmpty) {
    return (
      <PageContainer size="narrow" className="space-y-4">
        <PageHeader
          title="Saved"
          subtitle="Star resources on a lesson page to save them here."
        />
        <Card className="text-center">
          <Star className="mx-auto mb-3 text-[var(--accent)]" size={32} />
          <p className="text-sm text-[var(--text-muted)]">
            Star resources on a lesson page to save them here.
          </p>
          <Link to="/subjects" className="mt-4 inline-block">
            <Button variant="secondary">Browse subjects</Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  const savedCount = resolvedResources.length + resolvedLessons.length;

  return (
    <PageContainer size="narrow" className="space-y-6">
      <PageHeader
        title="Saved"
        subtitle={`${savedCount} saved item${savedCount === 1 ? "" : "s"}`}
      />

      {resolvedLessons.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
            <BookOpen size={16} />
            Lessons
            <span className="text-[var(--text-muted)]">({resolvedLessons.length})</span>
          </div>
          <div className="space-y-3">
            {resolvedLessons.map(({ bookmark, subject, node }) => (
              <Card key={`${bookmark.subjectId}-${bookmark.nodeId}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--text-heading)]">{node.name}</h3>
                    <p className="text-sm text-[var(--text-muted)]">{subject.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleLessonBookmark(bookmark.subjectId, bookmark.nodeId)}
                      aria-label="Remove lesson bookmark"
                      className="rounded-[var(--radius)] p-2 text-[var(--warning)] transition hover:bg-white/5"
                    >
                      <Star size={16} fill="currentColor" />
                    </button>
                    <Link to={`/subjects/${subject.id}/${node.id}`}>
                      <Button variant="secondary">Open lesson</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {resolvedResources.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
            <Star size={16} />
            Resources
            <span className="text-[var(--text-muted)]">({resolvedResources.length})</span>
          </div>
          <div className="grid min-w-0 gap-3">
            {resolvedResources.map(({ bookmark, subject, node, resource }) => (
              <div key={`${bookmark.nodeId}-${bookmark.resourceIndex}`} className="space-y-1">
                <p className="text-xs text-[var(--text-muted)]">
                  {subject.name} · {node.name}
                </p>
                <ResourceCard
                  resource={resource}
                  nodeId={bookmark.nodeId}
                  resourceIndex={bookmark.resourceIndex}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
