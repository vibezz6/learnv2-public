import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import {
  loadStudyIntent,
  setStudyIntent,
  STUDY_INTENT_LABELS,
  STUDY_INTENT_UPDATED_EVENT,
  type StudyIntentFocus,
} from "@/lib/studyIntent";

const OPTIONS: StudyIntentFocus[] = ["default", "sat", "college", "catch_up"];

export function StudyIntentPicker() {
  const [focus, setFocus] = useState(() => loadStudyIntent().focus);

  useEffect(() => {
    const sync = () => setFocus(loadStudyIntent().focus);
    window.addEventListener(STUDY_INTENT_UPDATED_EVENT, sync);
    return () => window.removeEventListener(STUDY_INTENT_UPDATED_EVENT, sync);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Today's study focus">
      <span className="text-xs text-[var(--text-muted)]">Focus today</span>
      {OPTIONS.map((option) => (
        <Button
          key={option}
          variant={focus === option ? "primary" : "secondary"}
          size="sm"
          aria-pressed={focus === option}
          onClick={() => setStudyIntent(option)}
        >
          {STUDY_INTENT_LABELS[option]}
        </Button>
      ))}
    </div>
  );
}
