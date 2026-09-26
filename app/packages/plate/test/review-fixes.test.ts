import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, frameAt, PlateDef, Registry, stateAt, validatePlate } from "../src";

const registry = new Registry().register(...emComponents);
const mk = (instances: unknown[], steps: unknown[]) => PlateDef.parse({ id: "t", title: "t", instances, steps });
const q = (items: unknown[]) => ({ id: "q", component: "charges", params: { items }, visible: true });
const point = (qv: number, pos: number[], id = "a") => ({ id, kind: "point", q: qv, pos });
const evalAt = (p: PlateDef, i = 0) => createEvaluator(registry, p.instances)(stateAt(p, i));

describe("final review fixes", () => {
  it("a charge 0.5% outside the surface reads zero flux, not ½q", () => {
    const p = mk([q([point(2, [1.005, 0, 0])]), { id: "s", component: "gaussian-surface", params: { size: 1 }, links: { charges: "q" }, visible: true }], [{ id: "s1", title: "t", note: "n" }]);
    const f = evalAt(p);
    expect(f.s!.model.onSurface).toBe(false);
    expect(f.s!.model.flux).toBe(0);
  });

  it("mid-transition frames of an integer param still evaluate", () => {
    const p = mk(
      [q([point(2, [0, 0, 0])]), { id: "f", component: "field-arrows", params: { grid: 5 }, links: { charges: "q" }, visible: true }],
      [
        { id: "s1", title: "t", note: "n" },
        { id: "s2", title: "t", patch: { f: { grid: 8 } }, note: "n" },
      ],
    );
    expect(() => createEvaluator(registry, p.instances)(frameAt(p, 0.3).state)).not.toThrow();
  });

  it("probe readouts are null (not NaN) when a charge sits on the probe point or a sheet crosses it", () => {
    const f = evalAt(mk([q([point(2, [1, 0, 0])]), { id: "f", component: "field-arrows", params: { probe: 1 }, links: { charges: "q" }, visible: true }], [{ id: "s1", title: "t", note: "n" }]));
    expect(f.f!.model.probeD).toBeNull();
    expect(f.f!.model.probeE).toBeNull();
    const sheet = evalAt(mk([q([{ id: "sh", kind: "sheet", rhoS: 1, z0: 0 }]), { id: "f", component: "field-arrows", params: {}, links: { charges: "q" }, visible: true }], [{ id: "s1", title: "t", note: "n" }]));
    expect(sheet.f!.model.probeD).toBeNull();
  });

  it("field samples and profile points are all finite around line and point charges", () => {
    const p = mk(
      [
        q([{ id: "l", kind: "line", rhoL: 1, x: 0, y: 0 }, point(1, [1, 0, 0], "b")]),
        { id: "f", component: "field-arrows", params: {}, links: { charges: "q" }, visible: true },
        { id: "pr", component: "field-profile", params: { rMin: 0.5, rMax: 1.5, samples: 5 }, links: { charges: "q" }, visible: true },
      ],
      [{ id: "s1", title: "t", note: "n" }],
    );
    const f = evalAt(p);
    for (const s of f.f!.model.samples as { mag: number; dir: number[] }[]) expect([s.mag, ...s.dir].every(Number.isFinite)).toBe(true);
    for (const pt of f.pr!.model.points as { v: number }[]) expect(Number.isFinite(pt.v)).toBe(true);
  });

  it("line or sheet charges crossing a blob are rejected, not approximated", () => {
    const p = mk(
      [q([{ id: "l", kind: "line", rhoL: 1, x: 0.1, y: 0 }]), { id: "s", component: "gaussian-surface", params: { shape: "blob" }, links: { charges: "q" }, visible: true }],
      [{ id: "s1", title: "t", note: "n" }],
    );
    expect(validatePlate(registry, p).map((i) => i.message).join()).toMatch(/blob/);
  });

  it("validatePlate checks interaction targets, reveal patches, handles and cue targets", () => {
    const inst = [q([point(2, [0, 0, 0])]), { id: "s", component: "gaussian-surface", params: {}, links: { charges: "q" }, visible: true }];
    const step = (interaction: unknown, extra: Record<string, unknown> = {}) => mk(inst, [{ id: "s1", title: "t", note: "n", interaction, ...extra }]);
    const pd = (over: Record<string, unknown>) => ({
      id: "g", type: "predict-drag", prompt: "p", target: { instance: "s", readout: "flux" }, range: [0, 5], unit: "µC", reveal: {}, dimension: "conceptual", feedback: { close: "c", far: "f" }, ...over,
    });
    const msgs = (p: PlateDef) => validatePlate(registry, p).filter((i) => i.level === "error").map((i) => i.message).join(" | ");
    expect(msgs(step(pd({})))).toBe("");
    expect(msgs(step(pd({ target: { instance: "surfce", readout: "flux" } })))).toMatch(/surfce/);
    expect(msgs(step(pd({ target: { instance: "s", readout: "fluxx" } })))).toMatch(/fluxx/);
    expect(msgs(step(pd({ unit: "C" })))).toMatch(/unit/);
    expect(msgs(step(pd({ reveal: { surfce: { size: 2 } } })))).toMatch(/surfce/);
    expect(msgs(step(pd({ reveal: { s: { size: -1 } } })))).toMatch(/reveal/);
    const place = { id: "pl", type: "place", prompt: "p", handle: { instance: "s", param: "quality" }, check: "c", hint: "h", dimension: "conceptual" };
    expect(msgs(step(place))).toMatch(/handle/);
    expect(msgs(step(undefined, { cues: [{ t: 0, action: "highlight", target: "ghost" }] }))).toMatch(/ghost/);
    expect(msgs(step(undefined, { cues: [{ t: 0, action: "camera", target: "view" }] }))).toBe("");
  });

  it("frameAt(+Infinity) clamps to the last step", () => {
    const p = mk([q([point(2, [0, 0, 0])])], [{ id: "s1", title: "t", note: "n" }, { id: "s2", title: "t", patch: { q: { items: [point(3, [0, 0, 0])] } }, note: "n" }]);
    expect(frameAt(p, Number.POSITIVE_INFINITY).stepIndex).toBe(1);
  });
});
