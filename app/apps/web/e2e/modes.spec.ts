import { expect, test } from "@playwright/test";
import { concept, G, margin, next, open } from "./helpers";

test("solve: a templated variant grades, and a new variant replaces it", async ({ page }) => {
  await open(page, concept("em1.electrostatics.gauss-applications", "mode=solve"));
  await page.getByRole("radio", { name: "Flux out of a cube" }).click();
  await expect(page.getByText("Variant 1")).toBeVisible();
  const prompt = await page.getByText(/Find the total flux leaving the cube/).textContent();
  const [, a, b] = prompt!.match(/charges ([\d.]+) µC at .* and ([\d.]+) µC at/)!;
  const sum = Math.round((Number(a) + Number(b)) * 1e4) / 1e4;
  await page.getByRole("textbox", { name: "Your answer, with units" }).fill(`${sum} µC`);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("✓ Understood.")).toBeVisible();
  await page.getByRole("button", { name: "New variant" }).click();
  await expect(page.getByText("Variant 2")).toBeVisible();
});

test("explore: moving the instruments completes experiment cards", async ({ page }) => {
  await open(page, concept(G, "mode=explore"));
  await page.getByRole("slider", { name: "Surface size" }).fill("2.2");
  await expect(page.locator(".experiment", { hasText: "Resize it" })).toContainText("✓ Done");
  await page.getByRole("radio", { name: "Cube" }).click();
  await expect(page.locator(".experiment", { hasText: "Reshape it" })).toContainText("✓ Done");
});

test("revise: map, due reviews and exam view", async ({ page }) => {
  await open(page, concept(G, "mode=revise"));
  for (const h of ["Concept map", "Due reviews", "Exam view"]) await expect(page.getByRole("heading", { name: h })).toBeVisible();
});

test("⌘K palette and number keys switch concepts and modes", async ({ page }) => {
  await open(page, "/");
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("gauss sol");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/gauss-law\?mode=solve/);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("3");
  await expect(page).toHaveURL(/mode=explore/);
  await page.keyboard.press("p");
  await expect(page.getByRole("complementary", { name: "Tool: Ink" })).toBeVisible();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("a step change lands immediately, with no tween", async ({ page }) => {
    await open(page, concept(G, "mode=learn&lesson=why-area"));
    await margin(page, "r = 1 m");
    await next(page);
    await expect(page.getByRole("slider", { name: "Lesson timeline" })).toHaveValue("1", { timeout: 150 });
    await margin(page, "r = 1.8 m");
  });
});
test("@perf explore stays responsive on a 4× throttled CPU", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const tLoad = Date.now();
  await open(page, concept(G, "mode=explore"));
  console.log(`explore hydrated in ${Date.now() - tLoad} ms at 4x CPU`);
  const size = page.getByRole("slider", { name: "Surface size" });
  const t0 = Date.now();
  for (let i = 0; i < 20; i++) await size.fill(String(Number((0.5 + i * 0.05).toFixed(2)))); // values on the slider step grid
  await expect(page.getByText("Ψ, flux out")).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(4000); // < 200 ms per update, including the recompute
});
