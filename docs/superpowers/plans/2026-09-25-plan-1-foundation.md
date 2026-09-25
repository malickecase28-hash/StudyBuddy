# Plan 1 — Foundation (monorepo, physics, engine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tested, UI-free core of StudyBuddy: a pnpm monorepo with `@studybuddy/physics` (field + flux numerics) and `@studybuddy/engine` (course grammar, answer checking, mastery, scheduling, rules, learner state, diagnostic routing, course lint).

**Architecture:** Two pure-TypeScript packages with no DOM or React dependency, consumed later by `apps/web` (Plan 2) and `packages/course-em1` (Plan 4). Packages export TS source directly (`exports: ./src/index.ts`); Vitest runs everything from the repo root.

**Tech Stack:** Node 24, pnpm 11, TypeScript 7, Vitest 5, Zod 4.

**Spec:** `docs/superpowers/specs/2026-09-25-em1-vertical-slice-design.md` (§2, §3, §6.4 physics verification, §7 state versioning)

**Plan series:** 1 Foundation (this) → 2 Web shell + design tokens + block renderers → 3 3D simulation → 4 Content pipeline + Flux→Gauss course data → 5 Journey screens.

## Global Constraints

- Runtime makes **zero** network/LLM calls; engine and physics are pure functions.
- All physics in SI units. `EPS0 = 8.8541878128e-12` F/m.
- Engine knows nothing about Electromagnetics or React; physics knows nothing about lessons.
- Every content block carries `source {doc, locator}` and `licence: "restricted" | "original"`.
- Mastery dimensions are exactly: `conceptual | computational | recognition | independent | application`.
- Concept states are exactly: `NOT_STARTED → INTRODUCED → EXPLORED → PRACTICED → DEMONSTRATED → MASTERED`.
- Error classes: `conceptual | arithmetic | unit | sign | notation`.
- Semantic colour keys: `charge | field | flux | surface | confirmed`.
- Repo root is `F:\StudyBuddy`; the monorepo root is `F:\StudyBuddy\app`. All commands below run from `F:\StudyBuddy\app` unless stated.

---

## File Structure

```
app/
  package.json               workspace root: scripts, dev deps
  pnpm-workspace.yaml
  tsconfig.json              strict base config, noEmit, covers packages
  vitest.config.ts
  packages/
    physics/
      package.json
      src/index.ts           re-exports
      src/vec.ts             Vec3 math
      src/constants.ts       EPS0, K_E
      src/charges.ts         point/line charge fields, D
      src/quadrature.ts      Gauss–Legendre nodes/weights
      src/surfaces.ts        parametric closed surfaces → patches
      src/flux.ts            flux integral, enclosed charge
      test/*.test.ts
    engine/
      package.json
      src/index.ts
      src/quantities.ts      unit parsing to SI
      src/schema/common.ts   Source, Licence, Mood, Dimension, Semantic, ErrorClass
      src/schema/blocks.ts   all block schemas (recursive)
      src/schema/rules.ts    Condition, Effect, Rule
      src/schema/course.ts   Lesson, Concept, Course
      src/schema/diagnostic.ts
      src/answer.ts          checkNumeric, checkChoice
      src/mastery.ts         evidence + derived concept state
      src/scheduler.ts       spaced retrieval
      src/learner-state.ts   LearnerState types, initial, migrate
      src/events.ts          LearnEvent types
      src/reducer.ts         (state, event, concept) → state + effects
      src/diagnostic.ts      adaptive item selection + route
      src/graph.ts           prerequisite graph helpers
      src/walk.ts            recursive block traversal
      src/lint.ts            structural course lint
      test/*.test.ts
```

---

### Task 1: Monorepo scaffold + vector math

**Files:**
- Create: `app/package.json`, `app/pnpm-workspace.yaml`, `app/tsconfig.json`, `app/vitest.config.ts`
- Create: `app/packages/physics/package.json`, `app/packages/physics/src/index.ts`, `app/packages/physics/src/vec.ts`, `app/packages/physics/src/constants.ts`
- Test: `app/packages/physics/test/vec.test.ts`

**Interfaces:**
- Produces: `type Vec3 = readonly [number, number, number]`; `vec(x,y,z)`, `add(a,b)`, `sub(a,b)`, `scale(a,s)`, `dot(a,b)`, `cross(a,b)`, `norm(a)`, `normalize(a)`; `EPS0`, `K_E`.

- [ ] **Step 1: Create workspace files**

`app/package.json`:
```json
{
  "name": "studybuddy",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.7.0",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  },
  "devDependencies": {
    "typescript": "^7.0.2",
    "vitest": "^5.0.2"
  }
}
```

`app/pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`app/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "preserve",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "lib": ["es2022"]
  },
  "include": ["packages/*/src", "packages/*/test", "vitest.config.ts"]
}
```

`app/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["packages/*/test/**/*.test.ts"] },
});
```

`app/packages/physics/package.json`:
```json
{
  "name": "@studybuddy/physics",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" }
}
```

- [ ] **Step 2: Write the failing test** — `app/packages/physics/test/vec.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { add, cross, dot, norm, normalize, scale, sub, vec, EPS0, K_E } from "../src";

describe("vec", () => {
  it("does basic algebra", () => {
    expect(add(vec(1, 2, 3), vec(4, 5, 6))).toEqual([5, 7, 9]);
    expect(sub(vec(4, 5, 6), vec(1, 2, 3))).toEqual([3, 3, 3]);
    expect(scale(vec(1, -2, 3), 2)).toEqual([2, -4, 6]);
    expect(dot(vec(1, 2, 3), vec(4, 5, 6))).toBe(32);
  });
  it("cross product follows right-hand rule", () => {
    expect(cross(vec(1, 0, 0), vec(0, 1, 0))).toEqual([0, 0, 1]);
    expect(cross(vec(0, 1, 0), vec(0, 0, 1))).toEqual([1, 0, 0]);
  });
  it("norm and normalize", () => {
    expect(norm(vec(3, 4, 12))).toBe(13);
    expect(norm(normalize(vec(3, 4, 12)))).toBeCloseTo(1, 15);
  });
  it("constants are consistent", () => {
    expect(K_E * 4 * Math.PI * EPS0).toBeCloseTo(1, 15);
  });
});
```

- [ ] **Step 3: Install and run to verify it fails**

Run: `pnpm install && pnpm vitest run packages/physics/test/vec.test.ts`
Expected: FAIL — cannot resolve `../src`.

- [ ] **Step 4: Implement**

`app/packages/physics/src/vec.ts`:
```ts
export type Vec3 = readonly [number, number, number];

export const vec = (x: number, y: number, z: number): Vec3 => [x, y, z];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const norm = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
export const normalize = (a: Vec3): Vec3 => scale(a, 1 / norm(a));
```

`app/packages/physics/src/constants.ts`:
```ts
/** Vacuum permittivity, F/m (CODATA 2018). */
export const EPS0 = 8.8541878128e-12;
/** Coulomb constant 1/(4πε₀), N·m²/C². */
export const K_E = 1 / (4 * Math.PI * EPS0);
```

`app/packages/physics/src/index.ts`:
```ts
export * from "./vec";
export * from "./constants";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run packages/physics/test/vec.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**
```bash
git add app/package.json app/pnpm-workspace.yaml app/tsconfig.json app/vitest.config.ts app/pnpm-lock.yaml app/packages/physics
git commit -m "feat(physics): scaffold monorepo and vector math"
```

---

### Task 2: Charge fields (E and D)

**Files:**
- Create: `app/packages/physics/src/charges.ts`
- Modify: `app/packages/physics/src/index.ts`
- Test: `app/packages/physics/test/charges.test.ts`

**Interfaces:**
- Consumes: `Vec3`, `sub`, `add`, `scale`, `norm` (Task 1); `K_E`, `EPS0`.
- Produces:
  - `type PointCharge = { kind: "point"; q: number; pos: Vec3 }`
  - `type LineCharge = { kind: "line"; rhoL: number; x: number; y: number }` (infinite, parallel to z)
  - `type Charge = PointCharge | LineCharge`
  - `electricField(charges: readonly Charge[], p: Vec3): Vec3` (free space, V/m)
  - `fluxDensity(charges: readonly Charge[], p: Vec3): Vec3` (D = ε₀E, C/m²)
  - `electricFieldInMedium(charges, p, epsR: number): Vec3` (E = D/(ε₀ε_r))

- [ ] **Step 1: Write the failing test** — `app/packages/physics/test/charges.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { electricField, electricFieldInMedium, fluxDensity, norm, vec, EPS0, type Charge } from "../src";

const q = 4e-6;
const point: Charge = { kind: "point", q, pos: vec(0, 0, 0) };

describe("point charge", () => {
  it("E falls off as 1/r^2: E(2r)/E(r) = 0.25", () => {
    const e1 = norm(electricField([point], vec(1, 0, 0)));
    const e2 = norm(electricField([point], vec(2, 0, 0)));
    expect(e2 / e1).toBeCloseTo(0.25, 12);
  });
  it("matches Coulomb magnitude kq/r^2 and points away from positive charge", () => {
    const e = electricField([point], vec(0, 3, 0));
    expect(e[1]).toBeCloseTo(q / (4 * Math.PI * EPS0 * 9), 6);
    expect(e[0]).toBe(0);
    expect(e[1]).toBeGreaterThan(0);
  });
  it("D = q/(4 pi r^2), independent of permittivity", () => {
    const d = fluxDensity([point], vec(0, 0, 2));
    expect(d[2]).toBeCloseTo(q / (4 * Math.PI * 4), 18);
  });
  it("superposes: equal and opposite charges cancel at the midpoint on the perpendicular axis x-component", () => {
    const pair: Charge[] = [
      { kind: "point", q, pos: vec(-1, 0, 0) },
      { kind: "point", q, pos: vec(1, 0, 0) },
    ];
    const e = electricField(pair, vec(0, 0, 0));
    expect(norm(e)).toBeCloseTo(0, 6);
  });
  it("medium with eps_r divides E, leaves D alone", () => {
    const e0 = norm(electricField([point], vec(1, 0, 0)));
    const e4 = norm(electricFieldInMedium([point], vec(1, 0, 0), 4));
    expect(e4 / e0).toBeCloseTo(0.25, 12);
  });
});

describe("infinite line charge", () => {
  it("E = rhoL/(2 pi eps0 rho), radial, halves when distance doubles", () => {
    const line: Charge = { kind: "line", rhoL: 2e-9, x: 0, y: 0 };
    const e1 = electricField([line], vec(1, 0, 5));
    const e2 = electricField([line], vec(2, 0, -3));
    expect(e1[0]).toBeCloseTo(2e-9 / (2 * Math.PI * EPS0 * 1), 9);
    expect(e1[2]).toBe(0);
    expect(e2[0] / e1[0]).toBeCloseTo(0.5, 12);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/physics/test/charges.test.ts`
Expected: FAIL — `electricField` is not exported.

- [ ] **Step 3: Implement** — `app/packages/physics/src/charges.ts`
```ts
import { EPS0, K_E } from "./constants";
import { add, norm, scale, sub, type Vec3 } from "./vec";

export type PointCharge = { kind: "point"; q: number; pos: Vec3 };
/** Infinite uniform line charge parallel to the z-axis through (x, y). */
export type LineCharge = { kind: "line"; rhoL: number; x: number; y: number };
export type Charge = PointCharge | LineCharge;

function fieldOf(c: Charge, p: Vec3): Vec3 {
  if (c.kind === "point") {
    const r = sub(p, c.pos);
    const d = norm(r);
    return scale(r, (K_E * c.q) / (d * d * d));
  }
  const rho: Vec3 = [p[0] - c.x, p[1] - c.y, 0];
  const d = norm(rho);
  return scale(rho, c.rhoL / (2 * Math.PI * EPS0 * d * d));
}

/** Free-space electric field intensity E (V/m) by superposition. */
export function electricField(charges: readonly Charge[], p: Vec3): Vec3 {
  return charges.reduce<Vec3>((acc, c) => add(acc, fieldOf(c, p)), [0, 0, 0]);
}

/** Electric flux density D = ε₀E (C/m²); depends only on free charge. */
export function fluxDensity(charges: readonly Charge[], p: Vec3): Vec3 {
  return scale(electricField(charges, p), EPS0);
}

/** E inside a homogeneous linear dielectric of relative permittivity epsR. */
export function electricFieldInMedium(charges: readonly Charge[], p: Vec3, epsR: number): Vec3 {
  return scale(electricField(charges, p), 1 / epsR);
}
```

