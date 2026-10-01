# Forma Plan K: Magnetostatics at Full Depth (Wave 6b)

> **For agentic workers (Codex):** read `AGENTS.md` first. **Plans F1–J must be complete.** Transcribe the content exactly. Every value was solved independently in Python (`scratchpad/k_solve.py`; outputs in the Self-Review Notes) and cross-checked against the textbook's printed answers (Hayt's drill problems) and the lecturer's solutions.
>
> **Workflow rule (user, 2026-10-01): add no new test files and no new test cases.** The plates' claims are the tests: `validatePlate`/`validateIdeas` evaluate every claim against the model, so a wrong formula fails the existing suite. F2's finite-difference loop already checks every field in `fields.ts`. The only test edits allowed are the ones this plan names: inventories that must grow because they are exact lists.

**Spec:** `docs/superpowers/specs/2026-10-01-forma-emag-magnetostatics-dynamics-design.md`

**Goal:** eight in-depth ideas across three concepts.
- `em1.magnetostatics.ampere`, "Biot–Savart and Ampère's law" (unlocked):
  - ① H, B, flux and force
  - ② The Biot–Savart law
  - ③ Ampère's circuital law
  - ④ Curl and Stokes' theorem
- `em1.magnetostatics.materials`, "Magnetic materials and boundaries" (new):
  - ⑤ Magnetization, χm and μr
  - ⑥ Magnetic boundary conditions
- `em1.magnetostatics.inductance`, "Inductance and magnetic energy" (new):
  - ⑦ Self-inductance
  - ⑧ Magnetic energy and mutual inductance

**Textbook spine:**
- Wentworth Ch. 3:
  - 3.1 fields and the cross product; 3.2 Biot–Savart; 3.3 Ampère; 3.4 curl and the point form;
  - 3.5 flux density; 3.6 forces; 3.7 materials; 3.8 boundary conditions;
  - 3.9 inductance and magnetic energy; 3.10 magnetic circuits.
- Hayt Ch. 7–8 drill problems: these are lec3a's illustrative problems Q06–Q11.

**Sources (catalog ids):**
- `lec3a`: illustrative problems Q01–Q15.
- `lec3b`: inductance.
- Homework and tests: `hw03-2425` 3.1 and 3.3; `ict2-2425` Q1 and Q3.
- Finals: `f2425` Q3, Q4(a); `f2324` Q3, Q4(a); `f1415`; `f1516` Q2(c), Q4(c); `f1718` Q3, Q4; `f2425r` Q3.
- Drills: `drill25` Q8, Q9.
- Textbook item ids: `text:hayt-d7.2`, `text:went-ex3.8` and so on.

**Ledger:** `.superpowers/sdd/2026-10-01-forma-plan-k-magnetostatics/progress.md`

## Global Constraints

- Same as Plans F3, G1, H and I.
- **Lint.** The lint does not read A/m, T, µT, mT, Wb, H (henry), µH, mH, A, mm or cm. Lengths in m are backed by plate params, which count as metres. Magnetic values are backed by claims.
- **μ₀ = 4π × 10⁻⁷ H/m exactly**, as every course paper prints it. Add it to `constants.ts` as `MU0`.
- **Directions use the right-hand rule.** A current along −az, or a coil carrying current in −aφ, gives fields in −aφ or −az. Never quote a magnitude where the question wants a vector.
- **Magnetic boundaries assume K = 0** (no surface current), as every course question does.
- Angles are measured from the normal unless `measure: "tangent"`. HW03 3.3 and the lecturer measure from the normal; Drill 2025 Q8 and lec3a Q13–Q14 measure from the tangent or interface.

## Review Focus

1. **Enclosed current inside a conductor.** `currents` gives I_enc = I(ρ² − a²)/(b² − a²) for a ≤ ρ ≤ b, so H grows linearly inside a solid wire. Plate claims (Hayt D7.7: 1591.5 A/m at 0.5 mm, 3.2 mT at 0.8 mm) test this.
2. **Loop sign and position.** A loop with negative I (HW03's −aφ coil) gives Hz < 0 on its axis. HW03 3.1(a) at z = −50 cm: −128.0 az A/m.
3. **`mag-boundary` given H or B.**
   - Given H₁, it forms B₁ = μr1μ₀H₁ before calling `dielectricBoundary`.
   - Flipping the normal changes nothing.
   - μr = 1 gives M = 0 exactly: compute M = (B/μ₀)(1 − 1/μr).
4. **Inductor parameters per kind.** A coax without b, or a toroid without h, throws a clear error. The internal term is off by default, matching Hayt D8.12(a), which counts only the external flux.
5. **Rectangular Stokes loop.** `vector-slice` with `loop: 3, loopH: 2` round Hayt D7.6's rectangle 2 ≤ x ≤ 5, −1 ≤ y ≤ 1 gives circ = −126, matching the surface integral of the curl.

---

### Task 1: Physics, units and fields

**Files:**
- Modify: `app/packages/physics/src/constants.ts` (`MU0`), `app/packages/physics/src/boundary.ts` (`magneticBoundary`), `app/packages/physics/src/fields.ts` (four fields), `app/packages/physics/src/index.ts`
- Modify: `app/packages/engine/src/quantities.ts` (units)
- Create: `app/packages/physics/src/magnetics.ts`

- [ ] **Step 1: Constants and units.**
  - In `constants.ts`, add `export const MU0 = 4e-7 * Math.PI;`. If a `MU0` already exists, keep the existing one and log a ruling.
  - In `quantities.ts` `BASE`, add `T: "T", "A/m": "A/m", Wb: "Wb", H: "H",`. The existing prefix logic gives mT, µT, mH and µH. One hazard: "mA/m" reads as milli + A/m, which is what we want.

- [ ] **Step 2: `magnetics.ts`**

```ts
import { gaussLegendre } from "./quadrature";
import { cross, dot, norm, scale, sub, type Vec3 } from "./vec";

/** Steady currents. Lines may point anywhere; loops, cylinders and sheets are centred on the z axis. */
export type Current =
  | { kind: "line"; I: number; point: Vec3; dir: Vec3 }
  | { kind: "segment"; I: number; from: Vec3; to: Vec3 }
  | { kind: "loop"; I: number; N: number; radius: number; z: number }
  | { kind: "cylinder"; I: number; a: number; b: number }
  | { kind: "sheet"; K: number; radius: number };

const ZERO: Vec3 = [0, 0, 0];
const aphi = (p: Vec3): Vec3 => { const r = Math.hypot(p[0], p[1]); return r === 0 ? ZERO : [-p[1] / r, p[0] / r, 0]; };
/** Current inside the circle of radius ρ about the z axis from a z-axis-centred source (lines count when parallel to z). */
function inside(c: Current, rho: number): number {
  if (c.kind === "cylinder") return rho <= c.a ? 0 : rho >= c.b ? c.I : (c.I * (rho * rho - c.a * c.a)) / (c.b * c.b - c.a * c.a);
  if (c.kind === "sheet") return rho > c.radius ? 2 * Math.PI * c.radius * c.K : 0;
  if (c.kind === "line" && c.dir[0] === 0 && c.dir[1] === 0) return Math.hypot(c.point[0], c.point[1]) < rho ? c.I * Math.sign(c.dir[2]) : 0;
  return 0;
}

/** H (A/m) at p. Lines and segments in closed form; loops by 96-point Gauss–Legendre Biot–Savart; cylinders and sheets by Ampère. */
export function magneticFieldH(currents: readonly Current[], p: Vec3): Vec3 {
  let H: Vec3 = [0, 0, 0];
  const add = (v: Vec3) => { H = [H[0] + v[0], H[1] + v[1], H[2] + v[2]]; };
  for (const c of currents) {
    if (c.kind === "line" || c.kind === "segment") {
      const a = c.kind === "line" ? c.point : c.from;
      const u = c.kind === "line" ? scale(c.dir, 1 / norm(c.dir)) : scale(sub(c.to, c.from), 1 / norm(sub(c.to, c.from)));
      const r1 = sub(p, a);
      const rho = sub(r1, scale(u, dot(r1, u)));
      const d = norm(rho);
      if (d === 0) continue;
      const k = c.kind === "line" ? 2 : dot(r1, u) / norm(r1) - dot(sub(p, c.to), u) / norm(sub(p, c.to));
      add(scale(cross(u, scale(rho, 1 / d)), (c.I * k) / (4 * Math.PI * d)));
    } else if (c.kind === "loop") {
      const { nodes, weights } = gaussLegendre(96);
      for (let i = 0; i < 96; i++) {
        const f = Math.PI * (1 + nodes[i]!);
        const q: Vec3 = [c.radius * Math.cos(f), c.radius * Math.sin(f), c.z];
        const dl: Vec3 = [-c.radius * Math.sin(f), c.radius * Math.cos(f), 0];
        const r = sub(p, q);
        add(scale(cross(dl, r), (c.N * c.I * Math.PI * weights[i]!) / (4 * Math.PI * norm(r) ** 3)));
      }
    } else {
      const rho = Math.hypot(p[0], p[1]);
      if (rho > 0) add(scale(aphi(p), inside(c, rho) / (2 * Math.PI * rho)));
    }
  }
  return H;
}

/** Ampère: the current enclosed by the circle through p about the z axis. */
export const enclosedCurrentAt = (currents: readonly Current[], p: Vec3) => currents.reduce((s, c) => s + inside(c, Math.hypot(p[0], p[1])), 0);
export const hphiAt = (H: Vec3, p: Vec3) => dot(H, aphi(p));

/** Self-inductance, henries. Coax and two-wire take the length; internal adds μ/8π per metre of conductor. */
export const indCoax = (a: number, b: number, length: number, mur = 1, internal = false) => ((mur * 4e-7 * Math.PI) / (2 * Math.PI)) * (Math.log(b / a) + (internal ? 0.25 : 0)) * length;
export const indTwoWire = (a: number, s: number, length: number, mur = 1, internal = false) => ((mur * 4e-7 * Math.PI) / Math.PI) * (Math.log((s - a) / a) + (internal ? 0.25 : 0)) * length;
export const indSolenoid = (N: number, radius: number, length: number, mur = 1) => (mur * 4e-7 * Math.PI * N * N * Math.PI * radius * radius) / length;
/** Toroid of rectangular cross-section: inner radius a, outer radius b, height h. */
export const indToroid = (N: number, a: number, b: number, h: number, mur = 1) => ((mur * 4e-7 * Math.PI * N * N * h) / (2 * Math.PI)) * Math.log(b / a);
```

Checks:
- The coax internal term: μ/(8π) = (μ/2π) × ¼. The two-wire internal term is 2 × μ/(8π) = (μ/π) × ¼.
- The line case uses k = 2, so H = I/(2πd). The segment case uses k = sin α₂ − sin α₁, written with dot products.
- The `gaussLegendre` nodes are on [−1, 1], so f = π(1 + x) maps them onto [0, 2π], and dφ = π dx.
- If `cross`, `dot`, `sub` or `gaussLegendre` have different names in this package, use the existing names and log a ruling.

- [ ] **Step 3: `magneticBoundary`** in `boundary.ts`:

```ts
import { MU0 } from "./constants";

/** The magnetic twin of dielectricBoundary (K = 0): B ↔ D, H ↔ E, μr ↔ εr, M = (B/μ₀)(1 − 1/μr). Normal B and tangential H are continuous. */
export function magneticBoundary({ B1, normal, mur1, mur2 }: { B1: Vec3; normal: Vec3; mur1: number; mur2: number }) {
  const r = dielectricBoundary({ D1: B1, normal, er1: mur1, er2: mur2 });
  const k = EPS0 / MU0;
  return {
    n: r.n, B1n: r.D1n, B1t: r.D1t, B2: r.D2,
    H1: scale(r.E1, k), H2: scale(r.E2, k),
    M1: scale(r.P1, 1 / MU0), M2: scale(r.P2, 1 / MU0),
    theta1: r.theta1, theta2: r.theta2!,
  };
}
```

E = D/(εrε₀), so E·ε₀/μ₀ = B/(μrμ₀) = H. And P = D(1 − 1/εr), so P/μ₀ = (B/μ₀)(1 − 1/μr) = M.

- [ ] **Step 4: Fields** in `fields.ts` (vectorFields):

```ts
  "d7.6": V({ id: "d7.6", text: "H = 6xy ax − 3y² ay", latex: String.raw`\mathbf H=6xy\,\mathbf a_x-3y^2\,\mathbf a_y`, system: "cart",
    F: ([x, y]) => [6 * x * y, -3 * y * y, 0], div: () => 0, curl: ([x]) => [0, 0, -6 * x] }),
  "d7.5a": V({ id: "d7.5a", text: "H = x²z ay − y²x az", latex: String.raw`\mathbf H=x^2z\,\mathbf a_y-y^2x\,\mathbf a_z`, system: "cart",
    F: ([x, y, z]) => [0, x * x * z, -y * y * x], div: () => 0, curl: ([x, y, z]) => [-2 * x * y - x * x, y * y, 2 * x * z] }),
  "f1718-3c": V({ id: "f1718-3c", text: "H = yz(x² + y²) ax − y²xz ay + 4x²y² az", latex: String.raw`\mathbf H=yz(x^2+y^2)\,\mathbf a_x-y^2xz\,\mathbf a_y+4x^2y^2\,\mathbf a_z`, system: "cart",
    F: ([x, y, z]) => [y * z * (x * x + y * y), -y * y * x * z, 4 * x * x * y * y], div: () => 0,
    curl: ([x, y, z]) => [x * y * (8 * x + y), y * (x * x - 8 * x * y + y * y), -z * (x * x + 4 * y * y)] }),
  filament: V({ id: "filament", text: "H = (−y ax + x ay)/(2π(x² + y²)), a 1 A filament on z", latex: String.raw`\mathbf H=\dfrac{-y\,\mathbf a_x+x\,\mathbf a_y}{2\pi(x^2+y^2)}`, system: "cart",
    F: ([x, y]) => [-y / (2 * Math.PI * (x * x + y * y)), x / (2 * Math.PI * (x * x + y * y)), 0], div: () => 0, curl: () => [0, 0, 0] }),
```

F2's finite-difference loop checks all four at its sample points. If a sample point lies on the z axis, where `filament` is singular, move only `filament` out of that loop's sample set with a guard (`if (id === "filament" && x === 0 && y === 0) continue`), and log a ruling.

- [ ] **Step 5: Run** `pnpm test && pnpm typecheck`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages && git commit -m "feat(physics): Biot–Savart and Ampère fields of currents, magnetic boundary, inductance formulas, μ0; T, A/m, Wb, H units; curl fields for Hayt D7.5, D7.6 and Finals 17-18 Q3

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 2: Components and views

**Files:**
- Modify: `app/packages/plate/src/components/media.ts` (`currents`, `mag-boundary`, `inductor`; `boundary`'s `draw` gains `sym`/`mat`)
- Modify: `app/packages/plate/src/components/math.ts` (`vector-slice` `loopH`)
- Modify: `app/apps/web/components/plate/views3d.tsx`, `viewsMath.tsx`, `views2d.tsx`, `Readouts.tsx`

- [ ] **Step 1: `currents`**

```ts
const CurrentItem = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("line"), I: z.number(), point: V3.default([0, 0, 0]), dir: V3.default([0, 0, 1]) }),
  z.object({ id: z.string(), kind: z.literal("segment"), I: z.number(), from: V3, to: V3 }),
  z.object({ id: z.string(), kind: z.literal("loop"), I: z.number(), N: z.number().int().positive().default(1), radius: z.number().positive(), z: z.number().default(0) }),
  z.object({ id: z.string(), kind: z.literal("cylinder"), I: z.number(), a: z.number().min(0).default(0), b: z.number().positive() }),
  z.object({ id: z.string(), kind: z.literal("sheet"), K: z.number(), radius: z.number().positive() }),
]);

export const Currents = defineComponent({
  id: "currents",
  params: z.object({ items: z.array(CurrentItem), probe: V3, mur: z.number().positive().default(1), drawScale: z.number().positive().default(1) }),
  model: (p) => {
    const cs = p.items as Current[];
    const H = magneticFieldH(cs, p.probe);
    const Hmag = norm(H);
    return { Hx: H[0], Hy: H[1], Hz: H[2], Hmag, Hphi: hphiAt(H, p.probe), Bmag: p.mur * MU0 * Hmag, Ienc: enclosedCurrentAt(cs, p.probe) };
  },
  handles: ["probe"],
  readouts: { Hx: "A/m", Hy: "A/m", Hz: "A/m", Hmag: "A/m", Hphi: "A/m", Bmag: "T", Ienc: "A" },
  quotable: { Hx: "A/m", Hy: "A/m", Hz: "A/m", Hmag: "A/m", Hphi: "A/m", Bmag: "T", Ienc: "A" },
});
```

Import `magneticFieldH`, `enclosedCurrentAt`, `hphiAt`, `MU0` and the `Current` type from `@forma/physics`.

- [ ] **Step 2: `mag-boundary`**

```ts
const MGROUPS = {
  n: ["nx", "ny", "nz"],
  split: ["H1nx", "H1ny", "H1nz", "H1tx", "H1ty", "H1tz"],
  H: ["H1x", "H1y", "H1z", "H2x", "H2y", "H2z"],
  B: ["B1x", "B1y", "B1z", "B2x", "B2y", "B2z"],
  M: ["M1x", "M1y", "M1z", "M2x", "M2y", "M2z"],
  angles: ["th1", "th2"],
  mag: ["H1mag", "H2mag", "B1mag", "B2mag"],
} as const;
type MGroup = keyof typeof MGROUPS;
const munit = (k: string) => (k.startsWith("B") ? "T" : k.startsWith("th") ? "°" : k.startsWith("n") ? "" : "A/m");
const MAG_UNITS = Object.fromEntries(Object.values(MGROUPS).flat().map((k) => [k, munit(k)]));

export const MagBoundary = defineComponent({
  id: "mag-boundary",
  params: z.object({
    given: z.enum(["H", "B"]).default("H"), F1: V3, normal: V3, mur1: z.number().positive(), mur2: z.number().positive(),
    measure: z.enum(["normal", "tangent"]).default("normal"),
    show: z.array(z.enum(Object.keys(MGROUPS) as [MGroup, ...MGroup[]])).default(["split", "H", "angles"]),
    anchor: V3.default([0, 0, 0]),
  }),
  model: (p) => {
    const B1: Vec3 = p.given === "B" ? p.F1 : scale(p.F1, p.mur1 * MU0);
    const r = magneticBoundary({ B1, normal: p.normal, mur1: p.mur1, mur2: p.mur2 });
    const h1n = dot(r.H1, r.n);
    const H1n = scale(r.n, h1n);
    const H1t = sub(r.H1, H1n);
    const from = (t: number) => (p.measure === "normal" ? t : 90 - t);
    const v = (name: string, x: readonly number[]) => ({ [`${name}x`]: x[0]!, [`${name}y`]: x[1]!, [`${name}z`]: x[2]! });
    const all: Record<string, number> = {
      nx: r.n[0], ny: r.n[1], nz: r.n[2],
      ...v("H1n", H1n), ...v("H1t", H1t), ...v("H1", r.H1), ...v("H2", r.H2), ...v("B1", B1), ...v("B2", r.B2), ...v("M1", r.M1), ...v("M2", r.M2),
      th1: from(r.theta1), th2: from(r.theta2), H1mag: norm(r.H1), H2mag: norm(r.H2), B1mag: norm(B1), B2mag: norm(r.B2),
    };
    const out: Record<string, unknown> = { draw: { n: r.n, D1: B1, D2: r.B2, D1n: r.B1n, D1t: r.B1t, split: p.show.includes("split"), sym: "B", mat: "μr" } };
    for (const g of p.show) for (const k of MGROUPS[g]) out[k] = all[k];
    return out;
  },
  handles: [],
  readouts: MAG_UNITS,
  quotable: MAG_UNITS,
});
```

In `Boundary`'s model, add `sym: "D", mat: "εr"` to `draw`.

- [ ] **Step 3: `inductor`**

```ts
export const Inductor = defineComponent({
  id: "inductor",
  params: z.object({
    kind: z.enum(["coax", "twowire", "solenoid", "toroid"]),
    mur: z.number().positive().default(1), I: z.number().default(1), internal: z.boolean().default(false),
    a: z.number().positive().optional(), b: z.number().positive().optional(), s: z.number().positive().optional(),
    length: z.number().positive().optional(), N: z.number().positive().optional(), radius: z.number().positive().optional(), h: z.number().positive().optional(),
  }),
  model: (p) => {
    const need = (...k: (keyof typeof p)[]) => { for (const x of k) if (p[x] === undefined) throw new Error(`a ${p.kind} inductor needs ${k.join(", ")}`); };
    let L: number;
    if (p.kind === "coax") { need("a", "b", "length"); if (!(p.b! > p.a!)) throw new Error("a coax needs a < b"); L = indCoax(p.a!, p.b!, p.length!, p.mur, p.internal); }
    else if (p.kind === "twowire") { need("a", "s", "length"); if (!(p.s! > 2 * p.a!)) throw new Error("the wires overlap: s must exceed 2a"); L = indTwoWire(p.a!, p.s!, p.length!, p.mur, p.internal); }
    else if (p.kind === "solenoid") { need("N", "radius", "length"); L = indSolenoid(p.N!, p.radius!, p.length!, p.mur); }
    else { need("N", "a", "b", "h"); if (!(p.b! > p.a!)) throw new Error("a toroid needs a < b"); L = indToroid(p.N!, p.a!, p.b!, p.h!, p.mur); }
    return { L, link: L * p.I, W: 0.5 * L * p.I * p.I };
  },
  handles: [],
  readouts: { L: "H", link: "Wb", W: "J" },
  quotable: { L: "H", link: "Wb", W: "J" },
});

export const mediaComponents = [Boundary, Capacitor, Currents, MagBoundary, Inductor];
```

Replace the existing `mediaComponents` line with that last line.

- [ ] **Step 4: `vector-slice` rectangle.**
  - Add the param `loopH: z.number().min(0).optional()`.
  - Change `loopCirculation(F, c, s, i, j)` to take a width and a height, `loopCirculation(F, c, w, h, i, j)`, and update its body to walk a w × h rectangle centred on c (the square case is w = h = s).
  - In the model, call it with `(cart, c, p.loop, p.loopH ?? p.loop, …)` and set `circRatio = k / (p.loop * (p.loopH ?? p.loop))`.
  - In `VectorSliceView`, draw the rectangle with the same width and height.

- [ ] **Step 5: Views.**
  - **`BoundaryView`** (Plan I):
    - read `d.sym ?? "D"` and `d.mat ?? "εr"` for the arrow labels (`${sym}₁`, `${sym}₂`, `${sym}₁ₙ`, `${sym}₁ₜ`) and for the region text (`Region 1 · ${mat} = …`);
    - read `p.er1 ?? p.mur1` and `p.er2 ?? p.mur2`;
    - register `"mag-boundary": BoundaryView`.
  - **`CurrentsView`** (views3d), in plate coordinates scaled by `drawScale`:
    - a `line` is a long arrow from `point − 2.5·dir̂` to `point + 2.5·dir̂`, tone `charge`, labelled `${I} A`;
    - a `segment` is an arrow from `from` to `to`, tone `charge`;
    - a `loop` is a 48-point polyline circle at height z with an arrowhead showing the current's sense (reversed for negative I), labelled `${N} turns` when N > 1;
    - a `cylinder` is two circles of radius `a` and `b` at z = 0 with `url(#hatch-graphite)` between them (a solid disc when a = 0);
    - a `sheet` is a dashed circle of its radius;
    - at the probe, a dot plus an H arrow of length 0.8 along Ĥ, tone `field`, labelled "H".
    - `aria-label`: `Currents and the field H at the probe, |H| = ${Hmag.toPrecision(4)} A/m`.
  - **`InductorView`** (viewsMath), a schematic that is not to scale:
    - `coax`: two concentric circles with hatching between them;
    - `twowire`: two small discs a distance apart, labelled `s` and `2a`;
    - `solenoid`: twelve ellipses along a horizontal axis, labelled `N = …`;
    - `toroid`: a ring of two concentric circles with eight short winding strokes.
    - `aria-label`: `${kind} inductor, schematic`.
  - Register `currents`, `mag-boundary` and `inductor`.

- [ ] **Step 6: Labels** (`Readouts.tsx`):
  - `LABEL`:
    - `Hx: "H x", Hy: "H y", Hz: "H z", Hmag: "|H|", Hphi: "Hφ", Bmag: "|B|", Ienc: "I enclosed"`
    - `H1nx: "H₁ normal, x", H1ny: "H₁ normal, y", H1nz: "H₁ normal, z", H1tx: "H₁ tangential, x", H1ty: "H₁ tangential, y", H1tz: "H₁ tangential, z"`
    - `H1x: "H₁ x", H1y: "H₁ y", H1z: "H₁ z", H2x: "H₂ x", H2y: "H₂ y", H2z: "H₂ z"`
    - `B1x: "B₁ x", B1y: "B₁ y", B1z: "B₁ z", B2x: "B₂ x", B2y: "B₂ y", B2z: "B₂ z"`
    - `M1x: "M₁ x", M1y: "M₁ y", M1z: "M₁ z", M2x: "M₂ x", M2y: "M₂ y", M2z: "M₂ z"`
    - `H1mag: "|H₁|", H2mag: "|H₂|", B1mag: "|B₁|", B2mag: "|B₂|", L: "Inductance L", link: "Flux linkage LI"`
  - For `inductor`, label `W` "Stored energy W", the same override as `capacitor`.
  - `TONE`: `Hmag: "field", Hphi: "field", Bmag: "flux", Ienc: "charge", H2x: "field", H2y: "field", H2z: "field", B2x: "flux", B2y: "flux", B2z: "flux", L: "surface"`.

- [ ] **Step 7: Run** `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`. Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages apps/web && git commit -m "feat(plate): currents (Biot–Savart and Ampère), magnetic boundary, inductor; rectangular Stokes loop

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 3: Templates

**Files:** `app/packages/course-em1/src/templates.ts`. The existing 50-seed template loop covers new templates if it iterates over `templates`. If its id list is explicit, append these five ids to it (the one allowed edit to it).

- [ ] **Step 1: Implement.** Reuse `sig`.

```ts
const AMP = "em1.magnetostatics.ampere";
const MAT = "em1.magnetostatics.materials";
const IND = "em1.magnetostatics.inductance";
const MU = 4e-7 * Math.PI;

const bsFilament = defineTemplate<{ I: number; d: number }>({
  id: "bs-filament",
  params: { I: { min: 1, max: 20, step: 1 }, d: { min: 5, max: 50, step: 5 } },
  prompt: (p) => `An infinite straight filament carries ${p.I} A. Find |H| at ${p.d} cm from it, in A/m.`,
  solve: (p) => ({
    answer: { value: sig(p.I / (2 * Math.PI * (p.d / 100))), unit: "A/m" },
    distractors: [{ value: sig(p.I / (4 * Math.PI * (p.d / 100))), unit: "A/m", errorClass: "conceptual", tag: "H_B_UNITS", feedback: "That's half: an infinite filament gives I/(2πρ), not I/(4πρ)." }],
  }),
  hints: () => ["H = I/(2πρ), circling the wire.", "ρ in metres.", "No μ: H doesn't depend on the medium."],
  worked: (p) => [{ text: `H = ${p.I}/(2π × ${p.d / 100}) = ${sig(p.I / (2 * Math.PI * (p.d / 100)))} A/m.` }],
  dimension: "computational",
  tags: { concepts: [AMP], misconceptions: ["H_B_UNITS"], difficulty: 1 },
});

const ampInside = defineTemplate<{ I: number; a: number; k: number }>({
  id: "amp-inside",
  params: { I: { min: 5, max: 50, step: 5 }, a: { min: 2, max: 10, step: 1 }, k: { min: 1, max: 9, step: 1 } },
  prompt: (p) => `A solid round conductor of radius ${p.a} mm carries ${p.I} A, uniformly spread. Find |H| inside it at ρ = ${sig((p.a * p.k) / 10)} mm, in A/m.`,
  solve: (p) => {
    const a = p.a / 1000, r = (p.a * p.k) / 10000;
    return {
      answer: { value: sig((p.I * r) / (2 * Math.PI * a * a)), unit: "A/m" },
      distractors: [{ value: sig(p.I / (2 * Math.PI * r)), unit: "A/m", errorClass: "conceptual", tag: "AMP_ENC_INSIDE", feedback: "That uses the whole current. Inside, only the fraction (ρ/a)² is enclosed." }],
    };
  },
  hints: () => ["Ampère: H · 2πρ = I_enc.", "Uniform current: I_enc = I(ρ/a)².", "So H = Iρ/(2πa²)."],
  worked: (p) => [{ text: `I_enc = ${p.I} × (${p.k / 10})² A; H = Iρ/(2πa²) = ${sig((p.I * ((p.a * p.k) / 10000)) / (2 * Math.PI * (p.a / 1000) ** 2))} A/m.` }],
  dimension: "computational",
  tags: { concepts: [AMP], misconceptions: ["AMP_ENC_INSIDE"], difficulty: 2 },
});

const magBndNormal = defineTemplate<{ m1: number; m2: number; Hz: number }>({
  id: "mag-bnd-normal",
  params: { m1: { min: 1, max: 5, step: 1 }, m2: { min: 6, max: 12, step: 1 }, Hz: { min: 1, max: 9, step: 1 } },
  prompt: (p) => `The plane z = 0 separates region 1 (μr1 = ${p.m1}) from region 2 (μr2 = ${p.m2}), with no surface current. In region 1, H₁z = ${p.Hz} A/m at the boundary. Find H₂z.`,
  solve: (p) => ({
    answer: { value: sig((p.m1 * p.Hz) / p.m2), unit: "A/m" },
    distractors: [{ value: p.Hz, unit: "A/m", errorClass: "conceptual", tag: "MBND_SWAP", feedback: "Normal H isn't continuous; normal B is. So μ1H₁z = μ2H₂z." }],
  }),
  hints: () => ["z is normal to z = 0.", "Normal B is continuous: μ1H₁z = μ2H₂z.", "H₂z = (μr1/μr2)H₁z."],
  worked: (p) => [{ text: `B₂z = B₁z, so H₂z = (${p.m1}/${p.m2}) × ${p.Hz} = ${sig((p.m1 * p.Hz) / p.m2)} A/m.` }],
  dimension: "computational",
  tags: { concepts: [MAT], misconceptions: ["MBND_SWAP"], difficulty: 1 },
});

const indCoaxT = defineTemplate<{ a: number; b: number; mur: number }>({
  id: "ind-coax",
  params: { a: { min: 0.5, max: 2, step: 0.5 }, b: { min: 3, max: 10, step: 1 }, mur: { min: 1, max: 5, step: 1 } },
  prompt: (p) => `A coax has inner radius ${p.a} mm, outer radius ${p.b} mm and μr = ${p.mur} between the conductors. Find its external inductance per metre, in µH/m.`,
  solve: (p) => ({
    answer: { value: sig(((p.mur * MU) / (2 * Math.PI)) * Math.log(p.b / p.a) / 1e-6), unit: "µH/m" },
    distractors: [{ value: sig(((p.mur * MU) / (2 * Math.PI)) * Math.log10(p.b / p.a) / 1e-6), unit: "µH/m", errorClass: "conceptual", tag: "IND_LN", feedback: "That's log₁₀. The flux integral ∫dρ/ρ gives the natural log." }],
  }),
  hints: () => ["L' = (μ/2π) ln(b/a).", "μ/2π = μr × 2 × 10⁻⁷ H/m.", "Only b/a matters."],
  worked: (p) => [{ text: `L' = ${p.mur} × 2 × 10⁻⁷ × ln(${p.b}/${p.a}) = ${sig(((p.mur * MU) / (2 * Math.PI)) * Math.log(p.b / p.a) / 1e-6)} µH/m.` }],
  dimension: "computational",
  tags: { concepts: [IND], misconceptions: ["IND_LN"], difficulty: 1 },
});

