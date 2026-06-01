import type { NotesFlowView } from "@/stores/noteSessions";

export interface OfficeHoursStep {
  id: NotesFlowView;
  label: string;
  description: string;
}

export const OFFICE_HOURS_STEPS: OfficeHoursStep[] = [
  { id: "editor", label: "Session notes", description: "Guided prompts for this lesson" },
  { id: "review", label: "TA feedback", description: "Strengths, gaps, and next steps" },
  { id: "mentor", label: "Recall check-in", description: "Five questions on key ideas" },
];

export const OFFICE_HOURS_TAGLINE =
  "Capture what you learned, get structured feedback, then prove you remember it — like office hours, saved on your device.";

export const OFFICE_HOURS_EDITOR_INTRO =
  "Answer the prompts in your own words. You only need one response to unlock TA feedback. Everything saves locally on this lesson.";

export const MIN_PROMPTS_FOR_TA_HINT =
  "Answer at least one prompt to unlock TA feedback. Works without an API key — add one in Settings for richer AI feedback.";

export function lockedStepHint(stepId: NotesFlowView): string | undefined {
  if (stepId === "review") {
    return "Answer at least one guided prompt before TA feedback opens.";
  }
  if (stepId === "mentor") {
    return "Complete TA feedback before the recall check-in.";
  }
  return undefined;
}
