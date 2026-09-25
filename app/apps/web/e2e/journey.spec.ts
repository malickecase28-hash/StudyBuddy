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

/** Spec §8 journey: diagnostic → route → lesson → wrong answers → detour → return → challenge → dashboard → notebook restore. */
test("full learning journey", async ({ page }) => {
  page.on("console", (m) => m.type() === "error" && console.log("[console]", m.text().slice(0, 300)));
  page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 300)));
  page.on("framenavigated", (f) => f === page.mainFrame() && console.log("[nav]", f.url()));
  await page.goto("/");
  await expect(page.getByText("Electromagnetics I, built to be understood")).toBeVisible();

  // Readiness diagnostic with a probe after a miss.
  await page.getByRole("link", { name: "Start the readiness check" }).click();
  const picks = ["4", "The angle around", "(0, 0, 2)", "2", "a² sin θ dθ dφ", "¼ as large", "0"];
  for (const p of picks) {
    await main(page).getByRole("button", { name: p, exact: false }).first().click();
    await main(page).getByRole("button", { name: "Next →" }).click();
  }
  await expect(page.getByText("Here's your route.")).toBeVisible();
  await expect(page.getByText("Worth refreshing first")).toBeVisible();
  await page.getByRole("button", { name: "Save and go home" }).click();
  await expect(page.getByText("refresher").first()).toBeVisible();

  // Main Gauss lesson.
  await page.goto("/learn/em1.electrostatics.gauss-law/main");
  await cont(page).click();
  await choose(page, /Still exactly \+Q/);
  await expect(page.getByText("Always $+Q$", { exact: false }).or(page.getByText("Always +Q", { exact: false }))).toBeVisible();
  for (let i = 0; i < 4; i++) await cont(page).click(); // field lab, D prose, surface prose, surface lab
  await expect(page.getByText(/Ψ = ∮ D·dS = 2\.00 µC/).first()).toBeVisible();
  await cont(page).click();
  await choose(page, /Along D, whichever way/); // SURFACE_NORMAL_DIRECTION #1
  await expect(page.getByText("Take another look.").last()).toBeVisible();
  await expect(cont(page)).toBeDisabled();
  await choose(page, /Always outward/);
  await cont(page).click();
  await choose(page, /Quadruples/);
  await cont(page).click();

  // Manipulate: resize the sphere with the keyboard and watch Ψ stay put.
  const thumb = main(page).getByRole("slider").last();
  await thumb.focus();
  for (let i = 0; i < 60; i++) await thumb.press("ArrowRight");
  await expect(page.getByText("There it is: you've seen it for yourself.")).toBeVisible();
  await expect(page.getByText(/Ψ = ∮ D·dS = 2\.00 µC/).last()).toBeVisible();

  // Equation build, statement, branch.
  await cont(page).click();
  for (let i = 0; i < 3; i++) await main(page).getByRole("button", { name: "Next term →" }).click();
  await main(page).getByRole("button", { name: "Save to notebook" }).click();
  await cont(page).click();
  await cont(page).click();
  await cont(page).click(); // past branch (optional)

  // Outside-charge mcq wrong → still gated; then numeric with the same misconception family.
  await choose(page, "7 µC");
  await choose(page, "2 µC");
  await choose(page, /The outside charge's flux lines/);
  await cont(page).click();
  await answer(page, "4 nC");
  await expect(page.getByText("Off by a factor of 10^-3")).toBeVisible();
  await answer(page, "4 µC");
  await cont(page).click();
  await choose(page, /\+3 µC/); // SURFACE_NORMAL_DIRECTION #2 → detour offer
  await expect(page.getByText("Same sticking point twice")).toBeVisible();

  // Detour and come back to the same block.
  await page.getByRole("link", { name: "Take the detour" }).click();
  await expect(page.getByRole("heading", { name: "Detour: which way dS points" })).toBeVisible();
  await cont(page).click();
  await cont(page).click();
  await choose(page, "Negative");
  await cont(page).click();
  await main(page).getByRole("button", { name: "Finish lesson" }).click();
  await page.getByRole("link", { name: "← Back to where you were" }).click();
  await expect(page).toHaveURL(/resume=mcq-negative/);
  await choose(page, /−3 µC/);

  // Mastery challenge: first-try solve offers skip-ahead.
  await page.goto("/learn/em1.electrostatics.gauss-applications/challenge");
  await answer(page, "-2 µC");
  await expect(page.getByText("First-try solve.")).toBeVisible();

  // Dashboard reflects the recurring misconception.
  await page.goto("/dashboard");
  await expect(page.getByText(/Lets dS follow D instead of pointing outward|Uses a normal that isn't outward/)).toBeVisible();

  // Notebook: the saved equation is there.
  await page.goto("/notebook");
  await expect(page.getByText("Faraday's result: the total equals the charge enclosed.")).toBeVisible();
});

test("return experience after time away", async ({ page }) => {
  await page.goto("/learn/em1.electrostatics.gauss-law/main");
  await cont(page).click();
  await choose(page, /Still exactly \+Q/);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Days to skip ahead").fill("5");
  await page.keyboard.press("Escape");
  await page.goto("/");
  await expect(page.getByText("It's been 5 days.")).toBeVisible();
  await expect(page.getByText(/Recall ·/i).first()).toBeVisible();
});

test("no serious accessibility violations on key screens", async ({ page }) => {
  for (const path of ["/", "/diagnostic", "/learn/em1.electrostatics.gauss-law/main", "/dashboard", "/past-papers"]) {
    await page.goto(path);
    await page.waitForTimeout(800);
    const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${path}: ${v.id} (${v.nodes.length})`)).toEqual([]);
  }
});

test("@perf lab stays usable on a 4x throttled CPU with low-power quality", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("/learn/em1.electrostatics.gauss-law/main");
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