const indSolenoidT = defineTemplate<{ N: number; len: number; r: number }>({
  id: "ind-solenoid",
  params: { N: { min: 100, max: 1000, step: 100 }, len: { min: 10, max: 50, step: 10 }, r: { min: 0.5, max: 2, step: 0.5 } },
  prompt: (p) => `An air-cored solenoid has ${p.N} turns, length ${p.len} cm and radius ${p.r} cm. Find L, in mH.`,
  solve: (p) => {
    const L = (MU * p.N * p.N * Math.PI * (p.r / 100) ** 2) / (p.len / 100);
    return {
      answer: { value: sig(L / 1e-3), unit: "mH" },
      distractors: [{ value: sig((L / p.N) / 1e-3), unit: "mH", errorClass: "conceptual", tag: "IND_TURNS", feedback: "L grows as N²: N turns make the field, and the flux links all N turns." }],
    };
  },
  hints: () => ["L = μN²S/ℓ.", "S = πr², with r in metres.", "N appears squared."],
  worked: (p) => [{ text: `L = 4π × 10⁻⁷ × ${p.N}² × π(${p.r / 100})² / ${p.len / 100} = ${sig((MU * p.N * p.N * Math.PI * (p.r / 100) ** 2) / (p.len / 100) / 1e-3)} mH.` }],
  dimension: "computational",
  tags: { concepts: [IND], misconceptions: ["IND_TURNS"], difficulty: 1 },
});
```

- Append the five to `templates`.
- Check by hand:
  - `bs-filament` with 15 A at 50 cm: 4.775 A/m.
  - `ind-solenoid` with 1000 turns, 50 cm, 1 cm: 4π × 10⁻⁷ × 10⁶ × π × 10⁻⁴ / 0.5 = 0.7896 mH.
- Units: "µH/m" resolves as µ + H/m. Add `"H/m": "H/m"` to `BASE` in the same commit if it doesn't resolve, and log a ruling.

- [ ] **Step 2: Run** `pnpm vitest run packages/course-em1 && pnpm typecheck`. Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages && git commit -m "feat(course-em1): templates for filament H, H inside a conductor, magnetic boundary, coax and solenoid inductance

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 4: The three concepts, and the bank remap

**Files:**
- Create: `app/packages/course-em1/src/concepts/magnetostatics.ts`
- Modify: `concepts/electrostatics.ts` (remove `locked("em1.magnetostatics.ampere", …)`), `index.ts`, `questions.ts`

- [ ] **Step 1: `concepts/magnetostatics.ts`.** Write the whole file now. Each concept is imported into the course only in the task that adds its plates: ampere in Task 5, materials in Task 6, inductance in Task 7. Until then, its `plateId` strings are not resolved.

```ts
import { meta, src } from "../sources";

const L3A = "UTech ELE3001 Lec 3a slides (G. D. Boswell)";
const L3B = "UTech ELE3001 Lec 3b slides (G. D. Boswell)";
const WENT3 = "Wentworth, Fundamentals of Electromagnetics with Engineering Applications, Ch. 3";
const plate = (id: string, where: string, ref = L3A) => ({ ...meta("vivid", src(ref, where)), id, type: "plate" as const, plateId: id });

const A = "em1.magnetostatics.ampere";
export const ampereConcept = {
  id: A,
  title: "Biot–Savart and Ampère's law",
  unit: 3,
  objectives: [
    "Relate H, B and magnetic flux (B = μH, Φ = ∫B·dS, ∮B·dS = 0), and find the force on a current, F = IL × B.",
    "Find H from currents with the Biot–Savart law: segments, infinite filaments, loops and N-turn coils.",
    "Use Ampère's circuital law for symmetric currents: wires inside and out, hollow cylinders, current sheets and the coax.",
    "Use the point form ∇ × H = J and Stokes' theorem.",
  ],
  prerequisites: [{ conceptId: "em1.electrostatics.current", minMastery: 0.3 }, { conceptId: "em1.math.vector-calculus", minMastery: 0.3 }],
  misconceptions: [
    { tag: "H_B_UNITS", description: "Mixes up H (A/m) and B (T), or puts μ into H.", remediation: `${A}/main` },
    { tag: "BS_DIRECTION", description: "Gets the direction of dL × aR wrong, or forgets the right-hand rule.", remediation: `${A}/main` },
    { tag: "AMP_ENC_INSIDE", description: "Uses the whole current inside a conductor instead of the enclosed fraction.", remediation: `${A}/main` },
    { tag: "CURL_ZERO", description: "Thinks ∇ × H is nonzero where there is no current.", remediation: `${A}/main` },
  ],
  examLinks: [
    { paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q3(a), Q4(a)", marks: 23, weight: 1 },
    { paper: "UTech ELE3001 Finals 2023-24 Sem 1", question: "Q3(b), Q4(a)", marks: 21, weight: 1 },
  ],
  sources: [src(L3A, "Biot–Savart and Ampère"), src(WENT3, "§3.1–3.6")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Biot–Savart and Ampère (in depth)",
      minutes: 90,
      blocks: [
        plate("idea-b-h-flux", "pp. 5–14; Wentworth §3.5–3.6"),
        plate("idea-biot-savart", "pp. 15–21; Wentworth §3.2"),
        plate("idea-ampere", "pp. 22–31; Wentworth §3.3"),
        plate("idea-curl-stokes", "pp. 32–33; Wentworth §3.4"),
      ],
    },
  ],
};

const M = "em1.magnetostatics.materials";
export const magMaterialsConcept = {
  id: M,
  title: "Magnetic materials and boundaries",
  unit: 3,
  objectives: [
    "Relate B, H and M: B = μ₀(H + M) = μrμ₀H, M = χmH.",
    "Apply the magnetic boundary conditions (normal B and tangential H continuous when K = 0) to find H₂, B₂ and the angles.",
  ],
  prerequisites: [{ conceptId: A, minMastery: 0.3 }, { conceptId: "em1.electrostatics.dielectrics", minMastery: 0.3 }],
  misconceptions: [
    { tag: "M_UNITS", description: "Gives M in tesla, or uses M = χmB.", remediation: `${M}/main` },
    { tag: "MBND_SWAP", description: "Treats tangential B or normal H as continuous.", remediation: `${M}/main` },
  ],
  examLinks: [
    { paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q3(b)", marks: 17, weight: 1 },
    { paper: "UTech ELE3001 Finals 2023-24 Sem 1", question: "Q3(c)", marks: 15, weight: 1 },
  ],
  sources: [src(L3A, "Magnetization and boundary conditions"), src(WENT3, "§3.7–3.8")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Magnetic materials and boundaries (in depth)",
      minutes: 50,
      blocks: [plate("idea-magnetization", "pp. 34–36; Wentworth §3.7"), plate("idea-mag-boundary", "pp. 37–44; Wentworth §3.8")],
    },
  ],
};

