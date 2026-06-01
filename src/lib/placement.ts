export type PlacementGoal = "sat" | "foundation" | "explore";

export interface PlacementOption {
  goal: PlacementGoal;
  title: string;
  description: string;
  trackName: string;
}

export const PLACEMENT_OPTIONS: PlacementOption[] = [
  {
    goal: "sat",
    title: "August SAT",
    description: "Daily SAT drills, Bluebook checkpoints, and mistake logging — best if college apps are the priority.",
    trackName: "August SAT Track",
  },
  {
    goal: "foundation",
    title: "Math & foundations",
    description: "Rebuild math, CS, and probability basics before harder subjects — good if GPA/SAT need a stronger base.",
    trackName: "Complete Foundation",
  },
  {
    goal: "explore",
    title: "Explore on my own",
    description: "Browse subjects and tracks without enrolling in a degree plan yet.",
    trackName: "None — you choose each day",
  },
];

export function trackIdForPlacement(goal: PlacementGoal): string | null {
  switch (goal) {
    case "sat":
      return "sat-august";
    case "foundation":
      return "foundation";
    case "explore":
      return null;
  }
}

export function labelForPlacement(goal: PlacementGoal | null | undefined): string | null {
  if (!goal) return null;
  return PLACEMENT_OPTIONS.find((o) => o.goal === goal)?.title ?? null;
}
