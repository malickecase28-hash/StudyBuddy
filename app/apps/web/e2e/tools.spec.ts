import { expect, test } from "@playwright/test";
import { choose, concept, G, margin, next, open } from "./helpers";

test("a tool opens as a wide split without remounting the lesson, expands, and closes", async ({ page }) => {
  await open(page, concept(G, "mode=learn&lesson=main&block=gauss&step=2"));
  await margin(page, "§3 Surface");
  await choose(page, "Always outward");
  await next(page);
  await page.getByRole("slider", { name: "Your prediction, in µC" }).fill("2");
  await page.getByRole("button", { name: "Commit prediction" }).click();
  await expect(page.getByText("Measured")).toBeVisible();

  await page.getByRole("button", { name: "Working paper" }).click();
  const pane = page.getByRole("complementary", { name: "Tool: Working paper" });
  await expect(pane).toBeVisible();
  const vw = page.viewportSize()!.width;
  const box = (await pane.boundingBox())!;
  expect(box.width).toBeGreaterThan(vw * 0.35);
  expect(box.x + box.width).toBeLessThanOrEqual(vw + 1);
  await expect(page.getByText("Measured")).toBeVisible(); // lesson state survived

  await page.getByRole("button", { name: "Expand the tool" }).click();
  await expect(page.getByRole("complementary", { name: "Margin" })).toBeHidden();
  await page.getByRole("button", { name: "Show the page again" }).click();
  await page.getByRole("button", { name: "Close Working paper" }).click();
  await expect(pane).toHaveCount(0);
  await expect(page.getByText("Measured")).toBeVisible();
});

test("Solve opens with working paper pinned beside the problem; closing unpins it", async ({ page }) => {
  await open(page, concept("em1.electrostatics.gauss-applications", "mode=solve"));
  await expect(page.getByRole("complementary", { name: "Tool: Working paper" })).toBeVisible();
  await page.getByRole("button", { name: "Close Working paper" }).click();
  await page.waitForTimeout(400); // learner state saves on a 250 ms debounce
  await page.reload();
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("complementary", { name: "Tool: Working paper" })).toHaveCount(0);
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("a tool is a full-screen sheet you can close from the keyboard", async ({ page }) => {
    await open(page, concept(G, "mode=learn"));
    await page.getByRole("button", { name: "Formula sheet" }).click();
    const pane = page.getByRole("complementary", { name: "Tool: Formula sheet" });
    const box = (await pane.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(385);
    await page.getByRole("button", { name: "Close Formula sheet" }).focus();
    await page.keyboard.press("Enter");
    await expect(pane).toHaveCount(0);
  });
});
