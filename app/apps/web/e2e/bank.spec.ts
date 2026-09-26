import { expect, test } from "@playwright/test";
import { open } from "./helpers";

test("the question bank filters by assessment and never links to a missing lesson", async ({ page }) => {
  await open(page, "/past-papers");
  await expect(page.getByRole("heading", { level: 1, name: "Question bank" })).toBeVisible();
  const all = await page.locator("article").count();
  expect(all).toBeGreaterThanOrEqual(48);
  await page.getByRole("radio", { name: "ICT 1" }).check();
  await expect(page.getByText("Mid-semester test 2023-24 · Q1(b)")).toBeVisible();
  await expect(page.getByText("HW04 2024-25 · 4.2")).toHaveCount(0);
  await page.getByRole("radio", { name: "Finals" }).check();
  await expect(page.getByText("HW04 2024-25 · 4.2")).toBeVisible();
  // A locked-only item shows no "Work this question" or "Strengthen" link.
  const coax = page.locator("article", { hasText: "UTech ELE3001 Finals 2024-25 Sem 1 · Q3(a)" });
  await expect(coax.getByRole("link", { name: /Work this question|Strengthen/ })).toHaveCount(0);
  await expect(coax.getByText("Coming in a later build")).toBeVisible();
});
