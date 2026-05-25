import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadSubject, getNode } from "@/curriculum/loader";
import type { SkillNode, Subject } from "@/curriculum/types";
import {
  FocusShell,
  FocusStudyBar,
  PageContainer,
  PageHeader,
  PageLoading,
} from "@/components/ui";
import { Quiz } from "@/features/quiz/QuizPage";
import { usePreferences } from "@/stores/preferences";

export function QuizRoutePage() {
  const { subjectId = "", nodeId = "" } = useParams();
  const { focusMode, toggleFocusMode } = usePreferences();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [node, setNode] = useState<SkillNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadSubject(subjectId).then((s) => {
      if (cancelled) return;
      setSubject(s ?? null);
      setNode(s ? getNode(s, nodeId) ?? null : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [subjectId, nodeId]);

  if (loading) {
    return <PageLoading size="narrow" />;
  }

  if (!subject || !node) {
    return (
      <PageContainer size="narrow" className="text-[var(--text-muted)]">
        Quiz not found.
      </PageContainer>
    );
  }

  const questions = node.quiz ?? [];
  const lessonPath = `/subjects/${subject.id}/${node.id}`;

  return (
    <FocusShell active={focusMode}>
      <PageContainer size="narrow" className="space-y-4">
        {focusMode ? (
          <FocusStudyBar
            backTo={lessonPath}
            backLabel={node.name}
            onExitFocus={toggleFocusMode}
          />
        ) : (
          <PageHeader
            backTo={{
              to: lessonPath,
              label: node.name,
            }}
            title={`Quiz · ${node.name}`}
            divider={false}
          />
        )}
        <Quiz
          key={node.id}
          questions={questions}
          nodeId={node.id}
          onComplete={() => {
            /* score saved in Quiz component */
          }}
        />
      </PageContainer>
    </FocusShell>
  );
}
