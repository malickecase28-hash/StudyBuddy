import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const main = (page: Page) => page.locator("main");
const cont = (page: Page) => main(page).getByRole("button", { name: /Continue ↓/ });
const choose = (page: Page, text: string | RegExp) =>
  main(page).getByRole("button", typeof text === "string" ? { name: text, exact: true } : { name: text }).last().click();
const answer = async (page: Page, value: string) => {
  const input = main(page).getByLabel("Your answer, with units").last();
  await input.fill(value);
  await main(page).getByRole("button", { name: "Check" }).last().click();
};

test("return experience after time away", async ({ page }) => {
  await page.goto("/learn/em1.electrostatics.gauss-law/main-classic");
  await cont(page).click();
  await choose(page, /Still exactly \+Q/);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Days to skip ahead").fill("5");
  await page.keyboard.press("Escape");
  await page.goto("/");
  await expect(page.getByText("It's been 5 days.")).toBeVisible();
  await expect(page.getByText(/Recall ·/i).first()).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByText("It's been 5 days.")).toHaveCount(0);
});

test("@perf lab stays usable on a 4x throttled CPU with low-power quality", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("/learn/em1.electrostatics.gauss-law/main-classic");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Low-power" }).click();
  await page.keyboard.press("Escape");
  await cont(page).click();
  await choose(page, /Still exactly \+Q/);
  for (let i = 0; i < 4; i++) await cont(page).click();
  const start = Date.now();
  await expect(page.getByText(/Ψ = ∮ D·dS = 2\.00 µC/).first()).toBeVisible({ timeout: 20_000 });
  expect(Date.now() - start).toBeLessThan(20_000);
});

test("workbench changes the physics and working paper keeps what you wrote", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.getByText(/Ψ = ∮ D·dS = 1\.00 µC/)).toBeVisible();
  await page.getByRole("slider", { name: "Q1" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText(/Ψ = ∮ D·dS = 1\.50 µC/)).toBeVisible();

  // Working paper is Ink now: it saves as you write, so a reopened page still has the working.
  await page.goto("/paper?concept=em1.electrostatics.gauss-law");
  await expect(page).toHaveURL(/\/ink\//);
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.getByRole("img", { name: /Gauss's Law/ }).click({ position: { x: 120, y: 120 } });
  await page.getByLabel("Text").fill("Flux follows enclosed charge.");
  await page.getByLabel("Text").press("Control+Enter");
  await page.waitForTimeout(600); // item rows are written 400 ms after the last change
  await page.goto("/paper?concept=em1.electrostatics.gauss-law");
  await expect(page).toHaveURL(/\/ink\//);
  await expect.poll(() => page.evaluate(() => [...(window as unknown as { __ink: { items: Map<string, { kind: string; text?: string }> } }).__ink.items.values()]
    .some((i) => i.kind === "text" && i.text === "Flux follows enclosed charge."))).toBe(true);
});

test("working paper opens in Ink with its tools, and nothing reads NaN", async ({ page }) => {
  await page.goto("/paper?concept=em1.electrostatics.gauss-law");
  await expect(page.getByRole("toolbar", { name: "Ink tools" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Colour charge" })).toBeVisible();
  await expect(page.getByText(/NaN/)).toHaveCount(0);
});

test("the classic lab's radius slider thumb follows its value", async ({ page }) => {
  await page.goto("/lab");
  const thumb = page.locator("[data-scope=slider][data-part=thumb]").first();
  await expect(thumb).toBeVisible();
  await thumb.focus();
  await page.keyboard.press("End");
  const right = (await thumb.boundingBox())!.x;
  await page.keyboard.press("Home");
  const left = (await thumb.boundingBox())!.x;
  expect(right - left).toBeGreaterThan(60);
});
