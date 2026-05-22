import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadSubject, getNode } from "@/curriculum/loader";
import type { SkillNode, Subject } from "@/curriculum/types";
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
    return <div className="p-8 text-[var(--text-muted)]">Loading quiz…</div>;
  }

  const questions = node.quiz ?? [];

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4 overflow-x-hidden px-3 py-4 sm:p-4 md:p-8">
      <Link
        to={`/subjects/${subject.id}/${node.id}`}
        className="inline-flex min-h-11 items-center text-sm text-[var(--text-muted)]"
      >
        ← Back to {node.name}
      </Link>
      <h1 className="break-words text-2xl font-bold text-[var(--text-heading)]">Quiz · {node.name}</h1>
      <Quiz
        questions={questions}
        nodeId={node.id}
        onComplete={() => {
          /* score saved in Quiz component */
        }}
      />
    </div>
  );
}
