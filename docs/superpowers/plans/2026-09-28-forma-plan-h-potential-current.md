# Forma Plan H: Potential, Energy and Current at Full Depth

> **For agentic workers (Codex):** read `AGENTS.md` first. **Plans F1–F4, G1 and G2 must be complete.** Transcribe the content exactly. Every value was solved with SymPy or Python from the source questions (`scratchpad/h` script outputs in the plan's Self-Review Notes), not from student work.

**Goal:** six in-depth ideas.
- `em1.electrostatics.potential` (unlocked):
  - ① Work and potential difference
  - ② The potential of point charges
  - ③ E = −∇V, and D from V
  - ④ Energy: moving charges and systems of charges
- `em1.electrostatics.current` (unlocked):
  - ⑤ Current density and Ohm's law in point form
  - ⑥ The continuity equation

**New plate support:**
- `line-work`: W = −Q∫E·dL along a segment or an arc.
- `conductor`: J, E, R, P and power density for a wire.
- A potential readout `V` on `e-probe`.
- A pair energy `U` on `coulomb-force`.
- New fields and units: scalar fields `ex4-V` and `f2324-1b`, vector fields `ex4-E` and `cont-5x`, and the units A, A/m², Ω, W, W/m³, S/m and J.

**Sources (catalog ids):**
- `lec2b`: Examples 4 and 5.
- `lec2c`: current, Ohm's law, Joule's law.
- `mst2324`: Q2(c), Q5(a).
- `f2425`: Q1(c), Q4(a)(ii), Q4(b).
- `f2324`: Q1(b), Q4(a)(i).
- `hw04-2425`: 4.1.

**Ledger:** `.superpowers/sdd/2026-09-28-forma-plan-h-potential-current/progress.md`

## Global Constraints

Same as Plans F3 and G1. Of the units in this plan, the lint reads only V/m, m, C, µC and nC. Values in V, kV, J, A, Ω and W are backed by claims (readouts) and are not linted.

**The course's ε₀ is 8.854 × 10⁻¹² F/m (the package uses 8.8541878128 × 10⁻¹²).** Lecture 2b's Example 5 used 1/(4πε₀) ≈ 9 × 10⁹ and got −5.872 kV. With the paper's ε₀ the answer is −5.864 kV. The text says so explicitly; neither value is silently "corrected".

## Review Focus

1. **Path independence.** For `ex4-E` from B(1, 0, 1) to A(0.8, 0.6, 1), the arc and the straight segment give the same W = −0.96 J, and a full circle gives 0. Tested in Task 1.
2. **Sign conventions.** W = −Q∫E·dL is the work *we* do. `line-work.Vab` is V(end) − V(start) = W/Q. E = −∇V: the plate shows ∇V, and the text negates it. Tested by claims in Tasks 3 and 4.
3. **The Finals 23-24 Q1(b)(ii) trick.** V(X) = V(Y) = 0, so W = 0 J. A student who plugs in without looking still gets 0, and the lesson makes the reason explicit: sin 0° = 0 and cos 90° = 0. Tested in Task 5.
4. **Potential of a ball.** Inside, V = ρv(3a² − r²)/(6ε₀); outside, kQ/r. Continuous at r = a. Tested in Task 1.
5. **Conductor units.** R in Ω and J in A/m² parse in the engine, so numeric checks with these units work. Tested in Task 1.

---

### Task 1: Physics, units and components

**Files:**
- Modify: `app/packages/engine/src/quantities.ts` (units), `app/packages/physics/src/potential.ts` (ball), `app/packages/physics/src/fields.ts` (fields), `app/packages/plate/src/components/em.ts` (e-probe `V`, coulomb-force `U`), `app/packages/plate/src/components/math.ts` (`line-work`, `conductor`)
- Modify: `app/apps/web/components/plate/viewsMath.tsx` (views), `views2d.tsx` (register), `Readouts.tsx` (labels)
- Test: `app/packages/physics/test/h.test.ts`, `app/packages/plate/test/math-h.test.ts`, `app/packages/engine/test/quantities.test.ts` (append)

- [ ] **Step 1: Write the failing tests**

`app/packages/engine/test/quantities.test.ts`, append:

```ts
it("reads current, resistance, power and energy units", () => {
  expect(toSI(3.183, "MA/m^2")).toEqual({ value: 3.183e6, dim: "A/m^2" });
  expect(toSI(5.488, "Ω").dim).toBe("Ω");
  expect(toSI(548.8, "W").dim).toBe("W");
  expect(toSI(8.988, "mJ").value).toBeCloseTo(8.988e-3, 15);
  expect(toSI(5.8e7, "S/m").dim).toBe("S/m");
});
```

`app/packages/physics/test/h.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { potential, scalarFields, vectorFields } from "../src";

const EPS0 = 8.8541878128e-12;
describe("potential", () => {
  it("lecture 2b Example 5: −5.864 kV at (1, 0, 1)", () => {
    const v = potential([{ kind: "point", q: -4e-6, pos: [2, -1, 3] }, { kind: "point", q: 5e-6, pos: [0, 4, -2] }], [1, 0, 1]);
    expect(v).toBeCloseTo(-5863.59, 1);
  });
  it("a uniform ball: continuous at the surface, kQ/r outside", () => {
    const ball = { kind: "ball" as const, rhoV: 3e-6, radius: 1, center: [0, 0, 0] as [number, number, number] };
    const Q = (3e-6 * 4 * Math.PI) / 3;
    expect(potential([ball], [1, 0, 0])).toBeCloseTo(Q / (4 * Math.PI * EPS0), 3);
    expect(potential([ball], [0, 0, 0])).toBeCloseTo((3e-6 * 3) / (6 * EPS0), 3);
    expect(potential([ball], [2, 0, 0])).toBeCloseTo(Q / (4 * Math.PI * EPS0 * 2), 3);
  });
});

describe("new fields", () => {
  it("ex4-V gives E = −∇V = y ax + x ay + 2 az", () => {
    const g = scalarFields["ex4-V"]!.grad([1, 0, 1]);
    expect([-g[0], -g[1], -g[2]]).toEqual([0, 1, 2]);
    expect(vectorFields["ex4-E"]!.F([1, 0, 1])).toEqual([0, 1, 2]);
  });
  it("Finals 23-24 Q1(b)(i): ∇V at (5, π/3, −π/2) = 25 aφ", () => {
    const g = scalarFields["f2324-1b"]!.grad([5, Math.PI / 3, -Math.PI / 2]);
    expect(g[0]).toBeCloseTo(0, 10);
    expect(g[1]).toBeCloseTo(0, 10);
    expect(g[2]).toBeCloseTo(25, 10);
  });
  it("cont-5x has divergence 5", () => {
    expect(vectorFields["cont-5x"]!.div([0.3, 1, 2])).toBe(5);
  });
});
```

`app/packages/plate/test/math-h.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const m = (component: string, params: Record<string, unknown>, extra: unknown[] = [], links?: Record<string, string>) => {
  const p = PlateDef.parse({ id: "t", title: "t", instances: [...extra, { id: "a", component, params, visible: true, ...(links ? { links } : {}) }], steps: [{ id: "s", title: "t", note: "n" }] });
  return createEvaluator(reg, p.instances)(stateAt(p, 0)).a!.model as Record<string, number>;
};
const ARC = { kind: "arc", center: [0, 0, 1], radius: 1, from: 0, to: (Math.atan2(0.6, 0.8) * 180) / Math.PI };

describe("line-work", () => {
  it("lecture 2b Example 4: W = −0.96 J along the arc, and along the straight line", () => {
    expect(m("line-work", { field: "ex4-E", q: 2, path: ARC }).W).toBeCloseTo(-0.96, 10);
    expect(m("line-work", { field: "ex4-E", q: 2, path: { kind: "segment", from: [1, 0, 1], to: [0.8, 0.6, 1] } }).W).toBeCloseTo(-0.96, 10);
  });
  it("round a closed loop, W = 0", () => {
    expect(m("line-work", { field: "ex4-E", q: 2, path: { ...ARC, to: 360 } }).W).toBeCloseTo(0, 10);
  });
  it("Vab = V(end) − V(start) = W/Q", () => {
    expect(m("line-work", { field: "ex4-E", q: 2, path: ARC }).Vab).toBeCloseTo(-0.48, 10);
  });
});

describe("conductor", () => {
  it("copper wire, 1 mm radius, 1 km, 10 A", () => {
    const c = m("conductor", { radius: 1e-3, length: 1000, sigma: 5.8e7, current: 10 });
    expect(c.J).toBeCloseTo(3.18310e6, -1);
    expect(c.E).toBeCloseTo(0.0548810, 7);
    expect(c.R).toBeCloseTo(5.48810, 5);
    expect(c.P).toBeCloseTo(548.810, 3);
  });
});

describe("e-probe V and coulomb-force U", () => {
  const q = { id: "q", component: "charges", params: { items: [{ id: "a", kind: "point", q: -4, pos: [2, -1, 3] }, { id: "b", kind: "point", q: 5, pos: [0, 4, -2] }] }, visible: true };
  it("V at (1, 0, 1) is −5864 V", () => {
    expect(m("e-probe", { point: [1, 0, 1] }, [q], { charges: "q" }).V).toBeCloseTo(-5863.59, 1);
  });
  it("the pair's energy is −0.02446 J", () => {
    expect(m("coulomb-force", { on: "b" }, [q], { charges: "q" }).U).toBeCloseTo(-0.024461, 6);
  });
  it("V is absent when a line charge is present (it has no zero at infinity)", () => {
    const line = { id: "q", component: "charges", params: { items: [{ id: "l", kind: "line", rhoL: 1000, x: 0, y: 0 }] }, visible: true };
    expect("V" in m("e-probe", { point: [1, 0, 0] }, [line], { charges: "q" })).toBe(false);
  });
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `pnpm vitest run packages/engine/test/quantities.test.ts packages/physics/test/h.test.ts packages/plate/test/math-h.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement.**

**Units** (`quantities.ts` `BASE`): add

```ts
A: "A", "A/m^2": "A/m^2", "Ω": "Ω", ohm: "Ω", W: "W", "W/m^3": "W/m^3", "S/m": "S/m", J: "J",
```

The existing prefix logic gives MA, kΩ, mJ and the rest. `resolveUnit` tries `BASE[u]` first and then a prefix, so "mJ" resolves as m + J. There is one hazard: "m" followed by "A/m^2" would read as milli-A/m². No plan uses that, so accept it.

**`potential.ts`:** handle the ball:

```ts
    if (c.kind === "ball") {
      const d = norm(sub(p, c.center));
      if (d >= c.radius) return s + (K_E * (c.rhoV * 4 * Math.PI * c.radius ** 3)) / 3 / d;
      return s + (c.rhoV * (3 * c.radius ** 2 - d * d)) / (6 * EPS0);
    }
```

Place it before the existing point branch, keeping the throw for line and sheet charges. Import `EPS0`.

**`fields.ts`:** add

```ts
// scalarFields
  "ex4-V": S({ id: "ex4-V", text: "V = −(xy + 2z)", latex: String.raw`V=-(xy+2z)`, system: "cart",
    f: ([x, y, z]) => -(x * y + 2 * z), grad: ([x, y]) => [-y, -x, -2] }),
  "f2324-1b": S({ id: "f2324-1b", text: "V = r³ sin θ cos φ", latex: String.raw`V=r^3\sin\theta\cos\phi`, system: "sph",
    f: ([r, t, p]) => r ** 3 * sin(t) * cos(p), grad: ([r, t, p]) => [3 * r * r * sin(t) * cos(p), r * r * cos(t) * cos(p), -r * r * sin(p)] }),
// vectorFields
  "ex4-E": V({ id: "ex4-E", text: "E = y ax + x ay + 2 az", latex: String.raw`\mathbf E=y\,\mathbf a_x+x\,\mathbf a_y+2\,\mathbf a_z`, system: "cart",
    F: ([x, y]) => [y, x, 2], div: () => 0, curl: () => [0, 0, 0] }),
  "cont-5x": V({ id: "cont-5x", text: "J = 5x ax", latex: String.raw`\mathbf J=5x\,\mathbf a_x`, system: "cart",
    F: ([x]) => [5 * x, 0, 0], div: () => 5, curl: () => [0, 0, 0] }),
```

`toEqual([0, 1, 2])` holds because −(−0) is 0 in `toEqual` for these values. If `toEqual` rejects a −0, compare with `toBeCloseTo` instead and log a ruling.

**`em.ts`:**
- **e-probe:** add `const V = (() => { try { return potential(cs, pt); } catch { return undefined; } })();`, return `...(V === undefined ? {} : { V })`, and add `V: "V"` to `readouts` and `quotable`.
- **coulomb-force:** when exactly one other item exists and it is a point charge, add `U: K_E * q * (other.q * 1e-6) / R`, with readout `U: "J"`.
- Import `potential` and `K_E` from `@forma/physics`.

**`math.ts`:** add two components.

```ts
const Path = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("segment"), from: V3, to: V3 }),
  z.object({ kind: z.literal("arc"), center: V3, radius: z.number().positive(), from: z.number(), to: z.number() }),
]);
type PathT = z.infer<typeof Path>;
const RAD = Math.PI / 180;
/** Point and tangent (d/ds) at s ∈ [0, 1]. Arcs lie in the plane z = center.z, angles in degrees from +x. */
export function pathAt(path: PathT, s: number): [Vec3, Vec3] {
  if (path.kind === "segment") {
    const d: Vec3 = [path.to[0] - path.from[0], path.to[1] - path.from[1], path.to[2] - path.from[2]];
    return [[path.from[0] + s * d[0], path.from[1] + s * d[1], path.from[2] + s * d[2]], d];
  }
  const a = (path.from + s * (path.to - path.from)) * RAD, da = (path.to - path.from) * RAD;
  const [cx, cy, cz] = path.center;
  return [[cx + path.radius * Math.cos(a), cy + path.radius * Math.sin(a), cz], [-path.radius * Math.sin(a) * da, path.radius * Math.cos(a) * da, 0]];
}

export const LineWork = defineComponent({
  id: "line-work",
  params: z.object({ field: VectorId, q: z.number(), path: Path, drawScale: z.number().positive().default(1) }),
  model: (p) => {
    const f = vectorFields[p.field]!;
    const E = (q: Vec3) => cartOf(f.F(nativeOf(q, f.system)), q, f.system);
    const { nodes, weights } = gaussLegendre(24);
    let integral = 0;
    for (let i = 0; i < 24; i++) {
      const s = 0.5 + 0.5 * nodes[i]!;
      const [pt, d] = pathAt(p.path, s);
      const e = E(pt);
      integral += 0.5 * weights[i]! * (e[0] * d[0] + e[1] * d[1] + e[2] * d[2]);
    }
    const W = -p.q * integral;
    return { W, Vab: W / p.q, q: p.q };
  },
  handles: [],
  readouts: { W: "J", Vab: "V" },
  quotable: { W: "J", Vab: "V", q: "C" },
});

export const Conductor = defineComponent({
  id: "conductor",
  params: z.object({ radius: z.number().positive(), length: z.number().positive(), sigma: z.number().positive(), current: z.number() }),
  model: (p) => {
    const A = Math.PI * p.radius * p.radius;
    const J = p.current / A;
    const R = p.length / (p.sigma * A);
    return { J, E: J / p.sigma, R, P: p.current * p.current * R, pd: (J * J) / p.sigma };
  },
  handles: [],
  readouts: { J: "A/m^2", E: "V/m", R: "Ω", P: "W", pd: "W/m^3" },
  quotable: { J: "A/m^2", E: "V/m", R: "Ω", P: "W", pd: "W/m^3" },
});
```

Add both to `mathComponents`. The Gauss–Legendre sum with 24 points is exact for these polynomial and trigonometric paths to 1e-12.

**Views** (`viewsMath.tsx`):
- **`LineWorkView`:** sample 48 points of `pathAt` × `drawScale`. Project with `toSvg3` and draw a polyline in `var(--charge)`, with an arrowhead marker (`url(#arrow-charge)`) at the end. Put a small circle at the start labelled "start" and the text "end" at the finish. `aria-label`: `Path for the work integral, ${path.kind}`.
- **`ConductorView`:** a schematic, not to scale.
  - A rectangle from (−2, −0.25) to (2, 0.25) m in plate coordinates with hatch `url(#hatch-graphite)`.
  - Three arrows inside it, pointing along +x with tone `flux`, labelled "J".
  - The text `r = ${radius × 1000} mm · L = ${length} m · σ = ${sigma.toExponential(2)} S/m` above it.
  - `aria-label`: "Conductor, schematic".
- Register `"line-work": LineWorkView` and `conductor: ConductorView` in `views2d.tsx`.

**Labels** (`Readouts.tsx`):
- `LABEL`: `W: "Work done W", Vab: "V(end) − V(start)", J: "|J|", E: "|E| in the conductor", R: "Resistance R", P: "Power I²R", pd: "Power density σE²", V: "Potential V", U: "Energy of the pair U"`.
- `TONE`: `W: "charge", V: "field", J: "flux"`.
- `E` may already be a readout name in another component. Check with `grep -n '\bE: "' apps/web/components/plate/Readouts.tsx`. If it is, keep that label and override it for the conductor: `if (inst.component === "conductor" && name === "E") label = "|E| in the conductor"`.

- [ ] **Step 4: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS. The F2 finite-difference test now also covers `ex4-V`, `f2324-1b`, `ex4-E` and `cont-5x`.

- [ ] **Step 5: Commit**

```bash
git add packages apps/web && git commit -m "feat: line-work and conductor components, potential readouts (incl. balls), pair energy, current units

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 2: Templates

**Files:** `templates.ts`; test `app/packages/course-em1/test/templates-h.test.ts`.

- [ ] **Step 1: Write the failing test.** Use the G1 template-test shape over `["v-point", "work-move", "current-density", "ohm-wire", "continuity-rate"]`, plus:

```ts
it("v-point: 2 nC at 100 cm is 17.98 V", () => {
  expect(templates.find((x) => x.id === "v-point")!.solve({ q: 2, r: 100 } as never).answer.value).toBeCloseTo(17.98, 2);
});
it("current-density reproduces Finals 24-25 Q4(a)(ii): 50 A in 8 mm radius", () => {
  expect(templates.find((x) => x.id === "current-density")!.solve({ I: 50, r: 8 } as never).answer.value).toBeCloseTo(248680, -1);
});
```

- [ ] **Step 2: Run it** and see it FAIL.

- [ ] **Step 3: Implement.** Reuse `KE`, `EPS0`, `sig`.

```ts
const vPoint = defineTemplate<{ q: number; r: number }>({
  id: "v-point",
  params: { q: { min: 1, max: 9, step: 1 }, r: { min: 10, max: 100, step: 10 } },
  prompt: (p) => `Find the potential ${p.r} cm from a ${p.q} nC point charge, taking V = 0 at infinity.`,
  solve: (p) => ({
    answer: { value: sig((KE * p.q * 1e-9) / (p.r / 100)), unit: "V" },
    distractors: [{ value: sig((KE * p.q * 1e-9) / (p.r / 100) ** 2), unit: "V", errorClass: "conceptual", tag: "V_INVERSE_SQUARE", feedback: "Potential falls as 1/R, not 1/R². That's the field's law." }],
  }),
  hints: () => ["V = Q/(4πε₀R).", "R in metres.", "One power of R, not two."],
  worked: (p) => [{ text: `V = 8.988 × 10⁹ × ${p.q} × 10⁻⁹ / ${p.r / 100} = ${sig((KE * p.q * 1e-9) / (p.r / 100))} V.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.potential"], misconceptions: ["V_INVERSE_SQUARE"], difficulty: 1 },
});

const workMove = defineTemplate<{ Q: number; q: number; ra: number }>({
  id: "work-move",
  params: { Q: { min: 1, max: 5, step: 1 }, q: { min: 1, max: 3, step: 1 }, ra: { min: 2, max: 5, step: 1 } },
  prompt: (p) => `A +${p.Q} µC charge is fixed at the origin. How much work must you do to bring a +${p.q} µC charge from ${p.ra} m to 1 m from it?`,
  solve: (p) => {
    const W = p.q * 1e-6 * KE * p.Q * 1e-6 * (1 - 1 / p.ra);
    return {
      answer: { value: sig(W), unit: "J" },
      distractors: [{ value: sig(-W), unit: "J", errorClass: "sign", tag: "WORK_SIGN", feedback: "Pushing like charges together takes positive work: W = q(V_end − V_start) > 0 here." }],
    };
  },
  hints: () => ["W = q(V_end − V_start).", "V = kQ/r at each end.", "The end is closer, so V_end > V_start."],
  worked: (p) => [{ text: `V(1 m) − V(${p.ra} m) = 8.988 × 10⁹ × ${p.Q} × 10⁻⁶ × (1 − 1/${p.ra}); multiply by ${p.q} × 10⁻⁶ C: W = ${sig(p.q * 1e-6 * KE * p.Q * 1e-6 * (1 - 1 / p.ra))} J.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.potential"], misconceptions: ["WORK_SIGN"], difficulty: 2 },
});

const currentDensity = defineTemplate<{ I: number; r: number }>({
  id: "current-density",
  params: { I: { min: 5, max: 50, step: 5 }, r: { min: 0.5, max: 8, step: 0.5 } },
  prompt: (p) => `A straight conductor of radius ${p.r} mm carries ${p.I} A, spread uniformly. Find |J|.`,
  solve: (p) => {
    const r = p.r / 1000;
    return {
      answer: { value: sig(p.I / (Math.PI * r * r)), unit: "A/m^2" },
      distractors: [{ value: sig(p.I / (2 * Math.PI * r)), unit: "A/m^2", errorClass: "conceptual", tag: "J_AREA", feedback: "That divides by the circumference. J is current per cross-sectional area, πr²." }],
    };
  },
  hints: () => ["J = I / (cross-sectional area).", "Area = πr², with r in metres.", "mm → m first."],
  worked: (p) => [{ text: `J = ${p.I} / (π × (${p.r / 1000})²) = ${sig(p.I / (Math.PI * (p.r / 1000) ** 2))} A/m².` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.current"], misconceptions: ["J_AREA"], difficulty: 1 },
});

const ohmWire = defineTemplate<{ L: number; d: number }>({
  id: "ohm-wire",
  params: { L: { min: 10, max: 100, step: 10 }, d: { min: 1, max: 4, step: 1 } },
  prompt: (p) => `Find the resistance of ${p.L} m of copper wire (σ = 5.8 × 10⁷ S/m) with diameter ${p.d} mm.`,
  solve: (p) => {
    const a = p.d / 2000;
    return {
      answer: { value: sig(p.L / (5.8e7 * Math.PI * a * a)), unit: "Ω" },
      distractors: [{ value: sig(p.L / (5.8e7 * Math.PI * (p.d / 1000) ** 2)), unit: "Ω", errorClass: "conceptual", tag: "J_AREA", feedback: "That uses the diameter as the radius. Halve it first." }],
    };
  },
  hints: () => ["R = L / (σS).", "S = πa², with a the radius in metres.", "Radius = diameter / 2."],
  worked: (p) => [{ text: `a = ${p.d / 2} mm; S = π(${p.d / 2000})² m²; R = ${p.L} / (5.8 × 10⁷ × S) = ${sig(p.L / (5.8e7 * Math.PI * (p.d / 2000) ** 2))} Ω.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.current"], misconceptions: ["J_AREA"], difficulty: 1 },
});

const continuityRate = defineTemplate<{ a: number; x0: number }>({
  id: "continuity-rate",
  params: { a: { min: 1, max: 9, step: 1 }, x0: { min: 1, max: 4, step: 1 } },
  prompt: (p) => `J = ${p.a}x² ax A/m². Find ∂ρv/∂t at x = ${p.x0} m.`,
  solve: (p) => ({
    answer: { value: -2 * p.a * p.x0, unit: "C/m^3" },
    distractors: [{ value: 2 * p.a * p.x0, unit: "C/m^3", errorClass: "sign", tag: "CONTINUITY_SIGN", feedback: "∇·J = −∂ρv/∂t: charge flowing out means the density falls." }],
  }),
  hints: () => ["∇·J = −∂ρv/∂t.", "∇·J = ∂(ax²)/∂x = 2ax.", "So ∂ρv/∂t = −2ax (per second)."],
  worked: (p) => [{ text: `∇·J = ${2 * p.a}x = ${2 * p.a * p.x0} at x = ${p.x0}, so ∂ρv/∂t = −${2 * p.a * p.x0} C/m³ per second.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.current"], misconceptions: ["CONTINUITY_SIGN"], difficulty: 1 },
});
```

Append the five to `templates`. Check two answers by hand:
- `v-point` with q = 2, r = 100: 17.975 V.
- `current-density` with 50 A and 8 mm: 248680 A/m².

The `continuity-rate` answer carries the unit "C/m^3" and means C/m³ per second. The engine's dims have no time, so the prompt and hints say "per second" in words. Commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): templates for potential, work, current density, wire resistance and continuity

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 3: The potential concept, and Ideas ① and ②

**Files:**
- Create: `concepts/potential.ts`, `plates/idea-work.ts`, `plates/idea-v-point.ts`
- Modify: `concepts/electrostatics.ts` (remove `locked("em1.electrostatics.potential", …)`), `index.ts` (add `potentialConcept` after `divergence`), `plates/index.ts`

- [ ] **Step 1: The concept** in `concepts/potential.ts`

```ts
import { meta, SLIDES, src } from "../sources";

const ID = "em1.electrostatics.potential";
export const potentialConcept = {
  id: ID,
  title: "Electric potential and energy",
  unit: 2,
  objectives: [
    "Find the work done and the potential difference from a field: W = −Q∫E·dL.",
    "Find the potential of point charges by superposition, with V = 0 at infinity.",
    "Find E, and D, from V using E = −∇V.",
    "Find the energy to move a charge, and the energy of a system of point charges.",
  ],
  prerequisites: [{ conceptId: "em1.electrostatics.field", minMastery: 0.3 }, { conceptId: "em1.math.vector-calculus", minMastery: 0.3 }],
  misconceptions: [
    { tag: "WORK_SIGN", description: "Loses the minus sign in W = −Q∫E·dL, or mixes up start and end.", remediation: `${ID}/main` },
    { tag: "V_VECTOR", description: "Adds potentials as vectors, or gives V a direction.", remediation: `${ID}/main` },
    { tag: "GRAD_SIGN", description: "Writes E = ∇V without the minus sign.", remediation: `${ID}/main` },
    { tag: "V_INVERSE_SQUARE", description: "Uses 1/R² for a point charge's potential.", remediation: `${ID}/main` },
  ],
  examLinks: [{ paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q1(c)", marks: 10, weight: 1 }],
  sources: [src(SLIDES, "Electric potential"), src("UTech ELE3001 Unit 2b slides (G. D. Boswell)", "Examples 4 and 5")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Potential and energy (in depth)",
      minutes: 80,
      blocks: [
        { ...meta("vivid", src(SLIDES, "Work done")), id: "idea-work", type: "plate" as const, plateId: "idea-work" },
        { ...meta("vivid", src(SLIDES, "Potential")), id: "idea-v-point", type: "plate" as const, plateId: "idea-v-point" },
      ],
    },
  ],
};
```

`idea-grad-v` and `idea-energy` are appended in Task 4.

- [ ] **Step 2: `plates/idea-work.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const ARC_TO = (Math.atan2(0.6, 0.8) * 180) / Math.PI; // 36.87°
const ARC = { kind: "arc" as const, center: [0, 0, 1] as [number, number, number], radius: 1, from: 0, to: ARC_TO };
const SEG = { kind: "segment" as const, from: [1, 0, 1] as [number, number, number], to: [0.8, 0.6, 1] as [number, number, number] };
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaWork = defineIdeaPlate({
  id: "idea-work",
  title: "Work and potential difference",
  requires: { objectives: [0], items: ["lecture:lec2b-ex4"], misconceptions: ["WORK_SIGN"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "lw", component: "line-work", params: { field: "ex4-E", q: 2, path: ARC, drawScale: 1.5 } },
    { id: "eq", component: "equation", params: eqp(R`W=-Q\int_{\text{start}}^{\text{end}}\mathbf E\cdot d\mathbf L`, "W equals minus Q times the line integral of E dot d L") },
  ],
  ideas: [
    {
      id: "work",
      title: "Work and potential difference",
      objectives: [0],
      explain: [
        {
          id: "definition", title: "The work we do", show: ["axes", "lw", "eq"], focus: ["lw", "eq"],
          note: "The field pushes on a charge with force QE. To move the charge along a path without letting it speed up, we push back with −QE. So the work we do is W = −Q∫E·dL along the path. Lecture 2b's Example 4 moves a +2 C charge along the unit circle at z = 1, from B(1, 0, 1) to A(0.8, 0.6, 1), through E = y âₓ + x âᵧ + 2 âz. The plate evaluates the integral: W = −0.96 J.",
          claims: [{ instance: "lw", readout: "W", value: -0.96, unit: "J" }],
        },
        {
          id: "path", title: "Any path, the same answer", patch: { lw: { path: SEG } }, focus: ["lw"],
          note: "Now take the straight chord from B to A instead of the arc. Different path, same work: still −0.96 J. An electrostatic field is conservative: the work depends only on where you start and where you finish. That is what makes a potential possible, because a single number V at each point is enough to say how much work any trip costs.",
          claims: [{ instance: "lw", readout: "W", value: -0.96, unit: "J" }],
        },
        {
          id: "difference", title: "Potential difference: work per coulomb", patch: { eq: eqp(R`V_{AB}=V_A-V_B=\dfrac{W_{B\to A}}{Q}=-\int_B^A\mathbf E\cdot d\mathbf L`, "V A B equals the work per coulomb") }, focus: ["lw", "eq"],
          note: "Divide the work by the charge and you get the potential difference, measured in volts (joules per coulomb): V_AB = V_A − V_B = −∫ from B to A of E·dL. Here V_AB = −0.96/2 = −0.48 V. A is 0.48 V below B, which is why moving the charge from B to A released energy: the field did the work, and ours was negative.",
          claims: [{ instance: "lw", readout: "Vab", value: -0.48, unit: "V" }],
        },
        {
          id: "loop", title: "Round a loop, zero", patch: { lw: { path: { ...ARC, to: 360 } } }, focus: ["lw"],
          note: "Go all the way round the circle and back to B. The work is exactly zero: ∮E·dL = 0 for any electrostatic field. By Stokes' theorem this is the same statement as ∇ × E = 0, the curl you met in vector calculus. Energy can't be pumped out of a static field by going in circles.",
          claims: [{ instance: "lw", readout: "W", value: 0, unit: "J" }],
        },
      ],
      examples: [
        {
          id: "ex4", level: "basic", title: "Lecture 2b Example 4: along the arc",
          setup: { lw: { path: ARC, q: 2 } },
          problem: "E = y âₓ + x âᵧ + 2 âz. Determine the work done carrying +2 C from B(1, 0, 1) to A(0.8, 0.6, 1) along the shorter arc of the unit circle at z = 1.",
          lines: [
            { text: "dL = dx âₓ + dy âᵧ + dz âz, and dz = 0 on the circle: W = −2∫(y dx + x dy).", focus: ["lw"] },
            { text: "On the circle y = √(1 − x²) and x = √(1 − y²): W = −2∫₁^0.8 √(1 − x²) dx − 2∫₀^0.6 √(1 − y²) dy.", latex: R`W=-2\int_1^{0.8}\!\sqrt{1-x^2}\,dx-2\int_0^{0.6}\!\sqrt{1-y^2}\,dy`, focus: ["lw"] },
            { text: "Evaluating: W = −(0.48 + 0.927 − 1.571) − (0.48 + 0.644) = −0.96 J.", focus: ["lw"], claims: [{ instance: "lw", readout: "W", value: -0.96, unit: "J" }] },
          ],
          covers: ["lecture:lec2b-ex4"],
          trap: "Dropping the minus sign in W = −Q∫E·dL gives +0.96 J: the field's work, not ours.",
        },
        {
          id: "chord", level: "tutorial", title: "The same trip in a straight line",
          setup: { lw: { path: SEG, q: 2 } },
          problem: "Repeat Example 4 along the straight line from B to A.",
          lines: [
            { text: "Parametrise: x = 1 − 0.2s, y = 0.6s, z = 1, for 0 ≤ s ≤ 1; dx = −0.2 ds, dy = 0.6 ds.", focus: ["lw"] },
            { text: "E·dL = y dx + x dy = (0.6s)(−0.2) + (1 − 0.2s)(0.6) = 0.6 − 0.24s per ds.", focus: ["lw"] },
            { text: "W = −2∫₀¹ (0.6 − 0.24s) ds = −2(0.6 − 0.12) = −0.96 J, the same as the arc.", focus: ["lw"], claims: [{ instance: "lw", readout: "W", value: -0.96, unit: "J" }] },
          ],
          trap: "Integrating y dx with y held at a constant value. On a slanted path, y changes with x; parametrise first.",
        },
        {
          id: "shortcut", level: "exam", title: "The shortcut: a potential function",
          setup: { lw: { path: { kind: "segment", from: [0.8, 0.6, 1], to: [0, 1, 1.4] }, q: -1 } },
          problem: "E = y âₓ + x âᵧ + 2 âz = −∇V with V = −(xy + 2z). Find the work to carry −1 C from A(0.8, 0.6, 1) to C(0, 1, 1.4).",
          lines: [
            { text: "Because E = −∇V, W = Q(V_end − V_start); no integral needed.", focus: ["lw"] },
            { text: "V_A = −(0.48 + 2) = −2.48 V and V_C = −(0 + 2.8) = −2.8 V.", focus: ["lw"] },
            { text: "W = (−1)(−2.8 − (−2.48)) = +0.32 J.", focus: ["lw"], claims: [{ instance: "lw", readout: "W", value: 0.32, unit: "J" }] },
          ],
          trap: "Using V_start − V_end flips the sign. W = Q(V_end − V_start), and Q's own sign counts too.",
        },
      ],
      asks: [
        { id: "minus", q: "Why the minus sign in W = −Q∫E·dL?", tags: ["WORK_SIGN"], a: "Because W is the work we do, against the field. The field's force is QE, and we push with −QE to move the charge steadily. Our work is the integral of our force along the path." },
        { id: "conservative", q: "What makes a field conservative?", a: "Its work depends only on the endpoints, never on the path. Equivalently, the work round every closed loop is zero, or its curl is zero everywhere. Static electric fields always qualify." },
        { id: "volt", q: "What is a volt, physically?", a: "A joule per coulomb. A potential difference of 1 V means it takes 1 J of work to move 1 C of charge between the two points." },
        { id: "ref", q: "What does V at a single point mean?", a: "The work per coulomb to bring a charge from a reference point, usually infinity (where V = 0), to that point. Only differences are physical; the reference is a choice." },
        { id: "sign-meaning", q: "What does a negative W mean?", a: "The field did the work for us: the charge moved the way the field pushes it. We would have had to hold it back." },
        { id: "arc-dl", q: "Why is dz = 0 on the arc?", a: "The whole path lies in the plane z = 1, so z never changes along it. The 2âz part of E contributes nothing to E·dL there." },
      ],
      checks: [
        {
          id: "path-choice", title: "Check: which path?", show: ["axes", "lw", "eq"], patch: { lw: { path: ARC, q: 2 } },
          note: "Four checks on work and potential difference. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "path-choice", type: "choose", prompt: "Carrying a charge between two points in an electrostatic field, the work…", dimension: "conceptual",
            options: [
              choice("same", "is the same for every path", true, "Right: the field is conservative."),
              choice("short", "is least along the straight line", false, "Every path gives the same work."),
              choice("long", "grows with the path's length", false, "Only the endpoints matter."),
            ] },
        },
        {
          id: "predict-q", title: "Check: double the charge",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-q", type: "predict-drag", prompt: "Carry +4 C along the same arc instead of +2 C. Drag W to your prediction.", target: { instance: "lw", readout: "W" }, range: [-3, 3], unit: "J", relTol: 0.05, reveal: { lw: { q: 4 } }, dimension: "conceptual",
            feedback: { close: "Right: twice as much, −1.92 J.", far: "W is proportional to Q: −1.92 J." } },
        },
        {
          id: "vab", title: "Check: the potential difference",
          note: "Divide the work by the charge.",
          interaction: { id: "vab", type: "numeric", prompt: "Moving +2 C from B to A takes W = −0.96 J. Find V_AB = V_A − V_B.", answer: { value: -0.48, unit: "V" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 0.48, unit: "V", errorClass: "sign", tag: "WORK_SIGN", feedback: "V_A − V_B = W(B→A)/Q, sign included." }],
            hints: ["V_AB = W/Q.", "−0.96 / 2."] },
          covers: ["lecture:lec2b-ex4"],
        },
        {
          id: "loop-w", title: "Check: a closed loop",
          note: "Last one.",
          interaction: { id: "loop-w", type: "choose", prompt: "The work to carry a charge once round any closed loop in an electrostatic field is…", dimension: "recognition",
            options: [
              choice("zero", "zero", true, "Right: ∮E·dL = 0."),
              choice("pos", "positive", false, "You'd be creating energy from nothing."),
              choice("dep", "it depends on the loop", false, "For a static field it is always zero."),
            ] },
        },
      ],
      recap: {
        points: [
          "The work we do is W = −Q∫E·dL.",
          "Electrostatic fields are conservative: W depends only on the endpoints, and ∮E·dL = 0.",
          "Potential difference: V_AB = V_A − V_B = W(B→A)/Q, in volts.",
          "If E = −∇V, then W = Q(V_end − V_start); no path integral is needed.",
        ],
        traps: ["Losing the minus sign.", "Treating y as constant on a slanted path.", "V_start − V_end instead of V_end − V_start."],
      },
    },
  ],
});
```

Check the exam example by hand. The segment from (0.8, 0.6, 1) to (0, 1, 1.4) has V_C = −(0·1 + 2·1.4) = −2.8, so W = −1 × (−2.8 + 2.48) = 0.32 J. The problem text states C(0, 1, 1.4), which matches the segment.

- [ ] **Step 3: `plates/idea-v-point.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const vp = instantiate(templates.find((t) => t.id === "v-point")!, 1);
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const EX5 = { items: [pt("a", -4, [2, -1, 3], "Q1 = −4 µC"), pt("b", 5, [0, 4, -2], "Q2 = +5 µC")], oblique: true, drawScale: 0.3 };

export const ideaVPoint = defineIdeaPlate({
  id: "idea-v-point",
  title: "The potential of point charges",
  requires: { objectives: [1], items: ["lecture:lec2b-ex5", "mst-2324-q2c"], misconceptions: ["V_VECTOR", "V_INVERSE_SQUARE"] },
  instances: [
    { id: "q", component: "charges", params: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")] } },
    { id: "ep", component: "e-probe", params: { point: [1, 0, 0] }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`V=\dfrac{Q}{4\pi\varepsilon_0R}`, speech: "V equals Q over four pi epsilon nought R", shortSpeech: "point potential" } },
  ],
  ideas: [
    {
      id: "v-point",
      title: "The potential of point charges",
      objectives: [1],
      explain: [
        {
          id: "formula", title: "V = Q/(4πε₀R)", show: ["q", "ep", "eq"], focus: ["ep", "eq"],
          note: "Bring a test charge in from infinity toward a point charge Q, integrate −E·dL, and the potential at distance R comes out as V = Q/(4πε₀R), with V = 0 at infinity. On the plate, 1 m from +2 µC, V = 17975 V. That is the same number as E's size there, but with units of volts, not volts per metre. The coincidence holds only at R = 1 m.",
          claims: [{ instance: "ep", readout: "V", value: 17975.1, unit: "V" }],
        },
        {
          id: "falloff", title: "It falls as 1/R, not 1/R²", patch: { ep: { point: [2, 0, 0] } }, focus: ["ep"],
          note: "At 2 m the potential is half as much, 8988 V; the field fell to a quarter. Potential is one integration of the field, so it loses one power of R: E goes as 1/R², V as 1/R. This is the most common slip in potential questions.",
          claims: [{ instance: "ep", readout: "V", value: 8987.55, unit: "V" }],
        },
        {
          id: "scalar", title: "Potentials add as numbers", patch: { q: EX5, ep: { point: [1, 0, 1], oblique: true, drawScale: 0.3 } }, focus: ["q", "ep"],
          note: "Potential is a scalar, so superposition is simple addition: no unit vectors, no components. Each charge contributes Qᵢ/(4πε₀|r − rᵢ|), with its sign. For lecture Example 5, −4 µC at (2, −1, 3) and +5 µC at (0, 4, −2) give V = −5.864 kV at (1, 0, 1). The lecture's −5.872 kV used 1/(4πε₀) ≈ 9 × 10⁹; with ε₀ = 8.854 × 10⁻¹², it is −5.864 kV.",
          claims: [{ instance: "ep", readout: "V", value: -5863.59, unit: "V" }],
        },
        {
          id: "sphere", title: "A charged sphere", patch: { q: { items: [pt("a", 200000, [0, 0, 0], "Q = +200 mC")], oblique: false, drawScale: 1 }, ep: { point: [0.064, 0, 0], oblique: false, drawScale: 10 } }, focus: ["ep"],
          note: "Outside a charged metal sphere, the charge acts as if it sits at the centre, so on the surface V = Q/(4πε₀R) with R the sphere's radius. The mid-semester test's 12.8 cm sphere holding +200 mC has R = 0.064 m and V = 2.809 × 10¹⁰ V, about 28 GV: an absurd voltage, because 200 mC is an enormous charge for a small sphere.",
          claims: [{ instance: "ep", readout: "V", value: 2.80861e10, unit: "V" }],
        },
      ],
      examples: [
        {
          id: "basic", level: "basic", title: "V at 1 m and 2 m",
          setup: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], oblique: false, drawScale: 1 }, ep: { point: [1, 0, 0], oblique: false, drawScale: 1 } },
          problem: "Find the potential 1 m and 2 m from a +2 µC point charge, with V = 0 at infinity.",
          lines: [
            { text: "At 1 m: V = 8.988 × 10⁹ × 2 × 10⁻⁶ / 1 = 17975 V.", focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: 17975.1, unit: "V" }] },
            { text: "At 2 m: half as much, 8988 V.", patch: { ep: { point: [2, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: 8987.55, unit: "V" }] },
          ],
          trap: "Quartering V at twice the distance. That is the field's rule; V halves.",
        },
        {
          id: "ex5", level: "tutorial", title: "Lecture 2b Example 5",
          setup: { q: EX5, ep: { point: [1, 0, 1], oblique: true, drawScale: 0.3 } },
          problem: "Point charges −4 µC and +5 µC are at (2, −1, 3) and (0, 4, −2). Calculate V at (1, 0, 1), taking V = 0 at infinity.",
          lines: [
            { text: "|r − r₁| = |(−1, 1, −2)| = √6 and |r − r₂| = |(1, −4, 3)| = √26.", focus: ["q"] },
            { text: "V = 8.988 × 10⁹ × 10⁻⁶ × (−4/√6 + 5/√26) = 8988 × (−1.633 + 0.9806).", focus: ["ep"] },
            { text: "V = −5864 V = −5.864 kV (the lecture's −5.872 kV used k = 9 × 10⁹).", focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: -5863.59, unit: "V" }] },
          ],
          covers: ["lecture:lec2b-ex5"],
          trap: "Taking absolute values of the charges. The −4 µC term must stay negative, or V comes out positive.",
        },
        {
          id: "mst2c", level: "exam", title: "MST Q2(c): a charged sphere",
          setup: { q: { items: [pt("a", 200000, [0, 0, 0], "Q = +200 mC")], oblique: false, drawScale: 1 }, ep: { point: [0.064, 0, 0], oblique: false, drawScale: 10 } },
          problem: "A thin metallic sphere of diameter 12.8 cm is charged to +200 mC. Calculate V at its surface.",
          lines: [
            { text: "Radius R = 12.8/2 cm = 0.064 m.", focus: ["ep"], givens: [{ value: 0.064, unit: "m" }] },
            { text: "V = Q/(4πε₀R) = 8.988 × 10⁹ × 0.2 / 0.064 = 2.809 × 10¹⁰ V ≈ 28.1 GV.", focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: 2.80861e10, unit: "V" }] },
          ],
          covers: ["mst-2324-q2c"],
          trap: "Using the diameter (0.128 m) halves the answer. The formula wants the radius.",
        },
      ],
      asks: [
        { id: "vector", q: "Does potential have a direction?", tags: ["V_VECTOR"], a: "No. V is a scalar: one number at each point. That is exactly why superposing potentials is easier than superposing fields: just add the numbers, signs included." },
        { id: "inverse", q: "Why 1/R and not 1/R²?", tags: ["V_INVERSE_SQUARE"], a: "V is the integral of E along a path from infinity. Integrating 1/R² gives 1/R. One integration, one power of R lost." },
        { id: "negative", q: "Can the potential be negative?", a: "Yes, near negative charges. With V = 0 at infinity, a negative charge makes its surroundings negative, just as a positive one makes them positive." },
        { id: "zero-point", q: "Can V be zero where E isn't?", a: "Yes. Midway between +Q and −Q, their potentials cancel, but their fields add, pointing from + to −." },
        { id: "sphere-inside", q: "What is V inside the metal sphere?", a: "The same as on its surface. Inside a conductor E = 0, so no work is done moving around inside, and V stays constant at the surface value." },
        { id: "units", q: "V or kV or GV?", a: "Match the size: the lecture's answers use kV for thousands of volts, and GV (10⁹ V) appears for the mid-semester sphere. Keep four significant figures." },
      ],
      checks: [
        {
          id: "falloff-c", title: "Check: how V falls", show: ["q", "ep", "eq"], patch: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], oblique: false, drawScale: 1 }, ep: { point: [1, 0, 0], oblique: false, drawScale: 1 } },
          note: "Four checks on potentials. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "falloff-c", type: "choose", prompt: "A point charge's potential falls with distance as…", dimension: "recognition",
            options: [
              choice("r", "1/R", true, "Right: V = Q/(4πε₀R)."),
              choice("r2", "1/R²", false, "That's E. V has one less power of R.", "V_INVERSE_SQUARE"),
              choice("const", "not at all", false, "V falls to zero at infinity."),
            ] },
        },
        {
          id: "predict-3", title: "Check: three times as far",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-3", type: "predict-drag", prompt: "The probe moves from 1 m to 3 m from the +2 µC charge. Drag V to your prediction.", target: { instance: "ep", readout: "V" }, range: [0, 20000], unit: "V", relTol: 0.05, reveal: { ep: { point: [3, 0, 0] } }, dimension: "conceptual", tag: "V_INVERSE_SQUARE",
            feedback: { close: "Right: a third, 5992 V.", far: "V ∝ 1/R: a third, 5992 V." } },
        },
        {
          id: "v-num", title: "Check: a potential, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "v-num", type: "numeric", prompt: vp.prompt, answer: vp.spec.answer, distractors: vp.spec.distractors, relTol: vp.spec.relTol, hints: vp.hints, template: "v-point", dimension: "computational" },
        },
        {
          id: "add", title: "Check: combining potentials",
          note: "Last one.",
          interaction: { id: "add", type: "choose", prompt: "To find V from several point charges…", dimension: "conceptual",
            options: [
              choice("sum", "add each Qᵢ/(4πε₀Rᵢ) as a signed number", true, "Right: potential is a scalar."),
              choice("vec", "add them as vectors, component by component", false, "V has no components.", "V_VECTOR"),
              choice("biggest", "use the nearest charge only", false, "Every charge contributes."),
            ] },
          covers: ["lecture:lec2b-ex5"],
        },
      ],
      recap: {
        points: [
          "Point charge: V = Q/(4πε₀R), with V = 0 at infinity; it falls as 1/R.",
          "Potentials add as signed scalars.",
          "Outside a charged sphere, V is that of a point charge at the centre; on the surface, use its radius.",
        ],
        traps: ["1/R² instead of 1/R.", "Dropping a charge's sign.", "The diameter in place of the radius."],
      },
    },
  ],
});
```

The `predict-3` value is 17975.1/3 = 5991.7 V. The `sphere` step's ep drawScale of 10 puts the probe 0.64 m from the centre on the plate; the model uses the true 0.064 m.

- [ ] **Step 4: Register.**
  - In `plates/index.ts`, add both plates.
  - In `concepts/electrostatics.ts`, remove the `locked("em1.electrostatics.potential", …)` line.
  - In `index.ts`, import `{ potentialConcept }` and add it after `divergence`.
  - Run `pnpm vitest run packages/course-em1 && pnpm typecheck`. Expected: PASS. Two lint details:
    - "17975 V" is backed by `V`, but V isn't linted anyway; claims cover it.
    - The "1 m" and "2 m" in the notes are backed by the probe params.

- [ ] **Step 5: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): potential concept; Ideas 1 and 2, work and potential difference (Example 4), point potentials (Example 5, MST Q2(c))

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 4: Ideas ③ and ④ (E = −∇V; energy)

**Files:** Create `plates/idea-grad-v.ts` and `plates/idea-energy.ts`. Append both to potential `main`, and register them.

- [ ] **Step 1: `plates/idea-grad-v.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const S3 = Math.sqrt(3);

