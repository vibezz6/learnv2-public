import { test, expect } from "@playwright/test";

test.describe("B87–M polish and verify", () => {
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

  test("college focus session complete shows package next-steps", async ({ page }) => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3);
    const deadlineStr = deadline.toISOString().slice(0, 10);
    await page.addInitScript((d: string) => {
      localStorage.setItem(
        "learnv2_colleges_v1",
        JSON.stringify({
          colleges: [
            {
              id: "c1",
              name: "Test U",
              slug: "test-u",
              deadline: d,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      );
      localStorage.setItem(
        "learnv2_college_checklist_v1",
        JSON.stringify({ completed: {}, customItems: [] }),
      );
      localStorage.setItem("learnv2_essay_tracker_v1", JSON.stringify({ essays: [] }));
    }, deadlineStr);
    await page.goto("/");
    await page.getByRole("button", { name: "Start focus session" }).click();
    await page.getByRole("button", { name: /Finish & log/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Session logged" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Open Test U package/i })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Open essay tracker/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Open Test U package/i }).click();
    await expect(page).toHaveURL(/\/campus\/application\?college=Test/);
  });

  test("SAT focus session complete has no college package CTA", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Start focus session" }).click();
    await page.getByRole("button", { name: /Finish & log/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: /Log a mistake/i })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Open .* package/i })).toHaveCount(0);
  });

  test("post-SAT suppresses drill hero and shows passed copy", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_preferences",
        JSON.stringify({
          state: { onboardingCompleted: true, theme: "dark", satTestDate: "2020-01-01" },
          version: 0,
        }),
      );
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(
        "learnv2_sat_daily_quiz_v1",
        JSON.stringify({ date: today, score: 5, total: 5 }),
      );
      const now = Date.now();
      localStorage.setItem(
        "learnv2_sat_mistakes_v1",
        JSON.stringify([
          {
            id: "m1",
            date: today,
            section: "math",
            category: "Linear equations",
            skillId: "linear-equations",
            note: "",
            createdAt: now,
          },
          {
            id: "m2",
            date: today,
            section: "math",
            category: "Linear equations",
            skillId: "linear-equations",
            note: "",
            createdAt: now - 1,
          },
          {
            id: "m3",
            date: today,
            section: "math",
            category: "Linear equations",
            skillId: "linear-equations",
            note: "",
            createdAt: now - 2,
          },
        ]),
      );
    });
    await page.goto("/");
    await expect(page.getByText(/SAT date passed — update your test date/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Start focus on drill/i })).toHaveCount(0);
  });

  test("post-SAT still shows college blocking package link", async ({ page }) => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3);
    const deadlineStr = deadline.toISOString().slice(0, 10);
    await page.addInitScript((d: string) => {
      localStorage.setItem(
        "learnv2_preferences",
        JSON.stringify({
          state: { onboardingCompleted: true, theme: "dark", satTestDate: "2020-01-01" },
          version: 0,
        }),
      );
      localStorage.setItem(
        "learnv2_colleges_v1",
        JSON.stringify({
          colleges: [
            {
              id: "c1",
              name: "Test U",
              slug: "test-u",
              deadline: d,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      );
      localStorage.setItem(
        "learnv2_college_checklist_v1",
        JSON.stringify({ completed: {}, customItems: [] }),
      );
    }, deadlineStr);
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Open Test U package/i })).toBeVisible();
  });

  test("Draft 3 retest nudge on SAT hub after Draft 1 complete", async ({ page }) => {
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
  });
});
