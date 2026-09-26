import { expect, test } from "@playwright/test";
import { concept, margin, open } from "./helpers";

const V = "em1.math.vectors";
test("toolkit plates render with their readouts", async ({ page }) => {
  await open(page, concept(V, "mode=learn&lesson=toolkit-preview"));
  await margin(page, "Gradient");
  await expect(page.locator(".readouts")).toContainText("11");
  for (const [step, text] of [[1, "3"], [2, "2"], [4, "Microwave"], [5, "0.007112"]] as const) {
    await open(page, concept(V, `mode=learn&lesson=toolkit-preview&step=${step}`));
    await expect(page.locator(step === 4 ? ".plate-svg" : ".readouts").first()).toContainText(text);
  }
});