const I = "em1.magnetostatics.inductance";
export const inductanceConcept = {
  id: I,
  title: "Inductance and magnetic energy",
  unit: 3,
  objectives: [
    "Find self-inductance L = NΦ/I for the coax, two-wire line, solenoid and toroid.",
    "Find the stored energy W = ½LI², the energy density ½B·H, and mutual inductance.",
  ],
  prerequisites: [{ conceptId: A, minMastery: 0.3 }],
  misconceptions: [
    { tag: "IND_TURNS", description: "Uses N instead of N² in the inductance of a coil.", remediation: `${I}/main` },
    { tag: "IND_LN", description: "Uses log₁₀ in the coax or two-wire inductance.", remediation: `${I}/main` },
    { tag: "WM_HALF", description: "Drops the ½ in W = ½LI².", remediation: `${I}/main` },
  ],
  examLinks: [{ paper: "UTech ELE3001 Finals 2017-18 Sem 1", question: "Q4(b)", marks: 10, weight: 1 }],
  sources: [src(L3B, "Inductance"), src(WENT3, "§3.9–3.10")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Inductance and energy (in depth)",
      minutes: 40,
      blocks: [plate("idea-self-inductance", "pp. 5–21; Wentworth §3.9", L3B), plate("idea-mag-energy", "pp. 15, 25–27; Wentworth §3.9", L3B)],
    },
  ],
};
```

- [ ] **Step 2: Bank keys** (`questions.ts`): add `mat: "em1.magnetostatics.materials"` and `ind: "em1.magnetostatics.inductance"` to `K`.

The remaps themselves happen when each concept is registered (Tasks 6 and 7), so the bank test never sees a concept that doesn't exist.

- [ ] **Step 3: Run** `pnpm typecheck`. Expected: PASS. No commit yet: this file and the keys are committed with Task 5.

---
### Task 5: The Ampère concept's four ideas

**Files:**
- Create: `plates/idea-b-h-flux.ts`, `plates/idea-biot-savart.ts`, `plates/idea-ampere.ts`, `plates/idea-curl-stokes.ts`
- Modify: `plates/index.ts`, `index.ts` (register `ampereConcept`; remove `locked("em1.magnetostatics.ampere", …)` from `electrostatics.ts`)

Every plate file in Tasks 5–7 opens with the Plan I helpers:

```ts
const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
type V3 = [number, number, number];
```

- [ ] **Step 1: `plates/idea-b-h-flux.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice, eqp, V3 as above.
const bs = instantiate(templates.find((t) => t.id === "bs-filament")!, 1);
const S20 = Math.sqrt(20);
const WIRE = { items: [{ id: "w", kind: "line" as const, I: 15 }], probe: [S20, 0, 4] as V3, mur: 1, drawScale: 0.25 };

export const ideaBHFlux = defineIdeaPlate({
  id: "idea-b-h-flux",
  title: "H, B, flux and force",
  requires: { objectives: [0], items: ["text:hayt-d7.2", "text:hayt-d8.2", "lecture:lec3a-q10"], misconceptions: ["H_B_UNITS"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "c", component: "currents", params: WIRE },
    { id: "eq", component: "equation", params: eqp(R`\mathbf H=\dfrac{I}{2\pi\rho}\,\mathbf a_\phi`, "H equals I over two pi rho, along a phi") },
  ],
  ideas: [
    {
      id: "bhflux",
      title: "H, B, flux and force",
      objectives: [0],
      explain: [
        {
          id: "h", title: "H: the field a current makes", show: ["axes", "c", "eq"], focus: ["c", "eq"],
          note: "Charges at rest make E. Charges in motion, currents, also make a magnetic field. Its intensity H, in amperes per metre, circles the current: grip the wire with your right thumb along the current and your fingers curl the way H points. On the plate, 15 A flows up the z axis. At P(√20, 0, 4), |H| = 15/(2π√20) = 0.5338 A/m, pointing along +ay.",
          claims: [{ instance: "c", readout: "Hy", value: 0.533822, unit: "A/m" }, { instance: "c", readout: "Hmag", value: 0.533822, unit: "A/m" }],
        },
        {
          id: "rect", title: "Rectangular components", patch: { c: { probe: [2, -4, 4] } }, focus: ["c"],
          note: "Most questions want H in rectangular components. At a point, aφ = (−y ax + x ay)/ρ. At P(2, −4, 4), ρ is still √20, so |H| is unchanged, but aφ = (4ax + 2ay)/√20. That gives H = 0.4775ax + 0.2387ay A/m, Hayt's Drill D7.2(b). The z coordinate never matters for an infinite wire.",
          claims: [{ instance: "c", readout: "Hx", value: 0.477465, unit: "A/m" }, { instance: "c", readout: "Hy", value: 0.238732, unit: "A/m" }],
        },
        {
          id: "b", title: "B = μH, in tesla", patch: { eq: eqp(R`\mathbf B=\mu\mathbf H=\mu_r\mu_0\mathbf H,\quad \mu_0=4\pi\times10^{-7}\ \text{H/m}`, "B equals mu H") }, focus: ["c", "eq"],
          note: "The magnetic flux density B is what pushes on moving charges and currents. In a medium of permeability μ, B = μH = μrμ₀H, with μ₀ = 4π × 10⁻⁷ H/m. Its unit is the tesla (T), one weber per square metre. H is set by the currents alone; B also depends on the material. Here, in free space, |B| = μ₀ × 0.5338 = 0.6708 µT.",
          claims: [{ instance: "c", readout: "Bmag", value: 6.7082e-7, unit: "T" }],
        },
        {
          id: "iron", title: "Iron multiplies B; B lines close", patch: { c: { mur: 1000 }, eq: eqp(R`\oint_S\mathbf B\cdot d\mathbf S=0\ \Leftrightarrow\ \nabla\cdot\mathbf B=0`, "the closed surface integral of B is zero") }, focus: ["c", "eq"],
          note: "Fill the space with iron of μr = 1000 and the same 15 A gives the same H, but B a thousand times larger: 0.6708 mT. That is why transformers and motors use iron cores. Whatever the material, B lines close on themselves: there are no magnetic charges, so ∮B·dS = 0 over any closed surface. That is Gauss's law for magnetism, ∇·B = 0. Flux through an open surface, Φ = ∫B·dS, is in webers.",
          claims: [{ instance: "c", readout: "Bmag", value: 6.7082e-4, unit: "T" }],
        },
      ],
      examples: [
        {
          id: "d7.2", level: "basic", title: "Hayt D7.2: H in rectangular components",
          setup: { c: { ...WIRE } },
          problem: "A filament carrying 15 A in the az direction lies along the entire z axis. Find H in rectangular coordinates at (a) P_A(√20, 0, 4) and (b) P_B(2, −4, 4).",
          lines: [
            { text: "ρ = √20 at both points, so |H| = 15/(2π√20) = 0.5338 A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hmag", value: 0.533822, unit: "A/m" }] },
            { text: "(a) At P_A, aφ = ay: H = 0.534ay A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hy", value: 0.533822, unit: "A/m" }] },
            { text: "(b) At P_B, aφ = (4ax + 2ay)/√20: H = 0.477ax + 0.239ay A/m.", patch: { c: { probe: [2, -4, 4] } }, focus: ["c"], claims: [{ instance: "c", readout: "Hx", value: 0.477465, unit: "A/m" }, { instance: "c", readout: "Hy", value: 0.238732, unit: "A/m" }] },
          ],
          covers: ["text:hayt-d7.2"],
          trap: "Putting μ₀ into H. H = I/(2πρ) has no μ; only B = μH does.",
        },
        {
          id: "force", level: "tutorial", title: "Hayt D8.2: the force on a wire",
          setup: { c: { ...WIRE } },
          problem: "B = −2ax + 3ay + 4az mT in free space. Find the force on a straight wire carrying 12 A from A(1, 1, 1) to (a) B(2, 1, 1) and (b) B(3, 5, 6).",
          lines: [
            { text: "For a straight wire in a uniform field, F = IL × B, with L the vector from A to B.", focus: ["eq"] },
            { text: "(a) L = ax: F = 12 ax × (−2ax + 3ay + 4az) mT = 12(−4ay + 3az) = −48ay + 36az mN.", focus: ["eq"] },
            { text: "(b) L = 2ax + 4ay + 5az: F = 12 L × B = 12ax − 216ay + 168az mN.", focus: ["eq"] },
          ],
          covers: ["text:hayt-d8.2"],
          trap: "Writing B × L flips the sign of every component. The order is IL × B.",
        },
        {
          id: "flux", level: "exam", title: "Lec 3a Q.10: flux through a curved surface",
          setup: { c: { ...WIRE, mur: 1 } },
          problem: "In free space, H = (2.39 × 10⁶/r) cos φ ar A/m (cylindrical). Find the magnetic flux crossing the surface r = 1 m, −π/4 ≤ φ ≤ π/4, 0 ≤ z ≤ 1 m.",
          lines: [
            { text: "B = μ₀H, and on the surface dS = r dφ dz ar, so B·dS = μ₀ × 2.39 × 10⁶ cos φ dφ dz: the r cancels.", focus: ["eq"] },
            { text: "Φ = μ₀ × 2.39 × 10⁶ × [sin φ] from −π/4 to π/4 × 1 = μ₀ × 2.39 × 10⁶ × √2.", focus: ["eq"] },
            { text: "Φ = 4π × 10⁻⁷ × 2.39 × 10⁶ × 1.414 = 4.247 Wb.", focus: ["eq"] },
          ],
          covers: ["lecture:lec3a-q10"],
          trap: "Integrating H instead of B. Flux is ∫B·dS, so multiply by μ₀.",
        },
      ],
      asks: [
        { id: "h-vs-b", q: "What's the difference between H and B?", tags: ["H_B_UNITS"], a: "H (A/m) is set by the currents alone, through the Biot–Savart or Ampère law. B = μH (tesla) includes the material's response, and it's B that exerts forces and whose flux induces emfs." },
        { id: "rhr", q: "Which way does H circle?", a: "Right-hand rule: thumb along the current, fingers curl with H. For current along +az, H is along +aφ." },
        { id: "tesla", q: "What is a tesla in other units?", a: "1 T = 1 Wb/m² = 1 N/(A·m). The Earth's field is about 50 µT; an MRI magnet is 1.5 to 3 T." },
        { id: "monopoles", q: "Why is ∮B·dS always zero?", a: "There are no magnetic charges. Every B line that enters a closed surface leaves it again, so the net flux is zero: ∇·B = 0." },
        { id: "force-dir", q: "Which way does the force on a wire act?", a: "Along IL × B: perpendicular to both the wire and the field. Fleming's left-hand rule, the motor rule, gives the same direction." },
        { id: "z", q: "Why doesn't z matter for an infinite wire?", a: "Every slice of an infinite straight wire looks the same, so H depends only on the distance ρ from it." },
      ],
      checks: [
        {
          id: "unit-c", title: "Check: the unit of H", show: ["axes", "c", "eq"], patch: { c: { ...WIRE } },
          note: "Four checks on H, B and flux. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "unit-c", type: "choose", prompt: "The SI unit of the magnetic field intensity H is…", dimension: "recognition",
            options: [
              choice("am", "A/m", true, "Right: amperes per metre."),
              choice("t", "T", false, "That's B's unit. H = B/μ.", "H_B_UNITS"),
              choice("wb", "Wb", false, "That's magnetic flux."),
            ] },
        },
        {
          id: "predict-dist", title: "Check: twice as far",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-dist", type: "predict-drag", prompt: "Move the probe to twice its distance from the wire. Drag |H| to your prediction.", target: { instance: "c", readout: "Hmag" }, range: [0, 1], unit: "A/m", relTol: 0.05, reveal: { c: { probe: [2 * S20, 0, 4] } }, dimension: "conceptual",
            feedback: { close: "Right: half, 0.2669 A/m. H ∝ 1/ρ.", far: "H = I/(2πρ): twice as far, half as much, 0.2669 A/m." } },
        },
        {
          id: "bs-num", title: "Check: a filament, your numbers",
          note: "Numbers of your own, in cm.",
          interaction: { id: "bs-num", type: "numeric", prompt: bs.prompt, answer: bs.spec.answer, distractors: bs.spec.distractors, relTol: bs.spec.relTol, hints: bs.hints, template: "bs-filament", dimension: "computational" },
        },
        {
          id: "force-c", title: "Check: the motor rule",
          note: "Last one.",
          interaction: { id: "force-c", type: "choose", prompt: "A wire carries current along +ax in a field B = B₀az (B₀ > 0). The force on it points along…", dimension: "application",
            options: [
              choice("neg-y", "−ay", true, "Right: ax × az = −ay."),
              choice("pos-y", "+ay", false, "ax × az = −ay: check the cyclic order x → y → z.", "BS_DIRECTION"),
              choice("z", "+az", false, "The force is perpendicular to B."),
            ] },
          covers: ["text:hayt-d8.2"],
        },
      ],
      recap: {
        points: [
          "A straight current makes H = I/(2πρ) aφ (A/m), circling by the right-hand rule.",
          "B = μH = μrμ₀H (tesla), with μ₀ = 4π × 10⁻⁷ H/m; flux Φ = ∫B·dS (webers).",
          "∮B·dS = 0: no magnetic charges, B lines close.",
          "Force on a wire: F = IL × B.",
        ],
        traps: ["μ in H.", "Integrating H instead of B for flux.", "B × L instead of L × B."],
      },
    },
  ],
});
```

Hand checks: 15/(2π√20) = 0.533822; at twice the distance, 0.266911; μ₀ × 0.533822 = 6.70820 × 10⁻⁷.

- [ ] **Step 2: `plates/idea-biot-savart.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

// R, choice, eqp, V3 as above.
const SEG = { items: [{ id: "s", kind: "segment" as const, I: 10, from: [0, 0, -1] as V3, to: [0, 0, 1] as V3 }], probe: [1, 0, 0] as V3, mur: 1, drawScale: 1 };
const LOOP = { items: [{ id: "l", kind: "loop" as const, I: 10, N: 1, radius: 1, z: 0 }], probe: [0, 0, 1] as V3 };
const SQUARE = {
  items: [
    { id: "s1", kind: "segment" as const, I: 10, from: [1, -1, 0] as V3, to: [1, 1, 0] as V3 },
    { id: "s2", kind: "segment" as const, I: 10, from: [1, 1, 0] as V3, to: [-1, 1, 0] as V3 },
    { id: "s3", kind: "segment" as const, I: 10, from: [-1, 1, 0] as V3, to: [-1, -1, 0] as V3 },
    { id: "s4", kind: "segment" as const, I: 10, from: [-1, -1, 0] as V3, to: [1, -1, 0] as V3 },
  ],
  probe: [0, 0, 0] as V3,
};
const HW03 = { items: [{ id: "c", kind: "loop" as const, I: -2.82, N: 200, radius: 0.3, z: 0 }], probe: [0, 0, -0.5] as V3, mur: 1, drawScale: 2 };