export const ideaGradV = defineIdeaPlate({
  id: "idea-grad-v",
  title: "E = −∇V, and D from V",
  requires: { objectives: [2], items: ["mst-2324-q5a", "f2425-q1c", "f2324-q1b"], misconceptions: ["GRAD_SIGN"] },
  instances: [
    { id: "sl", component: "scalar-slice", params: { field: "ex4-V", probe: [1, 0, 1], plane: "xz", offset: 0 } },
    { id: "eq", component: "equation", params: eqp(R`\mathbf E=-\nabla V,\qquad \mathbf D=\varepsilon\mathbf E=-\varepsilon\nabla V`, "E equals minus grad V, and D equals minus epsilon grad V") },
  ],
  ideas: [
    {
      id: "grad-v",
      title: "E = −∇V, and D from V",
      objectives: [2],
      explain: [
        {
          id: "downhill", title: "The field points downhill", show: ["sl", "eq"], focus: ["sl", "eq"],
          note: "Since V_AB = −∫E·dL, the field is minus the potential's gradient: E = −∇V. The gradient points uphill in V, so E points straight downhill, from high potential to low, perpendicular to the equipotentials. On the plate, V = −(xy + 2z), the potential behind Example 4's field. At (1, 0, 1), ∇V = (0, −1, −2), so E = (0, 1, 2): exactly y âₓ + x âᵧ + 2 âz there.",
          claims: [{ instance: "sl", readout: "g1", value: 0, unit: "" }, { instance: "sl", readout: "g2", value: -1, unit: "" }, { instance: "sl", readout: "g3", value: -2, unit: "" }],
        },
        {
          id: "cart", title: "Cartesian: Finals 2024-25 Q1(c)", patch: { sl: { field: "f2425-1c", probe: [2, -2, 1], offset: -2 } }, focus: ["sl"],
          note: "V = x³ sin y + 10z² kV. The gradient is (3x² sin y, x³ cos y, 20z) kV/m. At P(2, −2, 1) it is (−10.91, −3.329, 20.00) kV/m. So E = −∇V = 10.91âₓ + 3.329âᵧ − 20.00âz kV/m, and D = εE = ε(10.91âₓ + 3.329âᵧ − 20.00âz) × 10³ C/m², where ε is the region's permittivity, left as a symbol because the paper doesn't give it.",
          claims: [{ instance: "sl", readout: "g1", value: -10.9116, unit: "" }, { instance: "sl", readout: "g2", value: -3.32917, unit: "" }, { instance: "sl", readout: "g3", value: 20, unit: "" }],
        },
        {
          id: "cyl", title: "Cylindrical: MST Q5(a)", patch: { sl: { field: "mst-5a", probe: [-2, 0, 3], offset: 0 } }, focus: ["sl"],
          note: "V = ρ²z³ + 5z cos φ volts. The cylindrical gradient is (2ρz³, −5z sin φ/ρ, 3ρ²z² + 5 cos φ). At P(2, π, 3), sin φ = 0 and cos φ = −1, giving ∇V = (108, 0, 103). So E = −108âρ − 103âz V/m. The 1/ρ on the φ-term didn't matter here only because sin π = 0; it always has to be there.",
          claims: [{ instance: "sl", readout: "g1", value: 108, unit: "" }, { instance: "sl", readout: "g3", value: 103, unit: "" }],
        },
        {
          id: "sph", title: "Spherical: Finals 2023-24 Q1(b)(i)", patch: { sl: { field: "f2324-1b", probe: [0, -2.5 * S3, 2.5], offset: -2.5 * S3 } }, focus: ["sl"],
          note: "V = r³ sin θ cos φ. The spherical gradient is (3r² sin θ cos φ, r² cos θ cos φ, −r² sin φ). At P(5, π/3, −π/2), cos φ = 0 and sin φ = −1, leaving ∇V = 25âφ. So E = −25âφ V/m and, in free space, D = ε₀E = −2.214 × 10⁻¹⁰ âφ C/m². The point's cartesian position is (0, −4.330, 2.5) m, which is where the plate's probe sits.",
          claims: [{ instance: "sl", readout: "g3", value: 25, unit: "" }],
        },
      ],
      examples: [
        {
          id: "ex4v", level: "basic", title: "From V back to Example 4's field",
          setup: { sl: { field: "ex4-V", probe: [1, 0, 1], offset: 0 } },
          problem: "Given V = −(xy + 2z), find E at B(1, 0, 1).",
          lines: [
            { text: "∇V = (−y, −x, −2).", focus: ["sl"] },
            { text: "At B: ∇V = (0, −1, −2), so E = −∇V = âᵧ + 2âz V/m.", focus: ["sl"], claims: [{ instance: "sl", readout: "g2", value: -1, unit: "" }, { instance: "sl", readout: "g3", value: -2, unit: "" }] },
          ],
          trap: "Reporting ∇V as the field. E is its negative.",
        },
        {
          id: "mst5a", level: "tutorial", title: "MST Q5(a)",
          setup: { sl: { field: "mst-5a", probe: [-2, 0, 3], offset: 0 } },
          problem: "(i) State the equation relating E and V. (ii) Given V = ρ²z³ + 5z cos φ volts, find E at P(2, π, 3).",
          lines: [
            { text: "(i) E = −∇V.", focus: ["eq"] },
            { text: "∂V/∂ρ = 2ρz³ = 108; (1/ρ)∂V/∂φ = −5z sin φ/ρ = 0; ∂V/∂z = 3ρ²z² + 5 cos φ = 108 − 5 = 103.", focus: ["sl"], claims: [{ instance: "sl", readout: "g1", value: 108, unit: "" }, { instance: "sl", readout: "g3", value: 103, unit: "" }] },
            { text: "(ii) E = −108âρ − 103âz V/m.", focus: ["sl"] },
          ],
          covers: ["mst-2324-q5a"],
          trap: "cos π = −1, not 1. Getting 113 instead of 103 means the sign of cos φ was lost.",
        },
        {
          id: "f2425", level: "exam", title: "Finals 2024-25 Q1(c): D from V",
          setup: { sl: { field: "f2425-1c", probe: [2, -2, 1], offset: -2 } },
          problem: "In a region of permittivity ε, V = x³ sin y + 10z² kV. (i) Develop an expression for D in C·m⁻². (ii) Evaluate D at P(2, −2, 1) m.",
          lines: [
            { text: "(i) D = εE = −ε∇V = −ε(3x² sin y âₓ + x³ cos y âᵧ + 20z âz) × 10³ C/m² (the 10³ converts kV to V).", focus: ["sl", "eq"] },
            { text: "At P: ∇V = (−10.91, −3.329, 20.00) kV/m.", focus: ["sl"], claims: [{ instance: "sl", readout: "g1", value: -10.9116, unit: "" }, { instance: "sl", readout: "g2", value: -3.32917, unit: "" }, { instance: "sl", readout: "g3", value: 20, unit: "" }] },
            { text: "(ii) D = ε(10.91âₓ + 3.329âᵧ − 20.00âz) × 10³ C/m².", focus: ["sl"] },
          ],
          covers: ["f2425-q1c"],
          trap: "Forgetting the 10³ from kV. D comes out a thousand times too small.",
        },
      ],
      asks: [
        { id: "minus", q: "Why the minus sign in E = −∇V?", tags: ["GRAD_SIGN"], a: "∇V points toward increasing potential, but a positive charge is pushed toward lower potential, the way a ball rolls downhill. E points the way a positive charge is pushed, so it is the negative gradient." },
        { id: "equip", q: "What are equipotential surfaces?", a: "Surfaces of constant V. E is always perpendicular to them, and moving a charge along one costs no work." },
        { id: "units", q: "Why is ∇V in V/m?", a: "Differentiating volts with respect to metres gives volts per metre, which is exactly the unit of E. With V in kV, the gradient is in kV/m." },
        { id: "eps", q: "Why leave ε as a symbol?", a: "Finals 2024-25 Q1(c) gives no numerical permittivity, so the honest answer keeps ε. In free space it would be ε₀ = 8.854 × 10⁻¹² F/m." },
        { id: "which-sys", q: "How do I choose the gradient formula?", a: "Match V's variables: x, y, z means cartesian; ρ, φ, z means cylindrical; r, θ, φ means spherical. Then read the point's coordinates in the same system." },
        { id: "check", q: "How can I check my E?", a: "Two quick checks: E should point from higher V to lower V, and its units should be V/m. Also, the curl of −∇V must be zero." },
      ],
      checks: [
        {
          id: "sign", title: "Check: the relation", show: ["sl", "eq"], patch: { sl: { field: "ex4-V", probe: [1, 0, 1], offset: 0 } },
          note: "Four checks on E from V. Get each right to move on.",
          interaction: { id: "sign", type: "choose", prompt: "E and V are related by…", dimension: "recognition",
            options: [
              choice("right", "E = −∇V", true, "Right: E points downhill in potential."),
              choice("plus", "E = ∇V", false, "The gradient points uphill; E points downhill.", "GRAD_SIGN"),
              choice("int", "E = ∫V dL", false, "The integral goes the other way: V = −∫E·dL."),
            ] },
          covers: ["mst-2324-q5a"],
        },
        {
          id: "mst-ez", title: "Check: MST Q5(a), E_z",
          note: "One component.",
          interaction: { id: "mst-ez", type: "numeric", prompt: "V = ρ²z³ + 5z cos φ volts. Find E_z at P(2, π, 3).", answer: { value: -103, unit: "V/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 103, unit: "V/m", errorClass: "sign", tag: "GRAD_SIGN", feedback: "E = −∇V: negate the gradient." }, { value: -113, unit: "V/m", errorClass: "sign", feedback: "cos π = −1, so 5 cos φ = −5." }],
            hints: ["E_z = −∂V/∂z.", "∂V/∂z = 3ρ²z² + 5 cos φ.", "3(4)(9) − 5 = 103."] },
          covers: ["mst-2324-q5a"],
        },
        {
          id: "f2324-d", title: "Check: Finals 2023-24 Q1(b)(i)",
          note: "D in free space, from V.",
          interaction: { id: "f2324-d", type: "numeric", prompt: "V = r³ sin θ cos φ volts, in free space. Find D_φ at P(5, π/3, −π/2), in C/m².", answer: { value: -2.2135e-10, unit: "C/m^2" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 2.2135e-10, unit: "C/m^2", errorClass: "sign", tag: "GRAD_SIGN", feedback: "D = −ε₀∇V; the gradient's φ-part is +25." }],
            hints: ["(1/(r sin θ))∂V/∂φ = −r² sin φ.", "At φ = −π/2, that is +25.", "D_φ = −ε₀ × 25."] },
          covers: ["f2324-q1b"],
        },
        {
          id: "f2425-dz", title: "Check: Finals 2024-25 Q1(c)",
          note: "Last one: the z-part, in units of ε.",
          interaction: { id: "f2425-dz", type: "numeric", prompt: "V = x³ sin y + 10z² kV in a region of permittivity ε. D_z at P(2, −2, 1) equals ε × (?) × 10³. Give the number in the bracket.", answer: { value: -20, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 20, unit: "", errorClass: "sign", tag: "GRAD_SIGN", feedback: "D = −ε∇V, so the z-part is −20z." }],
            hints: ["∂V/∂z = 20z.", "At z = 1, that is 20.", "Negate."] },
          covers: ["f2425-q1c"],
        },
      ],
      recap: {
        points: [
          "E = −∇V: the field points downhill in potential, perpendicular to equipotentials.",
          "D = εE = −ε∇V; keep ε symbolic if the paper gives none.",
          "Use the gradient formula of V's own coordinate system, scale factors included.",
          "Carry unit prefixes: V in kV gives E in kV/m.",
        ],
        traps: ["Dropping the minus sign.", "cos π = −1, not +1.", "Losing the 10³ from kV."],
      },
    },
  ],
});
```

The spherical probe position is (5 sin 60° cos(−90°), 5 sin 60° sin(−90°), 5 cos 60°) = (0, −4.330, 2.5), and the slice offset is y = −4.330. `nativeOf` returns φ in [0, 2π), so φ = 270°, where cos φ = 0 and sin φ = −1, the same as −π/2. The gradient's φ-component is +25, as claimed.

- [ ] **Step 2: `plates/idea-energy.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const wm = instantiate(templates.find((t) => t.id === "work-move")!, 1);
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const EX5 = { items: [pt("a", -4, [2, -1, 3], "Q1 = −4 µC"), pt("b", 5, [0, 4, -2], "Q2 = +5 µC")], oblique: true, drawScale: 0.3 };

