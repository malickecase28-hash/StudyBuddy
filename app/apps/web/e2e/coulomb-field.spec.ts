import { expect, test } from "@playwright/test";
import { concept, margin, open } from "./helpers";

const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();

test("Coulomb and field ideas open at depth", async ({ page }) => {
  for (const [c, block, title, label] of [
    ["em1.electrostatics.coulomb", "idea-coulomb-law", "The law", "Idea 1 · Coulomb's law in vector form · Explanation 1 of 5"],
    ["em1.electrostatics.coulomb", "idea-superposition", "One charge at a time", "Idea 2 · Superposition of forces · Explanation 1 of 4"],
    ["em1.electrostatics.field", "idea-e-point", "Force per unit charge", "Idea 1 · E = F/q and the point-charge field · Explanation 1 of 4"],
    ["em1.electrostatics.field", "idea-e-superposition", "Fields add as vectors", "Idea 2 · Superposing fields · Explanation 1 of 3"],
    ["em1.electrostatics.field", "idea-e-continuous", "An infinite line charge", "Idea 3 · Fields of line and sheet charges · Explanation 1 of 4"],
  ] as const) {
    await open(page, concept(c, `mode=learn&lesson=main&block=${block}`));
    await margin(page, title);
    await expect(kicker(page)).toHaveText(label);
  }
});

test("MST Q2(b) worked example shows E_z ≈ −7.799×10¹³ V/m", async ({ page }) => {
  await open(page, concept("em1.electrostatics.field", "mode=learn&lesson=main&block=idea-e-superposition&step=14"));
  await expect(page.locator(".readouts")).toContainText("7.799");
});
