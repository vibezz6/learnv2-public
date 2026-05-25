import { useCallback, useEffect, useState } from "react";
import {
  getStudyIntentSubtitle,
  loadStudyIntent,
  setStudyIntent,
  STUDY_INTENT_LABELS,
  type StudyIntentFocus,
} from "@/lib/studyIntent";

const OPTIONS: StudyIntentFocus[] = ["default", "sat", "college", "catch_up"];

export function StudyIntentStrip() {
  const [focus, setFocus] = useState<StudyIntentFocus>(() => loadStudyIntent().focus);

  const refresh = useCallback(() => setFocus(loadStudyIntent().focus), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const subtitle = getStudyIntentSubtitle(focus);

  return (
    <div className="flex flex-col gap-2 min-[481px]:flex-row min-[481px]:items-center min-[481px]:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setStudyIntent(option);
              setFocus(option);
            }}
            className={`min-h-9 rounded-full border px-3 text-xs font-medium transition-colors touch-manipulation ${
              focus === option
                ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
            }`}
          >
            {STUDY_INTENT_LABELS[option]}
          </button>
        ))}
      </div>
      {subtitle && (
        <p className="text-xs text-[var(--text-muted)] min-[481px]:max-w-[50%]">{subtitle}</p>
      )}
    </div>
  );
}
