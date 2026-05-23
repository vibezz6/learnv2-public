import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Dumbbell, XCircle } from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  getChallengeCategories,
  getDailyChallenge,
  type DailyChallenge,
} from "@/data/dailyChallenges";
import { useProgress } from "@/stores/progress";
import { cn } from "@/lib/cn";

const categories = ["All", ...getChallengeCategories()];

interface Props {
  /** Pre-select category from the user's current subject (e.g. "Math") */
  defaultCategory?: string | null;
}

export function DailyChallengeWidget({ defaultCategory }: Props) {
  const addStudyTime = useProgress((s) => s.addStudyTime);
  const completeDailyChallenge = useProgress((s) => s.completeDailyChallenge);
  const isDailyChallengeCompleted = useProgress((s) => s.isDailyChallengeCompleted);

  const initialCategory =
    defaultCategory && categories.includes(defaultCategory) ? defaultCategory : "All";

  const [category, setCategory] = useState(initialCategory);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [numericAnswer, setNumericAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const loadChallenge = useCallback(
    (cat: string) => {
      const ch = getDailyChallenge(cat);
      setChallenge(ch);
      setCompleted(isDailyChallengeCompleted(ch.id));
      setSelectedOption(null);
      setNumericAnswer("");
      setShowResult(false);
    },
    [isDailyChallengeCompleted],
  );

  useEffect(() => {
    loadChallenge(category);
  }, [category, loadChallenge]);

  useEffect(() => {
    if (defaultCategory && categories.includes(defaultCategory)) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory]);

  if (!challenge) return null;

  const handleSubmit = () => {
    let correct = false;
    if (challenge.type === "multiple_choice" && selectedOption !== null) {
      correct = String(selectedOption) === challenge.correctAnswer;
    } else if (challenge.type === "numeric") {
      correct = numericAnswer.trim().toLowerCase() === challenge.correctAnswer.toLowerCase();
    }
    setIsCorrect(correct);
    setShowResult(true);
    if (correct && !completed) {
      completeDailyChallenge(challenge.id, challenge.xpReward);
      addStudyTime(5 * 60);
      setCompleted(true);
    }
  };

  return (
    <Card variant="accent" className="min-w-0">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-[var(--bg)]">
          <Dumbbell size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[var(--text-heading)]">Daily challenge</div>
          <div className="mt-0.5 text-xs text-[var(--text-muted)]">
            {challenge.subject} · {challenge.difficulty} · +{challenge.xpReward} XP
          </div>
        </div>
        {completed && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--success)]">
            <CheckCircle2 size={12} /> Done
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
              category === cat
                ? "border-[var(--border-strong)] bg-[var(--bg-hover)] text-[var(--text-heading)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="mb-4 break-words text-sm leading-relaxed text-[var(--text-heading)]">
        {challenge.question}
      </p>

      {!showResult ? (
        <div className="space-y-3">
          {challenge.type === "multiple_choice" &&
            challenge.options?.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                className={cn(
                  "min-h-11 w-full touch-manipulation rounded-[var(--radius)] border px-3 py-2.5 text-left text-sm transition-colors",
                  selectedOption === idx
                    ? "border-[var(--accent)] bg-[var(--accent-bg)]"
                    : "border-[var(--border)] hover:border-[var(--border-strong)]",
                )}
                onClick={() => setSelectedOption(idx)}
              >
                <span className="mr-2 font-bold text-[var(--accent)]">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {opt}
              </button>
            ))}
          {challenge.type === "numeric" && (
            <input
              type="text"
              value={numericAnswer}
              onChange={(e) => setNumericAnswer(e.target.value)}
              placeholder="Enter your answer…"
              className="min-h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          )}
          <Button
            className="min-h-11 w-full touch-manipulation min-[481px]:w-auto"
            disabled={
              (challenge.type === "multiple_choice" && selectedOption === null) ||
              (challenge.type === "numeric" && !numericAnswer.trim())
            }
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              isCorrect ? "text-[var(--success)]" : "text-[var(--danger)]",
            )}
          >
            {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {isCorrect ? "Correct!" : "Not quite."}
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">{challenge.explanation}</p>
          {!isCorrect && (
            <Button
              variant="secondary"
              onClick={() => {
                setShowResult(false);
                setSelectedOption(null);
                setNumericAnswer("");
              }}
            >
              Try again
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
