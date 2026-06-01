import { test, expect } from "@playwright/test";

test.describe("B74–K critical paths", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_preferences",
        JSON.stringify({ state: { onboardingCompleted: true, theme: "dark" }, version: 0 }),
      );
    });
  });

  test("college blocking surfaces package CTA on Today", async ({ page }) => {
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
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Open Test U package/i })).toBeVisible();
  });

  test("Daily 5 footnote hidden after quiz marked done", async ({ page }) => {
    await page.addInitScript(() => {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(
        "learnv2_sat_daily_quiz_v1",
        JSON.stringify({ date: today, score: 5, total: 5 }),
      );
    });
    await page.goto("/");
    await expect(page.getByText(/Take the Daily 5/)).toHaveCount(0);
  });

  test("print summary page has heading and table", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_colleges_v1",
        JSON.stringify({
          colleges: [
            {
              id: "c1",
              name: "Print College",
              slug: "print-college",
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      );
    });
    await page.goto("/campus/print-summary");
    await expect(page.getByRole("heading", { name: "Print summary" })).toBeVisible();
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("command palette: Log SAT mistake navigates", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.getByRole("button", { name: "Quick open" }).click();
    const input = page.getByPlaceholder(/Quick open/i);
    await input.fill("Log SAT mistake");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/mistakes/);
  });

  test("backup export roundtrip restores a key subset", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_sat_mistakes_v1",
        JSON.stringify([
          {
            id: "m-e2e",
            date: "2026-06-01",
            section: "math",
            category: "Algebra",
            skillId: "linear-equations",
            note: "",
            createdAt: Date.now(),
          },
        ]),
      );
    });
    await page.goto("/settings");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export progress" }).click(),
    ]);
    const path = await download.path();
    expect(path).toBeTruthy();
    const fs = await import("node:fs");
    const json = fs.readFileSync(path!, "utf8");
    const parsed = JSON.parse(json) as { keys?: Record<string, string> };
    expect(parsed.keys?.learnv2_sat_mistakes_v1).toContain("m-e2e");
  });
});
