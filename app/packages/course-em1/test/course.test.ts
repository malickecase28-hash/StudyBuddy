import { lintCourse, toSI, walkBlocks, type Block } from "@forma/engine";
import {
  EPS0,
  K_E,
  electricField,
  fluxDensity,
  fluxThrough,
  norm,
  surfacePatches,
  vec,
  type Charge,
} from "@forma/physics";
import { describe, expect, it } from "vitest";
import { course, diagnostic, GaussLabConfig, LAB_CHECKS, questionBank } from "../src";

const allBlocks: Block[] = [];
for (const c of course.concepts) for (const l of c.lessons) walkBlocks(l.blocks, (b) => allBlocks.push(b));

describe("course structure", () => {
  it("lints clean", () => {
    expect(lintCourse(course)).toEqual([]);
  });
  it("every block carries a source and licence", () => {
    for (const b of allBlocks) {
      expect(b.source.doc.length, b.id).toBeGreaterThan(0);
      expect(["restricted", "original"]).toContain(b.licence);
    }
  });
  it("every gauss-lab config parses and every manipulate check exists", () => {
    for (const b of allBlocks) {
      if ((b.type === "sim-3d" || b.type === "manipulate") && b.scene === "gauss-lab") {
        expect(() => GaussLabConfig.parse(b.config), b.id).not.toThrow();
      }
      if (b.type === "manipulate") expect(LAB_CHECKS[b.check], b.check).toBeDefined();
    }
  });
  it("every misconception tag in the slice has a remediation lesson", () => {
    const tags = new Set(course.concepts.flatMap((c) => c.misconceptions.map((m) => m.tag)));
    expect([...tags].sort()).toEqual(
      ["BALL_INSIDE_OUTSIDE", "BND_D_TANGENT", "BND_E_NORMAL", "BND_NORMAL_UNIT", "BND_RATIO_FLIP", "CAP_LN", "CAP_UNITS", "COND_E_INSIDE", "CONTINUITY_SIGN", "COULOMB_DIRECTION", "DENSITY_NO_JACOBIAN", "DISPLACEMENT_ORDER", "DIV_THEOREM_FACES", "DOT_CROSS_CONFUSION", "D_VS_E_PERMITTIVITY", "ELEMENT_SCALE_FACTOR", "ENERGY_DENSITY_UNIT", "ENERGY_HALF", "EPS0_DROPPED", "E_DIRECTION_NEGATIVE", "FLUX_PATCH_AREA", "FLUX_SCALES_WITH_AREA", "FORCE_MAGNITUDE_ONLY", "GAUSS_WITHOUT_SYMMETRY", "GRAD_DIV_TYPE", "GRAD_SIGN", "J_AREA", "LINE_FIELD_FORM", "MISSING_SCALE_FACTORS", "OPERATOR_SYSTEM_MISMATCH", "OUTSIDE_CHARGE_CONTRIBUTES", "PHI_QUADRANT", "POINT_FORM_EPS", "PREFIX_POWER", "SHEET_FIELD_DISTANCE", "SUPERPOSITION_MAGNITUDES", "SURFACE_NORMAL_DIRECTION", "SYMBOL_CASE", "UNIT_VECTOR_LENGTH", "V_INVERSE_SQUARE", "V_VECTOR", "WAVELENGTH_INVERSE", "WORK_SIGN"].sort(),
    );
  });
  it("diagnostic refreshers and bank-item concepts exist", () => {
    const ids = new Set(course.concepts.map((c) => c.id));
    for (const t of diagnostic.topics) if (t.refresher) expect(ids.has(t.refresher), t.refresher).toBe(true);
    for (const p of questionBank) {
      expect(p.concepts.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(1, 10);
      for (const c of p.concepts) expect(ids.has(c.conceptId), c.conceptId).toBe(true);
    }
  });
});

/**
 * Independent derivation (SI units) of every numeric answer in the course.
 * Keys are block ids, or step ids for step-solve blocks.
 */
const Q8 = (r: number) => 0.3e-9 * r * r; // D_r in C/m²
const cubeWith = (charges: Charge[], side: number) => fluxThrough(charges, surfacePatches({ kind: "cube", center: vec(0, 0, 0), side }, 48));
const four3nC: Charge[] = [
  [1, 1, 0],
  [-1, 1, 0],
  [-1, -1, 0],
  [1, -1, 0],
].map(([x, y, z]) => ({ kind: "point", q: 3e-9, pos: vec(x!, y!, z!) }));

const derived: Record<string, number> = {
  // gauss-law
  "num-cube": cubeWith([{ kind: "point", q: 4e-6, pos: vec(0.3, 0, 0) }], 2),
  "cp-mixed": fluxThrough(
    [
      { kind: "point", q: 3e-6, pos: vec(0.1, 0, 0) },
      { kind: "point", q: -1e-6, pos: vec(-0.2, 0.1, 0) },
      { kind: "point", q: 10e-6, pos: vec(2, 0, 0) },
    ],
    surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: 1 }, 64),
  ),
  "de-num": norm(fluxDensity([{ kind: "point", q: 2e-9, pos: vec(0, 0, 0) }], vec(1, 0, 0))),
  // gauss-applications
  q8a: Q8(2) / EPS0,
  q8b: Q8(3) * 4 * Math.PI * 9,
  q8c: Q8(4) * 4 * Math.PI * 16,
  q6a: fluxThrough(
    [{ kind: "point", q: 60e-6, pos: vec(0, 0, 0) }],
    surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: 0.26 }, 64).filter(
      (p) => p.center[0] > 0 && p.center[1] > 0 && p.center[2] > 0,
    ),
  ),
  q6b: 60e-6, // closed surface enclosing the charge (Gauss)
  q6c: 60e-6 * 0.5 * (1 - 0.26 / Math.hypot(0.26, 1e7)), // flux through a disk of radius → ∞ at height h
  "num-line": norm(electricField([{ kind: "line", rhoL: 2e-9, x: 0, y: 0 }], vec(0.5, 0, 0))),
  q9a: cubeWith(
    [
      { kind: "point", q: 0.1e-6, pos: vec(1, -2, 3) },
      { kind: "point", q: 1e-6 / 7, pos: vec(-1, 2, -2) },
    ],
    10,
  ),
  q9b: Math.PI * 1e-6 * 10,
  q9c: 0.1e-6 * 10 * Math.hypot(10 / 3, 10), // plane y=3x cut by the cube: width √((10/3)²+10²), height 10
  challenge: fluxThrough(
    [
      { kind: "point", q: 3e-6, pos: vec(0, 0, 0.5) },
      { kind: "point", q: -5e-6, pos: vec(0.2, 0, 0) },
      { kind: "point", q: 7e-6, pos: vec(3, 0, 0) },
    ],
    surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: 1 }, 64),
  ),
  "pp-d": 5e-9 * 100,
  "pp-q": 5e-9 * 100 * 4 * Math.PI * 100,
  // math
  "mag-a": norm(vec(1, 2, 2)),
  "num-flat": 3e-9 * 4,
  "num-tilt": 3e-9 * 4 * Math.cos(Math.PI / 3),
  "cp-area": surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: 2 }, 24).reduce((s, p) => s + norm(p.dS), 0),
  // electrostatics
  ex1: (K_E * 3e-4 * 1e-4) / 9,
  ex2: electricField(four3nC, vec(1, 1, 1))[2],
  q7a: fluxDensity([{ kind: "point", q: 55e-3, pos: vec(-2, 3, -6) }], vec(2, -3, 6))[2],
  rho: (1 / 4) * 0.3e-9 * 4 * 2 ** 3, // (1/r²) d/dr (0.3 r⁴) at r = 2
};

