import { expect, test } from "@playwright/test";
import { concept, margin, open } from "./helpers";

const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();

test("Gauss applications and point-form ideas open at depth", async ({ page }) => {
  for (const [c, block, title, label] of [
    ["em1.electrostatics.gauss-applications", "idea-charge-density", "Along a line: Q = ∫ρL dl", "Idea 1 · Charge from a density · Explanation 1 of 4"],
    ["em1.electrostatics.gauss-applications", "idea-patch-flux", "A share of the whole", "Idea 2 · Flux through part of a surface · Explanation 1 of 4"],
    ["em1.electrostatics.gauss-applications", "idea-spheres", "Inside a charged ball", "Idea 3 · Spheres of charge: D and Q inside and outside · Explanation 1 of 4"],
    ["em1.electrostatics.divergence", "idea-point-form", "Gauss's law, one point at a time", "Idea 1 · ∇·D = ρv, point by point · Explanation 1 of 4"],
    ["em1.electrostatics.divergence", "idea-div-theorem", "Two routes to the same charge", "Idea 2 · The divergence theorem with D · Explanation 1 of 4"],
  ] as const) {
    await test.step(`${c} / ${block}`, async () => {
      await open(page, concept(c, `mode=learn&lesson=main&block=${block}`));
      await margin(page, title);
      await expect(kicker(page)).toHaveText(label);
    });
  }
});

test("Gauss applications Jacobian example shows its exact charge readout", async ({ page }) => {
  await open(page, concept("em1.electrostatics.gauss-applications", "mode=learn&lesson=main&block=idea-charge-density&step=3"));
  await expect(page.locator(".readouts")).toContainText("829.7");
});
