import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { Stats } from "@/stores/progress";
import type { Subject } from "@/curriculum/types";
import { RightNowHero } from "@/features/dashboard/widgets/RightNowHero";
import { TodayMinimumStrip } from "@/features/dashboard/widgets/TodayMinimumStrip";

const subjects: Subject[] = [
  {
    id: "sat-prep",
    name: "SAT Prep",
    description: "",
    color: "#000",
    icon: "g",
    nodes: [
      {
        id: "st1",
        name: "Lesson 1",
        description: "",
        xpValue: 10,
        parentIds: [],
        estimatedMinutes: 10,
        resources: [],
        keyConcepts: [],
        whyItMatters: "",
        practiceProblems: [],
        difficulty: "beginner",
      },
    ],
  },
];

const stats: Stats = {
  totalXp: 0,
  level: 1,
  xpToNext: 500,
  completedNodes: 0,
  totalNodes: 1,
  streakCurrent: 0,
  streakLongest: 0,
  totalStudyMinutes: 0,
  dailyGoal: 60,
  todayMinutes: 0,
  dailyMinutes: {},
};

describe("RightNowHero", () => {
  it("renders the start-session CTA", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <RightNowHero subjects={subjects} resume={null} />
      </MemoryRouter>,
    );
    expect(html).toContain("Start focus session");
  });
});

describe("TodayMinimumStrip", () => {
  it("renders the minimum status and goal meter", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <TodayMinimumStrip stats={stats} />
      </MemoryRouter>,
    );
    expect(html).toContain("minimum");
    expect(html).toContain("/60m");
  });
});