export const ideaBiotSavart = defineIdeaPlate({
  id: "idea-biot-savart",
  title: "The Biot–Savart law",
  requires: { objectives: [1], items: ["hw03-2425-3.1a", "ict2-2425-q1", "f1516-q2c", "lecture:lec3a-q01", "lecture:lec3a-q03"], misconceptions: ["BS_DIRECTION"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "c", component: "currents", params: SEG },
    { id: "eq", component: "equation", params: eqp(R`d\mathbf H=\dfrac{I\,d\mathbf L\times\mathbf a_R}{4\pi R^2}`, "d H equals I d L cross a R over four pi R squared") },
  ],
  ideas: [
    {
      id: "biot",
      title: "The Biot–Savart law",
      objectives: [1],
      explain: [
        {
          id: "law", title: "The Biot–Savart law", show: ["axes", "c", "eq"], focus: ["c", "eq"],
          note: "This is the magnetic counterpart of Coulomb's law. Each small current element I dL contributes dH = I dL × aR/(4πR²), where R runs from the element to the field point. The cross product sets the direction: perpendicular to both the current and R. Add the elements by integrating. The plate's segment runs from z = −1 to z = 1 and carries 10 A. At 1 m from its midpoint, H = (I/4πρ)(sin α₂ − sin α₁) = 1.125ay A/m.",
          claims: [{ instance: "c", readout: "Hy", value: 1.1254, unit: "A/m" }],
        },
        {
          id: "infinite", title: "An infinite filament", patch: { c: { items: [{ id: "s", kind: "line", I: 10 }] } }, focus: ["c"],
          note: "Let the segment run to infinity both ways: α₁ → −90° and α₂ → +90°, so sin α₂ − sin α₁ = 2 and H = I/(2πρ) aφ, the result Wentworth derives in Example 3.2. At 1 m from 10 A that is 1.592 A/m: larger than the finite segment's 1.125 A/m, because more current now contributes.",
          claims: [{ instance: "c", readout: "Hy", value: 1.59155, unit: "A/m" }],
        },
        {
          id: "loop", title: "A loop, on its axis", patch: { c: LOOP, eq: eqp(R`\mathbf H=\dfrac{NIa^2}{2(a^2+h^2)^{3/2}}\,\mathbf a_z`, "H equals N I a squared over two times a squared plus h squared to the three halves") }, focus: ["c", "eq"],
          note: "For a ring of radius a carrying I, the radial parts of dH cancel in pairs across the ring and only the axial parts add (Wentworth Example 3.3): H = Ia²/(2(a² + h²)^(3/2)) az at height h on the axis. At the centre, h = 0, it is I/(2a). With N turns, multiply by N. On the plate, 10 A in a ring of radius 1 gives 1.768 A/m at height 1 above its centre.",
          claims: [{ instance: "c", readout: "Hz", value: 1.76777, unit: "A/m" }],
        },
        {
          id: "square", title: "A square loop", patch: { c: SQUARE }, focus: ["c"],
          note: "A square loop is four segments (Lec 3a Q.02). Each contributes (I/4πρ)(sin α₂ − sin α₁) with ρ = L/2 and α = ±45°, and at the centre all four point the same way. So H = 4 × √2 I/(2πL) = 2√2 I/(πL) az. For a square of side 2 carrying 10 A: 4.502 A/m. A circle of the same width gives I/(2a) = 5 A/m.",
          claims: [{ instance: "c", readout: "Hz", value: 4.50158, unit: "A/m" }],
        },
      ],
      examples: [
        {
          id: "q01", level: "basic", title: "Lec 3a Q.01: the centre of an N-turn coil",
          setup: { c: { items: [{ id: "c", kind: "loop", I: 2.82, N: 200, radius: 0.3, z: 0 }], probe: [0, 0, 0], drawScale: 2 } },
          problem: "Find H at the centre of a circular coil of radius a carrying I through N turns. Evaluate it for 200 turns of radius 0.3 m carrying 2.82 A in +aφ.",
          lines: [
            { text: "Every element is a distance a from the centre, and dL × aR points along az for each one.", focus: ["c"] },
            { text: "H = N ∮ I a dφ/(4πa²) az = NI/(2a) az.", focus: ["c", "eq"] },
            { text: "H = 200 × 2.82/(2 × 0.3) = 940.0az A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hz", value: 940, unit: "A/m" }] },
          ],
          covers: ["lecture:lec3a-q01", "f1516-q2c"],
          trap: "Using 2πa in the denominator: that's the filament formula. At a loop's centre it's NI/(2a).",
        },
        {
          id: "q03", level: "tutorial", title: "Lec 3a Q.03: a filament parallel to the y axis",
          setup: { c: { items: [{ id: "f", kind: "line", I: 5, point: [2, 0, 2], dir: [0, 1, 0] }], probe: [0, 0, 0], drawScale: 0.5 } },
          problem: "A 5.0 A filament in the ay direction runs parallel to the y axis through x = 2 m, z = 2 m. Find H at the origin.",
          lines: [
            { text: "The perpendicular from the filament to the origin is ρ = (−2, 0, −2), of length √8 = 2.828.", focus: ["c"] },
            { text: "|H| = I/(2πρ) = 5/(2π × 2.828) = 0.2813 A/m.", focus: ["c"] },
            { text: "Direction: ay × (−ax − az)/√2 = (−ax + az)/√2, so H = −0.1989ax + 0.1989az A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hx", value: -0.198944, unit: "A/m" }, { instance: "c", readout: "Hz", value: 0.198944, unit: "A/m" }] },
          ],
          covers: ["lecture:lec3a-q03"],
          trap: "Taking aR from the origin toward the filament. R runs from the source to the field point.",
        },
        {
          id: "hw03", level: "exam", title: "HW03 3.1(a): a 200-turn coil",
          setup: { c: HW03 },
          problem: "A 200-turn coil of radius 30.0 cm, parallel to the xy plane and centred at the origin, carries 2.82 A in the −aφ direction. Using Biot–Savart's law, calculate H at P(0, 0, −50) cm.",
          lines: [
            { text: "On the axis, H = NIa²/(2(a² + z²)^(3/2)); the sign of z doesn't change the size, only the current's sense sets the direction.", focus: ["c", "eq"] },
            { text: "|H| = 200 × 2.82 × 0.3²/(2(0.3² + 0.5²)^(3/2)) = 50.76/0.3965 = 128.0 A/m.", focus: ["c"] },
            { text: "The current flows in −aφ, so by the right-hand rule H points along −az: H_P = −128.0az A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hz", value: -128.019, unit: "A/m" }] },
          ],
          covers: ["hw03-2425-3.1a", "ict2-2425-q1"],
          trap: "Answering +128.0az. The −aφ current reverses the field.",
        },
      ],
      asks: [
        { id: "direction", q: "How do I get the direction from dL × aR?", tags: ["BS_DIRECTION"], a: "R points from the current element to the field point. Cross the current's direction into it. For current along +az and a point on the +x axis, az × ax = ay." },
        { id: "coulomb", q: "How is Biot–Savart like Coulomb's law?", a: "Both fall as 1/R² from a source element. But Coulomb's field points along R, while the Biot–Savart field points perpendicular to both the current and R." },
        { id: "finite", q: "Why is the finite segment weaker?", a: "Fewer elements contribute, and the far ones contribute little: sin α₂ − sin α₁ is less than 2 unless the segment is infinite." },
        { id: "radial", q: "Why do the radial parts cancel on a loop's axis?", a: "Elements on opposite sides of the ring give radial components that point opposite ways and are equally large. Only the axial parts survive." },
        { id: "turns", q: "What do N turns do?", a: "They multiply the current: N turns of I act like one loop carrying NI, so H scales by N." },
        { id: "when", q: "When do I use Biot–Savart instead of Ampère?", a: "When the current has no symmetry that lets you pull H out of the integral: loops, segments, squares. Ampère's law is the shortcut for long, symmetric currents." },
      ],
      checks: [
        {
          id: "inf-c", title: "Check: how H falls", show: ["axes", "c", "eq"], patch: { c: SEG },
          note: "Four checks on the Biot–Savart law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "inf-c", type: "choose", prompt: "An infinite straight filament's H falls with distance as…", dimension: "recognition",
            options: [
              choice("r", "1/ρ", true, "Right: H = I/(2πρ)."),
              choice("r2", "1/ρ²", false, "That's a single element, or a point charge's E. The whole infinite line gives 1/ρ."),
              choice("const", "not at all", false, "It falls off away from the wire."),
            ] },
        },
        {
          id: "predict-centre", title: "Check: from the axis to the centre",
          note: "Predict first; then the plate shows the result.",
          patch: { c: LOOP },
          interaction: { id: "predict-centre", type: "predict-drag", prompt: "Move the probe from height 1 down to the centre of the ring (radius 1, 10 A). Drag Hz to your prediction.", target: { instance: "c", readout: "Hz" }, range: [0, 10], unit: "A/m", relTol: 0.05, reveal: { c: { probe: [0, 0, 0] } }, dimension: "conceptual",
            feedback: { close: "Right: I/(2a) = 5 A/m.", far: "At the centre, H = I/(2a) = 10/2 = 5 A/m." } },
        },
        {
          id: "dir-c", title: "Check: the direction",
          note: "Right-hand rule.",
          interaction: { id: "dir-c", type: "choose", prompt: "Current flows along +az on the z axis. At a point on the +y axis, H points along…", dimension: "application",
            options: [
              choice("neg-x", "−ax", true, "Right: aφ at the +y axis is −ax."),
              choice("pos-x", "+ax", false, "Curl your fingers: at +y the circulation runs toward −x.", "BS_DIRECTION"),
              choice("z", "+az", false, "H circles the current; it has no z part here."),
            ] },
        },
        {
          id: "hw03-num", title: "Check: HW03 3.1(a)",
          note: "Last one.",
          patch: { c: HW03 },
          interaction: { id: "hw03-num", type: "numeric", prompt: "HW03 3.1(a): 200 turns, radius 30.0 cm, 2.82 A in −aφ, centred at the origin in the xy plane. Find Hz at P(0, 0, −50) cm, in A/m.", answer: { value: -128.019, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 128.019, unit: "A/m", errorClass: "sign", tag: "BS_DIRECTION", feedback: "The current runs in −aφ, so H points along −az." }],
            hints: ["On the axis, H = NIa²/(2(a² + z²)^(3/2)).", "a = 0.3, z = −0.5 (in metres).", "Sign: −aφ current gives −az."] },
          covers: ["hw03-2425-3.1a"],
        },
      ],
      recap: {
        points: [
          "Biot–Savart: dH = I dL × aR/(4πR²), with R from the element to the point.",
          "Segment: H = (I/4πρ)(sin α₂ − sin α₁); infinite filament: I/(2πρ).",
          "Loop on its axis: NIa²/(2(a² + h²)^(3/2)); at the centre, NI/(2a).",
          "Square of side L, at the centre: 2√2 I/(πL).",
        ],
        traps: ["R from the point to the source.", "Forgetting N.", "The −aφ sign."],
      },
    },
  ],
});
```

Hand checks:
- Segment: (10/4π)(2/√2) = 1.12540.
- Loop at height 1: 10/(2 × 2^1.5) = 1.76777.
- Square: 2√2 × 10/(2π) = 4.50158.
- Coil centre: 200 × 2.82/0.6 = 940.000.
- Q.03: (5/(2π√8))/√2 = 0.198944.
- HW03: 200 × 2.82 × 0.09/(2 × 0.34^1.5) = 128.019.

The Gauss–Legendre loop is exact to 1e-9 at these distances, so the claims hold to the default tolerance.

- [ ] **Step 3: `plates/idea-ampere.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice, eqp, V3 as above.
const ai = instantiate(templates.find((t) => t.id === "amp-inside")!, 1);
const WIRE = { items: [{ id: "w", kind: "cylinder" as const, I: 20, a: 0, b: 0.001 }], probe: [0.002, 0, 0] as V3, mur: 1, drawScale: 300 };
const SHEETS = {
  items: [
    { id: "f", kind: "line" as const, I: 0.02 * Math.PI },
    { id: "k1", kind: "sheet" as const, K: 0.4, radius: 0.01 },
    { id: "k2", kind: "sheet" as const, K: -0.25, radius: 0.02 },
    { id: "k3", kind: "sheet" as const, K: -0.3, radius: 0.03 },
  ],
  probe: [0.015, 0, 0] as V3, drawScale: 30,
};
const COAX = { items: [{ id: "in", kind: "cylinder" as const, I: 2.5, a: 0, b: 0.3 }, { id: "out", kind: "cylinder" as const, I: -2.5, a: 0.5, b: 0.6 }], probe: [0, 0.2, 0] as V3, drawScale: 2 };

export const ideaAmpere = defineIdeaPlate({
  id: "idea-ampere",
  title: "Ampère's circuital law",
  requires: {
    objectives: [2],
    items: ["text:hayt-d7.7", "f1415-q4", "f2425-q4a", "f2324-q4a", "f1718-q3a", "f2425r-q3a", "f1415-q3b", "ict2-2425-q1", "hw03-2425-3.1b", "f2425-q3a", "f1415-q2a", "f2324-q3b", "f1718-q3b"],
    misconceptions: ["AMP_ENC_INSIDE"],
  },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "c", component: "currents", params: WIRE },
    { id: "eq", component: "equation", params: eqp(R`\oint_L\mathbf H\cdot d\mathbf L=I_{\text{enc}}`, "the closed line integral of H equals the current enclosed") },
  ],
  ideas: [
    {
      id: "ampere",
      title: "Ampère's circuital law",
      objectives: [2],
      explain: [
        {
          id: "law", title: "Ampère's circuital law", show: ["axes", "c", "eq"], focus: ["c", "eq"],
          note: "When a current has enough symmetry, there's a shortcut. The line integral of H round any closed path equals the current the path encloses: ∮H·dL = I_enc. Choose a path on which H is constant and parallel to dL, and the integral becomes H × (path length). For a circle of radius ρ round a long wire, H · 2πρ = I. The plate's 20 A wire, 1 mm in radius, gives 1592 A/m at ρ = 2 mm (Hayt D7.7).",
          claims: [{ instance: "c", readout: "Hphi", value: 1591.55, unit: "A/m" }, { instance: "c", readout: "Ienc", value: 20, unit: "A" }],
        },
        {
          id: "inside", title: "Inside the conductor", patch: { c: { probe: [0.0005, 0, 0] }, eq: eqp(R`H\cdot2\pi\rho=I\dfrac{\rho^2}{a^2}\ \Rightarrow\ H=\dfrac{I\rho}{2\pi a^2}`, "H equals I rho over two pi a squared") }, focus: ["c", "eq"],
          note: "Inside a uniformly filled conductor, a circle of radius ρ < a encloses only the fraction ρ²/a² of the current. So H · 2πρ = Iρ²/a², and H = Iρ/(2πa²): it grows linearly from zero on the axis to its largest value at the surface. At ρ = 0.5 mm the circle encloses 5 A, and H is again 1592 A/m, by coincidence: a quarter of the current at half the radius.",
          claims: [{ instance: "c", readout: "Ienc", value: 5, unit: "A" }, { instance: "c", readout: "Hphi", value: 1591.55, unit: "A/m" }],
        },
        {
          id: "sheets", title: "Shells and sheets", patch: { c: SHEETS, eq: eqp(R`H_\phi=\dfrac{I_{\text{enc}}}{2\pi\rho}`, "H phi equals I enclosed over two pi rho") }, focus: ["c"],
          note: "A cylindrical current sheet is invisible from inside, like a charged shell in electrostatics: it only adds to circles larger than itself. Hayt Problem 7.11, set as Finals 2014-15 Q3(b), puts a 20π mA filament inside sheets of 400, −250 and −300 mA/m at 1, 2 and 3 cm. At ρ = 1.5 cm the filament and the first sheet are enclosed, 87.96 mA, so Hφ = 0.9333 A/m.",
          claims: [{ instance: "c", readout: "Ienc", value: 0.0879646, unit: "A" }, { instance: "c", readout: "Hphi", value: 0.933333, unit: "A/m" }],
        },
        {
          id: "coax", title: "The coax", patch: { c: COAX }, focus: ["c"],
          note: "The coax puts it all together (Wentworth Example 3.8): an inner conductor of radius a carrying I, and an outer one from b to c carrying −I. H = Iρ/(2πa²) inside the inner conductor and I/(2πρ) between them. It falls to zero across the outer conductor and is zero outside, where the net enclosed current is zero. Hayt D7.3(b): a = 0.3, b = 0.5, c = 0.6 m and 2.5 A give H = −0.884ax A/m at (0, 0.2, 0).",
          claims: [{ instance: "c", readout: "Hx", value: -0.884194, unit: "A/m" }],
        },
      ],
      examples: [
        {
          id: "d7.7", level: "basic", title: "Hayt D7.7: inside a solid conductor",
          setup: { c: { ...WIRE, probe: [0.0005, 0, 0] } },
          problem: "A solid nonmagnetic conductor of radius 1 mm on the z axis carries 20 A in az. Find (a) Hφ at ρ = 0.5 mm, (b) Bφ at ρ = 0.8 mm, (c) the total magnetic flux per metre inside the conductor.",
          lines: [
            { text: "(a) I_enc = 20 × (0.5/1)² = 5 A, so Hφ = 5/(2π × 0.0005) = 1592 A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hphi", value: 1591.55, unit: "A/m" }] },
            { text: "(b) At 0.8 mm, H = 20 × 0.0008/(2π × 10⁻⁶) = 2546 A/m, so Bφ = μ₀H = 3.2 mT.", patch: { c: { probe: [0.0008, 0, 0] } }, focus: ["c"], claims: [{ instance: "c", readout: "Bmag", value: 0.0032, unit: "T" }] },
            { text: "(c) Φ' = ∫₀^a μ₀Iρ/(2πa²) dρ = μ₀I/(4π) = 2 µWb per metre, whatever the radius.", focus: ["eq"] },
          ],
          covers: ["text:hayt-d7.7"],
          trap: "Using all 20 A inside the wire: 6366 A/m at 0.5 mm, four times too much.",
        },
        {
          id: "f1415", level: "tutorial", title: "Finals 2014-15 Q4: J, H and B in and out",
          setup: { c: { items: [{ id: "w", kind: "cylinder", I: 2, a: 0, b: 0.0002 }], probe: [0.0001, 0, 0], drawScale: 1000 } },
          problem: "A long straight nonmagnetic conductor of 0.2 mm radius carries a uniform 2 A d.c. Find J, then H and B within and outside it.",
          lines: [
            { text: "J = I/(πa²) = 2/(π(2 × 10⁻⁴)²) = 1.592 × 10⁷ az A/m².", focus: ["c"] },
            { text: "Inside: H = Iρ/(2πa²) = 7.958 × 10⁶ ρ aφ A/m, and B = μ₀H = 10.00ρ aφ T. At ρ = 0.1 mm, H = 795.8 A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hphi", value: 795.775, unit: "A/m" }] },
            { text: "Outside: H = I/(2πρ) = (0.3183/ρ) aφ A/m, and B = (4 × 10⁻⁷/ρ) aφ T.", focus: ["c"] },
          ],
          covers: ["f1415-q4"],
          trap: "Squaring 0.2 instead of 2 × 10⁻⁴: leaving mm unconverted is off by a factor of 10⁶.",
        },
        {
          id: "f2425", level: "exam", title: "Finals 2024-25 Q4(a): Ampère inside a conductor",
          setup: { c: { items: [{ id: "w", kind: "cylinder", I: 50, a: 0, b: 0.008 }], probe: [0.004, 0, 0], drawScale: 40 } },
          problem: "A long, straight, nonmagnetic conductor of radius 8.00 mm carries a uniform d.c. current of 50.0 A along z. (i) State Ampère's circuital law. (ii) Find J. (iii) Develop H and B inside. (iv) State and justify ∇ × H outside.",
          lines: [
            { text: "(i) The line integral of H round any closed path equals the current it encloses: ∮H·dL = I_enc.", focus: ["eq"] },
            { text: "(ii) J = 50/(π × 0.008²) = 2.487 × 10⁵ az A/m².", focus: ["c"] },
            { text: "(iii) H = Iρ/(2πa²) = 1.243 × 10⁵ ρ aφ A/m and B = μ₀H = 0.1563ρ aφ T. At ρ = 4 mm, H = 497.4 A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hphi", value: 497.359, unit: "A/m" }] },
            { text: "(iv) Outside, J = 0, so ∇ × H = 0: with H = I/(2πρ) aφ, (1/ρ)d(ρHφ)/dρ = 0.", focus: ["eq"] },
          ],
          covers: ["f2425-q4a", "f2324-q4a", "f1718-q3a", "f2425r-q3a"],
          trap: "Stating the law as ∮B·dL = I. With B, it's μ₀I_enc; with H, it's I_enc.",
        },
      ],
      asks: [
        { id: "enc", q: "Why does H inside a wire grow with ρ?", tags: ["AMP_ENC_INSIDE"], a: "A bigger circle encloses more current, I(ρ/a)², while its circumference grows only as ρ. So H = Iρ/(2πa²) rises linearly until the surface." },
        { id: "when", q: "When does Ampère's law give H directly?", a: "When symmetry makes H constant in size and parallel to dL along a path you can draw: long wires, cylinders, coaxes, sheets, solenoids and toroids." },
        { id: "drawback", q: "One drawback and one advantage of Ampère's law?", a: "Drawback: it only yields H when there's enough symmetry. Advantage: when there is, it replaces a Biot–Savart integral with one line. HW03 3.1(b)(ii) asks exactly this." },
        { id: "outside-coax", q: "Why is H zero outside a coax?", a: "A circle outside encloses I from the inner conductor and −I from the outer one: zero net current. So ∮H·dL = 0 and, by symmetry, H = 0. Coax cables don't leak magnetic field." },
        { id: "sheet", q: "What does an infinite flat current sheet give?", a: "H = ½K × aN: uniform on each side and reversed across it (Wentworth Example 3.6), like a charged sheet's E." },
        { id: "solenoid", q: "And a long solenoid?", a: "H = NI/ℓ inside, along the axis, and nearly zero outside (Wentworth Example 3.9). Its two sides act like a pair of opposite current sheets." },
      ],
      checks: [
        {
          id: "enc-c", title: "Check: the enclosed current", show: ["axes", "c", "eq"], patch: { c: WIRE },
          note: "Seven checks on Ampère's law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "enc-c", type: "choose", prompt: "Inside a solid wire with uniform current, at half the radius, the circle encloses…", dimension: "conceptual",
            options: [
              choice("quarter", "a quarter of I", true, "Right: (ρ/a)² = ¼."),
              choice("half", "half of I", false, "Current goes with area, which goes as ρ²."),
              choice("all", "all of I", false, "Only the current inside the circle counts.", "AMP_ENC_INSIDE"),
            ] },
        },
        {
          id: "predict-sheet", title: "Check: past another sheet",
          note: "Predict first; then the plate shows the result.",
          patch: { c: SHEETS },
          interaction: { id: "predict-sheet", type: "predict-drag", prompt: "Move the probe out to ρ = 2.5 cm, past the −250 mA/m sheet. Drag Hφ to your prediction.", target: { instance: "c", readout: "Hphi" }, range: [0, 2], unit: "A/m", relTol: 0.05, reveal: { c: { probe: [0.025, 0, 0] } }, dimension: "conceptual",
            feedback: { close: "Right: 56.55 mA enclosed, Hφ = 0.36 A/m.", far: "The −250 mA/m sheet removes 31.42 mA: 56.55 mA, so Hφ = 0.36 A/m." } },
          covers: ["f1415-q3b"],
        },
        {
          id: "inside-num", title: "Check: inside a wire, your numbers",
          note: "Numbers of your own, in mm.",
          interaction: { id: "inside-num", type: "numeric", prompt: ai.prompt, answer: ai.spec.answer, distractors: ai.spec.distractors, relTol: ai.spec.relTol, hints: ai.hints, template: "amp-inside", dimension: "computational" },
        },
        {
          id: "ict2-1b", title: "Check: ICT 2 Q1(b)",
          note: "Outside this time.",
          interaction: { id: "ict2-1b", type: "numeric", prompt: "ICT 2 Q1(b): a conductor of radius 5 cm carries 100 A uniformly along az. Find |H| at a point 22 cm from its axis, in A/m.", answer: { value: 72.3432, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 1400.55, unit: "A/m", errorClass: "conceptual", tag: "AMP_ENC_INSIDE", feedback: "That's the inside formula. At 22 cm you're outside, where all 100 A is enclosed." }],
            hints: ["22 cm > 5 cm: outside the conductor.", "H = I/(2πρ).", "100/(2π × 0.22)."] },
          covers: ["ict2-2425-q1"],
        },
        {
          id: "hw03-b", title: "Check: HW03 3.1(b)",
          note: "Inside this time.",
          interaction: { id: "hw03-b", type: "numeric", prompt: "HW03 3.1(b): J = 95.49 kA/m² flows uniformly in a conductor of radius 20.0 mm. Find |H| at ρ = 15 mm, in A/m.", answer: { value: 716.175, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 1273.2, unit: "A/m", errorClass: "conceptual", tag: "AMP_ENC_INSIDE", feedback: "That uses the whole 120 A. Inside, H = Jρ/2." }],
            hints: ["Inside: H · 2πρ = Jπρ².", "So H = Jρ/2.", "95 490 × 0.015/2."] },
          covers: ["hw03-2425-3.1b"],
        },
        {
          id: "coax-c", title: "Check: between the conductors",
          note: "The coax.",
          interaction: { id: "coax-c", type: "choose", prompt: "In a coax (inner radius a, outer conductor from b to c, current I), for a < ρ < b, H =", dimension: "recognition",
            options: [
              choice("right", "I/(2πρ) aφ", true, "Right: the whole inner current is enclosed, and none of the return."),
              choice("inside", "Iρ/(2πa²) aφ", false, "That's inside the inner conductor.", "AMP_ENC_INSIDE"),
              choice("zero", "0", false, "Only outside the whole cable."),
            ] },
          covers: ["f2425-q3a", "f1415-q2a"],
        },
        {
          id: "hollow-c", title: "Check: a hollow conductor",
          note: "Last one.",
          interaction: { id: "hollow-c", type: "choose", prompt: "A hollow conductor with inner radius a and outer radius b carries I along z. For ρ < a, H is…", dimension: "conceptual",
            options: [
              choice("zero", "0", true, "Right: a circle inside the hole encloses no current."),
              choice("full", "I/(2πρ)", false, "The current is all outside the circle.", "AMP_ENC_INSIDE"),
              choice("lin", "Iρ/(2πa²)", false, "That's a solid conductor."),
            ] },
          covers: ["f2324-q3b", "f1718-q3b"],
        },
      ],
      recap: {
        points: [
          "∮H·dL = I_enc; pick a path where H is constant and along dL.",
          "Long wire: I/(2πρ) outside, Iρ/(2πa²) inside.",
          "Sheets and shells only add to circles larger than themselves.",
          "Coax: Iρ/(2πa²), then I/(2πρ), falling to zero outside.",
        ],
        traps: ["The whole current inside a conductor.", "mm left unconverted.", "μ in Ampère's law with H."],
      },
    },
  ],
});
```

Hand checks:
- 20/(2π × 0.002) = 1591.55.
- 5/(2π × 0.0005) = 1591.55.
- Sheets at 1.5 cm: 0.0628319 + 0.0251327 = 0.0879646 A, so Hφ = 0.933333.
- D7.3(b): 2.5 × (0.2/0.3)²/(2π × 0.2) = 0.884194, along aφ = −ax at (0, 0.2).
- f1415: 2 × 10⁻⁴/(2π × 4 × 10⁻⁸) = 795.775.
- f2425: 50 × 0.004/(2π × 6.4 × 10⁻⁵) = 497.359.
- ICT 2: 100/(2π × 0.22) = 72.3432; its distractor is 100 × 0.22/(2π × 0.0025) = 1400.55.
- HW03: 95 490 × 0.015/2 = 716.175; its distractor uses I = 95 490π(0.02)² = 119.996 A, giving 119.996/(2π × 0.015) = 1273.2.

- [ ] **Step 4: `plates/idea-curl-stokes.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

