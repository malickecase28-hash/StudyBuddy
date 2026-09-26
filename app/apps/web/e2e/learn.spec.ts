import { expect, test } from "@playwright/test";
import { choose, concept, G, margin, next, open } from "./helpers";

test("learn: Faraday hook and the six-step Gauss plate, keyboard-first", async ({ page }) => {
  await open(page, concept(G, "mode=learn"));
  await margin(page, "One charge, four materials");
  await choose(page, "Exactly +Q");
  await next(page);
  await margin(page, "Always +Q");
  await page.getByRole("button", { name: /Continue: Electric flux/ }).click();

  await margin(page, "§1 Charge");
  await next(page);
  await margin(page, "§2 Field");
  await next(page);
  await margin(page, "§3 Surface");
  await next(page); // locked until §3 is answered
  await margin(page, "§3 Surface");
  await choose(page, "Always outward");
  await next(page);

  await margin(page, "§4 Flux");
  await expect(page.getByText("Ψ, flux out")).toHaveCount(0); // hidden until the prediction is committed
  await page.getByRole("slider", { name: "Your prediction, in µC" }).fill("2");
  await page.getByRole("button", { name: "Commit prediction" }).click();
  await expect(page.getByText(/Unchanged\. Area ×4, D ÷4/)).toBeVisible();
  await next(page);

  await margin(page, "§5 The law");
  const q2 = page.getByRole("button", { name: /\+3 µC charge/ });
  await q2.focus();
  for (let i = 0; i < 13; i++) await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Done. Look at the readouts.")).toBeVisible();
  await next(page);

  await margin(page, "§6 Prove it");
  await page.getByRole("textbox", { name: "Your answer, with units" }).fill("4 µC");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("✓ Understood.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Practise in Solve mode →" })).toBeVisible();
});

test("learn: two wrong normals open the detour, which returns to the same step", async ({ page }) => {
  await open(page, concept(G, "mode=learn&lesson=main&block=gauss&step=2"));
  await margin(page, "§3 Surface");
  await choose(page, "Along D, whichever way D points");
  await choose(page, "Inward, toward the charge");
  await page.getByRole("link", { name: "Take the detour" }).click();
  await expect(page).toHaveURL(/lesson=normal-direction/);
  await margin(page, "A negative charge");
  await next(page);
  await choose(page, "Negative");
  await page.getByRole("link", { name: "Back to where you were →" }).click();
  await expect(page).toHaveURL(/lesson=main.*step=2/);
  await margin(page, "§3 Surface");
});

test("pre-rendered pages ship the shell, so first paint is not blank", async ({ request }) => {
  for (const url of ["/", `/c/em1/${G}?mode=learn`]) {
    const html = await (await request.get(url)).text();
    expect(html, url).toContain("Skip to content");
    expect(html, url).toContain("Forma: go to your desk");
  }
});

test("a restored snapshot keeps later steps live", async ({ page }) => {
  await open(page, concept(G, "mode=learn&lesson=main&block=gauss&step=4"));
  await margin(page, "§3 Surface"); // locked: §3 and §4 must be answered first
  await choose(page, "Always outward");
  await next(page);
  await page.getByRole("button", { name: "Commit prediction" }).click();
  await next(page);
  await margin(page, "§5 The law");
  const q2 = page.getByRole("button", { name: /\+3 µC charge/ });
  await q2.focus();
  for (let i = 0; i < 13; i++) await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Done. Look at the readouts.")).toBeVisible();
  await page.getByRole("button", { name: "Save this setup to the notebook" }).click();
  await expect(page.getByText("Saved to your notebook.")).toBeVisible();
  await open(page, "/notebook");
  await page.keyboard.press("n");
  await page.getByRole("link", { name: "Restore this setup" }).first().click();
  await margin(page, "§5 The law");
  await next(page);
  await margin(page, "§6 Prove it");
  await expect(page.getByRole("img", { name: "Closed cube Gaussian surface" })).toBeVisible();
});
