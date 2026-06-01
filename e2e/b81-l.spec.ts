import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

test.describe("B81–L critical paths", () => {
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

  test("import confirm requires checkbox before overwrite", async ({ page }) => {
    await page.goto("/settings");
    const exportPayload = JSON.stringify({
      version: 3,
      keys: {
        learnv2_sat_daily_quiz_v1: JSON.stringify({ date: "2099-01-01", score: 1, total: 5 }),
      },
    });
    const tmp = path.join(os.tmpdir(), `learnv2-e2e-import-${Date.now()}.json`);
    fs.writeFileSync(tmp, exportPayload);
    await page.getByRole("button", { name: "Import from file" }).click();
    await page.locator('input[type="file"]').last().setInputFiles(tmp);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/overwrite local data/i)).toBeVisible();
    const importBtn = dialog.getByRole("button", { name: "Import", exact: true });
    await expect(importBtn).toBeDisabled();
    await dialog.getByRole("checkbox").check();
    await expect(importBtn).toBeEnabled();
    fs.unlinkSync(tmp);
  });

  test("submitted package shows application submitted banner", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_colleges_v1",
        JSON.stringify({
          colleges: [
            {
              id: "c-sub",
              name: "Submit U",
              slug: "submit-u",
              submittedAt: "2026-01-15T12:00:00.000Z",
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
              templateId: null,
              title: "Why Submit",
              prompt: "",
              college: "Submit U",
              status: "draft",
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        }),
      );
      localStorage.setItem(
        "learnv2_college_checklist_v1",
        JSON.stringify({ completed: {}, customItems: [] }),
      );
    });
    await page.goto("/campus/application?college=Submit%20U");
    await expect(page.getByText("Application submitted")).toBeVisible();
    await expect(page.getByText(/Do this first/i)).toHaveCount(0);
  });

  test("drill cooldown shows on SAT hub", async ({ page }) => {
    const drilledAt = Date.now() - 60 * 60 * 1000;
    await page.addInitScript((ts: number) => {
      localStorage.setItem(
        "learnv2_sat_mistakes_v1",
        JSON.stringify([
          {
            id: "m1",
            date: "2026-06-01",
            section: "math",
            category: "Linear equations",
            skillId: "linear-equations",
            note: "",
            createdAt: ts,
            drilledAt: ts,
          },
        ]),
      );
    }, drilledAt);
    await page.goto("/subjects/sat-prep");
    await expect(page.getByText(/On cooldown/i).first()).toBeVisible();
  });

  test("good shape hero when Daily 5 done and minimum met", async ({ page }) => {
    await page.addInitScript(() => {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(
        "learnv2_sat_daily_quiz_v1",
        JSON.stringify({ date: today, score: 5, total: 5 }),
      );
      localStorage.setItem(
        "learnv2_activity_v1",
        JSON.stringify([
          {
            id: "act-1",
            type: "lesson_completed",
            date: today,
            at: Date.now(),
            nodeId: "st4",
          },
        ]),
      );
      localStorage.setItem("learnv2_sat_mistakes_v1", JSON.stringify([]));
    });
    await page.goto("/");
    await expect(page.getByText(/Pick your next focus/i)).toBeVisible({ timeout: 10_000 });
  });

  test("campus show archived toggle reveals archived school", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "learnv2_colleges_v1",
        JSON.stringify({
          colleges: [
            {
              id: "c-arch",
              name: "Archived U",
              slug: "archived-u",
              submittedAt: "2026-01-01T00:00:00.000Z",
              archived: true,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      );
    });
    await page.goto("/campus");
    await expect(page.getByText("Archived U")).toHaveCount(0);
    await page.getByText("Show archived").click();
    await expect(page.getByText("Archived U")).toBeVisible();
  });
});
