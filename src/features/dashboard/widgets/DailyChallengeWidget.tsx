import { useState, useEffect } from "react";
import { CheckCircle2, Dumbbell, XCircle } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { getDailyChallenge, type DailyChallenge } from "@/data/dailyChallenges";
import { useProgress } from "@/stores/progress";

export function DailyChallengeWidget() {
  const addStudyTime = useProgress((s) => s.addStudyTime);
  const completeDailyChallenge = useProgress((s) => s.completeDailyChallenge);
  const isDailyChallengeCompleted = useProgress((s) => s.isDailyChallengeCompleted);

  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [numericAnswer, setNumericAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    const ch = getDailyChallenge();
    setChallenge(ch);
    setCompleted(isDailyChallengeCompleted(ch.id));
  }, [isDailyChallengeCompleted]);

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
    <Card className="min-w-0 border-[var(--accent-border)] bg-[var(--accent-bg)]">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-white">
          <Dumbbell size={18} />
        </div>
        <div>
          <div className="font-semibold text-[var(--text-heading)]">Daily challenge</div>
          <div className="text-xs text-[var(--text-muted)]">
            {challenge.subject} · {challenge.difficulty} · +{challenge.xpReward} XP
          </div>
        </div>
        {completed && (
          <span className="ml-auto flex items-center gap-1 text-xs text-[var(--success)]">
            <CheckCircle2 size={12} /> Done
          </span>
        )}
      </div>

      <p className="mb-3 break-words text-sm font-medium text-[var(--text-heading)]">{challenge.question}</p>

      {!showResult ? (
        <div className="space-y-2">
          {challenge.type === "multiple_choice" && challenge.options?.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              className={`min-h-11 w-full touch-manipulation rounded-[var(--radius)] border px-3 py-2 text-left text-sm transition ${
                selectedOption === idx
                  ? "border-[var(--accent)] bg-[var(--accent-bg)]"
                  : "border-[var(--border)] hover:border-[var(--border-strong)]"
              }`}
              onClick={() => setSelectedOption(idx)}
            >
              <span className="mr-2 font-bold text-[var(--accent)]">{String.fromCharCode(65 + idx)}.</span>
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
            className="mt-2 min-h-11 w-full touch-manipulation min-[481px]:w-auto"
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
        <div className="space-y-2">
          <div
            className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
          >
            {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {isCorrect ? "Correct!" : "Not quite."}
          </div>
          <p className="text-sm text-[var(--text-muted)]">{challenge.explanation}</p>
          {!isCorrect && (
            <Button variant="secondary" onClick={() => { setShowResult(false); setSelectedOption(null); setNumericAnswer(""); }}>
              Try again
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
