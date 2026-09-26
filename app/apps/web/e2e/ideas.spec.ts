import { expect, test } from "@playwright/test";
import { choose, concept, G, margin, next, open } from "./helpers";

const url = concept(G, "mode=learn&lesson=main&block=flux-surface");
const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();

test("an idea teaches, works examples line by line, answers asks, gates checks, and saves a recap", async ({ page }) => {
  await open(page, url);
  await margin(page, "A steady stream of D");
  await expect(kicker(page)).toHaveText("Idea 2 · Flux through a surface · Explanation 1 of 7");
  for (let k = 0; k < 7; k++) await next(page);
  await margin(page, "A 2 m square at 60°");
  await next(page);
  await next(page);
  await expect(kicker(page)).toHaveText("Idea 2 · Flux through a surface · Worked example 1 of 3 · line 2");
  await next(page);
  await expect(page.getByRole("note")).toContainText("about 1.7 times too big");

  // An ask previews its own plate state and then returns to the step.
  await page.getByText("Questions students ask (8)").click();
  await page.getByRole("button", { name: "Can flux be negative?" }).click();
  await expect(page.getByText("dΨ through the patch")).toBeVisible();
  await expect(page.locator(".readouts")).toContainText("-2.598");
  await page.getByRole("button", { name: "Back to the step" }).click();
  await expect(page.locator(".readouts")).toContainText("6");

  // Walk through the remaining worked examples to the first check.
  for (let k = 0; k < 11; k++) await next(page);
  await margin(page, "Check: edge-on");
  await next(page); // locked
  await margin(page, "Check: edge-on");
  await choose(page, "Negative");
  await choose(page, "The largest it can be");
  await expect(page.getByRole("button", { name: "worked example 1" })).toBeVisible(); // remediation after two misses
  await next(page);
  await margin(page, "Check: edge-on"); // still locked: checks need a correct answer
  await choose(page, "Zero");
  await next(page);

  await margin(page, "Check: predict the tilt");
  await page.getByRole("slider", { name: "Your prediction, in µC" }).fill("8.47"); // on the 0.07 step grid
  await page.getByRole("button", { name: "Commit prediction" }).click();
  await next(page);

  await margin(page, "Check: tilt to a target");
  const tilt = page.getByRole("slider", { name: /Patch tilt/ });
  await tilt.focus();
  for (let k = 0; k < 31; k++) await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Done. Look at the readouts.")).toBeVisible();
  // An ask shows its own plate state even with the learner's edits in place, then gives the edits back untouched.
  await page.getByText("Questions students ask (8)").click();
  await page.getByRole("button", { name: "Can flux be negative?" }).click();
  await expect(page.locator(".readouts")).toContainText("-2.598");
  await page.getByRole("button", { name: "Back to the step" }).click();
  await expect(page.locator(".readouts")).toContainText("3.005"); // 12 cos 75.5° = 3.0046
  await next(page);

  await margin(page, "Check: your own numbers");
  const answerBox = page.getByRole("textbox", { name: "Your answer, with units" });
  await answerBox.fill("1 µC");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await answerBox.fill("2 µC");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByRole("region", { name: "Worked example with new numbers" })).toBeVisible();
  await page.getByRole("button", { name: "Try a new one" }).click();
  const prompt = (await page.getByText(/A flat .* rectangle sits in a uniform field/).textContent())!;
  const [, a, b, D, th] = prompt.match(/flat ([\d.]+) m × ([\d.]+) m rectangle .* D = ([\d.]+) µC\/m², with its normal at ([\d.]+)°/)!;
  const psi = Math.round(Number(D) * Number(a) * Number(b) * Math.cos((Number(th) * Math.PI) / 180) * 1e4) / 1e4;
  await answerBox.fill(`${psi} µC`);
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("✓ Understood.")).toBeVisible();
  await next(page);

  await margin(page, "Check: flip the normal");
  await choose(page, "Flips sign, same size");
  await next(page);
  await margin(page, "Recap · Flux through a surface");
  await expect(page.getByRole("region", { name: "Recap: Flux through a surface" })).toBeVisible();

  await page.reload();
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15_000 });
  await page.goto("/notebook");
  await expect(page.getByText("Recap · Flux through a surface")).toHaveCount(1);
  await page.goto(`/c/em1/${G}/sheet`);
  await expect(page.getByRole("region", { name: "Recap: Flux through a surface" })).toBeVisible();
});

test("⌘K finds a question students ask and opens it on its plate", async ({ page }) => {
  await open(page, "/");
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("negative flux");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/ask=negative/);
  await expect(page.getByRole("region", { name: "Can flux be negative?" })).toBeVisible();
});

test("a long lesson's scrub bar shows marks, not one tick per step", async ({ page }) => {
  await open(page, url);
  const ticks = page.locator(".timeline-ticks button");
  expect(await ticks.count()).toBeLessThan(12);
  await expect(page.locator(".timeline-ticks")).toContainText("Example 1");
});

test("an ask previews instances hidden at the current step", async ({ page }) => {
  await open(page, url);
  await margin(page, "A steady stream of D");
  await page.getByText("Questions students ask (8)").click();
  await page.getByRole("button", { name: "What if the patch is curved?" }).click();
  await expect(page.locator('[data-instance="tiles"]')).toHaveAttribute("opacity", "1");
  await expect(page.locator('[data-instance="field"]')).toHaveCount(0);
});

test("⌘K opens a question from inside its own lesson", async ({ page }) => {
  await open(page, url);
  await margin(page, "A steady stream of D");
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("negative flux");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Can flux be negative?" })).toBeVisible();
});
