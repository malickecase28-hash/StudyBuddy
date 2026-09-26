import { expect, test } from "@playwright/test";
import { concept, G, margin, next, open } from "./helpers";

test("the Desk continues to the exact plate step, and the countdown lives only there and in Revise", async ({ page }) => {
  await open(page, concept(G, "mode=learn&lesson=quick&block=gauss"));
  await margin(page, "§1 Charge");
  await next(page);
  await margin(page, "§2 Field");
  await expect(page.locator(".status-footer")).not.toContainText("Finals");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "§2 Field" })).toBeVisible();
  await expect(page.getByText(/Finals in \d+ days/)).toBeVisible();
  await expect(page.getByText("StudyBuddy")).toHaveCount(0);
  await page.getByRole("link", { name: "Continue →" }).click();
  await margin(page, "§2 Field");
  await page.goto(concept(G, "mode=revise"));
  await expect(page.getByText(/Finals in \d+ days/)).toBeVisible();
});

test("first run points at the readiness check", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Start with a 5-minute readiness check" })).toBeVisible();
});

test("the footer sits at the bottom of a short page, and a classic continue has no empty thumbnail", async ({ page }) => {
  await page.goto("/learn/em1.math.vectors/main");
  await expect(page.locator("main").getByRole("heading").first()).toBeVisible({ timeout: 15_000 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Continue →" })).toBeVisible();
  await expect(page.locator(".plate-thumb-empty")).toHaveCount(0);
  const vh = page.viewportSize()!.height;
  const f = (await page.locator(".status-footer").boundingBox())!;
  expect(f.y + f.height).toBeGreaterThan(vh - 4);
});
