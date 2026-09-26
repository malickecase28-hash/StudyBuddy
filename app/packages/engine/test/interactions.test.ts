import { describe, expect, it } from "vitest";
import { Block, Interaction, pickRoute, type Route } from "../src";

const meta = { mood: "vivid", source: { doc: "d", locator: "p" }, licence: "original" } as const;

describe("plate block + interactions", () => {
  it("parses a plate block", () => {
    expect(Block.parse({ ...meta, id: "gauss", type: "plate", plateId: "gauss" }).type).toBe("plate");
  });
  it("parses a predict-drag with a reveal patch and fills defaults", () => {
    const i = Interaction.parse({
      id: "flux-guess",
      type: "predict-drag",
      prompt: "Drag Ψ to your prediction",
      target: { instance: "surface", readout: "flux" },
      range: [0, 10],
      unit: "µC",
      reveal: { surface: { size: 2 } },
      dimension: "conceptual",
      feedback: { close: "Yes: unchanged.", far: "Area grows, D falls: they cancel." },
      tag: "FLUX_SCALES_WITH_AREA",
    });
    expect(i.type === "predict-drag" && i.relTol).toBe(0.05);
    expect(i.routes).toEqual([]);
  });
  it("rejects an unknown interaction type", () => {
    expect(Interaction.safeParse({ id: "x", type: "dance", dimension: "conceptual" }).success).toBe(false);
  });
});

describe("pickRoute", () => {
  const routes: Route[] = [
    { when: { outcome: "incorrect", tag: "FLUX_SCALES_WITH_AREA", attemptGte: 2 }, goto: { lessonRef: "em1.x.y/why-area" } },
    { when: { outcome: "incorrect", masteryBelow: { conceptId: "em1.math.s", value: 0.3 } }, goto: { lessonRef: "em1.math.s/main" }, say: "Refresh surface integrals first." },
    { when: { outcome: "correct", attemptGte: 1 }, goto: { step: "s5" } },
  ];
  const base = { tags: {}, mastery: () => 0.9 };
  it("routes by outcome, tag and attempt; first match wins", () => {
    expect(pickRoute(routes, { ...base, outcome: "incorrect", tag: "FLUX_SCALES_WITH_AREA", attempt: 2 })?.goto.lessonRef).toBe("em1.x.y/why-area");
    expect(pickRoute(routes, { ...base, outcome: "incorrect", tag: "FLUX_SCALES_WITH_AREA", attempt: 1 })).toBeNull();
    expect(pickRoute(routes, { ...base, outcome: "correct", attempt: 1 })?.goto.step).toBe("s5");
  });
  it("routes on prerequisite mastery", () => {
    const r = pickRoute(routes, { tags: {}, mastery: (id) => (id === "em1.math.s" ? 0.1 : 1), outcome: "incorrect", attempt: 1 });
    expect(r?.say).toMatch(/surface integrals/);
  });
});
