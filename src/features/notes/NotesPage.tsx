import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  RotateCcw,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { getNode, loadSubject } from "@/curriculum/loader";
import type { MentorMessage, MentorSession, NoteReview, SkillNode, Subject } from "@/curriculum/types";
import { getPromptsForSubject } from "@/data/notePrompts";
import {
  evaluateMentorAnswerAsync,
  generateMentorQuestionsAsync,
  generateReviewAsync,
  generateReview,
  getSession,
  saveMentorSession,
  saveReview,
  updateResponses,
  upsertSession,
} from "@/stores/noteSessions";

type NotesView = "editor" | "review" | "mentor";

export function NotesPage() {
  const { subjectId = "", nodeId = "" } = useParams();
  const [view, setView] = useState<NotesView>("editor");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [node, setNode] = useState<SkillNode | null>(null);

  useEffect(() => {
    loadSubject(subjectId).then((s) => {
      setSubject(s ?? null);
      setNode(s ? getNode(s, nodeId) ?? null : null);
    });
  }, [subjectId, nodeId]);

  if (!subject || !node) {
    return <div className="p-8 text-[var(--text-muted)]">Loading notes…</div>;
  }

  const lessonPath = `/subjects/${subjectId}/${nodeId}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-4">
        <Link
          to={lessonPath}
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft size={16} />
          Lesson
        </Link>
        <span className="text-sm font-medium text-[var(--text-muted)]">Guided Notes</span>
        <div className="ml-auto flex gap-2">
          {(["editor", "review", "mentor"] as const).map((tab) => (
            <Button
              key={tab}
              variant={view === tab ? "primary" : "secondary"}
              onClick={() => setView(tab)}
            >
              {tab === "editor" ? "Write" : tab === "review" ? "Review" : "Mentor"}
            </Button>
          ))}
        </div>
      </div>

      {view === "editor" && (
        <NoteEditor
          node={node}
          subject={subject}
          onComplete={() => setView("review")}
        />
      )}
      {view === "review" && (
        <NoteReviewPanel
          node={node}
          subject={subject}
          onQuizMe={() => setView("mentor")}
        />
      )}
      {view === "mentor" && <NoteMentorPanel node={node} subject={subject} />}
    </div>
  );
}

function NoteEditor({
  node,
  subject,
  onComplete,
}: {
  node: SkillNode;
  subject: Subject;
  onComplete: () => void;
}) {
  const prompts = useMemo(() => getPromptsForSubject(subject.id), [subject.id]);
  const [responses, setResponses] = useState<Record<string, string>>(() => getSession(node.id)?.responses ?? {});
  const [activeIndex, setActiveIndex] = useState(0);

  const activePrompt = prompts[activeIndex];
  const filledCount = prompts.filter((p) => (responses[p.key] || "").trim()).length;

  const persist = useCallback(
    (next: Record<string, string>) => {
      const existing = getSession(node.id);
      if (existing) updateResponses(node.id, next);
      else {
        upsertSession({
          nodeId: node.id,
          subjectId: subject.id,
          responses: next,
          review: null,
          mentorSession: null,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    },
    [node.id, subject.id],
  );

  const handleChange = (value: string) => {
    if (!activePrompt) return;
    setResponses((prev) => {
      const next = { ...prev, [activePrompt.key]: value };
      persist(next);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-center gap-2 text-[var(--accent)]">
          <BookOpen size={18} />
          <span className="font-medium">{node.name}</span>
          <Badge>{filledCount}/{prompts.length}</Badge>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {prompts.map((prompt, idx) => (
            <button
              key={prompt.key}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`shrink-0 rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium transition ${
                idx === activeIndex
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:bg-white/5"
              }`}
            >
              {prompt.label}
            </button>
          ))}
        </div>

        {activePrompt && (
          <>
            <p className="mb-2 text-sm text-[var(--text-muted)]">{activePrompt.placeholder}</p>
            <textarea
              value={responses[activePrompt.key] || ""}
              onChange={(e) => handleChange(e.target.value)}
              rows={8}
              className="w-full resize-y rounded-[var(--radius)] border border-[var(--border)] bg-transparent p-3 text-sm leading-relaxed text-[var(--text)] outline-none focus:border-[var(--accent)]"
              placeholder="Write in your own words…"
            />
          </>
        )}
      </Card>

      <div className="flex justify-between">
        <Button
          variant="secondary"
          disabled={activeIndex === 0}
          onClick={() => setActiveIndex((i) => i - 1)}
        >
          <ChevronLeft size={16} />
          Previous
        </Button>
        <Button
          onClick={() => {
            if (activeIndex === prompts.length - 1) onComplete();
            else setActiveIndex((i) => i + 1);
          }}
        >
          {activeIndex === prompts.length - 1 ? "Review my notes" : "Next"}
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

function NoteReviewPanel({
  node,
  subject,
  onQuizMe,
}: {
  node: SkillNode;
  subject: Subject;
  onQuizMe: () => void;
}) {
  const [review, setReview] = useState<NoteReview | null>(() => getSession(node.id)?.review ?? null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const session = getSession(node.id);
    if (!session) return;
    setLoading(true);
    try {
      const result = await generateReviewAsync(node.id, session.responses, node.keyConcepts, node.name);
      setReview(result);
      saveReview(node.id, result);
    } catch {
      const fallback = generateReview(node.id, session.responses, node.keyConcepts);
      setReview(fallback);
      saveReview(node.id, fallback);
    }
    setLoading(false);
  };

  if (!review) {
    return (
      <Card className="space-y-4 text-center">
        <Sparkles className="mx-auto text-[var(--accent)]" size={32} />
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Ready for review</h2>
        <p className="text-sm text-[var(--text-muted)]">
          AI analyzes your guided notes for coverage and depth. Works offline with heuristics if no API key is set.
        </p>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? (
            <>
              <RotateCcw size={16} className="animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Zap size={16} />
              Generate review
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="text-center">
        <div className="text-4xl font-bold text-[var(--accent)]">{review.score}</div>
        <p className="text-sm text-[var(--text-muted)]">{subject.name} · {node.name}</p>
      </Card>

      <ReviewSection title="Strengths" items={review.strengths} />
      <ReviewSection title="Gaps" items={review.gaps} />
      <ReviewSection title="Suggestions" items={review.suggestions} />

      <div className="flex gap-2">
        <Button onClick={onQuizMe}>Quiz me →</Button>
        <Button variant="secondary" onClick={handleGenerate} disabled={loading}>
          <RotateCcw size={16} />
          Regenerate
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <h3 className="mb-2 font-semibold text-[var(--text-heading)]">{title}</h3>
      <ul className="space-y-1 text-sm text-[var(--text-muted)]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function NoteMentorPanel({ node, subject }: { node: SkillNode; subject: Subject }) {
  const [session, setSession] = useState<MentorSession | null>(() => getSession(node.id)?.mentorSession ?? null);
  const [index, setIndex] = useState(() => getSession(node.id)?.mentorSession?.messages.length ?? 0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [lastMessage, setLastMessage] = useState<MentorMessage | null>(null);

  const start = async () => {
    setLoading(true);
    try {
      const questions = await generateMentorQuestionsAsync(node.keyConcepts, node.name);
      const next: MentorSession = { questions, messages: [], startedAt: Date.now(), completedAt: null };
      setSession(next);
      setIndex(0);
      saveMentorSession(node.id, next);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!session || !answer.trim()) return;
    setEvaluating(true);
    const question = session.questions[index];
    const evaluation = await evaluateMentorAnswerAsync(question, answer);
    const message: MentorMessage = {
      question,
      answer: answer.trim(),
      feedback: evaluation.feedback,
      quality: evaluation.quality,
    };
    const updated: MentorSession = {
      ...session,
      messages: [...session.messages, message],
      completedAt: index + 1 >= session.questions.length ? Date.now() : null,
    };
    setSession(updated);
    saveMentorSession(node.id, updated);
    setLastMessage(message);
    setAnswer("");
    setIndex((i) => i + 1);
    setEvaluating(false);
  };

  if (!session) {
    return (
      <Card className="space-y-4 text-center">
        <GraduationCap className="mx-auto text-[var(--accent)]" size={32} />
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Mentor quiz</h2>
        <p className="text-sm text-[var(--text-muted)]">{node.name} · {subject.name}</p>
        <Button onClick={start} disabled={loading}>
          {loading ? "Generating…" : "Start quiz"}
        </Button>
      </Card>
    );
  }

  if (index >= session.questions.length) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Quiz complete</h2>
        <div className="space-y-3">
          {session.messages.map((msg, i) => (
            <div key={i} className="rounded-[var(--radius)] border border-[var(--border)] p-3 text-sm">
              <p className="font-medium text-[var(--text-heading)]">Q{i + 1}: {msg.question}</p>
              <p className="mt-1 text-[var(--text-muted)]">{msg.answer}</p>
              <p className="mt-1 text-[var(--accent)]">{msg.feedback}</p>
            </div>
          ))}
        </div>
        <Button variant="secondary" onClick={() => { setSession(null); setIndex(0); setLastMessage(null); }}>
          Retake
        </Button>
      </Card>
    );
  }

  if (lastMessage && lastMessage.question === session.questions[index - 1]) {
    return (
      <Card className="space-y-3">
        <Badge>{lastMessage.quality}</Badge>
        <p className="text-sm text-[var(--text-muted)]">{lastMessage.feedback}</p>
        <Button onClick={() => setLastMessage(null)}>Next question</Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
        <span>Question {index + 1} of {session.questions.length}</span>
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-heading)]">{session.questions[index]}</h3>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={5}
        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent p-3 text-sm outline-none focus:border-[var(--accent)]"
        placeholder="Type your answer…"
      />
      <Button onClick={submit} disabled={!answer.trim() || evaluating}>
        {evaluating ? "Evaluating…" : (
          <>
            Submit
            <Send size={16} />
          </>
        )}
      </Button>
    </Card>
  );
}
