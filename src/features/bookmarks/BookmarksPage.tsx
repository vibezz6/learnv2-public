import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  PageContainer,
  PageHeader,
  PageLoading,
  Section,
} from "@/components/ui";
import { findNodeAcrossSubjects, getNode, loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { ResourceCard } from "@/features/lesson/ResourceCard";
import { useBookmarks } from "@/stores/bookmarks";

export function BookmarksPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const resourceBookmarks = useBookmarks((s) => s.resourceBookmarks);
  const lessonBookmarks = useBookmarks((s) => s.lessonBookmarks);
  const toggleLessonBookmark = useBookmarks((s) => s.toggleLessonBookmark);

  useEffect(() => {
    loadAllSubjects().then((loaded) => {
      setSubjects(loaded);
      setLoading(false);
    });
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

  if (loading) {
    return <PageLoading size="narrow" />;
  }

  if (isEmpty) {
    return (
      <PageContainer size="narrow" className="space-y-4">
        <PageHeader
          title="Saved"
          subtitle="Star resources on a lesson page to save them here."
        />
        <Card variant="quiet">
          <EmptyState
            icon={<Star size={32} className="text-[var(--accent)]" />}
            title="Nothing saved yet"
            description="Star resources or lessons while you study — they'll show up here."
            actionLabel="Browse subjects"
            actionTo="/subjects"
          />
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
        <Section eyebrow="Lessons" title={`${resolvedLessons.length} bookmarked`}>
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
        </Section>
      )}

      {resolvedResources.length > 0 && (
        <Section eyebrow="Resources" title={`${resolvedResources.length} bookmarked`}>
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
        </Section>
      )}
    </PageContainer>
  );
}
