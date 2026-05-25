import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadSubject, getNode } from "@/curriculum/loader";
import type { SkillNode, Subject } from "@/curriculum/types";
import { PageContainer, PageHeader } from "@/components/ui";
import { Quiz } from "@/features/quiz/QuizPage";

export function QuizRoutePage() {
  const { subjectId = "", nodeId = "" } = useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [node, setNode] = useState<SkillNode | null>(null);

  useEffect(() => {
    loadSubject(subjectId).then((s) => {
      setSubject(s ?? null);
      setNode(s ? getNode(s, nodeId) ?? null : null);
    });
  }, [subjectId, nodeId]);

  if (!subject || !node) {
    return (
      <PageContainer size="narrow" className="text-[var(--text-muted)]">
        Loading quiz…
      </PageContainer>
    );
  }

  const questions = node.quiz ?? [];

  return (
    <PageContainer size="narrow" className="space-y-4">
      <PageHeader
        backTo={{
          to: `/subjects/${subject.id}/${node.id}`,
          label: node.name,
        }}
        title={`Quiz · ${node.name}`}
        divider={false}
      />
      <Quiz
        key={node.id}
        questions={questions}
        nodeId={node.id}
        onComplete={() => {
          /* score saved in Quiz component */
        }}
      />
    </PageContainer>
  );
}
