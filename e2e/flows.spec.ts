import { test, expect } from "@playwright/test";

test.describe("Learn v2 core flows", () => {
  // Skip the first-run onboarding modal (it overlays the page and blocks clicks).
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_preferences",
        JSON.stringify({ state: { onboardingCompleted: true, theme: "dark" }, version: 0 }),
      );
    });
  });

  test("theme toggle changes the document theme", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const before = await html.getAttribute("data-theme");
    await page.getByRole("button", { name: /^Theme:/ }).click();
    await expect
      .poll(async () => html.getAttribute("data-theme"))
      .not.toBe(before);
  });

  test("start focus session shows the session bar; cancel restores", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Start focus session" }).click();
    await expect(page.getByRole("button", { name: /Finish & log/ })).toBeVisible();
    await page.getByRole("button", { name: /Cancel session/ }).click();
    await expect(page.getByRole("button", { name: /Finish & log/ })).toHaveCount(0);
  });

  test("Daily 5 page loads", async ({ page }) => {
    await page.goto("/sat/daily-quiz");
    await expect(page.getByRole("heading", { name: "Daily 5" })).toBeVisible();
  });

  test("settings: save daily goal and SAT date drives the countdown", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await page.locator('input[type="number"]').first().fill("45");
    await page.getByRole("button", { name: "Save goal" }).click();
    await page.locator('input[type="date"]').first().fill("2099-08-22");
    await expect(page.getByText(/days to SAT/).first()).toBeVisible();
  });

  test("export downloads a backup file", async ({ page }) => {
    await page.goto("/settings");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export progress" }).click(),
    ]);
    expect(download.suggestedFilename()).toContain("learnv2-backup");
  });

  test("command palette: opens via keyboard, traps focus, closes on Escape", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const input = page.getByPlaceholder(/Quick open/i);
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    // Options are tabIndex=-1, so Tab keeps focus on the input (trapped in the palette).
    await page.keyboard.press("Tab");
    await expect(input).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(input).toHaveCount(0);
  });
});
