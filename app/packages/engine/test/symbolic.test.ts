import { describe, expect, it } from "vitest";
import { checkExpression } from "../src";

describe("checkExpression", () => {
  it("accepts algebraically equivalent forms", () => {
    expect(checkExpression("\\frac{Q}{4\\pi r^{2}}", "\\frac{Q r^{-2}}{4\\pi}").equivalent).toBe(true);
    expect(checkExpression("\\frac{Q}{\\varepsilon_0}", "Q\\varepsilon_0^{-1}").equivalent).toBe(true);
    expect(checkExpression("D\\cdot 4\\pi r^2", "4\\pi r^2 D").equivalent).toBe(true);
    // ε₀/μ₀ parse as unit-bearing constants; braced and bare subscripts must both work.
    expect(checkExpression("\\frac{1}{\\mu_{0}\\varepsilon_{0}}", "\\varepsilon_0^{-1}\\mu_0^{-1}").equivalent).toBe(true);
  });
  it("rejects different expressions", () => {
    expect(checkExpression("\\frac{Q}{4\\pi r^{2}}", "\\frac{Q}{4\\pi r}").equivalent).toBe(false);
    expect(checkExpression("\\frac{Q}{\\varepsilon_0}", "Q\\varepsilon_0").equivalent).toBe(false);
  });
  it("reports unparseable input", () => {
    expect(checkExpression("Q", "\\frac{").parsed).toBe(false);
  });
});
