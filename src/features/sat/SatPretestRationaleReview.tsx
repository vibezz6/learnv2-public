import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import {
  generateLLMPretestRationaleReview,
  hasOpenRouterApiKey,
  type SatPretestRationaleReview,
} from "@/services/llmReview";
import type { SatPretestQuestion, SatPretestResponse } from "@/lib/satPretest";
import { Link } from "react-router-dom";

interface Props {
  question: SatPretestQuestion;
  response: SatPretestResponse;
}

export function SatPretestRationaleReviewBlock({ question, response }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<SatPretestRationaleReview | null>(null);

  if (!hasOpenRouterApiKey()) {
    return (
      <p className="text-xs text-[var(--text-muted)]">
        Add an OpenRouter key in{" "}
        <Link to="/settings" className="font-medium text-[var(--accent)] hover:underline">
          Settings
        </Link>{" "}
        for optional AI rationale review (post-completion only).
      </p>
    );
  }

  const handleReview = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await generateLLMPretestRationaleReview({
        skill: question.skill,
        section: question.section,
        domain: question.domain,
        prompt: question.prompt,
        choices: question.choices,
        selectedChoiceId: response.selectedChoiceId,
        correctChoiceId: question.correctChoiceId,
        studentRationale: response.rationale,
        explanation: question.explanation,
      });
      if (!result) {
        setError("Could not get AI feedback. Check your key or try again in a moment.");
        return;
      }
      setReview(result);
    } catch {
      setError("Network error while contacting OpenRouter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 space-y-2 border-t border-[var(--border)] pt-2">
      {!review ? (
        <Button
          variant="secondary"
          className="min-h-9 w-full touch-manipulation text-xs sm:w-auto"
          disabled={loading}
          onClick={() => void handleReview()}
        >
          <Sparkles size={14} />
          {loading ? "Reviewing…" : "Review my thinking (AI)"}
        </Button>
      ) : null}
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
      {review ? (
        <div className="space-y-1.5 rounded-[var(--radius)] bg-[var(--bg-secondary)]/50 px-3 py-2 text-xs text-[var(--text-muted)]">
          <p className="text-[var(--text-heading)]">{review.feedback}</p>
          {review.misconception ? (
            <p>
              <span className="font-medium text-[var(--text-heading)]">Likely slip:</span>{" "}
              {review.misconception}
            </p>
          ) : null}
          <p>
            <span className="font-medium text-[var(--text-heading)]">Next step:</span>{" "}
            {review.studyTip}
          </p>
        </div>
      ) : null}
    </div>
  );
}
