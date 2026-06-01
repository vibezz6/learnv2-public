import { test, expect } from "@playwright/test";

test.describe("B99–O study intent closure", () => {
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

  test("picker sets college intent and week plan shows college focus row", async ({ page }) => {
    const farDeadline = new Date();
    farDeadline.setUTCDate(farDeadline.getUTCDate() + 10);
    const deadlineIso = farDeadline.toISOString().slice(0, 10);

    await page.addInitScript((deadline: string) => {
      localStorage.setItem(
        "learnv2_colleges_v1",
        JSON.stringify({
          colleges: [
            {
              id: "c-far",
              name: "Far U",
              slug: "far-u",
              deadline,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      );
    }, deadlineIso);
    await page.goto("/");
    await page.getByRole("button", { name: "College deadlines" }).click();
    await expect(page.getByText(/Today’s plan favors checklist and essay deadlines/i)).toBeVisible();
    await expect(page.getByText(/College focus today/i)).toBeVisible();
  });

  test("catch-up intent shows continue lesson row in week plan", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_progress",
        JSON.stringify({
          state: {
            data: {
              nodes: {
                st1: {
                  startedAt: Date.now(),
                  completedAt: null,
                  timeSpentMinutes: 5,
                  quizScores: [],
                  quizHistory: [],
                },
              },
            },
          },
          version: 0,
        }),
      );
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Catch up" }).click();
    await expect(page.getByText(/Today’s plan favors finishing in-progress lessons/i)).toBeVisible();
    await expect(page.getByText(/Catch up today/i)).toBeVisible();
    await expect(page.getByText(/Continue/i)).toBeVisible();
  });

  test("command palette Focus today SAT updates subtitle", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Quick open" }).click();
    const input = page.getByPlaceholder(/Quick open/i);
    await input.fill("Focus today: SAT");
    await page.keyboard.press("Enter");
    await expect(page.getByText(/Today’s plan favors SAT prep/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "SAT focus", pressed: true })).toBeVisible();
  });
});
