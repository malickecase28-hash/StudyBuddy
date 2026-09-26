import { contains, vec, type SurfaceShape } from "@forma/physics";
import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, fromSvg, outline, outlineNormals, pathD, PlateDef, Registry, stateAt, toSvg } from "../src";

describe("projection", () => {
  it("maps x right and z up, and round-trips", () => {
    expect(toSvg([1, 0, 0.5])).toEqual([100, -50]);
    expect(fromSvg(...toSvg([0.25, 0, -1.5]))).toEqual([0.25, 0, -1.5]);
    expect(pathD([[0, 0, 0], [1, 0, 0]], false)).toBe("M0.00 0.00 L100.00 0.00");
  });
});

describe("outlines lie on the surface", () => {
  const onSurface = (s: SurfaceShape, p: readonly number[]) => {
    const scaled = (k: number): SurfaceShape =>
      s.kind === "cube" ? { ...s, side: s.side * k } : s.kind === "cylinder" ? { ...s, radius: s.radius * k, height: s.height * k } : { ...s, radius: s.radius * k };
    return contains(scaled(1.001), p as never) && !contains(scaled(0.999), p as never);
  };
  const shapes: SurfaceShape[] = [
    { kind: "sphere", center: vec(0.2, 0, -0.1), radius: 1 },
    { kind: "cube", center: vec(0, 0, 0), side: 1.5 },
    { kind: "cylinder", center: vec(0, 0, 0), radius: 0.6, height: 2 },
    { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 },
  ];
  for (const s of shapes)
    it(`${s.kind}: every point is on the surface and normals point outward`, () => {
      const pts = outline(s, 96);
      expect(pts).toHaveLength(96);
      for (const p of pts) expect(onSurface(s, p), `${s.kind} ${p}`).toBe(true);
      const ns = outlineNormals(pts, s.center);
      ns.forEach((n, i) => {
        expect(Math.hypot(n[0], n[2])).toBeCloseTo(1, 9);
        expect(n[0] * (pts[i]![0] - s.center[0]) + n[2] * (pts[i]![2] - s.center[2])).toBeGreaterThan(0);
      });
    });
});

describe("gaussian-surface outline model", () => {
  const registry = new Registry().register(...emComponents);
  const plate = (items: unknown[]) =>
    PlateDef.parse({
      id: "t", title: "t",
      instances: [
        { id: "q", component: "charges", params: { items }, visible: true },
        { id: "s", component: "gaussian-surface", params: { size: 1 }, links: { charges: "q" }, visible: true },
      ],
      steps: [{ id: "s1", title: "t", note: "n" }],
    });
  it("a centred charge gives D·n = q/(4πr²) all round", () => {
    const p = plate([{ id: "a", kind: "point", q: 2, pos: [0, 0, 0] }]);
    const o = createEvaluator(registry, p.instances)(stateAt(p, 0)).s!.model.outline as { dn: number }[];
    for (const s of o) expect(s.dn).toBeCloseTo(2 / (4 * Math.PI), 6);
  });
  it("an outside charge gives inflow on the near side and outflow on the far side", () => {
    const p = plate([{ id: "a", kind: "point", q: 2, pos: [2, 0, 0] }]);
    const dn = (createEvaluator(registry, p.instances)(stateAt(p, 0)).s!.model.outline as { dn: number }[]).map((s) => s.dn);
    expect(Math.min(...dn)).toBeLessThan(0);
    expect(Math.max(...dn)).toBeGreaterThan(0);
  });
});