export const ideaEnergy = defineIdeaPlate({
  id: "idea-energy",
  title: "Energy: moving charges and systems of charges",
  requires: { objectives: [3], items: ["f2324-q1b"], misconceptions: ["WORK_SIGN"] },
  instances: [
    { id: "q", component: "charges", params: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")] } },
    { id: "ep", component: "e-probe", params: { point: [2, 0, 0] }, links: { charges: "q" } },
    { id: "fc", component: "coulomb-force", params: { on: "b" }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`W=Q\,(V_{\text{end}}-V_{\text{start}})`, speech: "W equals Q times V end minus V start", shortSpeech: "work from potential" } },
  ],
  ideas: [
    {
      id: "energy",
      title: "Energy: moving charges and systems of charges",
      objectives: [3],
      explain: [
        {
          id: "move", title: "Moving a charge: W = QΔV", show: ["q", "ep", "eq"], focus: ["ep", "eq"],
          givens: [{ value: 1, unit: "m" }, { value: 1, unit: "µC" }],
          note: "Once V is known, work is arithmetic: W = Q(V_end − V_start), with no path integral. Near a +2 µC charge, V = 8988 V at 2 m and 17975 V at 1 m. Bringing a +1 µC charge from 2 m in to 1 m costs W = 10⁻⁶ × (17975 − 8988) = 8.988 × 10⁻³ J. It's positive because we push like charges together.",
          claims: [{ instance: "ep", readout: "V", value: 8987.55, unit: "V" }],
        },
        {
          id: "pair", title: "The energy of a pair", show: ["fc"], patch: { q: EX5, ep: { point: [1, 0, 1], oblique: true, drawScale: 0.3 }, fc: { on: "b", oblique: true, drawScale: 0.3 }, eq: { latex: R`W_E=\dfrac{Q_1Q_2}{4\pi\varepsilon_0R_{12}}`, speech: "the energy of a pair is Q1 Q2 over four pi epsilon nought R", shortSpeech: "pair energy" } }, focus: ["q", "fc", "eq"],
          note: "Assembling charges costs energy. Bring the first in for free, then the second against the first one's potential: W_E = Q1Q2/(4πε₀R12). For Example 5's pair, −4 µC and +5 µC are √54 = 7.348 m apart, giving W_E = −0.02446 J. It's negative because opposite charges attract, so assembling them releases energy.",
          claims: [{ instance: "fc", readout: "U", value: -0.024461, unit: "J" }],
        },
        {
          id: "system", title: "Many charges: add every pair", patch: { eq: { latex: R`W_E=\sum_{\text{pairs}}\dfrac{Q_iQ_j}{4\pi\varepsilon_0R_{ij}}=\tfrac12\sum_i Q_iV_i`, speech: "the system energy is the sum over pairs, or one half the sum of Q V", shortSpeech: "system energy" } }, focus: ["eq"],
          note: "For three or more charges, add the energy of every pair once. For three charges that is three terms: 12, 13 and 23. An equivalent form is W_E = ½ΣQᵢVᵢ, where Vᵢ is the potential at charge i due to all the others. The ½ stops each pair being counted twice. This is the electric potential energy the revision guide lists for stationary point charges.",
        },
        {
          id: "zero", title: "When the answer is zero", givens: [{ value: 10, unit: "µC" }], patch: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], oblique: false, drawScale: 1 }, ep: { point: [2, 0, 0], oblique: false, drawScale: 1 }, eq: { latex: R`V=r^3\sin\theta\cos\phi:\quad V(\theta=0^\circ)=0,\ \ V(\phi=90^\circ)=0`, speech: "V is zero at theta zero and at phi ninety degrees", shortSpeech: "zero potential points" } }, focus: ["eq"],
          note: "Finals 2023-24 Q1(b)(ii) moves 10 µC from X(2, 0°, 100°) to Y(5, 45°, 90°) in V = r³ sin θ cos φ. At X, sin 0° = 0, so V_X = 0. At Y, cos 90° = 0, so V_Y = 0. The work is 10 µC × (0 − 0) = 0 J. The field is not zero along the way; the path simply begins and ends on the same equipotential. Look for that before grinding through numbers.",
        },
      ],
      examples: [
        {
          id: "move", level: "basic", title: "Bringing a charge closer",
          setup: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], oblique: false, drawScale: 1 }, ep: { point: [2, 0, 0], oblique: false, drawScale: 1 } },
          problem: "A +2 µC charge is fixed at the origin. Find the work to bring +1 µC from 2 m to 1 m from it.",
          givens: [{ value: 1, unit: "m" }, { value: 1, unit: "µC" }],
          lines: [
            { text: "V_start = V(2 m) = 8988 V.", focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: 8987.55, unit: "V" }] },
            { text: "V_end = V(1 m) = 17975 V.", patch: { ep: { point: [1, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: 17975.1, unit: "V" }] },
            { text: "W = 10⁻⁶ × (17975 − 8988) = 8.988 × 10⁻³ J.", focus: ["ep"] },
          ],
          trap: "Subtracting in the wrong order gives −8.988 mJ. W = Q(V_end − V_start).",
        },
        {
          id: "pair", level: "tutorial", title: "Example 5's pair: the energy stored",
          setup: { q: EX5, ep: { point: [1, 0, 1], oblique: true, drawScale: 0.3 }, fc: { on: "b", oblique: true, drawScale: 0.3 } },
          problem: "−4 µC at (2, −1, 3) and +5 µC at (0, 4, −2). Find the electric potential energy of the pair.",
          lines: [
            { text: "R12 = |(0, 4, −2) − (2, −1, 3)| = |(−2, 5, −5)| = √54 = 7.348 m.", focus: ["q"], givens: [{ value: Math.sqrt(54), unit: "m" }] },
            { text: "W_E = 8.988 × 10⁹ × (−4 × 10⁻⁶)(5 × 10⁻⁶)/7.348 = −0.02446 J.", focus: ["fc"], claims: [{ instance: "fc", readout: "U", value: -0.024461, unit: "J" }] },
          ],
          trap: "Squaring R as in Coulomb's force law. Energy uses R, not R².",
        },
        {
          id: "f2324", level: "exam", title: "Finals 2023-24 Q1(b)(ii)",
          setup: { eq: { latex: R`V=r^3\sin\theta\cos\phi`, speech: "V equals r cubed sine theta cosine phi", shortSpeech: "the given potential" } },
          problem: "In a region where V = r³ sin θ cos φ volts, calculate the energy required to move a 10 µC charge from X(2, 0°, 100°) to Y(5, 45°, 90°).",
          givens: [{ value: 10, unit: "µC" }],
          lines: [
            { text: "V_X = 2³ × sin 0° × cos 100° = 0, because sin 0° = 0.", focus: ["eq"] },
            { text: "V_Y = 5³ × sin 45° × cos 90° = 0, because cos 90° = 0.", focus: ["eq"] },
            { text: "W = Q(V_Y − V_X) = 10 × 10⁻⁶ × (0 − 0) = 0 J. No work: X and Y lie on the same equipotential.", focus: ["eq"] },
          ],
          covers: ["f2324-q1b"],
          trap: "Computing a path integral or using degrees for r. Check V at the endpoints first; here both vanish.",
        },
      ],
      asks: [
        { id: "sign-w", q: "What does positive W mean when moving a charge?", tags: ["WORK_SIGN"], a: "You supplied energy, which is now stored in the configuration. Negative W means the field supplied it: the charge moved where it wanted to go." },
        { id: "path", q: "Do I need the path to find the work?", a: "Not when V is known: W = Q(V_end − V_start). The path matters only if you insist on doing the line integral, and even then every path gives the same answer." },
        { id: "half", q: "Where does the ½ in ½ΣQV come from?", a: "ΣQᵢVᵢ counts each pair twice, once from each end. Halving it counts each pair once." },
        { id: "negative-energy", q: "What does negative potential energy mean?", a: "The system is bound: it would take positive work to pull the charges apart to infinity. Opposite charges together always give negative pair energy." },
        { id: "evolt", q: "What is an electronvolt?", a: "The energy one electron gains crossing 1 V: 1.602 × 10⁻¹⁹ J. It's handy for single particles; this course uses joules." },
        { id: "equip", q: "Why is no work done along an equipotential?", a: "V doesn't change along it, so Q(V_end − V_start) = 0. The field there is perpendicular to your motion and never pushes along it." },
      ],
      checks: [
        {
          id: "formula", title: "Check: work from potentials", show: ["q", "ep", "eq"], hide: ["fc"], patch: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], oblique: false, drawScale: 1 }, ep: { point: [2, 0, 0], oblique: false, drawScale: 1 }, eq: { latex: R`W=Q\,(V_{\text{end}}-V_{\text{start}})`, speech: "W equals Q times V end minus V start", shortSpeech: "work from potential" } },
          note: "Four checks on energy. Get each right to move on.",
          interaction: { id: "formula", type: "choose", prompt: "The work to move Q from A to B is…", dimension: "recognition",
            options: [
              choice("right", "Q(V_B − V_A)", true, "Right: end minus start."),
              choice("flip", "Q(V_A − V_B)", false, "That's the field's work, not ours.", "WORK_SIGN"),
              choice("sum", "Q(V_A + V_B)", false, "Only the difference matters."),
            ] },
        },
        {
          id: "move-num", title: "Check: moving a charge, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "move-num", type: "numeric", prompt: wm.prompt, answer: wm.spec.answer, distractors: wm.spec.distractors, relTol: wm.spec.relTol, hints: wm.hints, template: "work-move", dimension: "computational" },
        },
        {
          id: "f2324-w", title: "Check: Finals 2023-24 Q1(b)(ii)",
          note: "Look before you calculate.",
          interaction: { id: "f2324-w", type: "numeric", prompt: "V = r³ sin θ cos φ. Energy to move 10 µC from X(2, 0°, 100°) to Y(5, 45°, 90°), in J?", answer: { value: 0, unit: "J" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 8.84e-4, unit: "J", errorClass: "conceptual", feedback: "Check V at each end: sin 0° = 0 at X and cos 90° = 0 at Y." }],
            hints: ["Find V_X and V_Y.", "Both contain a factor that vanishes.", "W = Q × 0."] },
          covers: ["f2324-q1b"],
        },
        {
          id: "pair-sign", title: "Check: a pair's sign",
          note: "Last one.",
          interaction: { id: "pair-sign", type: "choose", prompt: "The potential energy of +3 µC and −3 µC held 1 m apart is…", dimension: "conceptual",
            options: [
              choice("neg", "negative", true, "Right: opposite charges attract, so assembling them releases energy."),
              choice("pos", "positive", false, "Q1Q2 < 0 makes the energy negative.", "WORK_SIGN"),
              choice("zero", "zero", false, "Only if they were infinitely far apart."),
            ] },
        },
      ],
      recap: {
        points: [
          "Moving a charge: W = Q(V_end − V_start); no path is needed.",
          "A pair's energy: W_E = Q1Q2/(4πε₀R12), negative for opposite charges.",
          "Many charges: add every pair once, or ½ΣQᵢVᵢ.",
          "Endpoints on one equipotential mean W = 0.",
        ],
        traps: ["V_start − V_end.", "R² in the energy formula.", "Grinding numbers when both potentials vanish."],
      },
    },
  ],
});
```

Two lint details:
- The `move` note's "8988 V" and "17975 V" are not linted (the unit is V). The `ep` readouts back them anyway.
- The `f2324-w` distractor 8.84e-4 is an illustrative wrong value: what a student gets from V_Y alone with sin/cos in radians. It is not a claimed physical quantity.

- [ ] **Step 3: Register both** in `plates/index.ts` and append them to potential `main`. Run `pnpm vitest run packages/course-em1 && pnpm typecheck`. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): potential Ideas 3 and 4, E = −∇V (MST Q5(a), Finals Q1(c), Finals 23-24 Q1(b)) and energy

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 5: The current concept, and Ideas ⑤ and ⑥

**Files:**
- Create: `concepts/current.ts`, `plates/idea-ohm.ts`, `plates/idea-continuity.ts`
- Modify: `concepts/electrostatics.ts` (remove `locked("em1.electrostatics.current", …)`), `index.ts` (add `currentConcept` after `potentialConcept`), `plates/index.ts`

- [ ] **Step 1: The concept**

```ts
import { meta, src } from "../sources";

