import { describe, expect, it } from "vitest";
import { contrast, mix } from "../src/contrast";
import { SEMANTIC, textColours, themeCss, THEMES } from "../src/tokens";

describe("contrast", () => {
  it("matches WCAG reference values", () => {
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });
  it("mixes hex colours", () => {
    expect(mix("#000000", "#FFFFFF", 0.5)).toBe("#808080");
  });
});

describe.each(Object.entries(THEMES))("%s theme", (_, p) => {
  const grounds = [p.paper, p.paper2];
  it("ink reads at 7:1 and graphite at 4.5:1", () => {
    for (const g of grounds) {
      expect(contrast(p.ink, g)).toBeGreaterThanOrEqual(7);
      expect(contrast(p.graphite, g)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("semantic strokes reach 3:1 (WCAG 1.4.11) and their text variants 4.5:1", () => {
    const t = textColours(p);
    for (const k of SEMANTIC)
      for (const g of grounds) {
        expect(contrast(p[k], g), k).toBeGreaterThanOrEqual(3);
        expect(contrast(t[k], g), `${k}-text`).toBeGreaterThanOrEqual(4.5);
      }
  });
  it("the focus ring reaches 3:1", () => {
    for (const g of grounds) expect(contrast(p.focus, g)).toBeGreaterThanOrEqual(3);
  });
});

it("themeCss emits every theme, semantic text variants and legacy aliases", () => {
  const css = themeCss();
  for (const t of Object.keys(THEMES)) expect(css).toContain(`[data-theme="${t}"]`);
  expect(css).toContain("--charge-text:");
  expect(css).toContain("--sem-flux:var(--flux)");
});