// R, choice, eqp, V3 as above.
const D76 = { field: "d7.6", plane: "xy" as const, offset: 0, probe: [3.5, 0, 0] as V3, loop: 3, loopH: 2, box: 0 };

export const ideaCurlStokes = defineIdeaPlate({
  id: "idea-curl-stokes",
  title: "Curl and Stokes' theorem",
  requires: { objectives: [3], items: ["text:hayt-d7.6", "lecture:lec3a-q09", "text:hayt-d7.5", "lecture:lec3a-q08", "lecture:lec3a-q05", "f1718-q3c"], misconceptions: ["CURL_ZERO"] },
  instances: [
    { id: "vs", component: "vector-slice", params: D76 },
    { id: "eq", component: "equation", params: eqp(R`\oint_L\mathbf H\cdot d\mathbf L=\int_S(\nabla\times\mathbf H)\cdot d\mathbf S`, "the closed line integral of H equals the surface integral of the curl of H") },
  ],
  ideas: [
    {
      id: "curl",
      title: "Curl and Stokes' theorem",
      objectives: [3],
      explain: [
        {
          id: "stokes", title: "Stokes' theorem", show: ["vs", "eq"], focus: ["vs", "eq"],
          note: "Stokes' theorem turns a line integral round a closed path into a surface integral over any surface the path bounds: ∮H·dL = ∫(∇ × H)·dS. Hayt D7.6 takes H = 6xy ax − 3y² ay round the rectangle 2 ≤ x ≤ 5, −1 ≤ y ≤ 1. Walking the four edges gives −126 A. Integrating ∇ × H = −6x az over the rectangle gives −126 A too. The plate's loop readout shows the circulation.",
          claims: [{ instance: "vs", readout: "circ", value: -126, unit: "" }],
        },
        {
          id: "point", title: "The point form: ∇ × H = J", patch: { vs: { field: "d7.5a", probe: [2, 3, 4], offset: 4, loop: 0 }, eq: eqp(R`\nabla\times\mathbf H=\mathbf J`, "the curl of H equals J") }, focus: ["vs", "eq"],
          note: "Shrink Ampère's path to a point: the circulation per unit area becomes the curl, and Ampère's law becomes ∇ × H = J, the point form. Hayt D7.5(a): for H = x²z ay − y²x az, ∇ × H = (−2xy − x²) ax + y² ay + 2xz az, which at (2, 3, 4) is J = −16ax + 9ay + 16az A/m². Wherever J is, H curls.",
          claims: [{ instance: "vs", readout: "c1", value: -16, unit: "" }, { instance: "vs", readout: "c2", value: 9, unit: "" }, { instance: "vs", readout: "c3", value: 16, unit: "" }],
        },
        {
          id: "zero", title: "No current, no curl", patch: { vs: { field: "filament", probe: [1, 0.5, 0], offset: 0 } }, focus: ["vs"],
          note: "Away from a wire, its H = I/(2πρ) aφ circles but has zero curl: (1/ρ)d(ρHφ)/dρ = (1/ρ)d(I/2π)/dρ = 0. Lec 3a Q.05 makes the point. The field lines curve, yet ∇ × H = 0 everywhere except on the wire itself, where J is. Curl measures circulation at a point, not the bending of lines.",
          claims: [{ instance: "vs", readout: "c3", value: 0, unit: "" }],
        },
        {
          id: "f1718", title: "Finals 2017-18 Q3(c)", patch: { vs: { field: "f1718-3c", probe: [5, 2, -3], offset: -3 } }, focus: ["vs"],
          note: "Finals 2017-18 Q3(c) gives H = yz(x² + y²) ax − y²xz ay + 4x²y² az. Its curl is J = xy(8x + y) ax + y(x² − 8xy + y²) ay − z(x² + 4y²) az, which at (5, 2, −3) is 420ax − 102ay + 123az A/m². Its divergence is zero, as it must be for any B or μ₀H: ∇·B = 0.",
          claims: [{ instance: "vs", readout: "c1", value: 420, unit: "" }, { instance: "vs", readout: "c2", value: -102, unit: "" }, { instance: "vs", readout: "c3", value: 123, unit: "" }, { instance: "vs", readout: "div", value: 0, unit: "" }],
        },
      ],
      examples: [
        {
          id: "d7.6", level: "basic", title: "Hayt D7.6: both sides of Stokes' theorem",
          setup: { vs: D76 },
          problem: "Evaluate both sides of Stokes' theorem for H = 6xy ax − 3y² ay A/m round the rectangular path 2 ≤ x ≤ 5, −1 ≤ y ≤ 1, z = 0, with dS along az.",
          lines: [
            { text: "Along y = −1, x from 2 to 5: H·dL = −6x dx, giving −3(25 − 4) = −63.", focus: ["vs"] },
            { text: "Up x = 5: −3y² dy from −1 to 1 gives −2. Back along y = 1: ∫ from 5 to 2 of 6x dx = −63. Down x = 2: ∫ from 1 to −1 of −3y² dy = +2.", focus: ["vs"] },
            { text: "Line integral: −63 − 2 − 63 + 2 = −126 A.", focus: ["vs"], claims: [{ instance: "vs", readout: "circ", value: -126, unit: "" }] },
            { text: "Surface integral: ∇ × H = −6x az, and ∫∫ −6x dx dy = −6 × 10.5 × 2 = −126 A. ✓", focus: ["vs", "eq"] },
          ],
          covers: ["text:hayt-d7.6", "lecture:lec3a-q09"],
          trap: "Walking the loop clockwise flips the sign. With dS along +az, go counter-clockwise seen from above.",
        },
        {
          id: "d7.5", level: "tutorial", title: "Hayt D7.5: J in three coordinate systems",
          setup: { vs: { field: "d7.5a", probe: [2, 3, 4], offset: 4, loop: 0, plane: "xy" } },
          problem: "Find J: (a) at P_A(2, 3, 4) if H = x²z ay − y²x az; (b) at P_B(1.5, 90°, 0.5) if H = (2/ρ) cos 0.2φ aρ; (c) at P_C(2, 30°, 20°) if H = (1/sin θ) aθ.",
          lines: [
            { text: "(a) ∇ × H = (−2xy − x²)ax + y² ay + 2xz az = −16ax + 9ay + 16az A/m².", focus: ["vs"], claims: [{ instance: "vs", readout: "c1", value: -16, unit: "" }] },
            { text: "(b) Only Hρ exists, so J = −(1/ρ)∂Hρ/∂φ az = (0.4/ρ²) sin 0.2φ az = 0.055az A/m².", focus: ["eq"] },
            { text: "(c) J = (1/r)[∂(rHθ)/∂r] aφ = (1/(r sin θ)) aφ = 1aφ A/m² at r = 2, θ = 30°.", focus: ["eq"] },
          ],
          covers: ["text:hayt-d7.5", "lecture:lec3a-q08"],
          trap: "Using the Cartesian curl on cylindrical or spherical components. Use the formula sheet's version for each system.",
        },
        {
          id: "f1718", level: "exam", title: "Finals 2017-18 Q3(c): J, current and ∇·B",
          setup: { vs: { field: "f1718-3c", probe: [5, 2, -3], offset: -3, loop: 0, plane: "xy" } },
          problem: "H = yz(x² + y²) ax − y²xz ay + 4x²y² az A/m. (i) Find J at (5, 2, −3). (ii) Find the current through x = −1, 0 < y, z < 2. (iii) Show ∇·B = 0.",
          lines: [
            { text: "(i) J = ∇ × H = xy(8x + y) ax + y(x² − 8xy + y²) ay − z(x² + 4y²) az = 420ax − 102ay + 123az A/m².", focus: ["vs"], claims: [{ instance: "vs", readout: "c1", value: 420, unit: "" }] },
            { text: "(ii) On x = −1, Jx = 8y − y², so I = ∫₀² ∫₀² (8y − y²) dy dz = 2(16 − 8/3) = 26.67 A.", focus: ["vs"] },
            { text: "(iii) ∇·H = 2xyz − 2xyz + 0 = 0, so ∇·B = μ₀∇·H = 0.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 0, unit: "" }] },
          ],
          covers: ["f1718-q3c"],
          trap: "Integrating J at the single point (5, 2, −3). Current is the flux of J over the surface, with x = −1 put in first.",
        },
      ],
      asks: [
        { id: "bend", q: "Can H have curved lines but zero curl?", tags: ["CURL_ZERO"], a: "Yes. A wire's H circles it, but ∇ × H = 0 everywhere except where current flows. Curl measures circulation per unit area at a point, not whether lines bend." },
        { id: "surface", q: "Which surface do I use in Stokes' theorem?", a: "Any surface bounded by the path; the answer is the same. Orient dS with the right-hand rule: fingers along the path, thumb along dS." },
        { id: "point", q: "How does ∇ × H = J follow from Ampère's law?", a: "Apply Ampère's law to a tiny loop: ∮H·dL ≈ (∇ × H)·ΔS, and I_enc = J·ΔS. Divide by ΔS and shrink it: ∇ × H = J." },
        { id: "divb", q: "Why must ∇·B be zero?", a: "There are no magnetic charges. Every B line closes, so no small volume is a source or a sink." },
        { id: "units", q: "What are the units of ∇ × H?", a: "A/m per metre, A/m²: the units of current density, as Ampère's point form requires." },
        { id: "cyl", q: "Which curl do I use for H = Hφ(ρ) aφ?", a: "The cylindrical curl. Only (1/ρ) d(ρHφ)/dρ survives, along az: that's how Finals 2024-25 Q4(a) and 2023-24 Q4(a) want ∇ × H shown." },
      ],
      checks: [
        {
          id: "zero-c", title: "Check: outside a wire", show: ["vs", "eq"], patch: { vs: { field: "filament", probe: [1, 0.5, 0], offset: 0, loop: 0 } },
          note: "Four checks on curl and Stokes' theorem. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "zero-c", type: "choose", prompt: "Outside a straight current-carrying wire, ∇ × H is…", dimension: "conceptual",
            options: [
              choice("zero", "0", true, "Right: no current there, so no curl."),
              choice("h", "I/(2πρ)", false, "That's |H|, not its curl.", "CURL_ZERO"),
              choice("j", "the wire's J", false, "J is zero outside the wire."),
            ] },
          covers: ["lecture:lec3a-q05"],
        },
        {
          id: "predict-shift", title: "Check: slide the rectangle",
          note: "Predict first; then the plate shows the result.",
          patch: { vs: D76 },
          interaction: { id: "predict-shift", type: "predict-drag", prompt: "Slide Hayt D7.6's rectangle to 3 ≤ x ≤ 6 (same size). Drag the circulation to your prediction.", target: { instance: "vs", readout: "circ" }, range: [-300, 0], unit: "", relTol: 0.05, reveal: { vs: { probe: [4.5, 0, 0] } }, dimension: "conceptual",
            feedback: { close: "Right: −6 × 13.5 × 2 = −162.", far: "∫∫ −6x dx dy over 3 to 6: −6 × 13.5 × 2 = −162." } },
        },
        {
          id: "curl-num", title: "Check: a curl component",
          note: "A number.",
          interaction: { id: "curl-num", type: "numeric", prompt: "For H = x²z ay − y²x az, find (∇ × H)ᵧ at (1, 2, 3), in A/m².", answer: { value: 4, unit: "A/m^2" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 6, unit: "A/m^2", errorClass: "conceptual", feedback: "That's the z component, 2xz. The y component is ∂Hx/∂z − ∂Hz/∂x = y²." }],
            hints: ["(∇ × H)ᵧ = ∂Hx/∂z − ∂Hz/∂x.", "Hx = 0, Hz = −y²x.", "−∂(−y²x)/∂x = y²."] },
        },
        {
          id: "curl-inside", title: "Check: inside the wire",
          note: "Last one.",
          interaction: { id: "curl-inside", type: "choose", prompt: "Inside a long wire carrying uniform current density J, ∇ × H equals…", dimension: "recognition",
            options: [
              choice("j", "J", true, "Right: Ampère's point form."),
              choice("zero", "0", false, "Only where there's no current.", "CURL_ZERO"),
              choice("h", "I/(2πρ)", false, "That's the field outside."),
            ] },
          covers: ["f2425-q4a", "f2324-q4a"],
        },
      ],
      recap: {
        points: [
          "Stokes: ∮H·dL = ∫(∇ × H)·dS, over any surface the path bounds.",
          "Point form of Ampère: ∇ × H = J.",
          "No current, no curl, even where H circles.",
          "∇·B = 0 always.",
        ],
        traps: ["Walking the loop the wrong way.", "The Cartesian curl on cylindrical components.", "Curl confused with bending."],
      },
    },
  ],
});
```

Hand checks:
- D7.6, slid to 3 ≤ x ≤ 6: −6 × (36 − 9)/2 × 2 = −162.
- D7.5(b): (0.4/2.25) sin 18° = 0.0549.
- The `filament` field's c3 is exactly 0, because `curl` returns constants.
- `f1718-3c`'s div is exactly 0, because `div` returns 0.

- [ ] **Step 5: Register and commit.**
  - In `plates/index.ts`, add the four plates.
  - In `electrostatics.ts`, delete `locked("em1.magnetostatics.ampere", …)`.
  - In `index.ts`, import `{ ampereConcept }` from `./concepts/magnetostatics` and add it after `capacitanceConcept`.
  - Run `pnpm test && pnpm typecheck`. Expected: PASS.
  - If a "lints clean" warning names an unbacked number, fix the text and the claim together (AGENTS.md) and log a ruling.

  ```bash
  git add packages/course-em1 && git commit -m "feat(course-em1): Biot–Savart and Ampère concept; H, B and force (Hayt D7.2, D8.2), Biot–Savart (HW03 3.1(a)), Ampère (Hayt D7.7, Finals Q4(a), ICT 2 Q1(b)), curl and Stokes (Hayt D7.5, D7.6, Finals 17-18 Q3(c))

  Co-Authored-By: Codex <noreply@openai.com>"
  ```

---
### Task 6: The materials concept's two ideas

**Files:**
- Create: `plates/idea-magnetization.ts`, `plates/idea-mag-boundary.ts`
- Modify: `plates/index.ts`, `index.ts` (register `magMaterialsConcept`), `questions.ts` (remap to `K.mat`)

- [ ] **Step 1: `plates/idea-magnetization.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

// R, choice, eqp, V3 as in Task 5.
const F2425 = { given: "H" as const, F1: [1, 3, 2] as V3, normal: [2, 1, 0] as V3, mur1: 2, mur2: 8 };