const ID = "em1.electrostatics.current";
const L2C = "UTech ELE3001 Lec 2c slides (G. D. Boswell)";
export const currentConcept = {
  id: ID,
  title: "Current density, continuity and Ohm's law",
  unit: 2,
  objectives: [
    "Relate current, current density and conductivity: I = ∫J·dS, J = σE, R = L/(σS), P = I²R.",
    "State, prove and apply the continuity equation ∇·J = −∂ρv/∂t.",
  ],
  prerequisites: [{ conceptId: "em1.electrostatics.field", minMastery: 0.3 }, { conceptId: "em1.electrostatics.divergence", minMastery: 0.3 }],
  misconceptions: [
    { tag: "J_AREA", description: "Divides current by the circumference or diameter instead of the cross-sectional area.", remediation: `${ID}/main` },
    { tag: "CONTINUITY_SIGN", description: "Drops the minus sign: thinks outflow increases the enclosed charge.", remediation: `${ID}/main` },
  ],
  examLinks: [{ paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q4(b)", marks: 5, weight: 1 }],
  sources: [src(L2C, "Current and Ohm's law")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Current and continuity (in depth)",
      minutes: 40,
      blocks: [
        { ...meta("vivid", src(L2C, "Current density")), id: "idea-ohm", type: "plate" as const, plateId: "idea-ohm" },
        { ...meta("vivid", src(L2C, "Continuity")), id: "idea-continuity", type: "plate" as const, plateId: "idea-continuity" },
      ],
    },
  ],
};
```

- [ ] **Step 2: `plates/idea-ohm.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const cd = instantiate(templates.find((t) => t.id === "current-density")!, 1);
const ow = instantiate(templates.find((t) => t.id === "ohm-wire")!, 1);
const CU = { radius: 1e-3, length: 1000, sigma: 5.8e7, current: 10 };
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaOhm = defineIdeaPlate({
  id: "idea-ohm",
  title: "Current density and Ohm's law in point form",
  requires: { objectives: [0], items: ["f2425-q4a", "f2324-q4a"], misconceptions: ["J_AREA"] },
  instances: [
    { id: "wire", component: "conductor", params: CU },
    { id: "eq", component: "equation", params: eqp(R`I=\int_S\mathbf J\cdot d\mathbf S,\qquad \mathbf J=\sigma\mathbf E`, "I equals the flux of J, and J equals sigma E") },
  ],
  ideas: [
    {
      id: "ohm",
      title: "Current density and Ohm's law in point form",
      objectives: [0],
      explain: [
        {
          id: "j", title: "Current density: amps per square metre", show: ["wire", "eq"], focus: ["wire", "eq"],
          note: "Current is charge per second through a surface. Current density J says how that current is spread over the surface: amps per square metre, with a direction. The total current is the flux of J, I = ∫J·dS. When J is uniform across a round wire, I = J × πa². On the plate, 10 A in a copper wire of 1 mm radius gives |J| = 3.183 × 10⁶ A/m².",
          claims: [{ instance: "wire", readout: "J", value: 3.1831e6, unit: "A/m^2" }],
        },
        {
          id: "point-ohm", title: "Ohm's law, point by point: J = σE", focus: ["wire", "eq"], patch: { eq: eqp(R`\mathbf J=\sigma\mathbf E\quad\Longleftrightarrow\quad\mathbf E=\mathbf J/\sigma`, "J equals sigma E") },
          note: "In a conductor the field drives the free electrons, and the current density is proportional to it: J = σE, where σ is the conductivity in siemens per metre. Copper's σ = 5.8 × 10⁷ S/m is huge, so a tiny field drives a large current. Here E = J/σ = 0.05488 V/m. This is Ohm's law in point form; the familiar V = IR follows from it.",
          claims: [{ instance: "wire", readout: "E", value: 0.054881, unit: "V/m" }],
        },
        {
          id: "resistance", title: "From point form to R = L/(σS)", focus: ["wire"], patch: { eq: eqp(R`V=EL=\dfrac{J}{\sigma}L=\dfrac{I}{\sigma S}L\ \Rightarrow\ R=\dfrac{L}{\sigma S}`, "R equals L over sigma S") },
          note: "Integrate over a uniform wire of length L and cross-section S. The voltage is V = EL, and E = J/σ = I/(σS), so V = I × L/(σS). The resistance is R = L/(σS). The plate's 1 km of 1 mm-radius copper has R = 5.488 Ω. Longer wires resist more; thicker and more conductive ones resist less.",
          claims: [{ instance: "wire", readout: "R", value: 5.4881, unit: "Ω" }],
        },
        {
          id: "joule", title: "Power: Joule heating", focus: ["wire"], patch: { eq: eqp(R`P=I^2R=\int\mathbf E\cdot\mathbf J\,dv,\qquad p=\sigma E^2`, "P equals I squared R") },
          note: "The field does work pushing charge through the resistance, and it appears as heat: P = I²R = 548.8 W in the plate's wire. Point by point, the power density is p = E·J = σE² watts per cubic metre, here 1.747 × 10⁵ W/m³. That is why thin wires carrying big currents get hot: J is large, and p grows as J²/σ.",
          claims: [{ instance: "wire", readout: "P", value: 548.81, unit: "W" }, { instance: "wire", readout: "pd", value: 174692, unit: "W/m^3" }],
        },
      ],
      examples: [
        {
          id: "f2425", level: "basic", title: "Finals 2024-25 Q4(a)(ii): J in a conductor",
          setup: { wire: { radius: 0.008, length: 1, sigma: 5.8e7, current: 50 } },
          problem: "A long straight conductor of radius 8.00 mm carries I = 50.0 A, uniformly distributed, along z. Find J within the conductor.",
          lines: [
            { text: "Cross-section: S = π(0.008)² = 2.011 × 10⁻⁴ m².", focus: ["wire"] },
            { text: "J = I/S = 50/(2.011 × 10⁻⁴) = 2.487 × 10⁵ âz A/m².", focus: ["wire"], claims: [{ instance: "wire", readout: "J", value: 248680, unit: "A/m^2" }] },
          ],
          covers: ["f2425-q4a"],
          trap: "Dividing by the circumference 2πr gives 994.7: that's current per metre, not per square metre.",
        },
        {
          id: "copper", level: "tutorial", title: "A copper wire: J, E and R",
          setup: { wire: CU },
          problem: "10 A flows in 1 km of copper wire (σ = 5.8 × 10⁷ S/m) of radius 1 mm. Find J, E and R.",
          lines: [
            { text: "J = 10/(π × 10⁻⁶) = 3.183 × 10⁶ A/m².", focus: ["wire"], claims: [{ instance: "wire", readout: "J", value: 3.1831e6, unit: "A/m^2" }] },
            { text: "E = J/σ = 3.183 × 10⁶ / 5.8 × 10⁷ = 0.05488 V/m.", focus: ["wire"], claims: [{ instance: "wire", readout: "E", value: 0.054881, unit: "V/m" }] },
            { text: "R = L/(σS) = 1000/(5.8 × 10⁷ × π × 10⁻⁶) = 5.488 Ω. Check: V = IR = 54.88 V = E × L.", focus: ["wire"], claims: [{ instance: "wire", readout: "R", value: 5.4881, unit: "Ω" }] },
          ],
          trap: "Using the 2 mm diameter as the radius gives S four times too big, so J and R come out a quarter of the right values.",
        },
        {
          id: "f2324", level: "exam", title: "Finals 2023-24 Q4(a)(i), then heating",
          setup: { wire: { radius: 0.0005, length: 1, sigma: 5.8e7, current: 8 } },
          problem: "An 8.0 A d.c. current flows uniformly in a straight conductor of radius 0.50 mm. (i) Find J. Then, if the conductor is copper, find the power dissipated per metre.",
          lines: [
            { text: "S = π(5 × 10⁻⁴)² = 7.854 × 10⁻⁷ m², so J = 8/S = 1.019 × 10⁷ âz A/m².", focus: ["wire"], claims: [{ instance: "wire", readout: "J", value: 1.01859e7, unit: "A/m^2" }] },
            { text: "Per metre, R = 1/(σS) = 0.02195 Ω, so P = I²R = 64 × 0.02195 = 1.405 W.", focus: ["wire"], claims: [{ instance: "wire", readout: "R", value: 0.0219524, unit: "Ω" }, { instance: "wire", readout: "P", value: 1.40495, unit: "W" }] },
          ],
          covers: ["f2324-q4a"],
          trap: "Leaving the radius in mm: 0.50 mm is 5 × 10⁻⁴ m, and squaring it gives 2.5 × 10⁻⁷, not 0.25.",
        },
      ],
      asks: [
        { id: "area", q: "Which area do I divide by?", tags: ["J_AREA"], a: "The cross-section the current crosses: πa² for a round wire, with a the radius. Not the circumference, and not the surface area of the wire's side." },
        { id: "sigma", q: "What sets σ?", a: "How many free charges a material has and how easily they drift. Copper has about 10²⁹ free electrons per cubic metre, so it conducts superbly; glass has almost none." },
        { id: "conductor-e", q: "Isn't E zero inside a conductor?", a: "In electrostatics, yes: once charges stop moving. With a steady current flowing, a small E is needed to keep the charges drifting against collisions, and J = σE." },
        { id: "drift", q: "How fast do electrons actually move?", a: "Slowly: J = ρv·v, and with copper's enormous charge density a few amps need drift speeds of only millimetres per second. The signal travels near light speed; the electrons don't." },
        { id: "resistivity", q: "What's resistivity?", a: "1/σ, in ohm-metres. R = L/(σS) is often written R = ρcL/S, with ρc the resistivity; the lecture uses both forms." },
        { id: "heat", q: "Why do thin wires get hotter?", a: "For the same current, a thinner wire has a larger J, and power density σE² = J²/σ grows as J². Halve the radius and J quadruples, so the heating per volume rises sixteen-fold." },
      ],
      checks: [
        {
          id: "area-c", title: "Check: J", show: ["wire", "eq"], patch: { wire: CU },
          note: "Four checks on current and Ohm's law. Get each right to move on.",
          interaction: { id: "area-c", type: "choose", prompt: "Uniform current I in a round wire of radius a gives |J| =", dimension: "recognition",
            options: [
              choice("right", "I / (πa²)", true, "Right: current per unit cross-sectional area."),
              choice("circ", "I / (2πa)", false, "That's per unit circumference, which is the wrong unit.", "J_AREA"),
              choice("diam", "I / (π(2a)²)", false, "Use the radius, not the diameter.", "J_AREA"),
            ] },
        },
        {
          id: "j-num", title: "Check: J, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "j-num", type: "numeric", prompt: cd.prompt, answer: cd.spec.answer, distractors: cd.spec.distractors, relTol: cd.spec.relTol, hints: cd.hints, template: "current-density", dimension: "computational" },
          covers: ["f2425-q4a"],
        },
        {
          id: "r-num", title: "Check: a wire's resistance",
          note: "Another wire.",
          interaction: { id: "r-num", type: "numeric", prompt: ow.prompt, answer: ow.spec.answer, distractors: ow.spec.distractors, relTol: ow.spec.relTol, hints: ow.hints, template: "ohm-wire", dimension: "computational" },
        },
        {
          id: "f2324-j", title: "Check: Finals 2023-24 Q4(a)(i)",
          note: "Last one.",
          interaction: { id: "f2324-j", type: "numeric", prompt: "8.0 A flows uniformly in a straight conductor of radius 0.50 mm. Find |J| in A/m².", answer: { value: 1.0186e7, unit: "A/m^2" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 2.5465e6, unit: "A/m^2", errorClass: "conceptual", tag: "J_AREA", feedback: "That uses 1 mm, the diameter, as the radius." }],
            hints: ["S = πa², a = 5 × 10⁻⁴ m.", "S = 7.854 × 10⁻⁷ m².", "J = 8 / S."] },
          covers: ["f2324-q4a"],
        },
      ],
      recap: {
        points: [
          "J is current per unit cross-sectional area (A/m²); I = ∫J·dS, or JπA for a uniform round wire.",
          "Ohm's law in point form: J = σE.",
          "R = L/(σS); P = I²R; power density p = σE² = J²/σ.",
        ],
        traps: ["Dividing by the circumference or the diameter.", "Leaving mm unconverted before squaring.", "Treating E = 0 in a current-carrying conductor."],
      },
    },
  ],
});
```

Two checks by hand:
- For 0.5 mm radius and 1 m of copper: 1/(5.8e7 × 7.853982e-7) = 0.0219524 Ω. With 8 A, P = 64 × 0.0219524 = 1.40495 W.
- The `f2324-j` distractor: 8/(π × 1e-6) = 2.5465e6.

- [ ] **Step 3: `plates/idea-continuity.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const cr = instantiate(templates.find((t) => t.id === "continuity-rate")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaContinuity = defineIdeaPlate({
  id: "idea-continuity",
  title: "The continuity equation",
  requires: { objectives: [1], items: ["f2425-q4b", "hw04-2425-4.1"], misconceptions: ["CONTINUITY_SIGN"] },
  instances: [
    { id: "vs", component: "vector-slice", params: { field: "cont-5x", plane: "xz", probe: [0.6, 0, 0.3], offset: 0, box: 0.6 } },
    { id: "eq", component: "equation", params: eqp(R`\oint_S\mathbf J\cdot d\mathbf S=-\dfrac{dQ_{\text{enc}}}{dt}`, "the current out of a closed surface equals minus the rate of change of the enclosed charge") },
  ],
  ideas: [
    {
      id: "continuity",
      title: "The continuity equation",
      objectives: [1],
      explain: [
        {
          id: "conservation", title: "Charge can't vanish", show: ["vs", "eq"], focus: ["vs", "eq"],
          note: "Charge is conserved: it can't be created or destroyed, only moved. So if current flows out of a closed surface, the charge inside must fall by exactly that much: ∮J·dS = −dQ_enc/dt. The minus sign is the whole point. Net outflow (a positive flux of J) means the enclosed charge is decreasing. On the plate, J = 5x âₓ spreads out, so charge is draining from every box.",
          claims: [{ instance: "vs", readout: "boxRatio", value: 5, unit: "" }],
        },
        {
          id: "point", title: "The point form", patch: { eq: eqp(R`\nabla\cdot\mathbf J=-\dfrac{\partial\rho_v}{\partial t}`, "divergence of J equals minus the rate of change of rho v") }, focus: ["vs", "eq"],
          note: "Apply the divergence theorem to the left side and write Q_enc = ∫ρv dv on the right: ∫∇·J dv = −∫∂ρv/∂t dv. This holds for every volume, however small, so the integrands must match: ∇·J = −∂ρv/∂t. For J = 5x âₓ, ∇·J = 5, so ∂ρv/∂t = −5 C/m³ every second, everywhere.",
          claims: [{ instance: "vs", readout: "div", value: 5, unit: "" }],
        },
        {
          id: "steady", title: "Steady currents: Kirchhoff's current law", patch: { vs: { field: "uniform", box: 0.6 } }, focus: ["vs"],
          note: "When nothing is changing, ∂ρv/∂t = 0, so ∇·J = 0: every bit of current that flows into a region flows out again. The plate's uniform current has zero divergence, and each box shows zero net outflow. Shrink a region to a circuit node and this is Kirchhoff's current law: the currents into a node sum to zero.",
          claims: [{ instance: "vs", readout: "boxRatio", value: 0, unit: "" }],
        },
      ],
      examples: [
        {
          id: "basic", level: "basic", title: "Reading ∂ρv/∂t from J",
          setup: { vs: { field: "cont-5x", box: 0.6, probe: [0.6, 0, 0.3] } },
          problem: "J = 5x âₓ A/m². Find ∂ρv/∂t.",
          lines: [
            { text: "∇·J = ∂(5x)/∂x = 5.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 5, unit: "" }] },
            { text: "Continuity: ∂ρv/∂t = −∇·J = −5 C/m³ per second. The charge density is falling everywhere.", focus: ["vs"] },
          ],
          trap: "Reporting +5. Current spreading out means charge leaving, so the density falls.",
        },
        {
          id: "proof", level: "tutorial", title: "Finals 2024-25 Q4(b): the proof",
          setup: { vs: { field: "cont-5x", box: 0.6 } },
          problem: "By considering conservation of charge, prove the continuity equation in point form, ∇·J = −∂ρv/∂t.",
          lines: [
            { text: "Conservation: the current leaving a closed surface S equals the rate at which the enclosed charge falls: ∮_S J·dS = −dQ/dt.", focus: ["eq"] },
            { text: "Write Q = ∫_V ρv dv, so −dQ/dt = −∫_V ∂ρv/∂t dv (the volume is fixed).", focus: ["eq"] },
            { text: "Divergence theorem on the left: ∮_S J·dS = ∫_V ∇·J dv.", focus: ["eq"] },
            { text: "So ∫_V (∇·J + ∂ρv/∂t) dv = 0 for every volume V; hence ∇·J = −∂ρv/∂t. ∎", focus: ["eq"] },
          ],
          covers: ["f2425-q4b"],
          trap: "Skipping 'for every volume'. That step is what lets you drop the integral and equate the integrands.",
        },
        {
          id: "state", level: "exam", title: "HW04 4.1(a): state it, and use it",
          setup: { vs: { field: "uniform", box: 0.6 } },
          problem: "State the current continuity equation and express it mathematically. What does it say about a steady (d.c.) current?",
          lines: [
            { text: "Statement: the net current flowing out of any closed surface equals the rate of decrease of the charge it encloses.", focus: ["eq"] },
            { text: "Integral form: ∮J·dS = −dQ/dt. Point form: ∇·J = −∂ρv/∂t.", focus: ["eq"] },
            { text: "For steady currents ∂ρv/∂t = 0, so ∇·J = 0: current neither accumulates nor vanishes anywhere (Kirchhoff's current law).", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 0, unit: "" }] },
          ],
          covers: ["hw04-2425-4.1"],
          trap: "Writing ∇·J = ∂ρv/∂t without the minus sign. That would let charge appear from nowhere.",
        },
      ],
      asks: [
        { id: "minus", q: "Why the minus sign?", tags: ["CONTINUITY_SIGN"], a: "Positive ∮J·dS means current flowing out. If charge leaves, what's inside decreases, so dQ/dt is negative. The minus sign makes both sides agree." },
        { id: "kcl", q: "How is this Kirchhoff's current law?", a: "For steady currents ∇·J = 0. Integrate over a tiny region around a circuit node: the currents in equal the currents out." },
        { id: "maxwell", q: "Where does continuity show up in Maxwell's equations?", a: "It is built in. Take the divergence of Ampère's law with the displacement current and continuity drops out. Maxwell added the displacement current precisely so that it would." },
        { id: "conductor", q: "What happens to charge placed inside a conductor?", a: "Continuity plus J = σE plus Gauss's law gives ∂ρv/∂t = −(σ/ε)ρv: the charge decays away, moving to the surface. In copper this takes about 10⁻¹⁹ s." },
        { id: "units", q: "What are the units of ∂ρv/∂t?", a: "C/m³ per second, which is A/m³: the same as ∇·J, amps per square metre per metre." },
        { id: "proof-marks", q: "What earns the marks in the proof?", a: "Four moves: conservation stated as ∮J·dS = −dQ/dt; Q written as ∫ρv dv; the divergence theorem; and 'true for every volume, so the integrands are equal'." },
      ],
      checks: [
        {
          id: "sign", title: "Check: the sign", show: ["vs", "eq"], patch: { vs: { field: "cont-5x", box: 0.6 } },
          note: "Four checks on continuity. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "sign", type: "choose", prompt: "The continuity equation in point form is…", dimension: "recognition",
            options: [
              choice("right", "∇·J = −∂ρv/∂t", true, "Right: outflow means falling density."),
              choice("plus", "∇·J = ∂ρv/∂t", false, "That would let charge grow as it flows out.", "CONTINUITY_SIGN"),
              choice("zero", "∇·J = 0 always", false, "Only for steady currents."),
            ] },
          covers: ["hw04-2425-4.1"],
        },
        {
          id: "predict-steady", title: "Check: a steady current",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-steady", type: "predict-drag", prompt: "Switch to a uniform current J = âₓ. Drag the net outflow per unit volume to your prediction.", target: { instance: "vs", readout: "boxRatio" }, range: [-5, 10], unit: "", relTol: 0.05, reveal: { vs: { field: "uniform" } }, dimension: "conceptual",
            feedback: { close: "Right: zero. Steady and uniform, so nothing accumulates.", far: "A uniform J has zero divergence: 0." } },
        },
        {
          id: "rate-num", title: "Check: a rate, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "rate-num", type: "numeric", prompt: cr.prompt, answer: cr.spec.answer, distractors: cr.spec.distractors, relTol: cr.spec.relTol, hints: cr.hints, template: "continuity-rate", dimension: "computational" },
        },
        {
          id: "proof-step", title: "Check: the key step",
          note: "Last one.",
          interaction: { id: "proof-step", type: "choose", prompt: "In the proof, which step turns ∮J·dS into a volume integral?", dimension: "application",
            options: [
              choice("div", "The divergence theorem", true, "Right: ∮J·dS = ∫∇·J dv."),
              choice("stokes", "Stokes' theorem", false, "Stokes relates a line integral to a surface integral."),
              choice("gauss", "Coulomb's law", false, "Coulomb's law says nothing about current."),
            ] },
          covers: ["f2425-q4b"],
        },
      ],
      recap: {
        points: [
          "Charge is conserved: ∮J·dS = −dQ_enc/dt.",
          "Point form: ∇·J = −∂ρv/∂t, via the divergence theorem, true for every volume.",
          "Steady currents: ∇·J = 0, which is Kirchhoff's current law.",
        ],
        traps: ["Dropping the minus sign.", "Skipping 'for every volume' in the proof.", "Assuming ∇·J = 0 when charge is changing."],
      },
    },
  ],
});
```

- [ ] **Step 4: Register.**
  - In `plates/index.ts`, add both plates.
  - Remove the `locked(…current…)` line.
  - In `index.ts`, add `currentConcept` after `potentialConcept`.
  - Run `pnpm vitest run packages/course-em1 && pnpm typecheck`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): current concept; Ohm's law in point form (Finals Q4(a)) and continuity (Finals 24-25 Q4(b), HW04 4.1)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 6: Coverage, e2e and axe

- [ ] **Step 1: Extend coverage.**
  - In `f3-coverage.test.ts`, add `"em1.electrostatics.potential"` and `"em1.electrostatics.current"` to the loop.
  - Add the assertions:

    ```ts
    expect(mainOf("em1.electrostatics.potential")).toEqual(["idea-work", "idea-v-point", "idea-grad-v", "idea-energy"]);
    expect(mainOf("em1.electrostatics.current")).toEqual(["idea-ohm", "idea-continuity"]);
    ```

  - Run `pnpm vitest run packages/course-em1`. Expected: PASS.

- [ ] **Step 2: e2e** at `app/apps/web/e2e/potential-current.spec.ts`. Mirror G1's kicker test over the six blocks:
  - `idea-work`: "The work we do", "Explanation 1 of 4"
  - `idea-v-point`: "V = Q/(4πε₀R)", "1 of 4"
  - `idea-grad-v`: "The field points downhill", "1 of 4"
  - `idea-energy`: "Moving a charge: W = QΔV", "1 of 4"
  - `idea-ohm`: "Current density: amps per square metre", "1 of 4"
  - `idea-continuity`: "Charge can't vanish", "1 of 3"

  Also check that step 0 of `idea-work` shows "−0.96" or "-0.96" in `.readouts`. The `Readout` primitive formats negatives with "-" (ASCII), so match with `/[-−]0\.96/`.

- Add to `a11y.spec.ts`:
  - `concept("em1.electrostatics.potential", "mode=learn")`
  - `concept("em1.electrostatics.current", "mode=learn&lesson=main&block=idea-ohm")`

- [ ] **Step 3: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web packages/course-em1 && git commit -m "test: potential and current coverage, e2e and axe

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 7: Verification and handback

- [ ] Run the full suite.
- [ ] Walk each idea's first explanation and exam example at 1360×900:
  - The arc path should draw in the oblique view.
  - The conductor schematic should show J arrows.
  - The sphere step's potential should read 2.809×10¹⁰.
- [ ] Write the ledger line `Task 7: verification — <counts>` and stop for Claude's review.

## Self-Review Notes

- **Solved (Python/SymPy):**
  - Lecture Example 4: W = −0.96 J, on the arc and the chord alike.
  - Example 5: V = −5863.6 V (the lecture's −5871.7 V used k = 9 × 10⁹); pair energy −0.02446 J.
  - MST Q2(c): 2.8086 × 10¹⁰ V. MST Q5(a): ∇V = (108, 0, 103).
  - Finals 24-25 Q1(c): ∇V = (−10.9116, −3.32917, 20) kV/m.
  - Finals 23-24 Q1(b): ∇V = 25aφ, so D = −2.2135 × 10⁻¹⁰ aφ C/m²; V(X) = V(Y) = 0, so W = 0.
  - Copper: J = 3.1831 × 10⁶ A/m², E = 0.054881 V/m, R = 5.4881 Ω, P = 548.81 W, p = 1.7469 × 10⁵ W/m³.
  - J: Finals 24-25 Q4(a)(ii) 2.4868 × 10⁵ A/m²; Finals 23-24 Q4(a)(i) 1.01859 × 10⁷ A/m².
- **Coverage:** each idea owns one objective.
- **Ampère-side items** (f2425-q4a and f2324-q4a) are covered here only for their J parts. Plan 6b teaches H and B.
