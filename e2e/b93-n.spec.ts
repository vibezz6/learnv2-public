import { test, expect } from "@playwright/test";

test.describe("B93–N polish and intent", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_preferences",
        JSON.stringify({
          state: { onboardingCompleted: true, theme: "dark", satTestDate: "2099-01-01" },
          version: 0,
        }),
      );
    });
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("campus essay final ratio badge on school card", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_colleges_v1",
        JSON.stringify({
          colleges: [
            {
              id: "c1",
              name: "Badge U",
              slug: "badge-u",
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      );
      localStorage.setItem(
        "learnv2_essay_tracker_v1",
        JSON.stringify({
          essays: [
            {
              id: "e1",
              templateId: "why-us",
              title: "Why us",
              prompt: "Why?",
              college: "Badge U",
              status: "final",
              createdAt: Date.now(),
            },
            {
              id: "e2",
              templateId: "why-us",
              title: "Why us 2",
              prompt: "Why?",
              college: "Badge U",
              status: "draft",
              createdAt: Date.now(),
            },
          ],
        }),
      );
    });
    await page.goto("/campus");
    await expect(page.getByText("1/2 essays final")).toBeVisible();
  });

  test("good shape hero shows streak support line", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await page.addInitScript((d: string) => {
      localStorage.setItem(
        "learnv2_sat_daily_quiz_v1",
        JSON.stringify({ date: d, score: 5, total: 5 }),
      );
      localStorage.setItem(
        "learnv2_activity_v1",
        JSON.stringify([
          {
            id: "act-1",
            type: "lesson_completed",
            date: d,
            at: Date.now(),
            nodeId: "st4",
          },
        ]),
      );
      localStorage.setItem("learnv2_sat_mistakes_v1", JSON.stringify([]));
      localStorage.setItem(
        "learnv2_progress",
        JSON.stringify({
          state: {
            data: {
              streaks: { current: 4, longest: 4, lastStudyDate: d },
            },
          },
          version: 0,
        }),
      );
    }, today);
    await page.goto("/");
    await expect(page.getByText(/Pick your next focus/i)).toBeVisible();
    await expect(page.getByText(/4-day streak — keep it going/i)).toBeVisible();
  });

  test("Draft 3 snooze hides retest CTA on SAT hub", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_sat_pretest_v1",
        JSON.stringify({
          schemaVersion: 1,
          attempts: [
            {
              id: "d1",
              draftId: "draft-1",
              status: "completed",
              startedAt: "2026-06-01T12:00:00.000Z",
              completedAt: "2026-06-01T12:30:00.000Z",
              questionOrder: ["q1"],
              currentIndex: 0,
              responses: {},
              scoreSummary: {
                totalQuestions: 24,
                correctAnswers: 18,
                pct: 75,
                sectionBreakdown: [],
                skillBreakdown: [],
                weakSkills: [],
                recommendedNodeIds: [],
                timeSpentSeconds: 900,
              },
            },
          ],
        }),
      );
    });
    await page.goto("/subjects/sat-prep#diagnostic");
    await expect(page.getByRole("button", { name: /Start Draft 3 retest/i })).toBeVisible();
    await page.getByRole("button", { name: "Snooze 24h" }).click();
    await expect(page.getByRole("button", { name: /Start Draft 3 retest/i })).toHaveCount(0);
  });

  test("command palette Draft 3 retest navigates to pretest tab", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_sat_pretest_v1",
        JSON.stringify({
          schemaVersion: 1,
          attempts: [
            {
              id: "d1",
              draftId: "draft-1",
              status: "completed",
              startedAt: "2026-06-01T12:00:00.000Z",
              completedAt: "2026-06-01T12:30:00.000Z",
              questionOrder: ["q1"],
              currentIndex: 0,
              responses: {},
              scoreSummary: {
                totalQuestions: 24,
                correctAnswers: 18,
                pct: 75,
                sectionBreakdown: [],
                skillBreakdown: [],
                weakSkills: [],
                recommendedNodeIds: [],
                timeSpentSeconds: 900,
              },
            },
          ],
        }),
      );
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Quick open" }).click();
    const input = page.getByPlaceholder(/Quick open/i);
    await input.fill("Draft 3 retest");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/sat\/pretest\?draft=draft-3/);
  });
});
