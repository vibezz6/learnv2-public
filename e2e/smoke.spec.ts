import { test, expect } from "@playwright/test";

test.describe("Learn v2 smoke", () => {
  test("Today dashboard loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
    await expect(page.getByText("Track, deadlines, and SAT follow-ups")).toBeVisible();
  });

  test("Stats page loads", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.getByRole("heading", { name: "Stats" })).toBeVisible();
    const empty = page.getByText("Start your journey");
    const active = page.getByText("At a glance");
    await expect(empty.or(active)).toBeVisible();
  });
});
