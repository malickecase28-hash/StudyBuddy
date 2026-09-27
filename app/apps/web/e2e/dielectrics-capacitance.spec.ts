import { expect, test } from "@playwright/test";
import { concept, margin, open } from "./helpers";

const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();

test("dielectric and capacitance ideas open at depth", async ({ page }) => {
  for (const [c, block, title, label] of [
    ["em1.electrostatics.dielectrics", "idea-polarization", "Why a material weakens E", "Idea 1 · Polarization and permittivity · Explanation 1 of 4"],
    ["em1.electrostatics.dielectrics", "idea-bc-tangential", "First, split D", "Idea 2 · Tangential E is continuous · Explanation 1 of 4"],
    ["em1.electrostatics.dielectrics", "idea-bc-normal", "A pillbox across the boundary", "Idea 3 · Normal D and surface charge · Explanation 1 of 5"],
    ["em1.electrostatics.dielectrics", "idea-refraction", "Field lines bend at the boundary", "Idea 4 · The refraction law · Explanation 1 of 4"],
    ["em1.electrostatics.dielectrics", "idea-conductor-bc", "E = 0 inside a conductor", "Idea 5 · Conductor boundaries · Explanation 1 of 4"],
    ["em1.electrostatics.capacitance", "idea-parallel-plate", "C = Q/V", "Idea 1 · Capacitance and the parallel-plate capacitor · Explanation 1 of 4"],
    ["em1.electrostatics.capacitance", "idea-cap-energy", "Charging costs work", "Idea 2 · Stored energy and energy density · Explanation 1 of 3"],
    ["em1.electrostatics.capacitance", "idea-coax-sphere", "A coaxial cable", "Idea 3 · Coaxial and spherical capacitors · Explanation 1 of 4"],
  ] as const) {
    await open(page, concept(c, `mode=learn&lesson=main&block=${block}`));
    await margin(page, title);
    await expect(kicker(page)).toHaveText(label);
  }
});

test("the refraction plate shows the Finals angle", async ({ page }) => {
  await open(page, concept("em1.electrostatics.dielectrics", "mode=learn&lesson=main&block=idea-refraction"));
  await expect(page.locator(".readouts")).toContainText("56.71");
});

test("the retired flux-density concept redirects to Gauss's law", async ({ page }) => {
  await page.goto("/c/em1/em1.electrostatics.flux-density");
  await expect(page).toHaveURL(/em1\.electrostatics\.gauss-law$/);
  await page.goto("/learn/em1.electrostatics.flux-density/main");
  await expect(page).toHaveURL(/em1\.electrostatics\.gauss-law\/flux-density$/);
});