export const ideaMagnetization = defineIdeaPlate({
  id: "idea-magnetization",
  title: "Magnetization, χm and μr",
  requires: { objectives: [0], items: ["text:hayt-d8.6", "f2324-q3c", "f2425-q3b"], misconceptions: ["M_UNITS"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "mb", component: "mag-boundary", params: { ...F2425, show: ["H", "B", "M"] } },
    { id: "eq", component: "equation", params: eqp(R`\mathbf B=\mu_0(\mathbf H+\mathbf M)`, "B equals mu nought times H plus M") },
  ],
  ideas: [
    {
      id: "magnetization",
      title: "Magnetization, χm and μr",
      objectives: [0],
      explain: [
        {
          id: "m", title: "Magnetization M", show: ["axes", "mb", "eq"], focus: ["mb", "eq"],
          note: "Atoms carry tiny current loops: orbiting and spinning electrons. In a field they line up, and their net magnetic dipole moment per unit volume is the magnetization M, in A/m like H. These bound currents add to the free ones, so B = μ₀(H + M). In Finals 2024-25 Q3(b), region 1 has μ₁ = 2μ₀ and H₁ = ax + 3ay + 2az A/m; there, M₁ = H₁ = ax + 3ay + 2az A/m.",
          claims: [{ instance: "mb", readout: "M1x", value: 1, unit: "A/m" }, { instance: "mb", readout: "M1y", value: 3, unit: "A/m" }],
        },
        {
          id: "chi", title: "χm and μr", patch: { eq: eqp(R`\mathbf M=\chi_m\mathbf H\ \Rightarrow\ \mathbf B=\mu_0(1+\chi_m)\mathbf H=\mu_r\mu_0\mathbf H`, "M equals chi m H, so B equals mu r mu nought H") }, focus: ["mb", "eq"],
          note: "In linear materials M is proportional to H: M = χmH, where χm is the magnetic susceptibility. Then B = μ₀(1 + χm)H = μrμ₀H, so μr = 1 + χm. Region 1's μr = 2 means χm = 1: M₁ equals H₁, and B₁ = 2μ₀H₁ = 2.513ax + 7.540ay + 5.027az µT (Wentworth §3.7).",
          claims: [{ instance: "mb", readout: "B1x", value: 2.51327e-6, unit: "T" }, { instance: "mb", readout: "B1y", value: 7.53982e-6, unit: "T" }],
        },
        {
          id: "kinds", title: "Three kinds of material", patch: { mb: { mur1: 1 } }, focus: ["mb"],
          note: "Diamagnetic materials such as copper and water have a tiny negative χm, about −10⁻⁵. Paramagnetic ones such as aluminium have a tiny positive χm. Ferromagnets (iron, nickel, cobalt) have χm in the hundreds to thousands, and it depends on H and on history: hysteresis. Course questions treat μr as a constant. Set μr = 1 and M vanishes, because free space has nothing to magnetize.",
          claims: [{ instance: "mb", readout: "M1x", value: 0, unit: "A/m" }],
        },
        {
          id: "from-b", title: "M when B is given", patch: { mb: { given: "B", F1: [3e-4, 0, 0], normal: [1, 0, 0], mur1: 16, mur2: 1 } }, focus: ["mb"],
          note: "When B is given, find H first, H = B/(μrμ₀), then M = χmH. In one step: M = (B/μ₀)(1 − 1/μr). Hayt D8.6(c): B = 300 µT in a material with χm = 15 gives H = 300 × 10⁻⁶/(16μ₀) = 14.92 A/m and M = 15 × 14.92 = 223.8 A/m.",
          claims: [{ instance: "mb", readout: "H1x", value: 14.9208, unit: "A/m" }, { instance: "mb", readout: "M1x", value: 223.812, unit: "A/m" }],
        },
      ],
      examples: [
        {
          id: "d8.6a", level: "basic", title: "Hayt D8.6(a): M from μ and H",
          setup: { mb: { given: "H", F1: [120, 0, 0], normal: [1, 0, 0], mur1: 14.3239, mur2: 1, show: ["H", "B", "M"] } },
          problem: "Find the magnetization in a magnetic material where μ = 1.8 × 10⁻⁵ H/m and H = 120 A/m.",
          lines: [
            { text: "μr = μ/μ₀ = 1.8 × 10⁻⁵/(4π × 10⁻⁷) = 14.32, so χm = μr − 1 = 13.32.", focus: ["mb"] },
            { text: "M = χmH = 13.32 × 120 = 1599 A/m.", focus: ["mb"], claims: [{ instance: "mb", readout: "M1x", value: 1598.87, unit: "A/m" }] },
          ],
          covers: ["text:hayt-d8.6"],
          trap: "Using μrH = 1719 A/m. M is the material's extra contribution: (μr − 1)H.",
        },
        {
          id: "f2324", level: "tutorial", title: "Finals 2023-24 Q3(c)(i): M₁ and B₁",
          setup: { mb: { given: "H", F1: [2, 3, -1], normal: [-1, 1, 0], mur1: 1, mur2: 3, show: ["H", "B", "M"] } },
          problem: "H₁ = 2ax + 3ay − az A/m in the region y − x − 2 ≤ 0, where μ₁ = μ₀. Calculate M₁ and B₁.",
          lines: [
            { text: "μr1 = 1, so χm1 = 0 and M₁ = 0.", focus: ["mb"], claims: [{ instance: "mb", readout: "M1x", value: 0, unit: "A/m" }] },
            { text: "B₁ = μ₀H₁ = 2.513ax + 3.770ay − 1.257az µT.", focus: ["mb"], claims: [{ instance: "mb", readout: "B1y", value: 3.76991e-6, unit: "T" }] },
          ],
          covers: ["f2324-q3c"],
          trap: "Writing M₁ = H₁ out of habit. In free space χm = 0, so there is no magnetization.",
        },
        {
          id: "f2425", level: "exam", title: "Finals 2024-25 Q3(b)(i)–(ii): M₁ and B₁",
          setup: { mb: { ...F2425, show: ["H", "B", "M"] } },
          problem: "H₁ = ax + 3ay + 2az A/m fills the region y + 2x − 4 ≤ 0, where μ₁ = 2μ₀. Calculate (i) the magnetization M₁ and (ii) B₁.",
          lines: [
            { text: "(i) χm1 = μr1 − 1 = 1, so M₁ = χm1H₁ = ax + 3ay + 2az A/m.", focus: ["mb"], claims: [{ instance: "mb", readout: "M1z", value: 2, unit: "A/m" }] },
            { text: "(ii) B₁ = μ₀(H₁ + M₁) = 2μ₀H₁ = 2.513ax + 7.540ay + 5.027az µT.", focus: ["mb", "eq"], claims: [{ instance: "mb", readout: "B1z", value: 5.02655e-6, unit: "T" }] },
          ],
          covers: ["f2425-q3b"],
          trap: "Giving B₁ as μ₀H₁. In a material, B = μrμ₀H.",
        },
      ],
      asks: [
        { id: "units", q: "What are M's units?", tags: ["M_UNITS"], a: "A/m, the same as H: M is magnetic dipole moment (A·m²) per unit volume (m³). B is in tesla, and B = μ₀(H + M)." },
        { id: "chi-mu", q: "How are χm and μr related?", a: "μr = 1 + χm. Free space has χm = 0 and μr = 1." },
        { id: "kinds", q: "Dia-, para- and ferromagnetic?", a: "Diamagnets have a slightly negative χm and are weakly repelled by magnets; paramagnets have a slightly positive χm and are weakly attracted; ferromagnets have χm in the hundreds or thousands." },
        { id: "bound", q: "What are bound currents?", a: "Aligned atomic current loops act like currents on and through the magnetized body: the bound current density is ∇ × M. They add to the free currents to make B." },
        { id: "twin", q: "How is this like polarization?", a: "M plays the role of P. One difference: P weakens E inside a dielectric, while M in a paramagnet or ferromagnet strengthens B." },
        { id: "hysteresis", q: "Is μr really constant for iron?", a: "No. Iron's B–H curve saturates and shows hysteresis, so μr depends on H and on history. Course questions take μr as constant: a linear material." },
      ],
      checks: [
        {
          id: "b-formula", title: "Check: B, H and M", show: ["axes", "mb", "eq"], patch: { mb: { ...F2425, show: ["H", "B", "M"] } },
          note: "Four checks on magnetization. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "b-formula", type: "choose", prompt: "In a magnetic material, B =", dimension: "recognition",
            options: [
              choice("right", "μ₀(H + M)", true, "Right: free plus bound contributions."),
              choice("wrong", "μ₀H + M", false, "M is in A/m; it needs the μ₀ too.", "M_UNITS"),
              choice("m", "μ₀M", false, "That leaves out the free currents' H."),
            ] },
        },
        {
          id: "predict-mur", title: "Check: a stronger material",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-mur", type: "predict-drag", prompt: "Region 1's μr rises from 2 to 5, with the same H₁. Drag M₁ᵧ to your prediction.", target: { instance: "mb", readout: "M1y" }, range: [0, 20], unit: "A/m", relTol: 0.05, reveal: { mb: { mur1: 5 } }, dimension: "conceptual",
            feedback: { close: "Right: χm = 4, so M₁ᵧ = 12 A/m.", far: "M = (μr − 1)H = 4 × 3 = 12 A/m." } },
        },
        {
          id: "m-num", title: "Check: Hayt D8.6(a)",
          note: "A number.",
          interaction: { id: "m-num", type: "numeric", prompt: "μ = 1.8 × 10⁻⁵ H/m and H = 120 A/m. Find M, in A/m.", answer: { value: 1598.87, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 1718.87, unit: "A/m", errorClass: "conceptual", tag: "M_UNITS", feedback: "That's μrH. M = (μr − 1)H." }],
            hints: ["μr = μ/μ₀.", "χm = μr − 1.", "M = χmH."] },
          covers: ["text:hayt-d8.6"],
        },
        {
          id: "f2425-m", title: "Check: Finals 2024-25 Q3(b)(i)",
          note: "Last one.",
          interaction: { id: "f2425-m", type: "numeric", prompt: "H₁ = ax + 3ay + 2az A/m in a material with μ₁ = 2μ₀. Find M₁ᵧ, in A/m.", answer: { value: 3, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 6, unit: "A/m", errorClass: "conceptual", tag: "M_UNITS", feedback: "That's μrH. χm = μr − 1 = 1, so M₁ᵧ = 3." }],
            hints: ["χm = μr − 1.", "μr = 2.", "M = χmH."] },
          covers: ["f2425-q3b"],
        },
      ],
      recap: {
        points: ["M is magnetic dipole moment per volume, in A/m.", "B = μ₀(H + M); M = χmH; μr = 1 + χm.", "Given B: M = (B/μ₀)(1 − 1/μr)."],
        traps: ["M = μrH instead of (μr − 1)H.", "B = μ₀H inside a material.", "M in tesla."],
      },
    },
  ],
});
```

Hand checks:
- 1.8 × 10⁻⁵/μ₀ = 14.3239, so M = 13.3239 × 120 = 1598.87.
- 3 × 10⁻⁴/(16μ₀) = 14.9208, and 15 × 14.9208 = 223.812.
- With μr = 1, M = (B/μ₀)(1 − 1) = 0 exactly.

- [ ] **Step 2: `plates/idea-mag-boundary.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice, eqp, V3 as in Task 5.
const mbn = instantiate(templates.find((t) => t.id === "mag-bnd-normal")!, 1);
const iMU = 1 / (4e-7 * Math.PI);
const F2425 = { given: "H" as const, F1: [1, 3, 2] as V3, normal: [2, 1, 0] as V3, mur1: 2, mur2: 8, measure: "normal" as const };
const HW033 = { given: "H" as const, F1: [9.44 * iMU, 6.87 * iMU, -12.2 * iMU] as V3, normal: [5, 4, 10] as V3, mur1: 4.66, mur2: 6.99, measure: "normal" as const };