Append to `app/packages/physics/src/index.ts`:
```ts
export * from "./charges";
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run packages/physics/test/charges.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**
```bash
git add app/packages/physics
git commit -m "feat(physics): point and line charge fields, D and medium E"
```

---

### Task 3: Gauss–Legendre quadrature + closed surfaces

**Files:**
- Create: `app/packages/physics/src/quadrature.ts`, `app/packages/physics/src/surfaces.ts`
- Modify: `app/packages/physics/src/index.ts`
- Test: `app/packages/physics/test/surfaces.test.ts`

**Interfaces:**
- Consumes: Vec3 helpers.
- Produces:
  - `gaussLegendre(n: number): { nodes: number[]; weights: number[] }` on [-1, 1]
  - `type Patch = { center: Vec3; dS: Vec3 }` (dS = outward normal × area)
  - `type SurfaceShape = { kind: "sphere"; center: Vec3; radius: number } | { kind: "cube"; center: Vec3; side: number } | { kind: "blob"; center: Vec3; radius: number; amplitude: number; lobes: number }`
  - `blobRadius(shape: Extract<SurfaceShape,{kind:"blob"}>, theta: number, phi: number): number`
  - `surfacePatches(shape: SurfaceShape, n: number): Patch[]` (n nodes per parameter direction per face)
  - `contains(shape: SurfaceShape, p: Vec3): boolean`

- [ ] **Step 1: Write the failing test** — `app/packages/physics/test/surfaces.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { contains, dot, gaussLegendre, norm, sub, surfacePatches, vec, type SurfaceShape } from "../src";

const area = (shape: SurfaceShape, n: number) =>
  surfacePatches(shape, n).reduce((s, p) => s + norm(p.dS), 0);

describe("gaussLegendre", () => {
  it("weights sum to 2 and integrate x^8 exactly with n=5", () => {
    const { nodes, weights } = gaussLegendre(5);
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(2, 14);
    const integral = nodes.reduce((s, x, i) => s + weights[i]! * x ** 8, 0);
    expect(integral).toBeCloseTo(2 / 9, 14);
  });
});