describe("every numeric answer is physics-verified", () => {
  const answers: [string, { value: number; unit: string }, number][] = [];
  for (const b of allBlocks) {
    if (b.type === "numeric" || b.type === "challenge") answers.push([b.id, b.answer, b.relTol]);
    if (b.type === "step-solve") for (const s of b.steps) answers.push([s.id, s.answer, s.relTol]);
  }
  it("covers every numeric answer in the course", () => {
    expect(answers.map(([id]) => id).filter((id) => !(id in derived))).toEqual([]);
  });
  for (const [id, answer, relTol] of answers) {
    it(`${id}: authored ${answer.value} ${answer.unit}`, () => {
      const authored = toSI(answer.value, answer.unit).value;
      const truth = derived[id]!;
      expect(Math.abs(authored - truth) / Math.abs(truth)).toBeLessThan(Math.min(relTol, 0.005));
    });
  }
});

describe("lab goal checks", () => {
  const sphere = { kind: "sphere" as const, center: [0, 0, 0] as [number, number, number], radius: 1 };
  it("outside-zero needs a charge outside and net flux from inside only", () => {
    const start = { charges: [{ id: "in", q: 3, pos: [0, 0, 0] as [number, number, number], draggable: false }, { id: "out", q: 2, pos: [0.5, 0, 0] as [number, number, number], draggable: true }], surface: sphere };
    expect(LAB_CHECKS["outside-zero"]!(start, start)).toBe(false);
    const moved = { ...start, charges: [start.charges[0]!, { ...start.charges[1]!, pos: [2, 0, 0] as [number, number, number] }] };
    // Net flux is 3 µC (not 0) but the moved charge contributes ~0: the check is about the outside charge.
    expect(LAB_CHECKS["outside-zero"]!(moved, start)).toBe(true);
  });
  it("resize-constant needs a ≥40% resize with charge enclosed", () => {
    const start = { charges: [{ id: "q", q: 2, pos: [0, 0, 0] as [number, number, number], draggable: false }], surface: sphere };
    expect(LAB_CHECKS["resize-constant"]!({ ...start, surface: { ...sphere, radius: 1.2 } }, start)).toBe(false);
    expect(LAB_CHECKS["resize-constant"]!({ ...start, surface: { ...sphere, radius: 1.5 } }, start)).toBe(true);
  });
});