export const ideaMagBoundary = defineIdeaPlate({
  id: "idea-mag-boundary",
  title: "Magnetic boundary conditions",
  requires: {
    objectives: [1],
    items: ["f2425-q3b", "f1718-q4a", "hw03-2425-3.3", "ict2-2425-q3", "f2324-q3c", "f2425r-q3b", "drill25-q8", "drill25-q9", "f1516-q4c", "lecture:lec3a-q13"],
    misconceptions: ["MBND_SWAP"],
  },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "mb", component: "mag-boundary", params: { ...F2425, show: ["n", "split", "H", "angles"] } },
    { id: "eq", component: "equation", params: eqp(R`B_{1n}=B_{2n},\qquad \mathbf H_{1t}=\mathbf H_{2t}\ (K=0)`, "normal B is continuous, and tangential H is continuous") },
  ],
  ideas: [
    {
      id: "mbnd",
      title: "Magnetic boundary conditions",
      objectives: [1],
      explain: [
        {
          id: "rules", title: "Two rules", show: ["axes", "mb", "eq"], focus: ["eq", "mb"],
          note: "The magnetic boundary conditions mirror the electric ones (Wentworth §3.8). Gauss's law for magnetism on a flat pillbox gives B₁ₙ = B₂ₙ: normal B is continuous. Ampère's law round a thin loop gives H₁ₜ − H₂ₜ = K. With no surface current, K = 0 and tangential H is continuous. So normal B and tangential H carry across, just as normal D and tangential E did.",
        },
        {
          id: "split", title: "Split H₁", focus: ["mb"],
          note: "Finals 2024-25 Q3(b): the plane y + 2x − 4 = 0 has normal (2, 1, 0), so n̂ = (2, 1, 0)/√5. With H₁ = ax + 3ay + 2az A/m, H₁·n̂ = 5/√5, so H₁ₙ = 2ax + ay and H₁ₜ = H₁ − H₁ₙ = −ax + 2ay + 2az A/m. Tangential H carries over unchanged. Normal B carries over, so μ₁H₁ₙ = μ₂H₂ₙ.",
          claims: [
            { instance: "mb", readout: "H1nx", value: 2, unit: "A/m" }, { instance: "mb", readout: "H1ny", value: 1, unit: "A/m" },
            { instance: "mb", readout: "H1tx", value: -1, unit: "A/m" }, { instance: "mb", readout: "H1tz", value: 2, unit: "A/m" },
          ],
        },
        {
          id: "assemble", title: "Assemble H₂ and B₂", patch: { mb: { show: ["n", "split", "H", "B"] } }, focus: ["mb"],
          note: "With μ₁ = 2μ₀ and μ₂ = 8μ₀: H₂ₙ = (2/8)H₁ₙ = 0.5ax + 0.25ay, and H₂ₜ = −ax + 2ay + 2az. So H₂ = −0.5ax + 2.25ay + 2az A/m, and B₂ = 8μ₀H₂ = −5.027ax + 22.62ay + 20.11az µT. Check the rule: B₂ₙ = 8μ₀(0.5, 0.25, 0) = 2μ₀(2, 1, 0) = B₁ₙ.",
          claims: [{ instance: "mb", readout: "H2x", value: -0.5, unit: "A/m" }, { instance: "mb", readout: "H2y", value: 2.25, unit: "A/m" }, { instance: "mb", readout: "B2y", value: 2.26195e-5, unit: "T" }],
        },
        {
          id: "refract", title: "The refraction law", patch: { mb: { show: ["angles", "mag"] }, eq: eqp(R`\dfrac{\tan\theta_1}{\tan\theta_2}=\dfrac{\mu_1}{\mu_2}`, "tan theta one over tan theta two equals mu one over mu two") }, focus: ["mb", "eq"],
          note: "Measured from the normal, tan θ = |Ht|/|Hn|. Ht is shared and μHn is shared, so tan θ₁/tan θ₂ = μ₁/μ₂. Here θ₁ = 53.30° and θ₂ = 79.44°: the field swings toward the boundary in the higher-permeability region. That is why iron guides flux: lines entering iron from air bend almost parallel to its surface.",
          claims: [{ instance: "mb", readout: "th1", value: 53.3008, unit: "°" }, { instance: "mb", readout: "th2", value: 79.4446, unit: "°" }],
        },
      ],
      examples: [
        {
          id: "drill25-q9", level: "basic", title: "Drill 2025 Q9: the ratio from B alone",
          setup: { mb: { given: "B", F1: [40 / iMU, 0, -25 / iMU], normal: [0, 0, 1], mur1: 8, mur2: 7, measure: "tangent", show: ["B", "angles"] } },
          problem: "A plane interface between two magnetic regions is normal to one Cartesian axis. B₁ = μ₀(40.0ax − 25.0az) T and B₂ = μ₀(35.0ax − 25.0az) T. Find tan θ₁/tan θ₂, with the angles measured from the interface.",
          lines: [
            { text: "Normal B is continuous, and only the z components match (−25 on both sides), so the interface is normal to az.", focus: ["mb"] },
            { text: "From the interface, tan θ = |Bₙ|/|Bₜ|: tan θ₁ = 25/40, so θ₁ = 32.01°; tan θ₂ = 25/35, so θ₂ = 35.54°.", focus: ["mb"], claims: [{ instance: "mb", readout: "th1", value: 32.0054, unit: "°" }, { instance: "mb", readout: "th2", value: 35.5377, unit: "°" }] },
            { text: "tan θ₁/tan θ₂ = 35/40 = 0.875, which is μ₂/μ₁ because Hₜ is shared.", focus: ["mb"] },
          ],
          covers: ["drill25-q9", "lecture:lec3a-q13"],
          trap: "Assuming the interface is normal to ax. The x components differ, so x is tangential.",
        },
        {
          id: "f1718", level: "tutorial", title: "Finals 2017-18 Q4(a): H₂ and B₂",
          setup: { mb: { given: "H", F1: [-2, 6, 4], normal: [-1, 1, 0], mur1: 1, mur2: 2, measure: "normal", show: ["n", "split", "H", "B"] } },
          problem: "H₁ = −2ax + 6ay + 4az A/m in the region y − x − 2 ≤ 0, where μ₁ = μ₀. Calculate (i) M₁ and B₁, (ii) H₂ and B₂ in the region y − x − 2 ≥ 0, where μ₂ = 2μ₀.",
          lines: [
            { text: "(i) μr1 = 1, so M₁ = 0 and B₁ = μ₀H₁ = −2.513ax + 7.540ay + 5.027az µT.", focus: ["mb"], claims: [{ instance: "mb", readout: "B1y", value: 7.53982e-6, unit: "T" }] },
            { text: "n̂ = (−ax + ay)/√2; H₁·n̂ = 8/√2, so H₁ₙ = −4ax + 4ay and H₁ₜ = 2ax + 2ay + 4az A/m.", focus: ["mb"], claims: [{ instance: "mb", readout: "H1nx", value: -4, unit: "A/m" }, { instance: "mb", readout: "H1tz", value: 4, unit: "A/m" }] },
            { text: "(ii) H₂ₙ = ½H₁ₙ = −2ax + 2ay, so H₂ = 4ay + 4az A/m and B₂ = 2μ₀H₂ = 10.05ay + 10.05az µT.", focus: ["mb"], claims: [{ instance: "mb", readout: "H2y", value: 4, unit: "A/m" }, { instance: "mb", readout: "B2z", value: 1.00531e-5, unit: "T" }] },
          ],
          covers: ["f1718-q4a"],
          trap: "Dividing the whole of H₁ by 2. Only the normal part changes; the tangential part crosses unchanged.",
        },
        {
          id: "hw03", level: "exam", title: "HW03 3.3: H₂, B₂, the angles and M",
          setup: { mb: { ...HW033, show: ["n", "H", "B", "angles"] } },
          problem: "Region 1 (μr1 = 4.66) and region 2 (μr2 = 1.5μr1) meet at the plane 5x + 4y + 10z − 12 = 0, with K = 0. In region 1, H₁ = (1/μ₀)(9.44ax + 6.87ay − 12.2az) A/m. Calculate (a) H₂ in terms of μ₀, (b) B₂, (c) θ₁ and θ₂ from the normal, (d) M₁ and M₂.",
          lines: [
            { text: "n̂ = (5, 4, 10)/√141. μ₀H₁·n̂ = −3.985, so μ₀H₁ₙ = −1.678ax − 1.342ay − 3.356az and μ₀H₁ₜ = 11.12ax + 8.212ay − 8.844az.", focus: ["mb"] },
            { text: "(a) μr2 = 6.99, so H₂ₙ = (4.66/6.99)H₁ₙ, and H₂ = (1/μ₀)(10.00ax + 7.317ay − 11.08az) A/m.", focus: ["mb"], claims: [{ instance: "mb", readout: "H2x", value: 7.95722e6, unit: "A/m" }, { instance: "mb", readout: "H2z", value: -8.81824e6, unit: "A/m" }] },
            { text: "(b) B₂ = μr2μ₀H₂ = 69.90ax + 51.15ay − 77.46az T.", focus: ["mb"], claims: [{ instance: "mb", readout: "B2x", value: 69.8954, unit: "T" }] },
            { text: "(c) θ₁ = 76.35° and θ₂ = 80.80° from the normal; check: tan θ₁/tan θ₂ = 4.66/6.99.", focus: ["mb"], claims: [{ instance: "mb", readout: "th1", value: 76.3499, unit: "°" }, { instance: "mb", readout: "th2", value: 80.8035, unit: "°" }] },
            { text: "(d) M₁ = 3.66H₁ = (1/μ₀)(34.55ax + 25.14ay − 44.65az) A/m; M₂ = 5.99H₂ = (1/μ₀)(59.90ax + 43.83ay − 66.38az) A/m.", focus: ["mb"] },
          ],
          covers: ["hw03-2425-3.3"],
          trap: "Using μr2 = 1.5 instead of 1.5 × 4.66 = 6.99. Read 'μr2 = 1.5μr1' carefully.",
        },
      ],
      asks: [
        { id: "swap", q: "Which components are continuous at a magnetic boundary?", tags: ["MBND_SWAP"], a: "Normal B and, with no surface current, tangential H. Not normal H, and not tangential B: those jump by the permeability ratio." },
        { id: "k", q: "What if there is a surface current K?", a: "Then H₁ₜ − H₂ₜ = K × aₙ₁₂: tangential H jumps by the surface current density. Every course question sets K = 0 and says so." },
        { id: "twin", q: "How do these compare with the electric conditions?", a: "Swap D for B, E for H, ε for μ and ρs for K. Normal D becomes normal B; tangential E becomes tangential H." },
        { id: "iron", q: "Why does iron guide magnetic flux?", a: "With μ₂ ≫ μ₁, tan θ₂ = (μ₂/μ₁) tan θ₁ is huge, so inside iron the field runs almost parallel to the surface. Flux stays in the iron, which is how magnetic circuits work." },
        { id: "mu0", q: "Do I keep μ₀ as a symbol?", a: "Often, yes. HW03 3.3 gives H₁ with 1/μ₀ outside, and the cleanest answers keep it: H₂ = (1/μ₀)(…) A/m. Note the units, as the lecturer stresses." },
        { id: "plane", q: "How do I get the normal of y − x − 2 = 0?", a: "Read the coefficients, (−1, 1, 0), and divide by the length √2. The constant 2 only places the plane." },
      ],
      checks: [
        {
          id: "rule-c", title: "Check: what carries across", show: ["axes", "mb", "eq"], patch: { mb: { ...F2425, show: ["n", "split", "H", "angles"] } },
          note: "Eight checks on magnetic boundaries. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "rule-c", type: "choose", prompt: "With K = 0, at a magnetic boundary…", dimension: "recognition",
            options: [
              choice("right", "Bₙ and Hₜ are continuous", true, "Right."),
              choice("swap", "Hₙ and Bₜ are continuous", false, "Swapped: Gauss gives Bₙ, Ampère gives Hₜ.", "MBND_SWAP"),
              choice("all", "B is continuous", false, "Only its normal part."),
            ] },
        },
        {
          id: "predict-mu2", title: "Check: a stronger region 2",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-mu2", type: "predict-drag", prompt: "μ₂ rises from 8μ₀ to 16μ₀, with the same H₁. Drag θ₂ to your prediction.", target: { instance: "mb", readout: "th2" }, range: [0, 90], unit: "°", relTol: 0.05, reveal: { mb: { mur2: 16 } }, dimension: "conceptual",
            feedback: { close: "Right: 84.68°, even closer to the boundary.", far: "H₂ₙ shrinks to (2/16)H₁ₙ while Hₜ stays: θ₂ = 84.68°." } },
        },
        {
          id: "mbn-num", title: "Check: normal H, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "mbn-num", type: "numeric", prompt: mbn.prompt, answer: mbn.spec.answer, distractors: mbn.spec.distractors, relTol: mbn.spec.relTol, hints: mbn.hints, template: "mag-bnd-normal", dimension: "computational" },
        },
        {
          id: "ict2-q3", title: "Check: ICT 2 Q3",
          note: "From the lecturer's ICT.",
          interaction: { id: "ict2-q3", type: "numeric", prompt: "ICT 2 Q3: B₁ = 14ax − 35ay + 28az µT meets the plane 12x + 5z = 3π, with μr1 = 8 and μr2 = 25 (K = 0). Find the angle B₂ makes with the normal, in degrees.", answer: { value: 79.4078, unit: "°" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 59.6986, unit: "°", errorClass: "conceptual", feedback: "That's θ₁, in region 1. B₂ₜ = (25/8)B₁ₜ makes region 2's angle larger." }],
            hints: ["n̂ = (12, 0, 5)/13; B₁ₙ = (308/169)(12, 0, 5) µT.", "B₂ₙ = B₁ₙ; B₂ₜ = (μ₂/μ₁)B₁ₜ.", "θ₂ = cos⁻¹(|B₂ₙ|/|B₂|)."] },
          covers: ["ict2-2425-q3"],
        },
        {
          id: "f2324-q3c", title: "Check: Finals 2023-24 Q3(c)(ii)",
          note: "Another plane.",
          interaction: { id: "f2324-q3c", type: "numeric", prompt: "Finals 2023-24 Q3(c): H₁ = 2ax + 3ay − az A/m (μ₁ = μ₀) at the plane y − x − 2 = 0; μ₂ = 3μ₀. Find H₂ᵧ, in A/m.", answer: { value: 2.66667, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 3, unit: "A/m", errorClass: "conceptual", tag: "MBND_SWAP", feedback: "y isn't purely tangential to this plane: H₁ₙ = −0.5ax + 0.5ay changes by μ₁/μ₂." }],
            hints: ["n̂ = (−1, 1, 0)/√2; H₁ₙ = −0.5ax + 0.5ay.", "H₂ₙ = H₁ₙ/3.", "H₂ᵧ = (3 − 0.5) + 0.5/3."] },
          covers: ["f2324-q3c"],
        },
        {
          id: "f2425r", title: "Check: the 2024-25 resit Q3(b)",
          note: "The resit.",
          interaction: { id: "f2425r", type: "numeric", prompt: "H₁ = 6ax + 3ay + 2az A/m with μ₁ = 2μ₀ in 3x + 4z ≤ 19; μ₂ = 4μ₀ beyond. Find H₂ₓ, in A/m.", answer: { value: 4.44, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 6, unit: "A/m", errorClass: "conceptual", tag: "MBND_SWAP", feedback: "x has a normal part here: n̂ = (0.6, 0, 0.8)." }],
            hints: ["n̂ = (0.6, 0, 0.8); H₁·n̂ = 5.2.", "H₁ₙ = 3.12ax + 4.16az; H₂ₙ = H₁ₙ/2.", "H₂ₓ = 2.88 + 1.56."] },
          covers: ["f2425r-q3b"],
        },
        {
          id: "drill25-q8", title: "Check: Drill 2025 Q8",
          note: "From the interface.",
          interaction: { id: "drill25-q8", type: "numeric", prompt: "B₁ = 12ax + 10ay − 14az T in region 1 (z < 0, μr1 = 15); region 2 (z > 0) has μr2 = 1. Find the angle B₂ makes with the interface, in degrees.", answer: { value: 85.746, unit: "°" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 41.8685, unit: "°", errorClass: "conceptual", feedback: "That's region 1's angle. B₂ₜ = B₁ₜ/15, so B₂ stands much steeper." }],
            hints: ["B₂z = −14; B₂ₜ = (μ₂/μ₁)B₁ₜ = (12, 10)/15.", "From the interface: tan θ = |Bₙ|/|Bₜ|.", "tan θ₂ = 14/√(0.8² + 0.667²)."] },
          covers: ["drill25-q8"],
        },
        {
          id: "f1516", title: "Check: Finals 2015-16 Q4(c)",
          note: "Last one.",
          interaction: { id: "f1516", type: "numeric", prompt: "At the xy-plane boundary, B₁ = 5ax + 6ay + 7az Wb/m² in medium 1 (μr1 = 1); medium 2 has μr2 = 16. Find H₂z, in A/m.", answer: { value: 348151, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 5.57042e6, unit: "A/m", errorClass: "conceptual", tag: "MBND_SWAP", feedback: "That copies H₁z. It's B₂z = 7 that's continuous; H₂z = 7/(16μ₀)." }],
            hints: ["z is normal: B₂z = B₁z = 7.", "H₂z = B₂z/(μr2μ₀).", "7/(16 × 4π × 10⁻⁷)."] },
          covers: ["f1516-q4c"],
        },
      ],
      recap: {
        points: [
          "K = 0: B₁ₙ = B₂ₙ and H₁ₜ = H₂ₜ.",
          "Recipe: n̂; H₁ₙ = (H₁·n̂)n̂; H₁ₜ = H₁ − H₁ₙ; H₂ = H₁ₜ + (μ₁/μ₂)H₁ₙ; B₂ = μ₂H₂.",
          "From the normal: tan θ₁/tan θ₂ = μ₁/μ₂.",
          "High-μ regions pull the field toward the boundary.",
        ],
        traps: ["Continuous Hₙ or Bₜ.", "Scaling all of H₁.", "Mixing up angle references."],
      },
    },
  ],
});
```

Hand checks:
- θ₂ at μ₂ = 16μ₀: tan⁻¹(3/(√5/8)) = 84.677°.
- HW03 3.3 in SI: H₂ = (7.95722, 5.82306, −8.81824) × 10⁶ A/m; B₂ = (69.8954, 51.1491, −77.4585) T.
- Drill 2025 Q9: angles 32.0054° and 35.5377°.
- Finals 2015-16 Q4(c): 7/(16μ₀) = 348151 A/m.

- [ ] **Step 3: Register and remap.**
  - In `plates/index.ts`, add both plates.
  - In `index.ts`, import `magMaterialsConcept` and add it after `ampereConcept`.
  - In `questions.ts`:
    - change `K.amp` to `K.mat` in `f2425-q3b`, `f2324-q3c`, `f1718-q4a`, `f2425r-q3b`, `f1516-q4c`, `ict2-2425-q3`, `hw03-2425-3.3`, `drill25-q8` and `drill25-q9`;
    - set their `practice` to `"em1.magnetostatics.materials/main"`.
  - Run `pnpm test && pnpm typecheck`. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): magnetic materials concept; magnetization (Hayt D8.6, Finals Q3(b)) and magnetic boundaries (Finals 24-25, 23-24, 17-18, resit; HW03 3.3; ICT 2 Q3; Drill 2025)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 7: The inductance concept's two ideas

**Files:**
- Create: `plates/idea-self-inductance.ts`, `plates/idea-mag-energy.ts`
- Modify: `plates/index.ts`, `index.ts` (register `inductanceConcept`), `questions.ts` (remap to `K.ind`)

- [ ] **Step 1: `plates/idea-self-inductance.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice, eqp as in Task 5.
const sol = instantiate(templates.find((t) => t.id === "ind-solenoid")!, 1);
const cox = instantiate(templates.find((t) => t.id === "ind-coax")!, 1);
const D813 = { kind: "solenoid" as const, N: 1500, radius: 0.01, length: 0.5, mur: 75, I: 2 };

export const ideaSelfInductance = defineIdeaPlate({
  id: "idea-self-inductance",
  title: "Self-inductance",
  requires: { objectives: [0], items: ["text:hayt-d8.13", "text:hayt-d8.12", "f1718-q4b", "f1415-q2b"], misconceptions: ["IND_TURNS", "IND_LN"] },
  instances: [
    { id: "ind", component: "inductor", params: D813 },
    { id: "eq", component: "equation", params: eqp(R`L=\dfrac{N\Phi}{I}`, "L equals N phi over I") },
  ],
  ideas: [
    {
      id: "self",
      title: "Self-inductance",
      objectives: [0],
      explain: [
        {
          id: "def", title: "L = NΦ/I", show: ["ind", "eq"], focus: ["ind", "eq"],
          note: "A current I in a coil makes a flux Φ through each of its N turns. The flux linkage NΦ is proportional to I, and the constant is the self-inductance: L = NΦ/I, in henries. Like capacitance, L depends only on geometry and material. Hayt D8.13(a): a solenoid 50 cm long and 2 cm in diameter, with 1500 turns on a core of μr = 75, has L = μN²S/ℓ = 133.2 mH.",
          claims: [{ instance: "ind", readout: "L", value: 0.13324, unit: "H" }],
        },
        {
          id: "n2", title: "Why N²", patch: { ind: { N: 750 } }, focus: ["ind"],
          note: "Halve the turns to 750 and L falls to a quarter, 33.31 mH. N appears twice: N turns make the field (H = NI/ℓ), and the resulting flux links all N turns. Doubling the radius would quadruple L too, through the area S = πr².",
          claims: [{ instance: "ind", readout: "L", value: 0.0333099, unit: "H" }],
        },
        {
          id: "toroid", title: "The toroid", patch: { ind: { kind: "toroid", N: 500, a: 0.02, b: 0.045, h: 0.025, mur: 1 }, eq: eqp(R`L=\dfrac{\mu N^2h}{2\pi}\ln\dfrac{b}{a}`, "L equals mu N squared h over two pi times the natural log of b over a") }, focus: ["ind", "eq"],
          note: "In a toroid the field is trapped inside the core: H = NI/(2πρ). For a rectangular cross-section of height h between radii a and b, integrating the flux gives L = (μN²h/2π) ln(b/a). Hayt D8.12(b): 500 turns on a 2.5 cm square fibreglass form with an inner radius of 2 cm gives 1.014 mH.",
          claims: [{ instance: "ind", readout: "L", value: 0.00101366, unit: "H" }],
        },
        {
          id: "lines", title: "Coax and two-wire lines", patch: { ind: { kind: "coax", a: 0.0008, b: 0.004, length: 3.5, mur: 50 }, eq: eqp(R`L=\dfrac{\mu\ell}{2\pi}\ln\dfrac{b}{a}`, "L equals mu ell over two pi times the natural log of b over a") }, focus: ["ind", "eq"],
          note: "For a coax, the flux between the conductors gives the external inductance L = (μℓ/2π) ln(b/a) (Wentworth §3.9). Hayt D8.12(a): 3.5 m of coax with a = 0.8 mm, b = 4 mm and μr = 50 has 56.33 µH. At low frequency the conductor's own internal flux adds μ/(8π) per metre. Two parallel wires of radius a and separation s give L' = (μ/π) ln((s − a)/a), plus μ/(4π) internal.",
          claims: [{ instance: "ind", readout: "L", value: 5.63303e-5, unit: "H" }],
        },
      ],
      examples: [
        {
          id: "solenoid", level: "basic", title: "Hayt D8.13(a): a cored solenoid",
          setup: { ind: D813 },
          problem: "A solenoid is 50 cm long, 2 cm in diameter and has 1500 turns. Its core has a relative permeability of 75. Find L.",
          lines: [
            { text: "S = π(0.01)² = 3.142 × 10⁻⁴ m², with the radius, not the diameter.", focus: ["ind"] },
            { text: "L = μN²S/ℓ = 75 × 4π × 10⁻⁷ × 1500² × 3.142 × 10⁻⁴/0.5 = 133.2 mH.", focus: ["ind"], claims: [{ instance: "ind", readout: "L", value: 0.13324, unit: "H" }] },
          ],
          covers: ["text:hayt-d8.13"],
          trap: "Using 2 cm as the radius makes L four times too large.",
        },
        {
          id: "coax", level: "tutorial", title: "Hayt D8.12(a): a coax",
          setup: { ind: { kind: "coax", a: 0.0008, b: 0.004, length: 3.5, mur: 50, I: 2 } },
          problem: "Find the self-inductance of 3.5 m of coaxial cable with a = 0.8 mm and b = 4 mm, filled with a material of μr = 50.",
          lines: [
            { text: "ln(b/a) = ln 5 = 1.609; μ/2π = 50 × 2 × 10⁻⁷ = 10⁻⁵ H/m.", focus: ["ind"] },
            { text: "L = 10⁻⁵ × 1.609 × 3.5 = 56.33 µH (external only, as Hayt intends).", focus: ["ind"], claims: [{ instance: "ind", readout: "L", value: 5.63303e-5, unit: "H" }] },
          ],
          covers: ["text:hayt-d8.12"],
          trap: "log₁₀ 5 = 0.699 gives 24.5 µH. The flux integral gives the natural log.",
        },
        {
          id: "lines", level: "exam", title: "Finals 2017-18 Q4(b) and 2014-15 Q2(b): derive them",
          setup: { ind: { kind: "twowire", a: 0.001, s: 0.1, length: 1, mur: 1, internal: true, I: 1 } },
          problem: "Determine the self-inductance per metre of (a) a coaxial cable of inner radius a and outer radius b and (b) a two-wire line of radius a and separation s, in air. Evaluate (b) for a = 1 mm and s = 10 cm.",
          lines: [
            { text: "(a) Between the conductors B = μI/(2πρ), so the flux per metre is ∫_a^b μI/(2πρ) dρ = (μI/2π) ln(b/a), and L' = (μ/2π) ln(b/a). The inner conductor's own flux adds μ/(8π).", focus: ["eq"] },
            { text: "(b) Between the wires, both fields add: Φ' = ∫_a^(s−a) [μ₀I/(2πx) + μ₀I/(2π(s − x))] dx = (μ₀I/π) ln((s − a)/a).", focus: ["ind"] },
            { text: "L' = (μ₀/π)[ln((s − a)/a) + ¼] = 4 × 10⁻⁷ × (ln 99 + 0.25) = 1.938 µH/m (1.838 µH/m external).", focus: ["ind"], claims: [{ instance: "ind", readout: "L", value: 1.93805e-6, unit: "H" }] },
          ],
          covers: ["f1718-q4b", "f1415-q2b"],
          trap: "Counting only one wire's field between them halves the external part. Both currents' fields point the same way between the wires.",
        },
      ],
      asks: [
        { id: "n2", q: "Why does L go as N²?", tags: ["IND_TURNS"], a: "N turns make the field, so Φ ∝ N; and that flux links all N turns, so NΦ ∝ N². Double the turns, quadruple the inductance." },
        { id: "henry", q: "What is a henry?", a: "1 H = 1 Wb/A: one weber of flux linkage per ampere. Equivalently 1 V·s/A, since v = L di/dt." },
        { id: "ln", q: "Why ln(b/a) in the coax?", tags: ["IND_LN"], a: "B = μI/(2πρ) between the conductors, and integrating 1/ρ from a to b gives the natural log." },
        { id: "internal", q: "When do I include internal inductance?", a: "At low frequency, when current fills the conductor: add μ/(8π) per metre per conductor. At high frequency the skin effect pushes current to the surface, and the internal term fades." },
        { id: "toroid", q: "Why is a toroid a good inductor?", a: "Its field stays inside the core, so it neither leaks flux nor picks up interference, and its L follows from a single Ampère circle." },
        { id: "core", q: "What does an iron core do?", a: "Multiplies L by μr: the same H makes μr times the flux. That's why practical inductors use ferrite or iron cores." },
      ],
      checks: [
        {
          id: "n-c", title: "Check: doubling the turns", show: ["ind", "eq"], patch: { ind: D813 },
          note: "Four checks on inductance. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "n-c", type: "choose", prompt: "Doubling the turns of a solenoid, keeping its length and radius, multiplies L by…", dimension: "conceptual",
            options: [
              choice("four", "4", true, "Right: L ∝ N²."),
              choice("two", "2", false, "The flux links every turn too: N².", "IND_TURNS"),
              choice("one", "1", false, "More turns, more field, more linkage."),
            ] },
        },
        {
          id: "predict-core", title: "Check: remove the core",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-core", type: "predict-drag", prompt: "Remove the core (μr from 75 to 1). Drag L to your prediction.", target: { instance: "ind", readout: "L" }, range: [0, 0.2], unit: "H", relTol: 0.05, reveal: { ind: { mur: 1 } }, dimension: "conceptual",
            feedback: { close: "Right: 1.777 mH, a 75th.", far: "L ∝ μ: 133.2/75 = 1.777 mH." } },
        },
        {
          id: "sol-num", title: "Check: a solenoid, your numbers",
          note: "Numbers of your own, in cm.",
          interaction: { id: "sol-num", type: "numeric", prompt: sol.prompt, answer: sol.spec.answer, distractors: sol.spec.distractors, relTol: sol.spec.relTol, hints: sol.hints, template: "ind-solenoid", dimension: "computational" },
        },
        {
          id: "coax-num", title: "Check: a coax, your numbers",
          note: "Last one.",
          interaction: { id: "coax-num", type: "numeric", prompt: cox.prompt, answer: cox.spec.answer, distractors: cox.spec.distractors, relTol: cox.spec.relTol, hints: cox.hints, template: "ind-coax", dimension: "computational" },
        },
      ],
      recap: {
        points: [
          "L = NΦ/I, in henries; it depends only on geometry and μ.",
          "Solenoid: μN²S/ℓ. Toroid: (μN²h/2π) ln(b/a).",
          "Coax: (μℓ/2π) ln(b/a), plus μ/(8π) per metre internal.",
          "Two-wire: (μ/π) ln((s − a)/a) per metre, plus μ/(4π) internal.",
        ],
        traps: ["N instead of N².", "Diameter for radius.", "log₁₀ for ln."],
      },
    },
  ],
});
```

Hand checks:
- 750 turns: 0.13324/4 = 0.0333099 H. Without the core: 0.13324/75 = 1.77653 mH.
- Two-wire: 4 × 10⁻⁷ × (ln 99 + 0.25) = 1.93805 × 10⁻⁶ H.
- The coax with log₁₀: 10⁻⁵ × 0.69897 × 3.5 = 24.46 µH.

- [ ] **Step 2: `plates/idea-mag-energy.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

