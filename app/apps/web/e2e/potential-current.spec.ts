import { expect, test } from "@playwright/test";
import { concept, margin, open } from "./helpers";

const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();

test("potential and current ideas open at depth", async ({ page }) => {
  for (const [c, block, title, label] of [
    ["em1.electrostatics.potential", "idea-work", "The work we do", "Idea 1 · Work and potential difference · Explanation 1 of 4"],
    ["em1.electrostatics.potential", "idea-v-point", "V = Q/(4πε₀R)", "Idea 2 · The potential of point charges · Explanation 1 of 4"],
    ["em1.electrostatics.potential", "idea-grad-v", "The field points downhill", "Idea 3 · E = −∇V, and D from V · Explanation 1 of 4"],
    ["em1.electrostatics.potential", "idea-energy", "Moving a charge: W = QΔV", "Idea 4 · Energy: moving charges and systems of charges · Explanation 1 of 4"],
    ["em1.electrostatics.current", "idea-ohm", "Current density: amps per square metre", "Idea 1 · Current density and Ohm's law in point form · Explanation 1 of 4"],
    ["em1.electrostatics.current", "idea-continuity", "Charge can't vanish", "Idea 2 · The continuity equation · Explanation 1 of 3"],
  ] as const) {
    await open(page, concept(c, `mode=learn&lesson=main&block=${block}`));
    await margin(page, title);
    await expect(kicker(page)).toHaveText(label);
  }
});

test("lecture 2b Example 4 shows its work readout", async ({ page }) => {
  await open(page, concept("em1.electrostatics.potential", "mode=learn&lesson=main&block=idea-work&step=0"));
  await expect(page.locator(".readouts")).toContainText(/[-−]0\.96/);
});