describe("surfacePatches", () => {
  it("sphere area is 4 pi R^2", () => {
    expect(area({ kind: "sphere", center: vec(0, 0, 0), radius: 2 }, 24)).toBeCloseTo(16 * Math.PI, 9);
  });
  it("cube area is 6 a^2", () => {
    expect(area({ kind: "cube", center: vec(1, 1, 1), side: 3 }, 4)).toBeCloseTo(54, 12);
  });
  it("patch normals point outward", () => {
    const shapes: SurfaceShape[] = [
      { kind: "sphere", center: vec(1, 0, 0), radius: 1 },
      { kind: "cube", center: vec(0, 2, 0), side: 2 },
      { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 },
    ];
    for (const s of shapes) {
      for (const p of surfacePatches(s, 8)) expect(dot(sub(p.center, s.center), p.dS)).toBeGreaterThan(0);
    }
  });
  it("contains() distinguishes inside and outside", () => {
    const blob: SurfaceShape = { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 };
    expect(contains(blob, vec(0.1, 0.1, 0.1))).toBe(true);
    expect(contains(blob, vec(2, 0, 0))).toBe(false);
    expect(contains({ kind: "cube", center: vec(0, 0, 0), side: 2 }, vec(0.9, -0.9, 0.9))).toBe(true);
    expect(contains({ kind: "sphere", center: vec(0, 0, 0), radius: 1 }, vec(0.8, 0.8, 0))).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/physics/test/surfaces.test.ts`
Expected: FAIL — `gaussLegendre` not exported.

- [ ] **Step 3: Implement quadrature** — `app/packages/physics/src/quadrature.ts`
```ts
const cache = new Map<number, { nodes: number[]; weights: number[] }>();

/** n-point Gauss–Legendre nodes and weights on [-1, 1] (Newton iteration on P_n). */
export function gaussLegendre(n: number): { nodes: number[]; weights: number[] } {
  const hit = cache.get(n);
  if (hit) return hit;
  const nodes = new Array<number>(n).fill(0);
  const weights = new Array<number>(n).fill(0);
  const m = Math.floor((n + 1) / 2);
  for (let i = 0; i < m; i++) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5));
    let pp = 0;
    for (let iter = 0; iter < 100; iter++) {
      let p1 = 1;
      let p2 = 0;
      for (let j = 1; j <= n; j++) {
        const p3 = p2;
        p2 = p1;
        p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j;
      }
      pp = (n * (z * p1 - p2)) / (z * z - 1);
      const z1 = z;
      z = z1 - p1 / pp;
      if (Math.abs(z - z1) < 1e-15) break;
    }
    nodes[i] = -z;
    nodes[n - 1 - i] = z;
    const w = 2 / ((1 - z * z) * pp * pp);
    weights[i] = w;
    weights[n - 1 - i] = w;
  }
  const out = { nodes, weights };
  cache.set(n, out);
  return out;
}
```

- [ ] **Step 4: Implement surfaces** — `app/packages/physics/src/surfaces.ts`
```ts
import { gaussLegendre } from "./quadrature";
import { add, cross, norm, scale, sub, type Vec3 } from "./vec";

export type Patch = { center: Vec3; dS: Vec3 };

export type SurfaceShape =
  | { kind: "sphere"; center: Vec3; radius: number }
  | { kind: "cube"; center: Vec3; side: number }
  | { kind: "blob"; center: Vec3; radius: number; amplitude: number; lobes: number };

type Param = {
  r: (u: number, v: number) => Vec3;
  u: readonly [number, number];
  v: readonly [number, number];
  vPeriodic: boolean;
};

const spherical = (c: Vec3, rad: (t: number, p: number) => number): Param => ({
  r: (t, p) => add(c, scale([Math.sin(t) * Math.cos(p), Math.sin(t) * Math.sin(p), Math.cos(t)], rad(t, p))),
  u: [0, Math.PI],
  v: [0, 2 * Math.PI],
  vPeriodic: true,
});

export function blobRadius(s: Extract<SurfaceShape, { kind: "blob" }>, theta: number, phi: number): number {
  return s.radius * (1 + s.amplitude * Math.sin(s.lobes * theta) * Math.cos(s.lobes * phi));
}

function params(shape: SurfaceShape): Param[] {
  if (shape.kind === "sphere") return [spherical(shape.center, () => shape.radius)];
  if (shape.kind === "blob") return [spherical(shape.center, (t, p) => blobRadius(shape, t, p))];
  const a = shape.side / 2;
  const c = shape.center;
  const face = (f: (u: number, v: number) => Vec3): Param => ({
    r: (u, v) => add(c, f(u, v)),
    u: [-a, a],
    v: [-a, a],
    vPeriodic: false,
  });
  // Each parametrisation is ordered so that r_u × r_v points outward.
  return [
    face((u, v) => [a, u, v]),
    face((u, v) => [-a, v, u]),
    face((u, v) => [v, a, u]),
    face((u, v) => [u, -a, v]),
    face((u, v) => [u, v, a]),
    face((u, v) => [v, u, -a]),
  ];
}

function rule(range: readonly [number, number], n: number, periodic: boolean): { x: number[]; w: number[] } {
  const [a, b] = range;
  if (periodic) {
    const h = (b - a) / n;
    return { x: Array.from({ length: n }, (_, i) => a + (i + 0.5) * h), w: new Array<number>(n).fill(h) };
  }
  const { nodes, weights } = gaussLegendre(n);
  const half = (b - a) / 2;
  return { x: nodes.map((t) => a + half * (t + 1)), w: weights.map((w) => w * half) };
}

function discretize(p: Param, n: number): Patch[] {
  const U = rule(p.u, n, false);
  const V = rule(p.v, p.vPeriodic ? 2 * n : n, p.vPeriodic);
  const hu = (p.u[1] - p.u[0]) * 1e-6;
  const hv = (p.v[1] - p.v[0]) * 1e-6;
  const out: Patch[] = [];
  U.x.forEach((u, i) => {
    V.x.forEach((v, j) => {
      const ru = scale(sub(p.r(u + hu, v), p.r(u - hu, v)), 1 / (2 * hu));
      const rv = scale(sub(p.r(u, v + hv), p.r(u, v - hv)), 1 / (2 * hv));
      out.push({ center: p.r(u, v), dS: scale(cross(ru, rv), U.w[i]! * V.w[j]!) });
    });
  });
  return out;
}

/** Quadrature patches over a closed surface; dS is outward. n = nodes per direction per face. */
export function surfacePatches(shape: SurfaceShape, n: number): Patch[] {
  return params(shape).flatMap((p) => discretize(p, n));
}

export function contains(shape: SurfaceShape, p: Vec3): boolean {
  const d = sub(p, shape.center);
  if (shape.kind === "sphere") return norm(d) < shape.radius;
  if (shape.kind === "cube") return Math.max(Math.abs(d[0]), Math.abs(d[1]), Math.abs(d[2])) < shape.side / 2;
  const r = norm(d);
  if (r === 0) return true;
  const theta = Math.acos(d[2] / r);
  const phi = Math.atan2(d[1], d[0]);
  return r < blobRadius(shape, theta, phi);
}
```

Append to `app/packages/physics/src/index.ts`:
```ts
export * from "./quadrature";
export * from "./surfaces";
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm vitest run packages/physics/test/surfaces.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**
```bash
git add app/packages/physics
git commit -m "feat(physics): Gauss-Legendre quadrature and closed-surface patches"
```

---

### Task 4: Flux integral (Gauss's Law verification)

**Files:**
- Create: `app/packages/physics/src/flux.ts`
- Modify: `app/packages/physics/src/index.ts`
- Test: `app/packages/physics/test/flux.test.ts`

**Interfaces:**
- Consumes: `fluxDensity`, `Charge`, `PointCharge` (Task 2); `surfacePatches`, `contains`, `SurfaceShape`, `Patch` (Task 3).
- Produces:
  - `fluxThrough(charges: readonly Charge[], patches: readonly Patch[]): number` — Ψ = Σ D·dS (C)
  - `patchContributions(charges, patches): number[]` — per-patch D·dS (for visualising local contributions in Plan 3)
  - `enclosedCharge(charges: readonly Charge[], shape: SurfaceShape): number` — point charges only; throws on line charges

- [ ] **Step 1: Write the failing test** — `app/packages/physics/test/flux.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { enclosedCharge, fluxThrough, surfacePatches, vec, type Charge, type SurfaceShape } from "../src";

const q = 4e-6;
const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe("Gauss's law numerically", () => {
  it("centred charge through a sphere gives Q (1e-9)", () => {
    const shape: SurfaceShape = { kind: "sphere", center: vec(0, 0, 0), radius: 1 };
    const psi = fluxThrough([{ kind: "point", q, pos: vec(0, 0, 0) }], surfacePatches(shape, 16));
    expect(rel(psi, q)).toBeLessThan(1e-9);
  });

  it("flux does not depend on sphere radius (FLUX_SCALES_WITH_AREA is wrong)", () => {
    const charges: Charge[] = [{ kind: "point", q, pos: vec(0, 0, 0) }];
    const small = fluxThrough(charges, surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: 1 }, 16));
    const big = fluxThrough(charges, surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: 2 }, 16));
    expect(rel(big, small)).toBeLessThan(1e-9);
  });

  const offCentre: Charge[] = [{ kind: "point", q, pos: vec(0.3, 0.2, -0.1) }];
  const shapes: [string, SurfaceShape, number][] = [
    ["sphere", { kind: "sphere", center: vec(0, 0, 0), radius: 1 }, 64],
    ["cube", { kind: "cube", center: vec(0, 0, 0), side: 2 }, 48],
    ["blob", { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 }, 96],
  ];
  for (const [name, shape, n] of shapes) {
    it(`off-centre charge through ${name} gives Q (1e-6)`, () => {
      expect(rel(fluxThrough(offCentre, surfacePatches(shape, n)), q)).toBeLessThan(1e-6);
    });
    it(`charge outside ${name} gives net flux ~0 (OUTSIDE_CHARGE_CONTRIBUTES is wrong)`, () => {
      const outside: Charge[] = [{ kind: "point", q, pos: vec(2.5, 0.4, 0) }];
      expect(Math.abs(fluxThrough(outside, surfacePatches(shape, n))) / q).toBeLessThan(1e-6);
    });
  }

  it("enclosedCharge sums point charges inside", () => {
    const charges: Charge[] = [
      { kind: "point", q: 1e-6, pos: vec(0, 0, 0) },
      { kind: "point", q: -3e-6, pos: vec(0.5, 0, 0) },
      { kind: "point", q: 7e-6, pos: vec(3, 0, 0) },
    ];
    expect(enclosedCharge(charges, { kind: "sphere", center: vec(0, 0, 0), radius: 1 })).toBeCloseTo(-2e-6, 18);
  });
  it("enclosedCharge rejects line charges", () => {
    expect(() =>
      enclosedCharge([{ kind: "line", rhoL: 1e-9, x: 0, y: 0 }], { kind: "sphere", center: vec(0, 0, 0), radius: 1 }),
    ).toThrow(/line/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/physics/test/flux.test.ts`
Expected: FAIL — `fluxThrough` not exported.

- [ ] **Step 3: Implement** — `app/packages/physics/src/flux.ts`
```ts
import { fluxDensity, type Charge } from "./charges";
import { contains, type Patch, type SurfaceShape } from "./surfaces";
import { dot } from "./vec";

export function patchContributions(charges: readonly Charge[], patches: readonly Patch[]): number[] {
  return patches.map((p) => dot(fluxDensity(charges, p.center), p.dS));
}

/** Ψ = ∮ D · dS over the patches, in coulombs. */
export function fluxThrough(charges: readonly Charge[], patches: readonly Patch[]): number {
  return patchContributions(charges, patches).reduce((s, x) => s + x, 0);
}

/** Total point charge strictly inside the closed surface. */
export function enclosedCharge(charges: readonly Charge[], shape: SurfaceShape): number {
  return charges.reduce((s, c) => {
    if (c.kind === "line") throw new Error("enclosedCharge: line charges are not supported for closed surfaces");
    return contains(shape, c.pos) ? s + c.q : s;
  }, 0);
}
```

Append to `app/packages/physics/src/index.ts`:
```ts
export * from "./flux";
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run packages/physics`
Expected: PASS (all physics tests). If an off-centre tolerance fails, raise that shape's `n` (not the tolerance) until it passes and record the chosen `n` in the test.

- [ ] **Step 5: Commit**
```bash
git add app/packages/physics
git commit -m "feat(physics): flux integral and enclosed charge, verified against Gauss's law"
```

---

### Task 5: Quantity parsing (units → SI)

**Files:**
- Create: `app/packages/engine/package.json`, `app/packages/engine/src/index.ts`, `app/packages/engine/src/quantities.ts`
- Test: `app/packages/engine/test/quantities.test.ts`

**Interfaces:**
- Produces:
  - `type Quantity = { value: number; dim: string }` (value in SI, `dim` canonical like `"C"`, `"C/m^2"`, `"V/m"`, `"1"`)
  - `parseQuantity(input: string): Quantity | null`
  - `toSI(value: number, unit: string): Quantity` (throws on unknown unit)

- [ ] **Step 1: Package file** — `app/packages/engine/package.json`
```json
{
  "name": "@studybuddy/engine",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "zod": "^4.6.5" }
}
```
Run: `pnpm install`

- [ ] **Step 2: Write the failing test** — `app/packages/engine/test/quantities.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { parseQuantity, toSI } from "../src";

describe("parseQuantity", () => {
  it.each([
    ["4 µC", 4e-6, "C"],
    ["4 uC", 4e-6, "C"],
    ["4μC", 4e-6, "C"],
    ["2.5 nC/m^2", 2.5e-9, "C/m^2"],
    ["2.5 nC/m²", 2.5e-9, "C/m^2"],
    ["3 cm", 0.03, "m"],
    ["3 cm^2", 3e-4, "m^2"],
    ["1.2e3 V/m", 1200, "V/m"],
    ["1.2 x 10^3 N/C", 1200, "V/m"],
    ["-7 mC", -7e-3, "C"],
    ["0.5", 0.5, "1"],
    ["5 mm", 5e-3, "m"],
  ])("%s", (input, value, dim) => {
    const q = parseQuantity(input);
    expect(q).not.toBeNull();
    expect(q!.value).toBeCloseTo(value, 15);
    expect(q!.dim).toBe(dim);
  });
  it("rejects garbage and unknown units", () => {
    expect(parseQuantity("abc")).toBeNull();
    expect(parseQuantity("4 furlongs")).toBeNull();
    expect(parseQuantity("")).toBeNull();
  });
  it("toSI converts authored answers and throws on unknown units", () => {
    expect(toSI(4, "µC")).toEqual({ value: 4e-6, dim: "C" });
    expect(() => toSI(1, "parsec")).toThrow();
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/quantities.test.ts`
Expected: FAIL — cannot resolve `../src`.

- [ ] **Step 4: Implement** — `app/packages/engine/src/quantities.ts`
```ts
export type Quantity = { value: number; dim: string };

/** Base units and the canonical dimension they map to. */
const BASE: Record<string, string> = {
  "": "1",
  C: "C",
  m: "m",
  "m^2": "m^2",
  "m^3": "m^3",
  "C/m": "C/m",
  "C/m^2": "C/m^2",
  "C/m^3": "C/m^3",
  "V/m": "V/m",
  "N/C": "V/m",
  V: "V",
  N: "N",
  "F/m": "F/m",
  F: "F",
};

const PREFIX: Record<string, number> = { p: 1e-12, n: 1e-9, "µ": 1e-6, u: 1e-6, m: 1e-3, c: 1e-2, k: 1e3, M: 1e6 };

function normalizeUnit(u: string): string {
  return u.replace(/\s+/g, "").replace(/²/g, "^2").replace(/³/g, "^3").replace(/μ/g, "µ");
}

/** Resolve a unit string to [SI factor, canonical dimension], or null. */
function resolveUnit(raw: string): [number, string] | null {
  const u = normalizeUnit(raw);
  const exact = BASE[u];
  if (exact !== undefined) return [1, exact];
  const prefix = PREFIX[u[0] ?? ""];
  const rest = u.slice(1);
  const dim = BASE[rest];
  if (prefix === undefined || dim === undefined || rest === "") return null;
  // A prefix binds to the first symbol and takes its exponent: cm^2 = (1e-2 m)^2.
  const exp = /^m\^(\d)/.exec(rest);
  return [exp ? prefix ** Number(exp[1]) : prefix, dim];
}

const NUMBER = /^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)\s*(?:[x×*]\s*10\s*\^\s*([-+]?\d+))?\s*(.*)$/i;

export function parseQuantity(input: string): Quantity | null {
  const m = NUMBER.exec(input.trim());
  if (!m) return null;
  const unit = resolveUnit(m[3] ?? "");
  if (!unit) return null;
  const mantissa = Number(m[1]);
  const power = m[2] ? 10 ** Number(m[2]) : 1;
  return { value: mantissa * power * unit[0], dim: unit[1] };
}

export function toSI(value: number, unit: string): Quantity {
  const r = resolveUnit(unit);
  if (!r) throw new Error(`Unknown unit: ${unit}`);
  return { value: value * r[0], dim: r[1] };
}
```

`app/packages/engine/src/index.ts`:
```ts
export * from "./quantities";
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm vitest run packages/engine/test/quantities.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add app/packages/engine app/pnpm-lock.yaml
git commit -m "feat(engine): quantity parsing with SI prefixes"
```

---

### Task 6: Course grammar schemas

**Files:**
- Create: `app/packages/engine/src/schema/common.ts`, `schema/rules.ts`, `schema/blocks.ts`, `schema/course.ts`, `schema/diagnostic.ts`
- Modify: `app/packages/engine/src/index.ts`
- Test: `app/packages/engine/test/schema.test.ts`

**Interfaces:**
- Produces (Zod schemas + inferred types, same name for both):
  - `Source {doc, locator}`, `Licence`, `Mood = "quiet"|"vivid"|"intense"|"assessment"|"reflect"`, `Dimension`, `DIMENSIONS`, `Semantic`, `ErrorClass`
  - `Choice {id, label, correct, feedback, tag?}`, `AuthoredQuantity {value, unit}`, `Distractor = AuthoredQuantity & {errorClass, tag?, feedback}`
  - Blocks (discriminated on `type`): `prose, equation-build, figure, sim-3d, sim-2d, predict, manipulate, identify, order, mcq, numeric, step-solve, challenge, branch, checkpoint, remediate, retrieval`; union schema `Block`, type `Block`; `McqBlock`, `NumericBlock`, `StepSolveBlock`, `ChallengeBlock`, `BranchBlock` etc. exported
  - `Condition`, `Effect`, `Rule`
  - `Lesson {id, title, minutes, blocks}`, `Concept`, `Course`
  - `DiagnosticItem {id, topic, role: "core"|"probe", prompt, options: Choice[]}`, `Diagnostic {topics: {id, label, refresher: string|null}[], items}`

- [ ] **Step 1: Write the failing test** — `app/packages/engine/test/schema.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { Block, Concept, Course } from "../src";

const meta = { mood: "quiet", source: { doc: "Unit 2b slides", locator: "slide 14" }, licence: "restricted" } as const;

const mcq = {
  ...meta,
  id: "flux-radius",
  type: "mcq",
  prompt: "The sphere radius doubles. What happens to the total flux?",
  dimension: "conceptual",
  options: [
    { id: "a", label: "Doubles", correct: false, feedback: "Area grows but D weakens as 1/r².", tag: "FLUX_SCALES_WITH_AREA" },
    { id: "b", label: "Unchanged", correct: true, feedback: "Only enclosed charge matters." },
  ],
};

describe("Block schema", () => {
  it("accepts a valid mcq", () => {
    expect(Block.parse(mcq).type).toBe("mcq");
  });
  it("rejects a block without licence", () => {
    const { licence: _l, ...bad } = mcq;
    expect(Block.safeParse(bad).success).toBe(false);
  });
  it("accepts nested branches (recursive)", () => {
    const branch = {
      ...meta,
      id: "why-enclosed",
      type: "branch",
      prompt: "What would you like to explore?",
      options: [{ id: "geo", label: "Show me geometrically", blocks: [{ ...meta, id: "p1", type: "prose", text: "Field lines…" }] }],
    };
    expect(Block.parse(branch).type).toBe("branch");
  });
  it("fills numeric defaults", () => {
    const b = Block.parse({
      ...meta,
      id: "q1",
      type: "numeric",
      prompt: "Find Ψ",
      dimension: "computational",
      answer: { value: 4, unit: "µC" },
    });
    expect(b.type === "numeric" && b.relTol).toBe(0.02);
    expect(b.type === "numeric" && b.distractors).toEqual([]);
  });
});

describe("Concept and Course", () => {
  it("parses a minimal course", () => {
    const concept = Concept.parse({
      id: "em1.electrostatics.gauss-law",
      title: "Gauss's Law",
      unit: 2,
      objectives: ["State Gauss's law"],
      prerequisites: [],
      misconceptions: [{ tag: "FLUX_SCALES_WITH_AREA", description: "…", remediation: "em1.electrostatics.gauss-law/why-area" }],
      examLinks: [],
      sources: [meta.source],
      status: "draft",
      lessons: [{ id: "main", title: "Gauss", minutes: 30, blocks: [mcq] }],
      rules: [],
    });
    expect(concept.locked).toBe(false);
    const course = Course.parse({
      id: "em1",
      code: "ELE3001",
      title: "Electromagnetics I",
      examDate: "2026-12-15",
      units: [{ number: 2, title: "Electrostatic Fields" }],
      concepts: [concept],
    });
    expect(course.concepts).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/schema.test.ts`
Expected: FAIL — `Block` not exported.

- [ ] **Step 3: Implement common** — `app/packages/engine/src/schema/common.ts`
```ts
import { z } from "zod";

export const Source = z.object({ doc: z.string().min(1), locator: z.string().min(1) });
export type Source = z.infer<typeof Source>;

export const Licence = z.enum(["restricted", "original"]);
export type Licence = z.infer<typeof Licence>;

export const Mood = z.enum(["quiet", "vivid", "intense", "assessment", "reflect"]);
export type Mood = z.infer<typeof Mood>;

export const DIMENSIONS = ["conceptual", "computational", "recognition", "independent", "application"] as const;
export const Dimension = z.enum(DIMENSIONS);
export type Dimension = z.infer<typeof Dimension>;

export const Semantic = z.enum(["charge", "field", "flux", "surface", "confirmed"]);
export type Semantic = z.infer<typeof Semantic>;

export const ErrorClass = z.enum(["conceptual", "arithmetic", "unit", "sign", "notation"]);
export type ErrorClass = z.infer<typeof ErrorClass>;

export const Id = z.string().regex(/^[a-z0-9-]+$/);
export const Tag = z.string().regex(/^[A-Z][A-Z0-9_]*$/);

export const Choice = z.object({
  id: Id,
  label: z.string().min(1),
  correct: z.boolean(),
  feedback: z.string().min(1),
  tag: Tag.optional(),
});
export type Choice = z.infer<typeof Choice>;

export const AuthoredQuantity = z.object({ value: z.number(), unit: z.string() });
export type AuthoredQuantity = z.infer<typeof AuthoredQuantity>;

export const Distractor = AuthoredQuantity.extend({
  errorClass: ErrorClass,
  tag: Tag.optional(),
  feedback: z.string().min(1),
});
export type Distractor = z.infer<typeof Distractor>;

/** Shared numeric-answer fields used by numeric, step-solve steps and challenge. */
export const NumericAnswerFields = {
  answer: AuthoredQuantity,
  relTol: z.number().positive().default(0.02),
  distractors: z.array(Distractor).default([]),
};
```

- [ ] **Step 4: Implement rules schema** — `app/packages/engine/src/schema/rules.ts`
```ts
import { z } from "zod";
import { Dimension, Id, Tag } from "./common";

export const Condition = z.discriminatedUnion("type", [
  z.object({ type: z.literal("tagCount"), tag: Tag, gte: z.number().int().positive() }),
  z.object({ type: z.literal("challengePassed"), firstAttempt: z.boolean() }),
  z.object({
    type: z.literal("attemptsFailed"),
    blockType: z.enum(["numeric", "mcq", "step-solve"]),
    gte: z.number().int().positive(),
  }),
]);
export type Condition = z.infer<typeof Condition>;

export const Effect = z.discriminatedUnion("type", [
  z.object({ type: z.literal("offerRemediation"), tag: Tag, lessonRef: z.string().min(1) }),
  z.object({ type: z.literal("offerSkip") }),
  z.object({ type: z.literal("revealWorkedStep") }),
  z.object({ type: z.literal("credit"), dimension: Dimension, amount: z.number().min(0).max(1) }),
]);
export type Effect = z.infer<typeof Effect>;

export const Rule = z.object({
  id: Id,
  when: Condition,
  then: z.array(Effect).min(1),
  once: z.boolean().default(true),
});
export type Rule = z.infer<typeof Rule>;
```

- [ ] **Step 5: Implement blocks** — `app/packages/engine/src/schema/blocks.ts`
```ts
import { z } from "zod";
import { Choice, Dimension, Id, Licence, Mood, NumericAnswerFields, Semantic, Source, Tag } from "./common";

const base = { id: Id, mood: Mood, source: Source, licence: Licence };
const simConfig = z.record(z.string(), z.unknown());

export const ProseBlock = z.object({ ...base, type: z.literal("prose"), text: z.string().min(1) });

export const EquationBuildBlock = z.object({
  ...base,
  type: z.literal("equation-build"),
  steps: z
    .array(z.object({ latex: z.string().min(1), caption: z.string(), highlights: z.array(z.string()).default([]) }))
    .min(1),
  bindings: z.record(z.string(), Semantic).default({}),
});

export const FigureBlock = z.object({
  ...base,
  type: z.literal("figure"),
  asset: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string(),
});

export const Sim3dBlock = z.object({ ...base, type: z.literal("sim-3d"), scene: z.string().min(1), config: simConfig, caption: z.string() });
export const Sim2dBlock = z.object({ ...base, type: z.literal("sim-2d"), scene: z.string().min(1), config: simConfig, caption: z.string() });

export const PredictBlock = z.object({
  ...base,
  type: z.literal("predict"),
  prompt: z.string().min(1),
  options: z.array(Choice).min(2),
  reveal: z.string().min(1),
  dimension: Dimension,
});

export const ManipulateBlock = z.object({
  ...base,
  type: z.literal("manipulate"),
  scene: z.string().min(1),
  config: simConfig,
  goal: z.string().min(1),
  check: z.string().min(1),
  dimension: Dimension,
});

export const IdentifyBlock = z.object({
  ...base,
  type: z.literal("identify"),
  prompt: z.string().min(1),
  scene: z.string().min(1),
  targets: z.array(Choice).min(2),
  dimension: Dimension,
});

export const OrderBlock = z.object({
  ...base,
  type: z.literal("order"),
  prompt: z.string().min(1),
  items: z.array(z.object({ id: Id, label: z.string().min(1) })).min(2),
  correctOrder: z.array(Id).min(2),
  feedback: z.string().min(1),
  dimension: Dimension,
});

export const McqBlock = z.object({
  ...base,
  type: z.literal("mcq"),
  prompt: z.string().min(1),
  options: z.array(Choice).min(2),
  selfExplain: z.object({ prompt: z.string().min(1), options: z.array(Choice).min(2) }).optional(),
  dimension: Dimension,
});

export const NumericBlock = z.object({
  ...base,
  type: z.literal("numeric"),
  prompt: z.string().min(1),
  ...NumericAnswerFields,
  hints: z.array(z.string()).max(3).default([]),
  dimension: Dimension,
});

export const StepSolveBlock = z.object({
  ...base,
  type: z.literal("step-solve"),
  prompt: z.string().min(1),
  steps: z
    .array(
      z.object({
        id: Id,
        prompt: z.string().min(1),
        ...NumericAnswerFields,
        hints: z.array(z.string().min(1)).length(3),
        workedStep: z.string().min(1),
      }),
    )
    .min(1),
  dimension: Dimension,
});

export const ChallengeBlock = z.object({
  ...base,
  type: z.literal("challenge"),
  prompt: z.string().min(1),
  ...NumericAnswerFields,
  dimensions: z.array(Dimension).min(1),
});

export const RemediateBlock = z.object({
  ...base,
  type: z.literal("remediate"),
  tag: Tag,
  lessonRef: z.string().min(1),
  message: z.string().min(1),
});

export const RetrievalBlock = z.object({
  ...base,
  type: z.literal("retrieval"),
  conceptId: z.string().min(1),
  dimension: Dimension,
  item: z.discriminatedUnion("type", [McqBlock, NumericBlock]),
});

export const AssessmentBlock = z.discriminatedUnion("type", [McqBlock, NumericBlock, StepSolveBlock, ChallengeBlock]);

export const CheckpointBlock = z.object({
  ...base,
  type: z.literal("checkpoint"),
  title: z.string().min(1),
  items: z.array(AssessmentBlock).min(1),
  passRatio: z.number().min(0).max(1),
});

export const BranchBlock = z.object({
  ...base,
  type: z.literal("branch"),
  prompt: z.string().min(1),
  get options() {
    return z.array(z.object({ id: Id, label: z.string().min(1), blocks: z.array(Block).min(1) })).min(1);
  },
});

export const Block = z.discriminatedUnion("type", [
  ProseBlock,
  EquationBuildBlock,
  FigureBlock,
  Sim3dBlock,
  Sim2dBlock,
  PredictBlock,
  ManipulateBlock,
  IdentifyBlock,
  OrderBlock,
  McqBlock,
  NumericBlock,
  StepSolveBlock,
  ChallengeBlock,
  BranchBlock,
  CheckpointBlock,
  RemediateBlock,
  RetrievalBlock,
]);

export type Block = z.infer<typeof Block>;
export type McqBlock = z.infer<typeof McqBlock>;
export type NumericBlock = z.infer<typeof NumericBlock>;
export type StepSolveBlock = z.infer<typeof StepSolveBlock>;
export type ChallengeBlock = z.infer<typeof ChallengeBlock>;
export type BranchBlock = z.infer<typeof BranchBlock>;
export type CheckpointBlock = z.infer<typeof CheckpointBlock>;
export type BlockType = Block["type"];
```

If TypeScript reports an implicit-`any` circularity on `BranchBlock`/`Block`, annotate the getter's return type: `get options(): z.ZodArray<z.ZodObject<{ id: typeof Id; label: z.ZodString; blocks: z.ZodArray<typeof Block> }>>`.

- [ ] **Step 6: Implement course + diagnostic schemas** — `app/packages/engine/src/schema/course.ts`
```ts
import { z } from "zod";
import { Block } from "./blocks";
import { Id, Source, Tag } from "./common";
import { Rule } from "./rules";

export const ConceptId = z.string().regex(/^[a-z0-9]+(\.[a-z0-9-]+)+$/);

export const Lesson = z.object({
  id: Id,
  title: z.string().min(1),
  minutes: z.number().positive(),
  blocks: z.array(Block).min(1),
});
export type Lesson = z.infer<typeof Lesson>;

export const Concept = z.object({
  id: ConceptId,
  title: z.string().min(1),
  unit: z.number().int().nonnegative(),
  objectives: z.array(z.string().min(1)).min(1),
  prerequisites: z.array(z.object({ conceptId: ConceptId, minMastery: z.number().min(0).max(1) })),
  misconceptions: z.array(z.object({ tag: Tag, description: z.string().min(1), remediation: z.string().min(1) })),
  examLinks: z.array(
    z.object({ paper: z.string().min(1), question: z.string().min(1), marks: z.number().positive(), weight: z.number().min(0).max(1) }),
  ),
  sources: z.array(Source),
  status: z.enum(["draft", "verified", "ready"]),
  lessons: z.array(Lesson),
  rules: z.array(Rule),
  locked: z.boolean().default(false),
});
export type Concept = z.infer<typeof Concept>;

export const Course = z.object({
  id: Id,
  code: z.string().min(1),
  title: z.string().min(1),
  examDate: z.iso.date(),
  units: z.array(z.object({ number: z.number().int().nonnegative(), title: z.string().min(1) })),
  concepts: z.array(Concept),
});
export type Course = z.infer<typeof Course>;
```

`app/packages/engine/src/schema/diagnostic.ts`:
```ts
import { z } from "zod";
import { Choice, Id } from "./common";

export const DiagnosticItem = z.object({
  id: Id,
  topic: Id,
  role: z.enum(["core", "probe"]),
  prompt: z.string().min(1),
  options: z.array(Choice).min(2),
});
export type DiagnosticItem = z.infer<typeof DiagnosticItem>;

export const Diagnostic = z.object({
  topics: z.array(z.object({ id: Id, label: z.string().min(1), refresher: z.string().nullable() })).min(1),
  items: z.array(DiagnosticItem).min(1),
});
export type Diagnostic = z.infer<typeof Diagnostic>;
```

Replace `app/packages/engine/src/index.ts`:
```ts
export * from "./quantities";
export * from "./schema/common";
export * from "./schema/rules";
export * from "./schema/blocks";
export * from "./schema/course";
export * from "./schema/diagnostic";
```

- [ ] **Step 7: Run tests and typecheck**

Run: `pnpm vitest run packages/engine && pnpm typecheck`
Expected: PASS, and `tsc` exits 0.

- [ ] **Step 8: Commit**
```bash
git add app/packages/engine
git commit -m "feat(engine): Zod course grammar (blocks, rules, concepts, diagnostic)"
```

---

### Task 7: Answer checking

**Files:**
- Create: `app/packages/engine/src/answer.ts`
- Modify: `app/packages/engine/src/index.ts`
- Test: `app/packages/engine/test/answer.test.ts`

**Interfaces:**
- Consumes: `parseQuantity`, `toSI` (Task 5); `AuthoredQuantity`, `Distractor`, `Choice`, `ErrorClass` (Task 6).
- Produces:
  - `type NumericSpec = { answer: AuthoredQuantity; relTol: number; distractors: Distractor[] }`
  - `type Verdict = { correct: boolean; errorClass?: ErrorClass; tag?: string; feedback: string }`
  - `checkNumeric(spec: NumericSpec, input: string): Verdict`
  - `checkChoice(options: Choice[], selectedId: string): Verdict`

- [ ] **Step 1: Write the failing test** — `app/packages/engine/test/answer.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { checkChoice, checkNumeric, type NumericSpec } from "../src";

const spec: NumericSpec = {
  answer: { value: 4, unit: "µC" },
  relTol: 0.02,
  distractors: [
    { value: 16, unit: "µC", errorClass: "conceptual", tag: "FLUX_SCALES_WITH_AREA", feedback: "You scaled flux with area." },
  ],
};

describe("checkNumeric", () => {
  it("accepts equivalent values in other prefixes", () => {
    expect(checkNumeric(spec, "4 µC").correct).toBe(true);
    expect(checkNumeric(spec, "0.004 mC").correct).toBe(true);
    expect(checkNumeric(spec, "4.05e-6 C").correct).toBe(true);
  });
  it("matches authored distractors with their tag", () => {
    const v = checkNumeric(spec, "16 uC");
    expect(v).toMatchObject({ correct: false, errorClass: "conceptual", tag: "FLUX_SCALES_WITH_AREA" });
  });
  it("detects sign errors", () => {
    expect(checkNumeric(spec, "-4 µC").errorClass).toBe("sign");
  });
  it("detects prefix/power-of-ten slips as unit errors", () => {
    expect(checkNumeric(spec, "4 nC").errorClass).toBe("unit");
    expect(checkNumeric(spec, "4 mC").errorClass).toBe("unit");
  });
  it("detects wrong dimension and missing units", () => {
    expect(checkNumeric(spec, "4 V/m").errorClass).toBe("unit");
    expect(checkNumeric(spec, "4").errorClass).toBe("unit");
  });
  it("flags unreadable input as notation", () => {
    expect(checkNumeric(spec, "four").errorClass).toBe("notation");
  });
  it("near misses are arithmetic, far misses conceptual", () => {
    expect(checkNumeric(spec, "4.3 µC").errorClass).toBe("arithmetic");
    expect(checkNumeric(spec, "9 µC").errorClass).toBe("conceptual");
  });
});

describe("checkChoice", () => {
  const options = [
    { id: "a", label: "Doubles", correct: false, feedback: "D weakens as 1/r².", tag: "FLUX_SCALES_WITH_AREA" },
    { id: "b", label: "Same", correct: true, feedback: "Only enclosed charge matters." },
  ];
  it("returns the option's feedback and tag", () => {
    expect(checkChoice(options, "a")).toEqual({ correct: false, errorClass: "conceptual", tag: "FLUX_SCALES_WITH_AREA", feedback: "D weakens as 1/r²." });
    expect(checkChoice(options, "b")).toEqual({ correct: true, feedback: "Only enclosed charge matters." });
  });
  it("throws on unknown option id", () => {
    expect(() => checkChoice(options, "z")).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/answer.test.ts`
Expected: FAIL — `checkNumeric` not exported.

- [ ] **Step 3: Implement** — `app/packages/engine/src/answer.ts`
```ts
import { parseQuantity, toSI } from "./quantities";
import type { AuthoredQuantity, Choice, Distractor, ErrorClass } from "./schema/common";

export type NumericSpec = { answer: AuthoredQuantity; relTol: number; distractors: Distractor[] };
export type Verdict = { correct: boolean; errorClass?: ErrorClass; tag?: string; feedback: string };

const close = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol * Math.max(Math.abs(b), Number.MIN_VALUE);

export function checkNumeric(spec: NumericSpec, input: string): Verdict {
  const expected = toSI(spec.answer.value, spec.answer.unit);
  const got = parseQuantity(input);
  if (!got) {
    return { correct: false, errorClass: "notation", feedback: `Enter a number with units, e.g. ${spec.answer.value} ${spec.answer.unit}.` };
  }
  if (got.dim !== expected.dim) {
    const missing = got.dim === "1";
    return {
      correct: false,
      errorClass: "unit",
      feedback: missing ? `Include units — the answer is measured in ${spec.answer.unit}-type units.` : "Check the units: that quantity has a different dimension from what's asked.",
    };
  }
  if (close(got.value, expected.value, spec.relTol)) return { correct: true, feedback: "That's it." };
  for (const d of spec.distractors) {
    const dv = toSI(d.value, d.unit).value;
    if (close(got.value, dv, spec.relTol)) {
      return { correct: false, errorClass: d.errorClass, ...(d.tag ? { tag: d.tag } : {}), feedback: d.feedback };
    }
  }
  if (close(-got.value, expected.value, spec.relTol)) {
    return { correct: false, errorClass: "sign", feedback: "The magnitude is right — check the sign and direction." };
  }
  const k = Math.log10(Math.abs(got.value / expected.value));
  if (Math.abs(k - Math.round(k)) < 0.01 && Math.round(k) !== 0) {
    return { correct: false, errorClass: "unit", feedback: `Off by a factor of 10^${Math.round(k)} — check your prefixes.` };
  }
  const nearMiss = close(got.value, expected.value, 0.1);
  return {
    correct: false,
    errorClass: nearMiss ? "arithmetic" : "conceptual",
    feedback: nearMiss ? "Close — recheck your arithmetic." : "Not quite — revisit how the quantity is set up.",
  };
}

export function checkChoice(options: Choice[], selectedId: string): Verdict {
  const o = options.find((x) => x.id === selectedId);
  if (!o) throw new Error(`Unknown option: ${selectedId}`);
  if (o.correct) return { correct: true, feedback: o.feedback };
  return { correct: false, errorClass: "conceptual", ...(o.tag ? { tag: o.tag } : {}), feedback: o.feedback };
}
```

Append to `app/packages/engine/src/index.ts`:
```ts
export * from "./answer";
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run packages/engine/test/answer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add app/packages/engine
git commit -m "feat(engine): numeric and choice answer checking with error classes"
```

---

### Task 8: Mastery + scheduler

**Files:**
- Create: `app/packages/engine/src/mastery.ts`, `app/packages/engine/src/scheduler.ts`
- Modify: `app/packages/engine/src/index.ts`
- Test: `app/packages/engine/test/mastery.test.ts`, `app/packages/engine/test/scheduler.test.ts`

**Interfaces:**
- Consumes: `Dimension`, `DIMENSIONS` (Task 6).
- Produces:
  - `type Dimensions = Record<Dimension, number>`; `zeroDimensions(): Dimensions`
  - `applyEvidence(d: Dimensions, dims: readonly Dimension[], correct: boolean, weight?: number): Dimensions` (default weight 0.35)
  - `type ConceptState = "NOT_STARTED"|"INTRODUCED"|"EXPLORED"|"PRACTICED"|"DEMONSTRATED"|"MASTERED"`
  - `deriveState(d: Dimensions, seen: boolean): ConceptState`
  - `overallMastery(d: Dimensions): number` (mean)
  - `DAY_MS = 86_400_000`
  - `type Review = { due: number; intervalDays: number }`
  - `nextReview(prev: Review | undefined, correct: boolean, now: number, examDate?: number): Review`

- [ ] **Step 1: Write failing tests**

`app/packages/engine/test/mastery.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { applyEvidence, deriveState, overallMastery, zeroDimensions } from "../src";

describe("mastery", () => {
  it("correct evidence moves toward 1, incorrect toward 0, bounded", () => {
    let d = zeroDimensions();
    d = applyEvidence(d, ["conceptual"], true);
    expect(d.conceptual).toBeCloseTo(0.35, 10);
    d = applyEvidence(d, ["conceptual"], true);
    expect(d.conceptual).toBeCloseTo(0.5775, 10);
    d = applyEvidence(d, ["conceptual"], false);
    expect(d.conceptual).toBeLessThan(0.5775);
    expect(d.computational).toBe(0);
    for (let i = 0; i < 50; i++) d = applyEvidence(d, ["conceptual"], true);
    expect(d.conceptual).toBeLessThanOrEqual(1);
  });
  it("derives concept state from dimensions", () => {
    const z = zeroDimensions();
    expect(deriveState(z, false)).toBe("NOT_STARTED");
    expect(deriveState(z, true)).toBe("INTRODUCED");
    expect(deriveState({ ...z, conceptual: 0.4 }, true)).toBe("EXPLORED");
    expect(deriveState({ ...z, conceptual: 0.4, computational: 0.6 }, true)).toBe("PRACTICED");
    expect(deriveState({ ...z, conceptual: 0.75, computational: 0.6, independent: 0.65 }, true)).toBe("DEMONSTRATED");
    const all = { conceptual: 0.9, computational: 0.85, recognition: 0.8, independent: 0.8, application: 0.95 };
    expect(deriveState(all, true)).toBe("MASTERED");
    expect(overallMastery(all)).toBeCloseTo(0.86, 10);
  });
});
```

`app/packages/engine/test/scheduler.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { DAY_MS, nextReview } from "../src";

const now = Date.UTC(2026, 8, 25);

describe("nextReview", () => {
  it("starts at 1 day and doubles on success, capped at 60", () => {
    let r = nextReview(undefined, true, now);
    expect(r.intervalDays).toBe(1);
    r = nextReview(r, true, now);
    expect(r.intervalDays).toBe(2);
    r = nextReview({ due: now, intervalDays: 40 }, true, now);
    expect(r.intervalDays).toBe(60);
    expect(r.due).toBe(now + 60 * DAY_MS);
  });
  it("resets to 1 day on a miss", () => {
    expect(nextReview({ due: now, intervalDays: 16 }, false, now).intervalDays).toBe(1);
  });
  it("compresses intervals when the exam is within 21 days", () => {
    const exam = now + 10 * DAY_MS;
    expect(nextReview({ due: now, intervalDays: 16 }, true, now, exam).intervalDays).toBe(5);
    const farExam = now + 90 * DAY_MS;
    expect(nextReview({ due: now, intervalDays: 16 }, true, now, farExam).intervalDays).toBe(32);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run packages/engine/test/mastery.test.ts packages/engine/test/scheduler.test.ts`
Expected: FAIL — exports missing.

- [ ] **Step 3: Implement** — `app/packages/engine/src/mastery.ts`
```ts
import { DIMENSIONS, type Dimension } from "./schema/common";

export type Dimensions = Record<Dimension, number>;
export type ConceptState = "NOT_STARTED" | "INTRODUCED" | "EXPLORED" | "PRACTICED" | "DEMONSTRATED" | "MASTERED";

export const zeroDimensions = (): Dimensions =>
  Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Dimensions;

/** Exponential moving evidence: success closes `weight` of the gap to 1, failure removes half of `weight` of the value. */
export function applyEvidence(d: Dimensions, dims: readonly Dimension[], correct: boolean, weight = 0.35): Dimensions {
  const out = { ...d };
  for (const k of dims) {
    out[k] = correct ? Math.min(1, out[k] + weight * (1 - out[k])) : Math.max(0, out[k] - (weight / 2) * out[k]);
  }
  return out;
}

export function deriveState(d: Dimensions, seen: boolean): ConceptState {
  if (DIMENSIONS.every((k) => d[k] >= 0.8)) return "MASTERED";
  if (d.independent >= 0.6 && d.conceptual >= 0.7) return "DEMONSTRATED";
  if (d.computational >= 0.5) return "PRACTICED";
  if (d.conceptual >= 0.3) return "EXPLORED";
  return seen ? "INTRODUCED" : "NOT_STARTED";
}

export const overallMastery = (d: Dimensions): number => DIMENSIONS.reduce((s, k) => s + d[k], 0) / DIMENSIONS.length;
```

`app/packages/engine/src/scheduler.ts`:
```ts
export const DAY_MS = 86_400_000;
export type Review = { due: number; intervalDays: number };

export function nextReview(prev: Review | undefined, correct: boolean, now: number, examDate?: number): Review {
  let interval = !correct ? 1 : prev ? Math.min(prev.intervalDays * 2, 60) : 1;
  if (examDate !== undefined) {
    const daysToExam = (examDate - now) / DAY_MS;
    if (daysToExam > 0 && daysToExam <= 21) interval = Math.min(interval, Math.max(1, Math.floor(daysToExam / 2)));
  }
  return { due: now + interval * DAY_MS, intervalDays: interval };
}
```

Append to `app/packages/engine/src/index.ts`:
```ts
export * from "./mastery";
export * from "./scheduler";
```

- [ ] **Step 4: Run to verify they pass**

Run: `pnpm vitest run packages/engine/test/mastery.test.ts packages/engine/test/scheduler.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add app/packages/engine
git commit -m "feat(engine): mastery evidence, concept states, spaced review scheduling"
```

---

### Task 9: Learner state, events, and migration

**Files:**
- Create: `app/packages/engine/src/events.ts`, `app/packages/engine/src/learner-state.ts`
- Modify: `app/packages/engine/src/index.ts`
- Test: `app/packages/engine/test/learner-state.test.ts`

**Interfaces:**
- Consumes: `Dimensions`, `zeroDimensions` (Task 8), `Review`, `Dimension`, `ErrorClass`, `BlockType`.
- Produces:
  - `LearnEvent` union:
    - `{ type: "blockViewed"; conceptId: string; blockId: string; at: number }`
    - `{ type: "answer"; conceptId: string; blockId: string; blockType: BlockType; dimensions: Dimension[]; correct: boolean; attempt: number; tag?: string; errorClass?: ErrorClass; at: number }`
    - `{ type: "retrieval"; conceptId: string; dimension: Dimension; correct: boolean; at: number }`
  - `ConceptProgress = { dimensions: Dimensions; seen: boolean; attempts: number; tags: Record<string, number>; blockFails: Record<string, number>; firedRules: string[]; lastSeen: number | null; review: Partial<Record<Dimension, Review>> }`
  - `NotebookEntry = { id: string; createdAt: number; conceptId: string; kind: "note" | "equation" | "sim-state"; title: string; body: string; simState?: { scene: string; config: Record<string, unknown> } }`
  - `Settings = { theme: "paper" | "night" | "contrast"; motion: "standard" | "reduced"; density: "comfortable" | "compact"; simQuality: "high" | "balanced" | "low"; equationDetail: "progressive" | "full" }`
  - `LearnerState = { version: 1; diagnostic: { completedAt: number; results: Record<string, "ready" | "partial" | "gap">; route: string[] } | null; concepts: Record<string, ConceptProgress>; position: { conceptId: string; lessonId: string; blockId: string; branchStack: string[] } | null; notebook: NotebookEntry[]; settings: Settings; history: LearnEvent[] }`
  - `STATE_VERSION = 1`, `HISTORY_CAP = 500`
  - `initialState(): LearnerState`, `emptyProgress(): ConceptProgress`
  - `migrate(raw: unknown): { state: LearnerState; reset: boolean; backup?: unknown }`

- [ ] **Step 1: Write the failing test** — `app/packages/engine/test/learner-state.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { emptyProgress, initialState, migrate, STATE_VERSION } from "../src";

describe("learner state", () => {
  it("initial state is empty and versioned", () => {
    const s = initialState();
    expect(s.version).toBe(STATE_VERSION);
    expect(s.concepts).toEqual({});
    expect(s.settings.theme).toBe("paper");
    expect(emptyProgress().dimensions.conceptual).toBe(0);
  });
  it("migrate(null) returns a fresh state without reset", () => {
    expect(migrate(null)).toEqual({ state: initialState(), reset: false });
  });
  it("migrate keeps a valid v1 state", () => {
    const s = initialState();
    s.concepts["em1.x.y"] = emptyProgress();
    const out = migrate(JSON.parse(JSON.stringify(s)));
    expect(out.reset).toBe(false);
    expect(out.state.concepts["em1.x.y"]).toBeDefined();
  });
  it("migrate backs up and resets corrupted or unknown-version state", () => {
    const bad = { version: 99, junk: true };
    const out = migrate(bad);
    expect(out.reset).toBe(true);
    expect(out.backup).toBe(bad);
    expect(out.state).toEqual(initialState());
    expect(migrate({ version: 1, concepts: "nope" }).reset).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/learner-state.test.ts`
Expected: FAIL — exports missing.

- [ ] **Step 3: Implement events** — `app/packages/engine/src/events.ts`
```ts
import type { BlockType } from "./schema/blocks";
import type { Dimension, ErrorClass } from "./schema/common";

export type LearnEvent =
  | { type: "blockViewed"; conceptId: string; blockId: string; at: number }
  | {
      type: "answer";
      conceptId: string;
      blockId: string;
      blockType: BlockType;
      dimensions: Dimension[];
      correct: boolean;
      attempt: number;
      tag?: string;
      errorClass?: ErrorClass;
      at: number;
    }
  | { type: "retrieval"; conceptId: string; dimension: Dimension; correct: boolean; at: number };
```

- [ ] **Step 4: Implement learner state** — `app/packages/engine/src/learner-state.ts`
```ts
import { z } from "zod";
import type { LearnEvent } from "./events";
import { zeroDimensions, type Dimensions } from "./mastery";
import type { Review } from "./scheduler";
import { DIMENSIONS, type Dimension } from "./schema/common";

export const STATE_VERSION = 1;
export const HISTORY_CAP = 500;

export type ConceptProgress = {
  dimensions: Dimensions;
  seen: boolean;
  attempts: number;
  tags: Record<string, number>;
  blockFails: Record<string, number>;
  firedRules: string[];
  lastSeen: number | null;
  review: Partial<Record<Dimension, Review>>;
};

export type NotebookEntry = {
  id: string;
  createdAt: number;
  conceptId: string;
  kind: "note" | "equation" | "sim-state";
  title: string;
  body: string;
  simState?: { scene: string; config: Record<string, unknown> };
};

export type Settings = {
  theme: "paper" | "night" | "contrast";
  motion: "standard" | "reduced";
  density: "comfortable" | "compact";
  simQuality: "high" | "balanced" | "low";
  equationDetail: "progressive" | "full";
};

export type LearnerState = {
  version: 1;
  diagnostic: { completedAt: number; results: Record<string, "ready" | "partial" | "gap">; route: string[] } | null;
  concepts: Record<string, ConceptProgress>;
  position: { conceptId: string; lessonId: string; blockId: string; branchStack: string[] } | null;
  notebook: NotebookEntry[];
  settings: Settings;
  history: LearnEvent[];
};

export const emptyProgress = (): ConceptProgress => ({
  dimensions: zeroDimensions(),
  seen: false,
  attempts: 0,
  tags: {},
  blockFails: {},
  firedRules: [],
  lastSeen: null,
  review: {},
});

export const initialState = (): LearnerState => ({
  version: STATE_VERSION,
  diagnostic: null,
  concepts: {},
  position: null,
  notebook: [],
  settings: { theme: "paper", motion: "standard", density: "comfortable", simQuality: "balanced", equationDetail: "progressive" },
  history: [],
});

const num01 = z.number().min(0).max(1);
const ReviewS = z.object({ due: z.number(), intervalDays: z.number().positive() });
const ProgressS = z.object({
  dimensions: z.object(Object.fromEntries(DIMENSIONS.map((d) => [d, num01])) as Record<Dimension, typeof num01>),
  seen: z.boolean(),
  attempts: z.number().int().nonnegative(),
  tags: z.record(z.string(), z.number()),
  blockFails: z.record(z.string(), z.number()),
  firedRules: z.array(z.string()),
  lastSeen: z.number().nullable(),
  review: z.record(z.string(), ReviewS),
});
const StateV1 = z.object({
  version: z.literal(1),
  diagnostic: z
    .object({ completedAt: z.number(), results: z.record(z.string(), z.enum(["ready", "partial", "gap"])), route: z.array(z.string()) })
    .nullable(),
  concepts: z.record(z.string(), ProgressS),
  position: z
    .object({ conceptId: z.string(), lessonId: z.string(), blockId: z.string(), branchStack: z.array(z.string()) })
    .nullable(),
  notebook: z.array(z.any()),
  settings: z.object({
    theme: z.enum(["paper", "night", "contrast"]),
    motion: z.enum(["standard", "reduced"]),
    density: z.enum(["comfortable", "compact"]),
    simQuality: z.enum(["high", "balanced", "low"]),
    equationDetail: z.enum(["progressive", "full"]),
  }),
  history: z.array(z.any()),
});

/** Validate persisted state; unknown versions or corrupt data are backed up and reset. */
export function migrate(raw: unknown): { state: LearnerState; reset: boolean; backup?: unknown } {
  if (raw === null || raw === undefined) return { state: initialState(), reset: false };
  const parsed = StateV1.safeParse(raw);
  if (parsed.success) return { state: parsed.data as LearnerState, reset: false };
  return { state: initialState(), reset: true, backup: raw };
}
```

Append to `app/packages/engine/src/index.ts`:
```ts
export * from "./events";
export * from "./learner-state";
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm vitest run packages/engine/test/learner-state.test.ts && pnpm typecheck`
Expected: PASS; typecheck exits 0.

- [ ] **Step 6: Commit**
```bash
git add app/packages/engine
git commit -m "feat(engine): learner state model, events, versioned migration"
```

---

### Task 10: Rules reducer

**Files:**
- Create: `app/packages/engine/src/reducer.ts`
- Modify: `app/packages/engine/src/index.ts`
- Test: `app/packages/engine/test/reducer.test.ts`

**Interfaces:**
- Consumes: `LearnerState`, `ConceptProgress`, `emptyProgress`, `HISTORY_CAP` (Task 9); `LearnEvent`; `applyEvidence` (Task 8); `nextReview` (Task 8); `Concept`, `Rule`, `Effect` (Task 6).
- Produces:
  - `reduce(state: LearnerState, event: LearnEvent, concept: Pick<Concept, "id" | "rules">, examDate?: number): { state: LearnerState; effects: Effect[] }`
  - `MASTERY_REVIEW_THRESHOLD = 0.8` (a dimension reaching it gets a first review scheduled)
  - Pure: never mutates input `state`.

- [ ] **Step 1: Write the failing test** — `app/packages/engine/test/reducer.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { DAY_MS, initialState, reduce, type LearnEvent, type Rule } from "../src";

const cid = "em1.electrostatics.gauss-law";
const rules: Rule[] = [
  { id: "area-twice", when: { type: "tagCount", tag: "FLUX_SCALES_WITH_AREA", gte: 2 }, then: [{ type: "offerRemediation", tag: "FLUX_SCALES_WITH_AREA", lessonRef: `${cid}/why-area` }], once: true },
  { id: "fast-pass", when: { type: "challengePassed", firstAttempt: true }, then: [{ type: "offerSkip" }, { type: "credit", dimension: "application", amount: 0.8 }], once: true },
  { id: "stuck", when: { type: "attemptsFailed", blockType: "step-solve", gte: 3 }, then: [{ type: "revealWorkedStep" }], once: false },
];
const concept = { id: cid, rules };
const t0 = Date.UTC(2026, 8, 25);

const wrong = (at: number, extra: Partial<Extract<LearnEvent, { type: "answer" }>> = {}): LearnEvent => ({
  type: "answer", conceptId: cid, blockId: "q1", blockType: "mcq", dimensions: ["conceptual"], correct: false, attempt: 1, tag: "FLUX_SCALES_WITH_AREA", at, ...extra,
});

describe("reduce", () => {
  it("does not mutate input and records history + seen", () => {
    const s0 = initialState();
    const { state } = reduce(s0, { type: "blockViewed", conceptId: cid, blockId: "b1", at: t0 }, concept);
    expect(s0.concepts).toEqual({});
    expect(state.concepts[cid]!.seen).toBe(true);
    expect(state.history).toHaveLength(1);
  });

  it("fires tagCount remediation on the second occurrence, only once", () => {
    let s = initialState();
    let r = reduce(s, wrong(t0), concept);
    expect(r.effects).toEqual([]);
    r = reduce(r.state, wrong(t0 + 1), concept);
    expect(r.effects).toEqual([{ type: "offerRemediation", tag: "FLUX_SCALES_WITH_AREA", lessonRef: `${cid}/why-area` }]);
    r = reduce(r.state, wrong(t0 + 2), concept);
    expect(r.effects).toEqual([]);
    s = r.state;
    expect(s.concepts[cid]!.tags.FLUX_SCALES_WITH_AREA).toBe(3);
  });

  it("first-attempt challenge pass offers skip and credits application", () => {
    const r = reduce(initialState(), { type: "answer", conceptId: cid, blockId: "ch", blockType: "challenge", dimensions: ["independent"], correct: true, attempt: 1, at: t0 }, concept);
    expect(r.effects.map((e) => e.type)).toEqual(["offerSkip", "credit"]);
    expect(r.state.concepts[cid]!.dimensions.application).toBe(0.8);
  });

  it("repeating attemptsFailed rule fires each time the threshold is met", () => {
    let s = initialState();
    const fail = (i: number): LearnEvent => ({ type: "answer", conceptId: cid, blockId: "ws", blockType: "step-solve", dimensions: ["computational"], correct: false, attempt: i, at: t0 + i });
    let fired = 0;
    for (let i = 1; i <= 6; i++) {
      const r = reduce(s, fail(i), concept);
      fired += r.effects.filter((e) => e.type === "revealWorkedStep").length;
      s = r.state;
    }
    expect(fired).toBe(2);
  });

  it("schedules a review once a dimension reaches the mastery threshold, and retrieval updates it", () => {
    let s = initialState();
    for (let i = 0; i < 5; i++) {
      s = reduce(s, { type: "answer", conceptId: cid, blockId: `c${i}`, blockType: "mcq", dimensions: ["conceptual"], correct: true, attempt: 1, at: t0 }, concept).state;
    }
    const review = s.concepts[cid]!.review.conceptual!;
    expect(review.intervalDays).toBe(1);
    expect(review.due).toBe(t0 + DAY_MS);
    s = reduce(s, { type: "retrieval", conceptId: cid, dimension: "conceptual", correct: true, at: t0 + DAY_MS }, concept).state;
    expect(s.concepts[cid]!.review.conceptual!.intervalDays).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/reducer.test.ts`
Expected: FAIL — `reduce` not exported.

- [ ] **Step 3: Implement** — `app/packages/engine/src/reducer.ts`
```ts
import type { LearnEvent } from "./events";
import { emptyProgress, HISTORY_CAP, type ConceptProgress, type LearnerState } from "./learner-state";
import { applyEvidence } from "./mastery";
import { nextReview } from "./scheduler";
import type { Concept } from "./schema/course";
import type { Effect, Rule } from "./schema/rules";

export const MASTERY_REVIEW_THRESHOLD = 0.8;

function conditionMet(rule: Rule, p: ConceptProgress, e: LearnEvent): boolean {
  const c = rule.when;
  if (e.type !== "answer") return false;
  switch (c.type) {
    case "tagCount":
      return !e.correct && e.tag === c.tag && (p.tags[c.tag] ?? 0) >= c.gte;
    case "challengePassed":
      return e.blockType === "challenge" && e.correct && (!c.firstAttempt || e.attempt === 1);
    case "attemptsFailed": {
      const fails = p.blockFails[e.blockId] ?? 0;
      return e.blockType === c.blockType && !e.correct && fails >= c.gte && fails % c.gte === 0;
    }
  }
}

export function reduce(
  state: LearnerState,
  event: LearnEvent,
  concept: Pick<Concept, "id" | "rules">,
  examDate?: number,
): { state: LearnerState; effects: Effect[] } {
  const prev = state.concepts[event.conceptId] ?? emptyProgress();
  const p: ConceptProgress = {
    ...prev,
    dimensions: { ...prev.dimensions },
    tags: { ...prev.tags },
    blockFails: { ...prev.blockFails },
    firedRules: [...prev.firedRules],
    review: { ...prev.review },
    seen: true,
    lastSeen: event.at,
  };
  const effects: Effect[] = [];

  if (event.type === "answer") {
    p.attempts += 1;
    if (!event.correct) {
      p.blockFails[event.blockId] = (p.blockFails[event.blockId] ?? 0) + 1;
      if (event.tag) p.tags[event.tag] = (p.tags[event.tag] ?? 0) + 1;
    }
    const before = { ...p.dimensions };
    p.dimensions = applyEvidence(p.dimensions, event.dimensions, event.correct);

    for (const rule of concept.rules) {
      if (rule.once && p.firedRules.includes(rule.id)) continue;
      if (!conditionMet(rule, p, event)) continue;
      effects.push(...rule.then);
      for (const eff of rule.then) {
        if (eff.type === "credit") p.dimensions[eff.dimension] = Math.max(p.dimensions[eff.dimension], eff.amount);
      }
      if (rule.once) p.firedRules.push(rule.id);
    }

    for (const d of event.dimensions) {
      if (before[d] < MASTERY_REVIEW_THRESHOLD && p.dimensions[d] >= MASTERY_REVIEW_THRESHOLD && !p.review[d]) {
        p.review[d] = nextReview(undefined, true, event.at, examDate);
      }
    }
  }

  if (event.type === "retrieval") {
    p.dimensions = applyEvidence(p.dimensions, [event.dimension], event.correct);
    p.review[event.dimension] = nextReview(p.review[event.dimension], event.correct, event.at, examDate);
  }

  const history = [...state.history, event].slice(-HISTORY_CAP);
  return { state: { ...state, concepts: { ...state.concepts, [event.conceptId]: p }, history }, effects };
}
```

Append to `app/packages/engine/src/index.ts`:
```ts
export * from "./reducer";
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run packages/engine/test/reducer.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**
```bash
git add app/packages/engine
git commit -m "feat(engine): pure rules reducer with remediation, skip, credit and reviews"
```

---

### Task 11: Diagnostic router

**Files:**
- Create: `app/packages/engine/src/diagnostic.ts`
- Modify: `app/packages/engine/src/index.ts`
- Test: `app/packages/engine/test/diagnostic.test.ts`

**Interfaces:**
- Consumes: `Diagnostic`, `DiagnosticItem` (Task 6).
- Produces:
  - `type DiagnosticAnswers = Record<string, boolean>` (itemId → correct)
  - `nextDiagnosticItem(d: Diagnostic, answers: DiagnosticAnswers): DiagnosticItem | null`
  - `topicResult(d: Diagnostic, topicId: string, answers: DiagnosticAnswers): "ready" | "partial" | "gap"`
  - `diagnosticRoute(d: Diagnostic, answers: DiagnosticAnswers): { results: Record<string, "ready"|"partial"|"gap">; route: string[] }` (route = refresher concept ids for non-ready topics, topic order, deduped, nulls skipped)

- [ ] **Step 1: Write the failing test** — `app/packages/engine/test/diagnostic.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { diagnosticRoute, nextDiagnosticItem, type Diagnostic } from "../src";

const opt = [
  { id: "a", label: "A", correct: true, feedback: "ok" },
  { id: "b", label: "B", correct: false, feedback: "no" },
];
const d: Diagnostic = {
  topics: [
    { id: "dot", label: "Dot product", refresher: "em1.math.vectors" },
    { id: "sph", label: "Spherical coords", refresher: "em1.math.surface-integrals" },
    { id: "coul", label: "Coulomb", refresher: null },
  ],
  items: [
    { id: "dot-core", topic: "dot", role: "core", prompt: "p", options: opt },
    { id: "dot-probe", topic: "dot", role: "probe", prompt: "p", options: opt },
    { id: "sph-core", topic: "sph", role: "core", prompt: "p", options: opt },
    { id: "sph-probe", topic: "sph", role: "probe", prompt: "p", options: opt },
    { id: "coul-core", topic: "coul", role: "core", prompt: "p", options: opt },
    { id: "coul-probe", topic: "coul", role: "probe", prompt: "p", options: opt },
  ],
};

describe("diagnostic", () => {
  it("asks core first, probes only after a miss, then moves on", () => {
    expect(nextDiagnosticItem(d, {})!.id).toBe("dot-core");
    expect(nextDiagnosticItem(d, { "dot-core": true })!.id).toBe("sph-core");
    expect(nextDiagnosticItem(d, { "dot-core": true, "sph-core": false })!.id).toBe("sph-probe");
    const done = { "dot-core": true, "sph-core": false, "sph-probe": true, "coul-core": false, "coul-probe": false };
    expect(nextDiagnosticItem(d, done)).toBeNull();
  });
  it("routes refreshers for partial/gap topics only", () => {
    const answers = { "dot-core": true, "sph-core": false, "sph-probe": true, "coul-core": false, "coul-probe": false };
    expect(diagnosticRoute(d, answers)).toEqual({
      results: { dot: "ready", sph: "partial", coul: "gap" },
      route: ["em1.math.surface-integrals"],
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/diagnostic.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** — `app/packages/engine/src/diagnostic.ts`
```ts
import type { Diagnostic, DiagnosticItem } from "./schema/diagnostic";

export type DiagnosticAnswers = Record<string, boolean>;
type Result = "ready" | "partial" | "gap";

const item = (d: Diagnostic, topic: string, role: "core" | "probe") =>
  d.items.find((i) => i.topic === topic && i.role === role);

export function nextDiagnosticItem(d: Diagnostic, answers: DiagnosticAnswers): DiagnosticItem | null {
  for (const t of d.topics) {
    const core = item(d, t.id, "core");
    if (!core) continue;
    if (!(core.id in answers)) return core;
    const probe = item(d, t.id, "probe");
    if (!answers[core.id] && probe && !(probe.id in answers)) return probe;
  }
  return null;
}

export function topicResult(d: Diagnostic, topicId: string, answers: DiagnosticAnswers): Result {
  const core = item(d, topicId, "core");
  if (core && answers[core.id]) return "ready";
  const probe = item(d, topicId, "probe");
  return probe && answers[probe.id] ? "partial" : "gap";
}

export function diagnosticRoute(d: Diagnostic, answers: DiagnosticAnswers): { results: Record<string, Result>; route: string[] } {
  const results: Record<string, Result> = {};
  const route: string[] = [];
  for (const t of d.topics) {
    const r = topicResult(d, t.id, answers);
    results[t.id] = r;
    if (r !== "ready" && t.refresher && !route.includes(t.refresher)) route.push(t.refresher);
  }
  return { results, route };
}
```

Append to `app/packages/engine/src/index.ts`:
```ts
export * from "./diagnostic";
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run packages/engine/test/diagnostic.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add app/packages/engine
git commit -m "feat(engine): adaptive readiness diagnostic and refresher routing"
```

---

### Task 12: Prerequisite graph + course lint

**Files:**
- Create: `app/packages/engine/src/walk.ts`, `app/packages/engine/src/graph.ts`, `app/packages/engine/src/lint.ts`
- Modify: `app/packages/engine/src/index.ts`
- Test: `app/packages/engine/test/lint.test.ts`

**Interfaces:**
- Consumes: `Course`, `Concept`, `Block` (Task 6); `toSI` (Task 5); `LearnerState` (Task 9); `overallMastery` (Task 8).
- Produces:
  - `walkBlocks(blocks: readonly Block[], visit: (b: Block) => void): void` — depth-first, includes branch option blocks, checkpoint items, retrieval items
  - `topoOrder(course: Course): string[]` — throws `Error("cycle: …")` on cycles
  - `unmetPrerequisites(course: Course, conceptId: string, state: LearnerState): { conceptId: string; minMastery: number; current: number }[]`
  - `type LintIssue = { conceptId?: string; blockId?: string; message: string }`
  - `lintCourse(course: Course): LintIssue[]` — empty array = clean

- [ ] **Step 1: Write the failing test** — `app/packages/engine/test/lint.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { Course, initialState, lintCourse, topoOrder, unmetPrerequisites, emptyProgress } from "../src";

const meta = { mood: "quiet", source: { doc: "d", locator: "p1" }, licence: "original" } as const;
const concept = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  title: id,
  unit: 2,
  objectives: ["o"],
  prerequisites: [],
  misconceptions: [],
  examLinks: [],
  sources: [],
  status: "draft",
  lessons: [{ id: "main", title: "t", minutes: 5, blocks: [{ ...meta, id: "p", type: "prose", text: "x" }] }],
  rules: [],
  ...extra,
});
const course = (concepts: unknown[]) =>
  Course.parse({ id: "em1", code: "ELE3001", title: "EM1", examDate: "2026-12-15", units: [], concepts });

describe("graph", () => {
  it("orders prerequisites before dependants and detects cycles", () => {
    const c = course([
      concept("em1.a.gauss", { prerequisites: [{ conceptId: "em1.a.flux", minMastery: 0.6 }] }),
      concept("em1.a.flux"),
    ]);
    expect(topoOrder(c)).toEqual(["em1.a.flux", "em1.a.gauss"]);
    const cyc = course([
      concept("em1.a.x", { prerequisites: [{ conceptId: "em1.a.y", minMastery: 0.5 }] }),
      concept("em1.a.y", { prerequisites: [{ conceptId: "em1.a.x", minMastery: 0.5 }] }),
    ]);
    expect(() => topoOrder(cyc)).toThrow(/cycle/);
  });
  it("reports unmet prerequisites from learner mastery", () => {
    const c = course([
      concept("em1.a.gauss", { prerequisites: [{ conceptId: "em1.a.flux", minMastery: 0.6 }] }),
      concept("em1.a.flux"),
    ]);
    const s = initialState();
    s.concepts["em1.a.flux"] = { ...emptyProgress(), dimensions: { conceptual: 1, computational: 1, recognition: 0, independent: 0, application: 0 } };
    expect(unmetPrerequisites(c, "em1.a.gauss", s)).toEqual([{ conceptId: "em1.a.flux", minMastery: 0.6, current: 0.4 }]);
  });
});

describe("lintCourse", () => {
  it("passes a clean course", () => {
    expect(lintCourse(course([concept("em1.a.flux")]))).toEqual([]);
  });
  it("catches the structural problems the spec lists", () => {
    const bad = course([
      concept("em1.a.gauss", {
        prerequisites: [{ conceptId: "em1.a.missing", minMastery: 0.5 }],
        misconceptions: [{ tag: "FLUX_SCALES_WITH_AREA", description: "d", remediation: "em1.a.gauss/nope" }],
        rules: [{ id: "r", when: { type: "tagCount", tag: "UNDECLARED", gte: 2 }, then: [{ type: "offerSkip" }] }],
        lessons: [
          {
            id: "main",
            title: "t",
            minutes: 5,
            blocks: [
              { ...meta, id: "dup", type: "prose", text: "x" },
              { ...meta, id: "dup", type: "prose", text: "y" },
              {
                ...meta, id: "m", type: "mcq", prompt: "?", dimension: "conceptual",
                options: [
                  { id: "a", label: "A", correct: false, feedback: "f", tag: "NOT_DECLARED" },
                  { id: "b", label: "B", correct: false, feedback: "f" },
                ],
              },
              { ...meta, id: "o", type: "order", prompt: "?", dimension: "conceptual", items: [{ id: "x", label: "X" }, { id: "y", label: "Y" }], correctOrder: ["x", "z"], feedback: "f" },
              { ...meta, id: "n", type: "numeric", prompt: "?", dimension: "computational", answer: { value: 1, unit: "furlong" } },
            ],
          },
        ],
      }),
    ]);
    const msgs = lintCourse(bad).map((i) => i.message);
    expect(msgs).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/prerequisite em1\.a\.missing does not exist/),
        expect.stringMatching(/remediation em1\.a\.gauss\/nope does not resolve/),
        expect.stringMatching(/rule r uses undeclared tag UNDECLARED/),
        expect.stringMatching(/duplicate block id dup/),
        expect.stringMatching(/tag NOT_DECLARED is not declared/),
        expect.stringMatching(/mcq m has no correct option/),
        expect.stringMatching(/order o: correctOrder must be a permutation of item ids/),
        expect.stringMatching(/unit "furlong"/),
      ]),
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/lint.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement walk** — `app/packages/engine/src/walk.ts`
```ts
import type { Block } from "./schema/blocks";

export function walkBlocks(blocks: readonly Block[], visit: (b: Block) => void): void {
  for (const b of blocks) {
    visit(b);
    if (b.type === "branch") for (const o of b.options) walkBlocks(o.blocks, visit);
    if (b.type === "checkpoint") walkBlocks(b.items, visit);
    if (b.type === "retrieval") walkBlocks([b.item], visit);
  }
}
```

- [ ] **Step 4: Implement graph** — `app/packages/engine/src/graph.ts`
```ts
import type { LearnerState } from "./learner-state";
import { overallMastery } from "./mastery";
import type { Course } from "./schema/course";

export function topoOrder(course: Course): string[] {
  const byId = new Map(course.concepts.map((c) => [c.id, c]));
  const out: string[] = [];
  const mark = new Map<string, "visiting" | "done">();
  const visit = (id: string, path: string[]) => {
    const m = mark.get(id);
    if (m === "done") return;
    if (m === "visiting") throw new Error(`cycle: ${[...path, id].join(" -> ")}`);
    mark.set(id, "visiting");
    for (const p of byId.get(id)?.prerequisites ?? []) if (byId.has(p.conceptId)) visit(p.conceptId, [...path, id]);
    mark.set(id, "done");
    out.push(id);
  };
  for (const c of course.concepts) visit(c.id, []);
  return out;
}

export function unmetPrerequisites(course: Course, conceptId: string, state: LearnerState) {
  const concept = course.concepts.find((c) => c.id === conceptId);
  if (!concept) throw new Error(`Unknown concept: ${conceptId}`);
  return concept.prerequisites
    .map((p) => {
      const prog = state.concepts[p.conceptId];
      return { conceptId: p.conceptId, minMastery: p.minMastery, current: prog ? overallMastery(prog.dimensions) : 0 };
    })
    .filter((p) => p.current < p.minMastery);
}
```

- [ ] **Step 5: Implement lint** — `app/packages/engine/src/lint.ts`
```ts
import { topoOrder } from "./graph";
import { toSI } from "./quantities";
import type { Block } from "./schema/blocks";
import type { AuthoredQuantity } from "./schema/common";
import type { Course } from "./schema/course";
import { walkBlocks } from "./walk";

export type LintIssue = { conceptId?: string; blockId?: string; message: string };

function resolves(course: Course, ref: string): boolean {
  const [conceptId, lessonId] = ref.split("/");
  const c = course.concepts.find((x) => x.id === conceptId);
  return !!c && c.lessons.some((l) => l.id === lessonId);
}

function tagsIn(b: Block): string[] {
  const choiceTags = (opts: { tag?: string }[]) => opts.flatMap((o) => (o.tag ? [o.tag] : []));
  switch (b.type) {
    case "mcq":
      return [...choiceTags(b.options), ...choiceTags(b.selfExplain?.options ?? [])];
    case "predict":
      return choiceTags(b.options);
    case "identify":
      return choiceTags(b.targets);
    case "numeric":
    case "challenge":
      return choiceTags(b.distractors);
    case "step-solve":
      return b.steps.flatMap((s) => choiceTags(s.distractors));
    case "remediate":
      return [b.tag];
    default:
      return [];
  }
}

function quantitiesIn(b: Block): AuthoredQuantity[] {
  if (b.type === "numeric" || b.type === "challenge") return [b.answer, ...b.distractors];
  if (b.type === "step-solve") return b.steps.flatMap((s) => [s.answer, ...s.distractors]);
  return [];
}

export function lintCourse(course: Course): LintIssue[] {
  const issues: LintIssue[] = [];
  const ids = new Set(course.concepts.map((c) => c.id));
  try {
    topoOrder(course);
  } catch (e) {
    issues.push({ message: (e as Error).message });
  }

  for (const c of course.concepts) {
    const add = (message: string, blockId?: string) => issues.push({ conceptId: c.id, ...(blockId ? { blockId } : {}), message });
    const declared = new Set(c.misconceptions.map((m) => m.tag));

    for (const p of c.prerequisites) if (!ids.has(p.conceptId)) add(`prerequisite ${p.conceptId} does not exist`);
    for (const m of c.misconceptions) if (!resolves(course, m.remediation)) add(`remediation ${m.remediation} does not resolve`);
    for (const r of c.rules) {
      if (r.when.type === "tagCount" && !declared.has(r.when.tag)) add(`rule ${r.id} uses undeclared tag ${r.when.tag}`);
      for (const eff of r.then) {
        if (eff.type === "offerRemediation" && !resolves(course, eff.lessonRef)) add(`rule ${r.id} lessonRef ${eff.lessonRef} does not resolve`);
      }
    }

    const seen = new Set<string>();
    for (const lesson of c.lessons) {
      walkBlocks(lesson.blocks, (b) => {
        if (seen.has(b.id)) add(`duplicate block id ${b.id}`, b.id);
        seen.add(b.id);
        for (const t of tagsIn(b)) if (!declared.has(t)) add(`tag ${t} is not declared in misconceptions`, b.id);
        if ((b.type === "mcq" || b.type === "predict") && !b.options.some((o) => o.correct)) add(`${b.type} ${b.id} has no correct option`, b.id);
        if (b.type === "identify" && !b.targets.some((o) => o.correct)) add(`identify ${b.id} has no correct target`, b.id);
        if (b.type === "order") {
          const itemIds = [...b.items.map((i) => i.id)].sort().join();
          if ([...b.correctOrder].sort().join() !== itemIds) add(`order ${b.id}: correctOrder must be a permutation of item ids`, b.id);
        }
        if (b.type === "remediate" && !resolves(course, b.lessonRef)) add(`remediate ${b.id} lessonRef ${b.lessonRef} does not resolve`, b.id);
        const qs = quantitiesIn(b);
        const dims = new Set<string>();
        for (const q of qs) {
          try {
            dims.add(toSI(q.value, q.unit).dim);
          } catch {
            add(`unit "${q.unit}" cannot be parsed`, b.id);
          }
        }
        if (dims.size > 1) add(`answer and distractors have mixed dimensions in ${b.id}`, b.id);
      });
    }
  }
  return issues;
}
```

Append to `app/packages/engine/src/index.ts`:
```ts
export * from "./walk";
export * from "./graph";
export * from "./lint";
```

- [ ] **Step 6: Run full suite + typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: all physics + engine tests PASS; `tsc` exits 0.

- [ ] **Step 7: Commit**
```bash
git add app/packages/engine
git commit -m "feat(engine): prerequisite graph, block walker and structural course lint"
```

---

## Self-Review Notes

- Spec coverage for this plan's scope: §2 packages `engine`/`physics` (Tasks 1–12); §3.1 objects (Task 6); §3.2 block types — all 17 schema types incl. `sim-2d` (Task 6); §3.3 rules (Tasks 6, 10); §3.4 answer checking (Tasks 5, 7); §3.5 mastery + retention (Tasks 8, 10); §3.6 LearnerState + migration (Task 9); §4 piece 2 diagnostic logic (Task 11); §6.4 simulation verification + structural lint (Tasks 4, 12). UI, 3D, content, and journey screens are Plans 2–5.
- Error classes include `notation` (spec §3.4 updated to match).
- `attemptsFailed` rules with `once: false` fire every `gte`-th failure on the same block (3rd, 6th, …).