// R, choice, eqp as in Task 5.
const D813 = { kind: "solenoid" as const, N: 1500, radius: 0.01, length: 0.5, mur: 75, I: 2 };

export const ideaMagEnergy = defineIdeaPlate({
  id: "idea-mag-energy",
  title: "Magnetic energy and mutual inductance",
  requires: { objectives: [1], items: ["text:hayt-d8.13", "lecture:lec3b-energy", "lecture:lec3b-mutual"], misconceptions: ["WM_HALF"] },
  instances: [
    { id: "ind", component: "inductor", params: D813 },
    { id: "eq", component: "equation", params: eqp(R`W=\tfrac12LI^2`, "W equals one half L I squared") },
  ],
  ideas: [
    {
      id: "energy",
      title: "Magnetic energy and mutual inductance",
      objectives: [1],
      explain: [
        {
          id: "w", title: "Energy in an inductor", show: ["ind", "eq"], focus: ["ind", "eq"],
          note: "Building up a current against the back-emf v = L di/dt takes work: W = ∫Li di = ½LI². The plate's 133.2 mH solenoid carrying 2 A stores 0.2665 J. The ½ arises as it does for a capacitor: the opposing emf works against a current that grows from zero.",
          claims: [{ instance: "ind", readout: "W", value: 0.266479, unit: "J" }],
        },
        {
          id: "density", title: "The energy lives in the field", patch: { eq: eqp(R`w_m=\tfrac12\mathbf B\cdot\mathbf H=\dfrac{B^2}{2\mu}`, "w m equals one half B dot H") }, focus: ["eq", "ind"],
          note: "As with E, the energy is spread through the field, with density w_m = ½B·H = B²/(2μ) J/m³. Inside a long solenoid B = μNI/ℓ is uniform, and w_m × πr²ℓ gives back ½LI². Iron cores store surprisingly little: for a given B, a high μ means a small H, so ½B·H is small.",
          claims: [{ instance: "ind", readout: "W", value: 0.266479, unit: "J" }],
        },
        {
          id: "double", title: "Twice the current", patch: { ind: { I: 4 } }, focus: ["ind"],
          note: "W grows as I²: at 4 A the solenoid stores 1.066 J, four times as much. The flux linkage LI only doubles, to 0.5330 Wb.",
          claims: [{ instance: "ind", readout: "W", value: 1.06592, unit: "J" }, { instance: "ind", readout: "link", value: 0.532959, unit: "Wb" }],
        },
        {
          id: "mutual", title: "Mutual inductance", patch: { ind: { I: 2 }, eq: eqp(R`M_{12}=\dfrac{N_2\Phi_{12}}{I_1}=M_{21}`, "M one two equals N two phi one two over I one") }, focus: ["eq"],
          note: "Two coils that share flux are coupled. The mutual inductance M₁₂ = N₂Φ₁₂/I₁ is the flux linkage in coil 2 per ampere in coil 1, and M₁₂ = M₂₁. Hayt D8.13(c): wind a 1200-turn, 50 cm coil round the 1500-turn one. The inner coil's flux, all inside its μr = 75 core, links every outer turn: M = μN₁N₂S₁/ℓ = 106.6 mH. In series, coupled coils give L = L₁ + L₂ ± 2M.",
        },
      ],
      examples: [
        {
          id: "w", level: "basic", title: "Energy and energy density",
          setup: { ind: D813 },
          problem: "Hayt D8.13(a)'s 133.2 mH solenoid carries 2 A. Find the stored energy and the average energy density inside it (radius 1 cm, length 50 cm).",
          lines: [
            { text: "W = ½LI² = ½ × 0.1332 × 2² = 0.2665 J.", focus: ["ind"], claims: [{ instance: "ind", readout: "W", value: 0.266479, unit: "J" }] },
            { text: "Volume = π(0.01)² × 0.5 = 1.571 × 10⁻⁴ m³, so w_m = 0.2665/1.571 × 10⁻⁴ = 1696 J/m³.", focus: ["ind"] },
          ],
          covers: ["text:hayt-d8.13", "lecture:lec3b-energy"],
          trap: "LI² without the ½ doubles the answer to 0.533 J.",
        },
        {
          id: "series", level: "tutorial", title: "Inductors in series and parallel",
          setup: { ind: D813 },
          problem: "The 133.2 mH solenoid and Hayt D8.12(b)'s 1.014 mH toroid are connected, uncoupled. Find the total inductance in series and in parallel, and the energy stored in series at 2 A.",
          lines: [
            { text: "Series: L = L₁ + L₂ = 133.2 + 1.014 = 134.3 mH, storing ½ × 0.1343 × 4 = 0.2685 J.", focus: ["ind"] },
            { text: "Parallel: 1/L = 1/L₁ + 1/L₂, so L = (0.1332 × 0.001014)/(0.1342) = 1.006 mH, just below the smaller one.", focus: ["ind"] },
          ],
          covers: ["lecture:lec3b-mutual"],
          trap: "Combining inductors like capacitors. Inductors add in series, like resistors.",
        },
        {
          id: "mutual", level: "exam", title: "Hayt D8.13(c): M, and the emf it induces",
          setup: { ind: D813 },
          problem: "A 50 cm, 1200-turn solenoid is wound coaxially round the 1500-turn, 2 cm-diameter, μr = 75-cored solenoid. (a) Find M. (b) If the inner coil's current rises at 100 A/s, what emf appears in the outer coil?",
          lines: [
            { text: "(a) The inner coil's field μN₁I₁/ℓ fills only its own core, S₁ = π(0.01)².", focus: ["eq"] },
            { text: "M = N₂Φ₁₂/I₁ = μN₁N₂S₁/ℓ = 75 × 4π × 10⁻⁷ × 1500 × 1200 × 3.142 × 10⁻⁴/0.5 = 106.6 mH.", focus: ["eq"] },
            { text: "(b) v₂ = M di₁/dt = 0.1066 × 100 = 10.66 V. That's Faraday's law at work: the next unit.", focus: ["eq"] },
          ],
          covers: ["text:hayt-d8.13"],
          trap: "Using the outer coil's area. Only flux that exists links: the inner coil's field is confined to its own core.",
        },
      ],
      asks: [
        { id: "half", q: "Where does the ½ in ½LI² come from?", tags: ["WM_HALF"], a: "The back-emf L di/dt opposes a current that grows from zero, so on average you push against half the final linkage. The work is ∫Li di = ½LI²." },
        { id: "density", q: "What's the magnetic energy density?", a: "w_m = ½B·H = B²/(2μ) = ½μH², in J/m³. Integrate it over the field's volume to get ½LI²." },
        { id: "sym", q: "Is M₁₂ always equal to M₂₁?", a: "Yes, for linear media: the flux linkage in coil 2 per ampere in coil 1 equals the linkage in coil 1 per ampere in coil 2." },
        { id: "k", q: "What's the coupling coefficient?", a: "k = M/√(L₁L₂), between 0 and 1. Coils wound together on a shared core approach 1; Lec 3b's air-cored example has k ≈ 0.1." },
        { id: "uses", q: "Where is mutual inductance used?", a: "Transformers, wireless chargers and many sensors: a changing current in one coil induces v₂ = M di₁/dt in the other. Faraday's law, in Unit 4, explains why." },
        { id: "combine", q: "How do inductors combine?", a: "Like resistors, when uncoupled: L = L₁ + L₂ in series, and 1/L = 1/L₁ + 1/L₂ in parallel. Coupling adds ±2M in series." },
      ],
      checks: [
        {
          id: "half-c", title: "Check: the energy formula", show: ["ind", "eq"], patch: { ind: D813 },
          note: "Four checks on magnetic energy. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "half-c", type: "choose", prompt: "An inductor L carrying current I stores…", dimension: "recognition",
            options: [
              choice("half", "½LI²", true, "Right."),
              choice("full", "LI²", false, "Missing the ½.", "WM_HALF"),
              choice("li", "LI", false, "That's the flux linkage, in webers."),
            ] },
        },
        {
          id: "predict-i", title: "Check: triple the current",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-i", type: "predict-drag", prompt: "Triple the current from 2 A to 6 A. Drag W to your prediction.", target: { instance: "ind", readout: "W" }, range: [0, 3], unit: "J", relTol: 0.05, reveal: { ind: { I: 6 } }, dimension: "conceptual",
            feedback: { close: "Right: nine times, 2.398 J.", far: "W ∝ I²: 9 × 0.2665 = 2.398 J." } },
        },
        {
          id: "w-num", title: "Check: stored energy",
          note: "A number.",
          interaction: { id: "w-num", type: "numeric", prompt: "A 133.2 mH inductor carries 2.0 A. Find the stored energy, in J.", answer: { value: 0.2664, unit: "J" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 0.5328, unit: "J", errorClass: "conceptual", tag: "WM_HALF", feedback: "That's LI². The energy is ½LI²." }],
            hints: ["W = ½LI².", "L = 0.1332 H.", "½ × 0.1332 × 4."] },
        },
        {
          id: "m-c", title: "Check: mutual inductance",
          note: "Last one.",
          interaction: { id: "m-c", type: "choose", prompt: "The mutual inductance M₁₂ is…", dimension: "recognition",
            options: [
              choice("right", "N₂Φ₁₂/I₁: the linkage in coil 2 per ampere in coil 1", true, "Right."),
              choice("l1", "N₁Φ₁/I₁", false, "That's coil 1's self-inductance."),
              choice("ratio", "Φ₁₂/N₂", false, "Inductance is linkage per ampere."),
            ] },
          covers: ["lecture:lec3b-mutual"],
        },
      ],
      recap: {
        points: ["W = ½LI²; the flux linkage is LI.", "w_m = ½B·H = B²/(2μ).", "M₁₂ = N₂Φ₁₂/I₁ = M₂₁; coupled coils in series: L₁ + L₂ ± 2M."],
        traps: ["Dropping the ½.", "Inductors combined like capacitors.", "M from flux that doesn't exist."],
      },
    },
  ],
});
```

Hand checks:
- ½ × 0.133240 × 4 = 0.266479; at 4 A, 1.06592 J; LI = 0.532959 Wb; at 6 A, 2.39831 J.
- M = 0.106592 H.
- Series 0.134253 H; parallel 1.00601 mH.

- [ ] **Step 3: Register and remap.**
  - In `plates/index.ts`, add both plates.
  - In `index.ts`, import `inductanceConcept` and add it after `magMaterialsConcept`.
  - In `questions.ts`, change `K.amp` to `K.ind` in `f1415-q2b` and `f1718-q4b`, and set their `practice` to `"em1.magnetostatics.inductance/main"`.
  - Run `pnpm test && pnpm typecheck`. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): inductance concept; self-inductance (Hayt D8.12, D8.13; Finals coax and two-wire) and magnetic energy, mutual inductance

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 8: Coverage and verification

- [ ] **Step 1: Coverage loop (the only test edit).** In `f3-coverage.test.ts`, add `"em1.magnetostatics.ampere"`, `"em1.magnetostatics.materials"` and `"em1.magnetostatics.inductance"` to the `for (const id of [...])` loop. Add no new assertions.
- [ ] **Step 2: Run** `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`. Expected: PASS.
  - Visual baselines that show the map or concept list change (one locked concept becomes three unlocked). Update only those baselines, inspect them, and log a ruling naming them.
  - Add no new e2e specs.
- [ ] **Step 3: Walk at 1360×900** each idea's first explanation and exam example:
  - `currents` draws the wire, loop and coax, and the H arrow points the right-hand way.
  - `mag-boundary` labels B₁ and B₂, and the regions read "μr = …".
  - The inductor schematics show the right kind.
- [ ] **Step 4: Commit** the coverage edit and any baselines:

  ```bash
  git add -A packages/course-em1/test apps/web && git commit -m "test: magnetostatics in the coverage loop; baselines for three unlocked concepts

  Co-Authored-By: Codex <noreply@openai.com>"
  ```

  Then write the ledger line `Task 8: verification — <counts>` and stop for Claude's review.

## Self-Review Notes (Python, μ₀ = 4π × 10⁻⁷)

- **Idea ①:**
  - Hayt D7.2: H = 0.533822ay; (0.477465, 0.238732).
  - |B| = 6.70820 × 10⁻⁷ T; ×1000 in iron.
  - D8.2: (0, −48, 36) and (12, −216, 168) mN.
  - Lec 3a Q.10: Φ = 4.24740 Wb.
- **Idea ②:**
  - Segment: 1.12540; infinite: 1.59155.
  - Loop at h = 1: 1.76777; centre: 5.
  - Square: 4.50158.
  - Q.03: (−0.198944, 0, 0.198944).
  - Coil centre: 940.000. HW03 3.1(a): −128.019az (Biot–Savart by 2000-point quadrature agrees with the closed form).
- **Idea ③:**
  - D7.7: 1591.55 (2 mm and 0.5 mm), 3.2000 mT at 0.8 mm; Φ' = 2.000 µWb/m.
  - Sheets: 2.0000, 0.93333, 0.36000 and 0 A/m.
  - D7.3(a): (1.98944, −1.98944, 0). D7.3(b): −0.884194ax.
  - Finals 2024-25 Q4: J = 2.48680 × 10⁵, H = 1.24340 × 10⁵ρ, B = 0.156250ρ.
  - Finals 2023-24 Q4: J = 1.01859 × 10⁷, B = 6.4ρ.
  - HW03 3.1(b): I = 119.996 A, H(15 mm) = 716.175.
  - ICT 2 Q1(b): J = 12 732.4, H(0.22) = 72.3432.
- **Idea ④:** D7.6 −126; D7.5 (−16, 9, 16), 0.054936 and 1; Finals 2017-18 Q3(c): (420, −102, 123), I = 26.667 A.
- **Idea ⑤:** D8.6(a) μr = 14.3239, M = 1598.87; D8.6(c) H = 14.9208, M = 223.812.
- **Idea ⑥:**
  - Finals 2024-25 Q3(b): H₁ₙ = (2, 1, 0); H₂ = (−0.5, 2.25, 2); B₂ = (−5.02655, 22.6195, 20.1062) µT; θ = 53.3008° and 79.4446°.
  - Finals 2023-24 Q3(c): H₂ = (2.33333, 2.66667, −1).
  - Finals 2017-18 Q4(a): H₂ = (0, 4, 4), B₂ = (0, 10.0531, 10.0531) µT.
  - HW03 3.3: θ = 76.3499° and 80.8035° (lecturer: 76.35° and 80.80°).
  - ICT 2 Q3: B₂ = (−2.72337, −109.375, 68.1361) µT, θ₂ = 79.4078° (lecturer: 79.41°).
  - Drill 2025 Q8: H₂μ₀ = (0.8, 0.666667, −14); angles 41.8685° and 85.7460°.
  - Lec 3a Q15: H₂ = (−4.94231, −7.03846, 2).
- **Idea ⑦:** D8.12(a) 56.3303 µH; D8.12(b) 1.01366 mH; D8.13(a) 133.240 mH; two-wire 1.93805 µH/m.
- **Idea ⑧:** W = 0.266479 J; w_m = 1696.46 J/m³; D8.13(c) M = 106.592 mH; emf 10.6592 V.
- **Not used:** Hayt D8.13(b), the outer solenoid's L. The book prints 192 mH; my computation gives 86.69 mH, and I couldn't reconcile them. It is left out rather than taught with a doubtful number.
