import { expect, test } from "@playwright/test";
import { open } from "./helpers";

test("the question bank filters by assessment and never links to a missing lesson", async ({ page }) => {
  await open(page, "/questions");
  await expect(page.getByRole("heading", { level: 1, name: "Question bank" })).toBeVisible();
  const all = await page.locator("article").count();
  expect(all).toBeGreaterThanOrEqual(48);
  await page.getByRole("radio", { name: "Test 1" }).check();
  await expect(page.locator("#mst-2324-q1b")).toBeVisible();
  await expect(page.locator('[id="hw04-2425-4.2"]')).toHaveCount(0);
  await page.getByRole("radio", { name: "Final exam" }).check();
  await expect(page.locator('[id="hw04-2425-4.2"]')).toBeVisible();
  // The newly unlocked coax question can strengthen the Ampere lesson.
  const coax = page.locator("#f2425-q3a");
  await expect(coax.getByRole("link", { name: /Strengthen Biot–Savart and Ampère/ })).toHaveAttribute("href", "/c/em1/em1.magnetostatics.ampere?mode=learn&lesson=main");
  await expect(coax.getByText("Coming in a later build")).toHaveCount(0);
});
