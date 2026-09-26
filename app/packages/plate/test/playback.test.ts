import { describe, expect, it } from "vitest";
import { applyOverrides, frameAt, gradePrediction, hiddenReadouts, lockIndex, PlateDef, readAloudText, stateAt } from "../src";

const plate = PlateDef.parse({
  id: "p", title: "P",
  instances: [
    { id: "q", component: "charges", params: { items: [{ id: "q1", kind: "point", q: 2, pos: [0, 0, 0] }] } },
    { id: "s", component: "gaussian-surface", params: { size: 1 }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: "\\Psi", speech: "psi", shortSpeech: "psi" } },
  ],
  steps: [
    { id: "a", title: "A", show: ["q"], note: "A charge." },
    {
      id: "b", title: "B", show: ["s", "eq"], note: "Predict.",
      patch: { eq: { latex: "\\Psi=\\oint", speech: "psi equals the closed surface integral of D dot d S", shortSpeech: "flux" } },
      interaction: {
        id: "guess", type: "predict-drag", prompt: "p", target: { instance: "s", readout: "flux" }, range: [0, 10], unit: "µC",
        reveal: { s: { size: 2 } }, dimension: "conceptual", feedback: { close: "c", far: "f" },
      },
    },
    { id: "c", title: "C", patch: { q: { items: [{ id: "q1", kind: "point", q: 4, pos: [0, 0, 0] }] } }, note: "More.", narration: { transcript: "Now double the charge and watch." } },
  ],
});

describe("playback rules", () => {
  it("locks forward travel at the first unanswered interaction", () => {
    expect(lockIndex(plate, new Set())).toBe(1);
    expect(lockIndex(plate, new Set(["guess"]))).toBe(2);
  });
  it("grades predictions against a tolerance floored by the range", () => {
    expect(gradePrediction(2.05, 2, 0.05, [0, 10])).toBe("close");
    expect(gradePrediction(3, 2, 0.05, [0, 10])).toBe("far");
    expect(gradePrediction(0.04, 0, 0.05, [0, 10])).toBe("close");
  });
  it("overrides win at every timeline position and vanish when cleared", () => {
    const o = { q: { params: { items: [{ id: "q1", kind: "point", q: 9, pos: [0.5, 0, 0] }] } } };
    for (const pos of [1, 1.3, 1.7, 2]) expect((applyOverrides(frameAt(plate, pos).state, o).q!.params.items as { q: number }[])[0]!.q).toBe(9);
    expect(applyOverrides(stateAt(plate, 2), {})).toEqual(stateAt(plate, 2));
    expect(applyOverrides(stateAt(plate, 0), { ghost: { visible: true } })).toEqual(stateAt(plate, 0));
  });
  it("hides a predict-drag target until it is answered", () => {
    expect(hiddenReadouts(plate, 1, new Set())).toEqual([{ instance: "s", readout: "flux" }]);
    expect(hiddenReadouts(plate, 1, new Set(["guess"]))).toEqual([]);
    expect(hiddenReadouts(plate, 0, new Set())).toEqual([]);
  });
  it("reads the transcript or note, plus the speech of an equation this step introduces", () => {
    expect(readAloudText(plate, 0)).toBe("A charge.");
    expect(readAloudText(plate, 1)).toBe("Predict. psi equals the closed surface integral of D dot d S");
    expect(readAloudText(plate, 2)).toBe("Now double the charge and watch.");
  });
});
