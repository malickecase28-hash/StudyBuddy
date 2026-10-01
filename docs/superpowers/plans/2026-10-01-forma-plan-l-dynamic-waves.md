# Forma Plan L: Dynamic Fields and Plane Waves at Full Depth (Wave 6c)

> **For agentic workers (Codex):** read `AGENTS.md` first. **Plans F1–K must be complete.** Transcribe the content exactly. Every value was solved independently in Python (`scratchpad/l_solve.py`; outputs in the Self-Review Notes) and cross-checked against the textbooks' printed answers: Hayt D9.3, D11.1, D11.3 and D11.4; Wentworth Examples 4.1, 5.1, 5.3, 5.4, 5.6 and 5.7.
>
> **Workflow rule (user, 2026-10-01): add no new test files and no new test cases.** The plates' claims are the tests. The only test edit allowed is adding this plan's two concept ids to the existing coverage loop.

**Spec:** `docs/superpowers/specs/2026-10-01-forma-emag-magnetostatics-dynamics-design.md`

**Goal:** seven in-depth ideas across two concepts.
- `em1.dynamic.faraday`, "Faraday's law and Maxwell's equations" (unlocked):
  - ⑨ Faraday's law
  - ⑩ Displacement current
  - ⑪ Maxwell's equations
- `em1.waves.plane-waves`, "Plane waves and power" (unlocked):
  - ⑫ Reading a TEM wave
  - ⑬ Lossy media
  - ⑭ Dielectrics versus conductors; skin depth
  - ⑮ Poynting's theorem and power

**Textbook spine:**
- Wentworth Ch. 4: 4.1 continuity; 4.2 wave fundamentals; 4.3 Faraday and transformer emf; 4.4 motional emf; 4.5 displacement current; 4.6 Maxwell's equations; 4.7 lossless TEM waves; 4.8 phasors.
- Wentworth Ch. 5: 5.1 wave equations; 5.2 lossless media; 5.3 dielectrics; 5.4 conductors; 5.5 Poynting.
- Hayt Ch. 9 and 11 drills.

**Sources (catalog ids):**
- `hw04-2425`: 4.1–4.3.
- Finals: `f2425` Q4(c); `f2324` Q3(a), Q4(b), Q4(c); `f2425r` Q4; `f1516` Q4(a).
- `drill24` Q8; the module's "Maxwell's Equations Explained" handout (`02_Lecture_Slides`).
- Textbook item ids: `text:went-ex4.1`, `text:went-p4.9`, `text:hayt-d11.3` and so on.

**Ledger:** `.superpowers/sdd/2026-10-01-forma-plan-l-dynamic-waves/progress.md`

## Global Constraints

- Same as Plans I and K.
- **Hz is linted** (`[kMGT]?Hz`). Every frequency quoted in a note, line, problem, trap or ask must be backed by an `f` quotable in Hz on a visible instance (`plane-wave` and `emf-loop` both declare one), or by a step `given` when the plate can't show it.
- **m and V/m are linted.** Wavelengths and depths in m are backed by `lambda` and `delta`, and field values in V/m by `Ewave` and `Eamp`. Write µm, cm and km freely; they are not linted.
- Not linted: V, A, Ω, Np/m, rad/m, m/s, W/m², °, s, rev/s and µA.
- **The wave convention:** E(z, t) = E₀e^(−αz) cos(ωt − βz + φ), travelling in +z, with H = (E₀/|η|)e^(−αz) cos(ωt − βz + φ − θη) in the direction a_E × a_H = a_z.
- c is 1/√(μ₀ε₀) = 2.998 × 10⁸ m/s from the package constants. Papers write "3 × 10⁸"; where that changes the fourth figure, the text says so.

## Review Focus

1. **The lossless limit is exact.** With σ = 0, α must be exactly 0 (the complex square root with r = |a| gives 0, not 1e-9), θη = 0, and `delta` is omitted. Claims such as α = 0 depend on this.
2. **Branch of the square root.** Every passive medium has α ≥ 0, β > 0 and 0 ≤ θη ≤ 45°. Copper at 1 GHz gives θη = 45.000°.
3. **Units of `f`.** Every component that shows a frequency carries `f` as a quotable in Hz, so "100 MHz" and "1 GHz" lint against it.
4. **Signs.** Faraday's emf carries Lenz's minus sign: emf = −N dΦ/dt. `emf-loop` reports the signed emf, plus the size of the current when R is given.
5. **Time tweens.** `plane-wave`'s `t` and `z` tween between steps, so the drawn wave moves. Every mid-transition frame must evaluate, as `validatePlate` already checks.

---

### Task 1: Units, physics

**Files:**
- Modify: `app/packages/engine/src/quantities.ts`
- Create: `app/packages/physics/src/waves.ts`
- Modify: `app/packages/physics/src/index.ts`

- [ ] **Step 1: Units.** Add to `BASE`: `"Np/m": "Np/m", "rad/m": "rad/m", "m/s": "m/s", "W/m^2": "W/m^2", "rad/s": "rad/s"`. If "m/s" collides with the prefix logic (m + "/s"), `BASE` is checked first, so it resolves exactly.

- [ ] **Step 2: `waves.ts`**

```ts
import { EPS0, MU0 } from "./constants";

/** Principal square root of a + jb, real part ≥ 0. */
export const csqrt = (a: number, b: number): [number, number] => {
  const r = Math.hypot(a, b);
  return [Math.sqrt((r + a) / 2), (b < 0 ? -1 : 1) * Math.sqrt((r - a) / 2)];
};

export type WaveMedium = { f: number; er?: number; mur?: number; sigma?: number };
/**
 * Uniform plane wave: γ = √(jωμ(σ + jωε)) = α + jβ and η = √(jωμ/(σ + jωε)) = |η|∠θη.
 * Exact for σ = 0: α = 0 and θη = 0.
 */
export function planeWave({ f, er = 1, mur = 1, sigma = 0 }: WaveMedium) {
  const w = 2 * Math.PI * f, eps = er * EPS0, mu = mur * MU0;
  const [alpha, beta] = csqrt(-w * w * mu * eps, w * mu * sigma);
  const den = sigma * sigma + (w * eps) ** 2;
  const [nr, ni] = csqrt((w * mu * w * eps) / den, (w * mu * sigma) / den);
  return { omega: w, alpha, beta, eta: Math.hypot(nr, ni), thetaEta: (Math.atan2(ni, nr) * 180) / Math.PI, lossTan: sigma / (w * eps), lambda: (2 * Math.PI) / beta, u: w / beta };
}
```

Export it from `index.ts`. (`MU0` was added by Plan K.)

- [ ] **Step 3: Run** `pnpm test && pnpm typecheck`. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages && git commit -m "feat(physics): plane waves in any linear medium (γ, η, loss tangent); wave units

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 2: Components and views

**Files:**
- Modify: `app/packages/plate/src/components/media.ts` (`emf-loop`, `plane-wave`)
- Modify: `views3d.tsx`, `viewsMath.tsx`, `views2d.tsx`, `Readouts.tsx`

- [ ] **Step 1: `emf-loop`**

```ts
export const EmfLoop = defineComponent({
  id: "emf-loop",
  params: z.object({
    mode: z.enum(["ramp", "transformer", "rod"]),
    N: z.number().positive().default(1), S: z.number().positive().default(0.01),
    /** ramp: dB/dt in T/s. */ rate: z.number().default(0),
    /** transformer: B = B0 sin(2πft). */ B0: z.number().default(0), f: z.number().positive().default(50), t: z.number().default(0),
    /** rod: a bar of length `length` spinning about one end at `rps` revolutions per second in B. */ B: z.number().default(0), length: z.number().positive().default(0.1), rps: z.number().default(0),
    R: z.number().positive().optional(),
  }),
  model: (p) => {
    let emf: number, extra: Record<string, number> = {};
    if (p.mode === "ramp") emf = -p.N * p.rate * p.S;
    else if (p.mode === "transformer") {
      const w = 2 * Math.PI * p.f;
      emf = -p.N * w * p.B0 * p.S * Math.cos(w * p.t);
      extra = { Phi: p.B0 * p.S * Math.sin(w * p.t), emfPeak: p.N * w * p.B0 * p.S, f: p.f };
    } else emf = 0.5 * p.B * (2 * Math.PI * p.rps) * p.length * p.length;
    return { emf, ...extra, ...(p.R ? { I: Math.abs(emf) / p.R } : {}), S: p.S };
  },
  handles: [],
  readouts: { emf: "V", emfPeak: "V", Phi: "Wb", I: "A" },
  quotable: { emf: "V", emfPeak: "V", Phi: "Wb", I: "A", f: "Hz", S: "m^2" },
});
```

The rod's emf is ½Bωℓ² (Wentworth Problem 4.21). Its sign is taken as positive at the free end, for B along +z and counter-clockwise rotation.

- [ ] **Step 2: `plane-wave`**

```ts
export const PlaneWave = defineComponent({
  id: "plane-wave",
  params: z.object({
    f: z.number().positive(), er: z.number().positive().default(1), mur: z.number().positive().default(1), sigma: z.number().min(0).default(0),
    E0: z.number().positive().default(1), phi: z.number().default(0), z: z.number().default(0), t: z.number().default(0),
    /** Drawing only: plate units per wavelength. */ drawScale: z.number().positive().default(1),
  }),
  model: (p) => {
    const w = planeWave({ f: p.f, er: p.er, mur: p.mur, sigma: p.sigma });
    const ph = w.omega * p.t - w.beta * p.z + (p.phi * Math.PI) / 180;
    const env = Math.exp(-w.alpha * p.z);
    const th = (w.thetaEta * Math.PI) / 180;
    return {
      alpha: w.alpha, beta: w.beta, lambda: w.lambda, u: w.u, eta: w.eta, thetaEta: w.thetaEta, lossTan: w.lossTan,
      ...(w.alpha > 0 ? { delta: 1 / w.alpha } : {}),
      Eamp: p.E0 * env, Ewave: p.E0 * env * Math.cos(ph), Hwave: (p.E0 / w.eta) * env * Math.cos(ph - th),
      Pave: ((p.E0 * p.E0) / (2 * w.eta)) * env * env * Math.cos(th),
      f: p.f,
    };
  },
  handles: [],
  readouts: { alpha: "Np/m", beta: "rad/m", lambda: "m", u: "m/s", eta: "Ω", thetaEta: "°", lossTan: "", delta: "m", Eamp: "V/m", Ewave: "V/m", Hwave: "A/m", Pave: "W/m^2" },
  quotable: { alpha: "Np/m", beta: "rad/m", lambda: "m", u: "m/s", eta: "Ω", thetaEta: "°", lossTan: "", delta: "m", Eamp: "V/m", Ewave: "V/m", Hwave: "A/m", Pave: "W/m^2", f: "Hz" },
});

export const mediaComponents = [Boundary, Capacitor, Currents, MagBoundary, Inductor, EmfLoop, PlaneWave];
```

Replace the `mediaComponents` line with that last line.

- [ ] **Step 3: Views.**
  - **`PlaneWaveView`** (views3d). Physical z runs along plate y, drawn over two wavelengths as 0 ≤ y ≤ 2 × drawScale.
    - Sample 96 points s ∈ [0, 2λ].
    - The E curve is in plate z (vertical), at amplitude 0.8 × e^(−αs)/e^(−αz₀) × cos(ωt − βs + φ). Draw it as a polyline in `var(--field)`, labelled "E".
    - The H curve is in plate x (the oblique axis), at amplitude 0.8 × e^(−αs) × cos(ωt − βs + φ − θη). Draw it in `var(--flux)`, labelled "H".
    - When α > 0, draw dashed envelope curves ±0.8e^(−αs) in `var(--graphite)`.
    - Draw a thin vertical tick at s = z (the probe), and an arrow along +y labelled "travel".
    - Project every point with `toSvg3([x, y, z])`.
    - `aria-label`: `Plane wave, f = ${f.toPrecision(3)} Hz, wavelength ${lambda.toPrecision(3)} m${alpha > 0 ? ", decaying" : ""}`.
  - **`EmfLoopView`** (viewsMath), a schematic:
    - `ramp` and `transformer`: a square loop (side 1.6) with N noted, a 3 × 3 grid of "⊙" B markers whose size follows B(t) (transformer) or a fixed size (ramp), and a curved arrow showing the induced current's sense: clockwise when emf < 0 seen from +z.
    - `rod`: a bar from the origin at angle 2π × rps × 0.1 (fixed, for the picture), a circular dashed path, and ⊙ markers.
    - `aria-label`: `Faraday loop, ${mode}, emf ${emf.toPrecision(3)} V`.
  - Register `"emf-loop"` and `"plane-wave"` in `views2d.tsx`.

- [ ] **Step 4: Labels.**
  - `LABEL`:
    - `emf: "emf"`, `emfPeak: "Peak emf"`, `Phi: "Flux Φ"`
    - `alpha: "α"`, `beta: "β"`, `lambda: "λ"`, `u: "Phase velocity u"`, `eta: "|η|"`, `thetaEta: "θη"`, `lossTan: "Loss tangent σ/ωε"`, `delta: "Skin depth δ"`
    - `Eamp: "E amplitude here"`, `Ewave: "E(z, t)"`, `Hwave: "H(z, t)"`, `Pave: "Average power density"`
  - `I` is already labelled. For `emf-loop`, override it to "Induced current".
  - `TONE`: `Ewave: "field", Eamp: "field", Hwave: "flux", Pave: "charge", emf: "charge"`.

- [ ] **Step 5: Run** `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages apps/web && git commit -m "feat(plate): Faraday loop and plane-wave components with views

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 3: Templates

**Files:** `app/packages/course-em1/src/templates.ts` (append five). If the 50-seed template test lists ids explicitly, append these to its list.

- [ ] **Step 1: Implement.**

```ts
const DYN = "em1.dynamic.faraday";
const WAV = "em1.waves.plane-waves";
const C0 = 1 / Math.sqrt(4e-7 * Math.PI * EPS0);
const ETA0 = Math.sqrt((4e-7 * Math.PI) / EPS0);

const emfPeak = defineTemplate<{ N: number; s: number; B0: number; f: number }>({
  id: "emf-peak",
  params: { N: { min: 10, max: 200, step: 10 }, s: { min: 5, max: 20, step: 5 }, B0: { min: 10, max: 100, step: 10 }, f: { min: 50, max: 60, step: 10 } },
  prompt: (p) => `A ${p.N}-turn square coil of side ${p.s} cm lies normal to B = ${p.B0} sin(2π × ${p.f}t) mT. Find the peak induced emf, in V.`,
  solve: (p) => {
    const S = (p.s / 100) ** 2, w = 2 * Math.PI * p.f;
    return {
      answer: { value: sig(p.N * w * p.B0 * 1e-3 * S), unit: "V" },
      distractors: [{ value: sig(p.N * p.B0 * 1e-3 * S), unit: "V", errorClass: "conceptual", tag: "EMF_RATE", feedback: "That's NΦ, the flux linkage. The emf is its rate of change, which brings in ω." }],
    };
  },
  hints: () => ["emf = −N dΦ/dt, with Φ = B₀S sin ωt.", "Peak emf = NωB₀S.", "ω = 2πf; S in m²."],
  worked: (p) => [{ text: `S = (${p.s / 100})² m²; peak emf = ${p.N} × 2π × ${p.f} × ${p.B0} × 10⁻³ × S = ${sig(p.N * 2 * Math.PI * p.f * p.B0 * 1e-3 * (p.s / 100) ** 2)} V.` }],
  dimension: "computational",
  tags: { concepts: [DYN], misconceptions: ["EMF_RATE"], difficulty: 1 },
});

const lossTangent = defineTemplate<{ sig: number; er: number; f: number }>({
  id: "loss-tangent",
  params: { sig: { min: 0.5, max: 5, step: 0.5 }, er: { min: 5, max: 80, step: 5 }, f: { min: 1, max: 100, step: 1 } },
  prompt: (p) => `A medium has σ = ${p.sig} S/m and εr = ${p.er}. Find the ratio of conduction to displacement current density, σ/(ωε), at ${p.f} MHz.`,
  solve: (p) => {
    const lt = p.sig / (2 * Math.PI * p.f * 1e6 * p.er * EPS0);
    return {
      answer: { value: sig(lt), unit: "" },
      distractors: [{ value: sig(lt * 2 * Math.PI), unit: "", errorClass: "conceptual", tag: "LOSS_TAN", feedback: "That uses f, not ω = 2πf." }],
    };
  },
  hints: () => ["|Jc|/|Jd| = σ/(ωε).", "ω = 2π × f in Hz.", "ε = εr × 8.854 × 10⁻¹²."],
  worked: (p) => [{ text: `σ/(ωε) = ${p.sig}/(2π × ${p.f} × 10⁶ × ${p.er} × 8.854 × 10⁻¹²) = ${sig(p.sig / (2 * Math.PI * p.f * 1e6 * p.er * EPS0))}.` }],
  dimension: "computational",
  tags: { concepts: [DYN], misconceptions: ["LOSS_TAN"], difficulty: 1 },
});

const waveLambda = defineTemplate<{ f: number; er: number }>({
  id: "wave-lambda",
  params: { f: { min: 10, max: 1000, step: 10 }, er: { min: 2, max: 9, step: 1 } },
  prompt: (p) => `A ${p.f} MHz plane wave travels in a lossless nonmagnetic medium with εr = ${p.er}. Find its wavelength, in m.`,
  solve: (p) => ({
    answer: { value: sig(C0 / Math.sqrt(p.er) / (p.f * 1e6)), unit: "m" },
    distractors: [{ value: sig(C0 / (p.f * 1e6)), unit: "m", errorClass: "conceptual", tag: "WAVE_MEDIUM", feedback: "That's the free-space wavelength. In the medium, u = c/√εr, so λ shrinks by √εr." }],
  }),
  hints: () => ["u = c/√εr.", "λ = u/f.", "c = 2.998 × 10⁸ m/s."],
  worked: (p) => [{ text: `u = ${sig(C0)}/√${p.er} = ${sig(C0 / Math.sqrt(p.er))} m/s; λ = u/f = ${sig(C0 / Math.sqrt(p.er) / (p.f * 1e6))} m.` }],
  dimension: "computational",
  tags: { concepts: [WAV], misconceptions: ["WAVE_MEDIUM"], difficulty: 1 },
});

const skinDepth = defineTemplate<{ f: number }>({
  id: "skin-depth",
  params: { f: { min: 1, max: 100, step: 1 } },
  prompt: (p) => `Find the skin depth in copper (σ = 5.8 × 10⁷ S/m, μr = 1) at ${p.f} MHz, in µm.`,
  solve: (p) => {
    const k = Math.PI * p.f * 1e6 * 4e-7 * Math.PI * 5.8e7;
    return {
      answer: { value: sig(1 / Math.sqrt(k) / 1e-6), unit: "µm" },
      distractors: [{ value: sig(1 / k / 1e-6), unit: "µm", errorClass: "arithmetic", tag: "SKIN_DEPTH", feedback: "Missing the square root: δ = 1/√(πfμσ)." }],
    };
  },
  hints: () => ["In a good conductor α = √(πfμσ).", "δ = 1/α.", "f in Hz."],
  worked: (p) => [{ text: `α = √(π × ${p.f} × 10⁶ × 4π × 10⁻⁷ × 5.8 × 10⁷) = ${sig(Math.sqrt(Math.PI * p.f * 1e6 * 4e-7 * Math.PI * 5.8e7))} Np/m; δ = 1/α = ${sig(1 / Math.sqrt(Math.PI * p.f * 1e6 * 4e-7 * Math.PI * 5.8e7) / 1e-6)} µm.` }],
  dimension: "computational",
  tags: { concepts: [WAV], misconceptions: ["SKIN_DEPTH"], difficulty: 2 },
});

const poyntingAvg = defineTemplate<{ E0: number; er: number }>({
  id: "poynting-avg",
  params: { E0: { min: 1, max: 100, step: 1 }, er: { min: 1, max: 9, step: 1 } },
  prompt: (p) => `A plane wave with amplitude ${p.E0} V/m travels in a lossless nonmagnetic medium with εr = ${p.er}. Find its average power density, in W/m².`,
  solve: (p) => {
    const eta = ETA0 / Math.sqrt(p.er);
    return {
      answer: { value: sig((p.E0 * p.E0) / (2 * eta)), unit: "W/m^2" },
      distractors: [{ value: sig((p.E0 * p.E0) / eta), unit: "W/m^2", errorClass: "conceptual", tag: "POYNTING_HALF", feedback: "Missing the ½: the time average of cos² is ½." }],
    };
  },
  hints: () => ["η = 376.7/√εr Ω.", "P_ave = E₀²/(2η).", "The ½ is the average of cos²."],
  worked: (p) => [{ text: `η = 376.7/√${p.er} = ${sig(ETA0 / Math.sqrt(p.er))} Ω; P_ave = ${p.E0}²/(2η) = ${sig((p.E0 * p.E0) / (2 * (ETA0 / Math.sqrt(p.er))))} W/m².` }],
  dimension: "computational",
  tags: { concepts: [WAV], misconceptions: ["POYNTING_HALF"], difficulty: 1 },
});
```

- Append the five to `templates`.
- Check by hand:
  - `emf-peak` with N = 200, 10 cm, 50 mT, 60 Hz gives 37.70 V.
  - `wave-lambda` with 100 MHz and εr = 4 gives 1.499 m.
  - `skin-depth` at 10 MHz gives 20.90 µm.
  - `poynting-avg` with 10 V/m and εr = 4 gives 0.2654 W/m².

- [ ] **Step 2: Run** `pnpm vitest run packages/course-em1 && pnpm typecheck`. Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages && git commit -m "feat(course-em1): templates for induced emf, loss tangent, wavelength, skin depth and average power

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 4: The two concepts

**Files:** Create `app/packages/course-em1/src/concepts/dynamics.ts`.

- [ ] **Step 1: Write the file.**

```ts
import { meta, src } from "../sources";

const WENT4 = "Wentworth, Fundamentals of Electromagnetics with Engineering Applications, Ch. 4";
const WENT5 = "Wentworth, Fundamentals of Electromagnetics with Engineering Applications, Ch. 5";
const MAXH = "UTech ELE3001 handout: Maxwell's Equations Explained (G. D. Boswell)";
const plate = (id: string, ref: string, where: string) => ({ ...meta("vivid", src(ref, where)), id, type: "plate" as const, plateId: id });

const D = "em1.dynamic.faraday";
export const faradayConcept = {
  id: D,
  title: "Faraday's law and Maxwell's equations",
  unit: 4,
  objectives: [
    "State Faraday's law and find induced emf: transformer emf −N dΦ/dt and motional emf; prove the point form ∇ × E = −∂B/∂t with Stokes' theorem.",
    "Explain displacement current, Jd = ∂D/∂t, and compare it with conduction current through σ/(ωε).",
    "State Maxwell's equations in point and integral form, for static and time-varying fields, and explain their significance.",
  ],
  prerequisites: [{ conceptId: "em1.magnetostatics.ampere", minMastery: 0.3 }, { conceptId: "em1.electrostatics.current", minMastery: 0.3 }],
  misconceptions: [
    { tag: "LENZ_SIGN", description: "Drops Lenz's minus sign, or gets the induced current's direction wrong.", remediation: `${D}/main` },
    { tag: "EMF_RATE", description: "Takes the emf from the flux itself rather than its rate of change.", remediation: `${D}/main` },
    { tag: "JD_SOURCE", description: "Thinks displacement current is charge flowing across the gap.", remediation: `${D}/main` },
    { tag: "LOSS_TAN", description: "Uses f instead of ω in σ/(ωε), or inverts the ratio.", remediation: `${D}/main` },
    { tag: "MAXWELL_STATIC", description: "Writes ∇ × E = 0 or ∇ × H = J for time-varying fields.", remediation: `${D}/main` },
  ],
  examLinks: [
    { paper: "UTech ELE3001 Finals 2024-25 Sem 1 (resit)", question: "Q4(a)", marks: 8, weight: 1 },
    { paper: "UTech ELE3001 Finals 2015-16 Sem 1", question: "Q4(a)", marks: 4, weight: 1 },
  ],
  sources: [src(WENT4, "§4.3–4.6"), src(MAXH, "the four equations")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Faraday and Maxwell (in depth)",
      minutes: 60,
      blocks: [plate("idea-faraday", WENT4, "§4.3–4.4"), plate("idea-displacement", WENT4, "§4.5"), plate("idea-maxwell", MAXH, "pp. 1–2; Wentworth §4.6")],
    },
  ],
};

const W = "em1.waves.plane-waves";
export const wavesConcept = {
  id: W,
  title: "Plane waves and power",
  unit: 5,
  objectives: [
    "Read a TEM wave E₀e^(−αz) cos(ωt − βz + φ) for ω, β, λ, u and α, and find H through η; in lossless media β = ω√(με) and η = √(μ/ε).",
    "Find α, β and η in a lossy medium from γ = √(jωμ(σ + jωε)), using the loss tangent.",
    "Compare propagation in good dielectrics and good conductors, and find the skin depth δ = 1/α.",
    "State Poynting's theorem and find a wave's average power density.",
  ],
  prerequisites: [{ conceptId: D, minMastery: 0.3 }],
  misconceptions: [
    { tag: "WAVE_BETA_LAMBDA", description: "Confuses β with λ or with ω.", remediation: `${W}/main` },
    { tag: "WAVE_MEDIUM", description: "Uses free-space c, λ or η = 377 Ω inside a material.", remediation: `${W}/main` },
    { tag: "SKIN_DEPTH", description: "Forgets the square root in δ = 1/√(πfμσ), or gives a skin depth in a lossless medium.", remediation: `${W}/main` },
    { tag: "POYNTING_HALF", description: "Drops the ½ in the average Poynting vector.", remediation: `${W}/main` },
  ],
  examLinks: [
    { paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q4(c)", marks: 5, weight: 1 },
    { paper: "UTech ELE3001 Finals 2023-24 Sem 1", question: "Q4(b), Q4(c)", marks: 10, weight: 1 },
  ],
  sources: [src(WENT4, "§4.2, 4.7–4.8"), src(WENT5, "§5.1–5.5")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Plane waves (in depth)",
      minutes: 80,
      blocks: [
        plate("idea-tem-wave", WENT4, "§4.2, 4.7"),
        plate("idea-lossy", WENT5, "§5.1–5.3"),
        plate("idea-conductors", WENT5, "§5.4"),
        plate("idea-poynting", WENT5, "§5.5"),
      ],
    },
  ],
};
```

Each concept is imported into the course in the task that adds its plates (Tasks 5 and 6), each time removing its `locked(…)` line. Nothing is committed in this task.

---
### Task 5: The Faraday concept's three ideas

**Files:**
- Create: `plates/idea-faraday.ts`, `plates/idea-displacement.ts`, `plates/idea-maxwell.ts`
- Modify: `plates/index.ts`, `index.ts` (import `faradayConcept`; remove `locked("em1.dynamic.faraday", …)`)

Each file opens with the Plan K helpers (`R`, `choice`, `eqp`).

- [ ] **Step 1: `plates/idea-faraday.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice, eqp as in Plan K.
const ep = instantiate(templates.find((t) => t.id === "emf-peak")!, 1);
const RAMP = { mode: "ramp" as const, N: 1, S: 0.01, rate: 10, R: 10 };
const TRANS = { mode: "transformer" as const, N: 200, S: 0.01, B0: 0.05, f: 60, t: 0 };
const ROD = { mode: "rod" as const, B: 0.1, length: 0.06, rps: 60 };

export const ideaFaraday = defineIdeaPlate({
  id: "idea-faraday",
  title: "Faraday's law",
  requires: { objectives: [0], items: ["text:went-p4.9", "text:went-ex4.2", "text:went-p4.21", "f2425r-q4a", "hw04-2425-4.1"], misconceptions: ["LENZ_SIGN", "EMF_RATE"] },
  instances: [
    { id: "loop", component: "emf-loop", params: RAMP },
    { id: "eq", component: "equation", params: eqp(R`\text{emf}=-N\dfrac{d\Phi}{dt}`, "emf equals minus N d phi d t") },
  ],
  ideas: [
    {
      id: "faraday",
      title: "Faraday's law",
      objectives: [0],
      explain: [
        {
          id: "law", title: "A changing flux drives an emf", show: ["loop", "eq"], focus: ["loop", "eq"],
          note: "Faraday found that a changing magnetic flux through a loop drives an emf round it: emf = −dΦ/dt, or −N dΦ/dt with N turns. The minus sign is Lenz's law: the induced current flows so as to oppose the change. Wentworth Problem 4.9: B rises at 10 Wb/m² per second through a 10 × 10 cm loop of 10 Ω. The emf is 0.1 V in size and I = 10 mA, circulating clockwise seen from above, to oppose the rising +z flux.",
          claims: [{ instance: "loop", readout: "emf", value: -0.1, unit: "V" }, { instance: "loop", readout: "I", value: 0.01, unit: "A" }],
        },
        {
          id: "transformer", title: "Transformer emf", patch: { loop: TRANS }, focus: ["loop"],
          note: "Let B = B₀ sin ωt instead (Wentworth Example 4.2). Then Φ = B₀S sin ωt and emf = −NωB₀S cos ωt: the emf peaks when B passes through zero, where it changes fastest. On the plate, 200 turns of 0.01 m² in a 50 mT field at 60 Hz give a peak of 37.70 V, and at t = 0 the emf is −37.70 V.",
          claims: [{ instance: "loop", readout: "emfPeak", value: 37.6991, unit: "V" }, { instance: "loop", readout: "emf", value: -37.6991, unit: "V" }],
        },
        {
          id: "motional", title: "Motional emf", patch: { loop: ROD }, focus: ["loop"],
          note: "A conductor moving through a steady B also gets an emf, from the force qu × B on its charges: emf = ∮(u × B)·dL. Wentworth Problem 4.21: a 6.0 cm rod spinning about one end at 60 rev/s in B = 100 mT. A point at radius r moves at ωr, so emf = ∫ωrB dr = ½Bωℓ² = 67.86 mV.",
          claims: [{ instance: "loop", readout: "emf", value: 0.0678584, unit: "V" }],
        },
        {
          id: "point", title: "The point form, via Stokes", patch: { eq: eqp(R`\oint_L\mathbf E\cdot d\mathbf L=-\int_S\dfrac{\partial\mathbf B}{\partial t}\cdot d\mathbf S\ \Rightarrow\ \nabla\times\mathbf E=-\dfrac{\partial\mathbf B}{\partial t}`, "curl E equals minus the rate of change of B") }, focus: ["eq"],
          note: "Write the emf as ∮E·dL and the flux as ∫B·dS. For a fixed loop, ∮E·dL = −∫(∂B/∂t)·dS. Stokes' theorem turns the left side into ∫(∇ × E)·dS, and since this holds for every surface, ∇ × E = −∂B/∂t. A changing B makes a curling E, with no charges needed. In statics this reduces to ∇ × E = 0.",
        },
      ],
      examples: [
        {
          id: "p4.9", level: "basic", title: "Wentworth Problem 4.9: a rising field",
          setup: { loop: RAMP },
          problem: "B increases at 10 Wb/m² per second in the z direction. A 10 × 10 cm square loop centred at the origin in the xy plane has 10 Ω of distributed resistance. Find the size and direction of the induced current.",
          lines: [
            { text: "Φ = BS, so dΦ/dt = 10 × 0.01 = 0.1 Wb/s, and |emf| = 0.1 V.", focus: ["loop"], claims: [{ instance: "loop", readout: "emf", value: -0.1, unit: "V" }] },
            { text: "I = 0.1/10 = 10 mA.", focus: ["loop"], claims: [{ instance: "loop", readout: "I", value: 0.01, unit: "A" }] },
            { text: "Lenz: the current makes its own field along −z to oppose the rising +z flux, so it flows clockwise seen from above.", focus: ["loop"] },
          ],
          covers: ["text:went-p4.9"],
          trap: "Counter-clockwise: that current's field would add to the rising flux, which Lenz's law forbids.",
        },
        {
          id: "transformer", level: "tutorial", title: "Transformer emf in a coil",
          setup: { loop: TRANS },
          problem: "A 200-turn coil of area 0.01 m² lies normal to B = 50 sin(2π × 60t) mT. Find the emf as a function of time, and its peak.",
          lines: [
            { text: "Φ = B₀S sin ωt = 0.05 × 0.01 sin(120πt) = 5 × 10⁻⁴ sin(120πt) Wb.", focus: ["loop"] },
            { text: "emf = −N dΦ/dt = −200 × 120π × 5 × 10⁻⁴ cos(120πt) = −37.70 cos(120πt) V; the peak is 37.70 V.", focus: ["loop", "eq"], claims: [{ instance: "loop", readout: "emfPeak", value: 37.6991, unit: "V" }] },
          ],
          covers: ["text:went-ex4.2"],
          trap: "Answering NΦ = 0.1 Wb as the emf. That's the flux linkage; the emf is its rate of change.",
        },
        {
          id: "resit", level: "exam", title: "Finals 2024-25 resit Q4(a)",
          setup: { loop: TRANS },
          problem: "(i) State, in integral form, Maxwell's equation that embodies Faraday's work. (ii) Deduce two important implications of Faraday's discovery. (iii) Express in point form Maxwell's equation that completes Ampère's circuital law, and name the additional term.",
          lines: [
            { text: "(i) ∮L E·dL = −(d/dt)∫S B·dS: the emf round any closed path equals minus the rate of change of the flux through it.", focus: ["eq"] },
            { text: "(ii) A changing magnetic field creates an electric field with no charges needed, the basis of generators and transformers. And E is no longer conservative when B changes: ∮E·dL ≠ 0.", focus: ["loop"] },
            { text: "(iii) ∇ × H = J + ∂D/∂t. The added term ∂D/∂t is the displacement current density.", focus: ["eq"] },
          ],
          covers: ["f2425r-q4a", "hw04-2425-4.1"],
          trap: "Stating Faraday's law without the minus sign. Lenz's law is part of the law.",
        },
      ],
      asks: [
        { id: "lenz", q: "What does the minus sign in Faraday's law mean?", tags: ["LENZ_SIGN"], a: "Lenz's law: the induced current's own flux opposes the change that caused it. Without the minus sign, a rising flux would drive a current that raised it further: energy from nothing." },
        { id: "rate", q: "Does a strong steady field induce an emf?", tags: ["EMF_RATE"], a: "No. Only a changing flux linkage does: emf = −N dΦ/dt. A huge constant B through a still loop induces nothing." },
        { id: "two", q: "What are the two ways to change the flux?", a: "Change B in time (transformer emf), or move the circuit through B (motional emf). Transformers use the first; generators the second." },
        { id: "transformer", q: "How does a transformer use this?", a: "The primary's alternating current makes an alternating flux in the core, and each secondary turn sees −dΦ/dt. More secondary turns, more volts: V₂/V₁ = N₂/N₁." },
        { id: "source", q: "Where does the electric field come from?", a: "From the changing B itself: ∇ × E = −∂B/∂t. This E curls round; it starts and ends on no charges, so it isn't conservative." },
        { id: "units", q: "What's a volt in magnetic terms?", a: "One weber per second: a flux changing at 1 Wb/s induces 1 V in one turn." },
      ],
      checks: [
        {
          id: "lenz-c", title: "Check: Lenz's law", show: ["loop", "eq"], patch: { loop: RAMP },
          note: "Four checks on Faraday's law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "lenz-c", type: "choose", prompt: "The flux through a loop along +z is increasing. Seen from +z, the induced current flows…", dimension: "application",
            options: [
              choice("cw", "clockwise", true, "Right: its field points along −z, opposing the increase."),
              choice("ccw", "counter-clockwise", false, "That would add to the rising flux.", "LENZ_SIGN"),
              choice("none", "not at all", false, "A changing flux always drives an emf."),
            ] },
        },
        {
          id: "predict-f", title: "Check: a faster field",
          note: "Predict first; then the plate shows the result.",
          patch: { loop: TRANS },
          interaction: { id: "predict-f", type: "predict-drag", prompt: "Double the field's frequency, keeping B₀. Drag the peak emf to your prediction.", target: { instance: "loop", readout: "emfPeak" }, range: [0, 100], unit: "V", relTol: 0.05, reveal: { loop: { f: 120 } }, dimension: "conceptual",
            feedback: { close: "Right: twice as much, 75.40 V. The emf follows dΦ/dt ∝ ω.", far: "Peak emf = NωB₀S ∝ f: 75.40 V." } },
        },
        {
          id: "emf-num", title: "Check: a coil, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "emf-num", type: "numeric", prompt: ep.prompt, answer: ep.spec.answer, distractors: ep.spec.distractors, relTol: ep.spec.relTol, hints: ep.hints, template: "emf-peak", dimension: "computational" },
        },
        {
          id: "steady-c", title: "Check: a steady field",
          note: "Last one.",
          interaction: { id: "steady-c", type: "choose", prompt: "A loop sits still in a constant field of 2 T. The induced emf is…", dimension: "conceptual",
            options: [
              choice("zero", "zero", true, "Right: nothing is changing."),
              choice("two", "2 V", false, "Flux alone induces nothing; only its change does.", "EMF_RATE"),
              choice("area", "proportional to the loop's area", false, "Only if B were changing."),
            ] },
        },
      ],
      recap: {
        points: ["emf = −N dΦ/dt; the minus sign is Lenz's law.", "Transformer emf: −NωB₀S cos ωt. Motional: ∮(u × B)·dL.", "Point form, via Stokes: ∇ × E = −∂B/∂t."],
        traps: ["Losing the minus sign.", "Taking the emf from Φ instead of dΦ/dt.", "∇ × E = 0 when B changes."],
      },
    },
  ],
});
```

Hand checks: ½ × 0.1 × 2π × 60 × 0.06² = 0.0678584 V. At 120 Hz the peak is 75.3982 V.

- [ ] **Step 2: `plates/idea-displacement.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice, eqp as in Plan K.
const lt = instantiate(templates.find((t) => t.id === "loss-tangent")!, 1);
const SEA = { f: 1e6, er: 81, sigma: 4, E0: 1 };

export const ideaDisplacement = defineIdeaPlate({
  id: "idea-displacement",
  title: "Displacement current",
  requires: { objectives: [1], items: ["text:went-p4.27", "text:went-p4.29", "text:went-p4.28", "text:hayt-d9.3"], misconceptions: ["JD_SOURCE", "LOSS_TAN"] },
  instances: [
    { id: "pw", component: "plane-wave", params: SEA },
    { id: "eq", component: "equation", params: eqp(R`\nabla\times\mathbf H=\mathbf J+\dfrac{\partial\mathbf D}{\partial t}`, "curl H equals J plus the rate of change of D") },
  ],
  ideas: [
    {
      id: "displacement",
      title: "Displacement current",
      objectives: [1],
      explain: [
        {
          id: "fix", title: "Ampère's law needs a fix", show: ["pw", "eq"], focus: ["eq"],
          note: "Charge a capacitor. Ampère's law round the wire encloses the current I, but a surface through the gap between the plates encloses no conduction current at all: the same loop gives two answers. Maxwell's fix adds the displacement current density Jd = ∂D/∂t: ∇ × H = J + ∂D/∂t. In the gap, D grows as the plates charge, and ∫(∂D/∂t)·dS equals the wire's current exactly. Charge conservation demands it.",
        },
        {
          id: "sea", title: "Which current wins?", focus: ["pw"],
          note: "The ratio of the two is |Jc|/|Jd| = σ/(ωε), the loss tangent. Seawater (σ = 4 S/m, εr = 81) at 1 MHz has σ/(ωε) = 887.7: conduction current is almost 900 times larger, so at this frequency seawater behaves as a conductor.",
          claims: [{ instance: "pw", readout: "lossTan", value: 887.659, unit: "" }],
        },
        {
          id: "cross", title: "The crossover", patch: { pw: { f: 887.659e6 } }, focus: ["pw"],
          note: "The two are equal when ω = σ/ε, at f = σ/(2πε) = 887.7 MHz for seawater (Wentworth Problem 4.28). Above it, displacement current dominates, and seawater acts more like a lossy dielectric.",
          claims: [{ instance: "pw", readout: "lossTan", value: 1, unit: "" }],
        },
        {
          id: "copper", title: "Copper at 60 Hz", patch: { pw: { f: 60, er: 1, sigma: 5.8e7 } }, focus: ["pw"],
          note: "In copper at 60 Hz, σ/(ωε₀) = 1.738 × 10¹⁶: displacement current is utterly negligible. Hayt D9.3(d): a conduction current density of 1 MA/m² comes with a displacement current density of only 57.6 pA/m². That's why circuit theory can ignore it inside wires.",
          claims: [{ instance: "pw", readout: "lossTan", value: 1.73759e16, unit: "" }],
        },
      ],
      examples: [
        {
          id: "p4.27", level: "basic", title: "Wentworth Problem 4.27: the gap's displacement current",
          setup: { pw: SEA },
          problem: "Plates of area 60 cm² are separated by 2.0 mm of ideal dielectric with εr = 9.0. With v(t) = 1.0 sin(2π × 10³ t) V across them, find the displacement current.",
          lines: [
            { text: "C = εS/d = 9 × 8.854 × 10⁻¹² × 0.006/0.002 = 239.1 pF.", focus: ["eq"] },
            { text: "In the gap, ∫(∂D/∂t)·dS = C dv/dt = 239.1 pF × 2π × 10³ cos(2π × 10³ t).", focus: ["eq"] },
            { text: "i_d = 1.502 cos(2π × 10³ t) µA: exactly the conduction current in the leads.", focus: ["eq"] },
          ],
          covers: ["text:went-p4.27"],
          trap: "Saying no current crosses the gap, so there is no field. There's no conduction current, but the displacement current makes H all the same.",
        },
        {
          id: "p4.29", level: "tutorial", title: "Wentworth Problem 4.29: inside a coax",
          setup: { pw: SEA },
          problem: "A 1.0 m coax with inner conductor diameter 2.0 mm and outer conductor diameter 6.0 mm is filled with an ideal dielectric of εr = 10.2. With v(t) = 10 cos(6π × 10⁶ t) mV on the inner conductor, find the displacement current.",
          lines: [
            { text: "C = 2πεL/ln(b/a) = 2π × 10.2 × 8.854 × 10⁻¹² × 1.0/ln 3 = 516.5 pF.", focus: ["eq"] },
            { text: "i_d = C dv/dt = −516.5 pF × 6π × 10⁶ × 0.010 sin(6π × 10⁶ t) = −97.36 sin(6π × 10⁶ t) µA.", focus: ["eq"] },
          ],
          covers: ["text:went-p4.29"],
          trap: "Using the diameters in ln(b/a). Here the ratio is the same, 3, but halve them out of habit.",
        },
        {
          id: "crossover", level: "exam", title: "Seawater and copper: which current wins",
          setup: { pw: SEA },
          givens: [{ value: 60, unit: "Hz" }, { value: 887.659e6, unit: "Hz" }],
          problem: "(a) At what frequency are the conduction and displacement current densities equal in seawater (σ = 4 S/m, εr = 81)? (b) Find their ratio at 1 MHz. (c) Find Jd in copper at 60 Hz when J = 1 MA/m² (Hayt D9.3(d)).",
          lines: [
            { text: "(a) Equal when σ = ωε: f = σ/(2πε) = 4/(2π × 81 × 8.854 × 10⁻¹²) = 887.7 MHz.", focus: ["pw"], givens: [{ value: 887.659e6, unit: "Hz" }] },
            { text: "(b) σ/(ωε) at 1 MHz = 887.7: conduction dominates.", focus: ["pw"], claims: [{ instance: "pw", readout: "lossTan", value: 887.659, unit: "" }] },
            { text: "(c) E = J/σ = 10⁶/5.8 × 10⁷ V/m, so Jd = ωε₀E = 377 × 8.854 × 10⁻¹² × 0.01724 = 57.6 pA/m².", focus: ["eq"] },
          ],
          covers: ["text:went-p4.28", "text:hayt-d9.3"],
          trap: "Using f instead of ω = 2πf in σ/(ωε): a factor of 2π out.",
        },
      ],
      asks: [
        { id: "flow", q: "Is displacement current a flow of charge?", tags: ["JD_SOURCE"], a: "No. No charge crosses a capacitor's gap. ∂D/∂t is a changing field that makes H exactly as a current would, which is why Maxwell called it a current." },
        { id: "why", q: "Why did Maxwell need it?", a: "Without it, Ampère's law contradicts charge conservation: ∇·(∇ × H) = 0 would force ∇·J = 0 even while charge piles up on a capacitor plate." },
        { id: "waves", q: "What does displacement current make possible?", a: "Fields that sustain each other in empty space: a changing E makes H through ∂D/∂t, and a changing H makes E through Faraday's law. That's an electromagnetic wave." },
        { id: "ratio", q: "How do I compare conduction and displacement current?", tags: ["LOSS_TAN"], a: "|Jc|/|Jd| = σ/(ωε), with ω = 2πf. Much greater than 1: a conductor. Much less than 1: a good dielectric." },
        { id: "freq", q: "Why does the ratio depend on frequency?", a: "Jd = ωεE grows with frequency while Jc = σE doesn't. Any material looks more like a dielectric at high enough frequency." },
        { id: "wires", q: "Is there displacement current in a wire?", a: "Yes, but tiny: in copper at mains frequency it's about 10⁻¹⁶ of the conduction current." },
      ],
      checks: [
        {
          id: "jd-c", title: "Check: what displacement current is", show: ["pw", "eq"], patch: { pw: SEA },
          note: "Four checks on displacement current. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "jd-c", type: "choose", prompt: "In a charging capacitor's gap, the displacement current is…", dimension: "conceptual",
            options: [
              choice("dd", "a changing D, ∂D/∂t, with no charge crossing", true, "Right."),
              choice("leak", "charge leaking across the gap", false, "No charge crosses an ideal dielectric.", "JD_SOURCE"),
              choice("zero", "zero", false, "It equals the current in the leads."),
            ] },
        },
        {
          id: "predict-10", title: "Check: ten times the frequency",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-10", type: "predict-drag", prompt: "Raise the frequency tenfold in the seawater. Drag σ/(ωε) to your prediction.", target: { instance: "pw", readout: "lossTan" }, range: [0, 1000], unit: "", relTol: 0.05, reveal: { pw: { f: 1e7 } }, dimension: "conceptual",
            feedback: { close: "Right: a tenth, 88.77.", far: "σ/(ωε) ∝ 1/f: 88.77." } },
        },
        {
          id: "lt-num", title: "Check: a ratio, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "lt-num", type: "numeric", prompt: lt.prompt, answer: lt.spec.answer, distractors: lt.spec.distractors, relTol: lt.spec.relTol, hints: lt.hints, template: "loss-tangent", dimension: "computational" },
        },
        {
          id: "term-c", title: "Check: the corrected law",
          note: "Last one.",
          interaction: { id: "term-c", type: "choose", prompt: "Ampère's law with Maxwell's correction reads…", dimension: "recognition",
            options: [
              choice("right", "∇ × H = J + ∂D/∂t", true, "Right."),
              choice("static", "∇ × H = J", false, "That's the static form.", "MAXWELL_STATIC"),
              choice("faraday", "∇ × E = −∂B/∂t", false, "That's Faraday's law."),
            ] },
        },
      ],
      recap: {
        points: ["Jd = ∂D/∂t completes Ampère's law: ∇ × H = J + ∂D/∂t.", "|Jc|/|Jd| = σ/(ωε); equal at f = σ/(2πε).", "Conductors at low frequency: Jd is negligible."],
        traps: ["Displacement current as moving charge.", "f instead of ω.", "Inverting the ratio."],
      },
    },
  ],
});
```

Hand checks:
- Seawater: 4/(2π × 10⁶ × 81ε₀) = 887.659; the crossover is 887.659 MHz.
- Copper: 5.8 × 10⁷/(2π × 60ε₀) = 1.73759 × 10¹⁶.
- The capacitors: 239.063 pF gives 1.50208 µA; 516.517 pF gives 97.3611 µA.

- [ ] **Step 3: `plates/idea-maxwell.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

// R, choice, eqp as in Plan K.
const FS = { f: 1e8, E0: 1 };

export const ideaMaxwell = defineIdeaPlate({
  id: "idea-maxwell",
  title: "Maxwell's equations",
  requires: { objectives: [2], items: ["f1516-q4a", "f2324-q3a", "f1819s3-q1", "drill24-q8"], misconceptions: ["MAXWELL_STATIC"] },
  instances: [
    { id: "pw", component: "plane-wave", params: FS },
    { id: "eq", component: "equation", params: eqp(R`\nabla\cdot\mathbf D=\rho_v,\quad \nabla\cdot\mathbf B=0,\quad \nabla\times\mathbf E=-\dfrac{\partial\mathbf B}{\partial t},\quad \nabla\times\mathbf H=\mathbf J+\dfrac{\partial\mathbf D}{\partial t}`, "Maxwell's four equations in point form") },
  ],
  ideas: [
    {
      id: "maxwell",
      title: "Maxwell's equations",
      objectives: [2],
      explain: [
        {
          id: "point", title: "Four equations", show: ["pw", "eq"], focus: ["eq"],
          note: "Maxwell's equations gather everything in four lines. ∇·D = ρv: charges are sources of D. ∇·B = 0: there are no magnetic charges. ∇ × E = −∂B/∂t: Faraday's law. ∇ × H = J + ∂D/∂t: Ampère–Maxwell. Add the constitutive relations D = εE, B = μH and J = σE, and they describe every classical electromagnetic effect in this course.",
        },
        {
          id: "integral", title: "Integral form", patch: { eq: eqp(R`\oint\mathbf D\cdot d\mathbf S=Q,\ \oint\mathbf B\cdot d\mathbf S=0,\ \oint\mathbf E\cdot d\mathbf L=-\dfrac{d}{dt}\int\mathbf B\cdot d\mathbf S,\ \oint\mathbf H\cdot d\mathbf L=I+\int\dfrac{\partial\mathbf D}{\partial t}\cdot d\mathbf S`, "Maxwell's four equations in integral form") }, focus: ["eq"],
          note: "Each point form has an integral twin through the divergence theorem or Stokes' theorem: ∮D·dS = Q_enc, ∮B·dS = 0, ∮E·dL = −(d/dt)∫B·dS and ∮H·dL = I_enc + ∫(∂D/∂t)·dS. Exams ask for both, so learn them in pairs.",
        },
        {
          id: "static", title: "Static fields", patch: { eq: eqp(R`\nabla\cdot\mathbf D=\rho_v,\ \nabla\times\mathbf E=0;\qquad \nabla\cdot\mathbf B=0,\ \nabla\times\mathbf H=\mathbf J`, "the static equations") }, focus: ["eq"],
          note: "Set every ∂/∂t to zero and the equations split into two pairs: ∇·D = ρv with ∇ × E = 0 (electrostatics, where E = −∇V), and ∇·B = 0 with ∇ × H = J (magnetostatics). Only time variation couples E and H. This is what Finals 2023-24 Q3(a) and 2018-19 Q1(c) ask for.",
        },
        {
          id: "light", title: "The prediction: light", patch: { eq: eqp(R`\nabla^2\mathbf E=\mu_0\varepsilon_0\dfrac{\partial^2\mathbf E}{\partial t^2},\quad u=\dfrac{1}{\sqrt{\mu_0\varepsilon_0}}`, "the wave equation, with speed one over root mu nought epsilon nought") }, focus: ["eq", "pw"],
          note: "Combine Faraday's law and the Ampère–Maxwell law in free space, and each field obeys a wave equation, ∇²E = μ₀ε₀ ∂²E/∂t², with speed 1/√(μ₀ε₀). The plate's free-space wave travels at u = 2.998 × 10⁸ m/s: the measured speed of light. Light is an electromagnetic wave. That was Maxwell's greatest result.",
          claims: [{ instance: "pw", readout: "u", value: 2.99792e8, unit: "m/s" }],
        },
      ],
      examples: [
        {
          id: "both", level: "basic", title: "Finals 2015-16 Q4(a): both forms",
          setup: { pw: FS },
          problem: "State Maxwell's equations in both integral and point form.",
          lines: [
            { text: "Gauss (electric): ∇·D = ρv ⇔ ∮S D·dS = ∫v ρv dv.", focus: ["eq"] },
            { text: "Gauss (magnetic): ∇·B = 0 ⇔ ∮S B·dS = 0.", focus: ["eq"] },
            { text: "Faraday: ∇ × E = −∂B/∂t ⇔ ∮L E·dL = −(d/dt)∫S B·dS.", focus: ["eq"] },
            { text: "Ampère–Maxwell: ∇ × H = J + ∂D/∂t ⇔ ∮L H·dL = ∫S (J + ∂D/∂t)·dS.", focus: ["eq"] },
          ],
          covers: ["f1516-q4a"],
          trap: "Mixing up the pairs: the divergence equations become closed-surface integrals; the curl equations become closed-line integrals.",
        },
        {
          id: "static", level: "tutorial", title: "Finals 2023-24 Q3(a): the static equations",
          setup: { pw: FS },
          problem: "State Maxwell's equations for static electromagnetic fields in point form, and explain each.",
          lines: [
            { text: "∇·D = ρv: electric flux begins and ends on charge.", focus: ["eq"] },
            { text: "∇ × E = 0: static E is conservative, so E = −∇V.", focus: ["eq"] },
            { text: "∇·B = 0: no magnetic charges; B lines close.", focus: ["eq"] },
            { text: "∇ × H = J: steady currents are the sources of H.", focus: ["eq"] },
          ],
          covers: ["f2324-q3a", "f1819s3-q1"],
          trap: "Keeping −∂B/∂t in a 'static' answer. Static means every time derivative is zero.",
        },
        {
          id: "significance", level: "exam", title: "Drill 2024 Q08: what the equations mean",
          setup: { pw: FS },
          problem: "Explain the significance of (i) ∇ × E = 0 and (ii) ∇ × H = Jc + ∂D/∂t. Then explain divergence, and why E can have divergence but B cannot.",
          lines: [
            { text: "(i) A static E is conservative: zero work round any closed path, and E = −∇V.", focus: ["eq"] },
            { text: "(ii) Both conduction current and a changing D make a circulating H. The ∂D/∂t term keeps charge conserved and lets H exist in empty space, which makes waves possible.", focus: ["eq"] },
            { text: "Divergence is the net outward flux per unit volume as the volume shrinks to a point. E lines start and end on charges, so ∇·D = ρv; there are no magnetic charges, so ∇·B = 0 everywhere.", focus: ["eq"] },
          ],
          covers: ["drill24-q8"],
          trap: "Saying B has no divergence because B is weak. It's because magnetic charges don't exist.",
        },
      ],
      asks: [
        { id: "curl-e", q: "Is ∇ × E always zero?", tags: ["MAXWELL_STATIC"], a: "Only in statics. When B changes, ∇ × E = −∂B/∂t, and E is no longer conservative: −∇V alone can't describe it." },
        { id: "monopole", q: "Which equation says there are no magnetic monopoles?", a: "∇·B = 0, Gauss's law for magnetism: B lines always close." },
        { id: "const", q: "What links D to E and B to H?", a: "The material's constitutive relations: D = εE, B = μH and J = σE. Maxwell's equations hold everywhere; the material enters only through ε, μ and σ." },
        { id: "continuity", q: "Is charge conservation built in?", a: "Yes. Take the divergence of the Ampère–Maxwell law and use Gauss's law: you get ∇·J = −∂ρv/∂t, the continuity equation." },
        { id: "c", q: "Why is c = 1/√(μ₀ε₀)?", a: "The wave equation's coefficient μ₀ε₀ equals 1/u². The measured constants give 2.998 × 10⁸ m/s, which matched the measured speed of light." },
        { id: "why", q: "What's their overall significance?", a: "They unified electricity, magnetism and optics, predicted radio waves before anyone had made one, and underpin all of modern communications engineering." },
      ],
      checks: [
        {
          id: "static-c", title: "Check: statics", show: ["pw", "eq"], patch: { pw: FS },
          note: "Four checks on Maxwell's equations. Get each right to move on.",
          interaction: { id: "static-c", type: "choose", prompt: "For static fields, ∇ × E =", dimension: "recognition",
            options: [
              choice("zero", "0", true, "Right: a static E is conservative."),
              choice("dbdt", "−∂B/∂t", false, "That's the general form; in statics ∂B/∂t = 0."),
              choice("j", "J", false, "That's the curl of H."),
            ] },
        },
        {
          id: "mono-c", title: "Check: monopoles",
          note: "Which one?",
          interaction: { id: "mono-c", type: "choose", prompt: "Which equation rules out magnetic monopoles?", dimension: "recognition",
            options: [
              choice("divb", "∇·B = 0", true, "Right."),
              choice("divd", "∇·D = ρv", false, "That's about electric charge."),
              choice("curlh", "∇ × H = J + ∂D/∂t", false, "That's about the sources of H."),
            ] },
        },
        {
          id: "c-num", title: "Check: the speed of light",
          note: "A number.",
          interaction: { id: "c-num", type: "numeric", prompt: "Compute 1/√(μ₀ε₀), in m/s.", answer: { value: 2.99792e8, unit: "m/s" }, relTol: 0.005, dimension: "computational",
            distractors: [{ value: 8.98755e16, unit: "m/s", errorClass: "arithmetic", feedback: "Missing the square root." }],
            hints: ["μ₀ = 4π × 10⁻⁷, ε₀ = 8.854 × 10⁻¹².", "μ₀ε₀ = 1.113 × 10⁻¹⁷.", "Take 1/√ of it."] },
        },
        {
          id: "faraday-c", title: "Check: Faraday in integral form",
          note: "Last one.",
          interaction: { id: "faraday-c", type: "choose", prompt: "In integral form, Faraday's law is…", dimension: "recognition",
            options: [
              choice("right", "∮E·dL = −(d/dt)∫B·dS", true, "Right."),
              choice("gauss", "∮B·dS = 0", false, "That's Gauss's law for magnetism."),
              choice("amp", "∮H·dL = I", false, "That's static Ampère.", "MAXWELL_STATIC"),
            ] },
        },
      ],
      recap: {
        points: ["∇·D = ρv; ∇·B = 0; ∇ × E = −∂B/∂t; ∇ × H = J + ∂D/∂t.", "Integral twins via the divergence and Stokes' theorems.", "Statics: set ∂/∂t = 0; E and H decouple.", "Together they predict waves at 1/√(με)."],
        traps: ["Static forms for time-varying fields.", "Mixing surface and line integrals.", "Forgetting ∂D/∂t."],
      },
    },
  ],
});
```

- [ ] **Step 4: Register and commit.**
  - In `plates/index.ts`, add the three plates.
  - In `electrostatics.ts`, delete `locked("em1.dynamic.faraday", …)`.
  - In `index.ts`, import `{ faradayConcept }` from `./concepts/dynamics` and add it after `inductanceConcept`.
  - Run `pnpm test && pnpm typecheck`. Expected: PASS.

  ```bash
  git add packages/course-em1 && git commit -m "feat(course-em1): Faraday and Maxwell concept; Faraday's law (Wentworth 4.2, P4.9, P4.21; resit Q4(a)), displacement current (Wentworth P4.27–4.29, Hayt D9.3), Maxwell's equations

  Co-Authored-By: Codex <noreply@openai.com>"
  ```

---

### Task 6: The waves concept's four ideas

**Files:**
- Create: `plates/idea-tem-wave.ts`, `plates/idea-lossy.ts`, `plates/idea-conductors.ts`, `plates/idea-poynting.ts`
- Modify: `plates/index.ts`, `index.ts` (import `wavesConcept`; remove `locked("em1.waves.plane-waves", …)`)

- [ ] **Step 1: `plates/idea-tem-wave.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice, eqp as in Plan K.
const wl = instantiate(templates.find((t) => t.id === "wave-lambda")!, 1);
const AIR = { f: 1e8, E0: 1, er: 1, sigma: 0, z: 0, t: 0 };
const P431 = { f: 2e6, er: 9, E0: 100, sigma: 0, z: 0, t: 0 };

export const ideaTemWave = defineIdeaPlate({
  id: "idea-tem-wave",
  title: "Reading a TEM wave",
  requires: { objectives: [0], items: ["text:went-ex4.1", "text:went-p4.31", "text:hayt-d11.1", "text:hayt-d11.3", "hw04-2425-4.2", "f2425r-q4b"], misconceptions: ["WAVE_BETA_LAMBDA", "WAVE_MEDIUM"] },
  instances: [
    { id: "pw", component: "plane-wave", params: AIR },
    { id: "eq", component: "equation", params: eqp(R`\mathbf E(z,t)=E_0e^{-\alpha z}\cos(\omega t-\beta z+\phi)\,\mathbf a_x`, "E of z t equals E nought e to the minus alpha z cos omega t minus beta z plus phi") },
  ],
  ideas: [
    {
      id: "tem",
      title: "Reading a TEM wave",
      objectives: [0],
      explain: [
        {
          id: "read", title: "Five numbers in one line", show: ["pw", "eq"], focus: ["pw", "eq"],
          note: "A wave E(z, t) = E₀e^(−αz) cos(ωt − βz + φ) carries five numbers: the amplitude E₀, the attenuation α (Np/m), the angular frequency ω = 2πf, the phase constant β (rad/m) and the phase φ. Wentworth Example 4.1: a 1 V/m, 100 MHz wave in air has α = 0 and ω = 2π × 10⁸ rad/s, so λ = c/f = 3.00 m and β = 2π/λ = 2.096 rad/m.",
          claims: [{ instance: "pw", readout: "lambda", value: 2.99792, unit: "m" }, { instance: "pw", readout: "beta", value: 2.09585, unit: "rad/m" }, { instance: "pw", readout: "alpha", value: 0, unit: "Np/m" }],
        },
        {
          id: "medium", title: "Slower in a medium", patch: { pw: P431 }, focus: ["pw"],
          note: "In a lossless medium the wave slows: u = 1/√(με) = c/√εr, and λ = u/f. Wentworth Problem 4.31: E = 100 cos(4π × 10⁶ t − 0.1257y) V/m in a nonmagnetic medium has f = 2 MHz and u = ω/β = 1.0 × 10⁸ m/s, so λ = 50 m. Then √εr = c/u = 3, so εr = 9.",
          claims: [{ instance: "pw", readout: "u", value: 9.99308e7, unit: "m/s" }, { instance: "pw", readout: "lambda", value: 49.9654, unit: "m" }],
        },
        {
          id: "eta", title: "H from E: the intrinsic impedance", patch: { eq: eqp(R`\dfrac{|\mathbf E|}{|\mathbf H|}=\eta=\sqrt{\dfrac{\mu}{\varepsilon}}=\dfrac{376.7}{\sqrt{\varepsilon_r}}\ \Omega`, "E over H equals eta") }, focus: ["pw", "eq"],
          note: "E and H travel together, perpendicular to each other and to the direction of travel, with |E|/|H| = η, the intrinsic impedance. In a lossless nonmagnetic medium, η = √(μ/ε) = 376.7/√εr Ω. Here η = 125.6 Ω, so the 100 V/m wave carries H = 0.7963 A/m. For E along ax travelling toward +z, H lies along ay, so that E × H points along the travel.",
          claims: [{ instance: "pw", readout: "eta", value: 125.577, unit: "Ω" }, { instance: "pw", readout: "Hwave", value: 0.796326, unit: "A/m" }],
        },
        {
          id: "move", title: "The wave moves", patch: { pw: { t: 6.25e-8 } }, focus: ["pw"],
          note: "Advance time by an eighth of a period, T/8 = 62.5 ns. The crests move forward by λ/8, and at z = 0 the field falls to 70.71 V/m, which is 100 cos 45°. The pattern travels toward +z because the phase ωt − βz stays fixed only if z grows with t.",
          claims: [{ instance: "pw", readout: "Ewave", value: 70.7107, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "d11.1", level: "basic", title: "Hayt D11.1: frequency, wavelength, period, H",
          setup: { pw: { f: 1e6 / (2 * Math.PI), er: 1, sigma: 0, E0: 250, z: 0, t: 0 } },
          problem: "A uniform plane wave in free space travels along az with E = Ex ax of amplitude 250 V/m and ω = 1.00 Mrad/s. Find f, λ, the period and the amplitude of H.",
          lines: [
            { text: "f = ω/2π = 159.2 kHz.", focus: ["pw"] },
            { text: "λ = c/f = 1884 m, or 1.884 km.", focus: ["pw"], claims: [{ instance: "pw", readout: "lambda", value: 1883.65, unit: "m" }] },
            { text: "T = 1/f = 6.283 µs.", focus: ["pw"] },
            { text: "H = E/η₀ = 250/376.7 = 0.6636 A/m.", focus: ["pw"], claims: [{ instance: "pw", readout: "Hwave", value: 0.663605, unit: "A/m" }] },
          ],
          covers: ["text:hayt-d11.1"],
          trap: "Taking ω for f: 1 Mrad/s is 159.2 kHz, not a megahertz.",
        },
        {
          id: "hw04", level: "tutorial", title: "HW04 4.2 and the resit Q4(b): what the terms mean",
          setup: { pw: AIR },
          problem: "E(z, t) = E₀e^(−αz) cos(ωt ± βz + φ) ay. (a) What is a TEM wave? (b) What are α, ω, β and φ? (c) State H(z, t). (d) Relate E, H and u.",
          lines: [
            { text: "(a) Transverse electromagnetic: E and H both lie across the direction of travel, at right angles to each other.", focus: ["pw"] },
            { text: "(b) α: attenuation constant (Np/m). ω: angular frequency (rad/s). β: phase constant (rad/m). φ: phase angle (rad).", focus: ["eq"] },
            { text: "(c) For the ωt − βz wave, travelling in +z: H(z, t) = −(E₀/|η|)e^(−αz) cos(ωt − βz + φ − θη) ax, so that ay × (−ax) = az.", focus: ["eq"] },
            { text: "(d) E ⊥ H ⊥ the travel direction, |E|/|H| = |η|, E × H points along the travel, and u = ω/β.", focus: ["pw"] },
          ],
          covers: ["hw04-2425-4.2", "f2425r-q4b"],
          trap: "H along +ax for E along ay travelling +z: then E × H would point along −z. Check the cross product.",
        },
        {
          id: "d11.3", level: "exam", title: "Hayt D11.3: a wave in polyethylene",
          setup: { pw: { f: 9.375e9, er: 2.26, sigma: 0, E0: 500, z: 0, t: 0 } },
          problem: "A 9.375 GHz uniform plane wave travels in lossless polyethylene (εr = 2.26). The electric field amplitude is 500 V/m. Find β, λ, u, η and the amplitude of H.",
          lines: [
            { text: "β = ω√εr/c = 2π × 9.375 × 10⁹ × 1.503/2.998 × 10⁸ = 295.4 rad/m.", focus: ["pw"], claims: [{ instance: "pw", readout: "beta", value: 295.382, unit: "rad/m" }] },
            { text: "λ = 2π/β = 2.127 cm; u = c/√εr = 1.994 × 10⁸ m/s.", focus: ["pw"], claims: [{ instance: "pw", readout: "lambda", value: 0.0212714, unit: "m" }] },
            { text: "η = 376.7/1.503 = 250.6 Ω, so H = 500/250.6 = 1.995 A/m.", focus: ["pw"], claims: [{ instance: "pw", readout: "eta", value: 250.597, unit: "Ω" }, { instance: "pw", readout: "Hwave", value: 1.99523, unit: "A/m" }] },
          ],
          covers: ["text:hayt-d11.3"],
          trap: "Using η = 377 Ω inside the polyethylene: H would come out 1.33 A/m instead of 1.995 A/m.",
        },
      ],
      asks: [
        { id: "beta", q: "How do β and λ relate?", tags: ["WAVE_BETA_LAMBDA"], a: "β = 2π/λ: radians of phase per metre. β = 10π rad/m means a 20 cm wavelength." },
        { id: "eta377", q: "Is η always 377 Ω?", tags: ["WAVE_MEDIUM"], a: "Only in free space. In a lossless nonmagnetic medium η = 376.7/√εr Ω; in a lossy medium η is complex." },
        { id: "tem", q: "What does TEM mean?", a: "Transverse electromagnetic: E and H both lie across the direction of travel, at right angles to each other." },
        { id: "dir", q: "How do I find H's direction?", a: "E × H points along the travel. For E along ax travelling toward +z, H is along ay; travelling toward −z, H is along −ay." },
        { id: "sign", q: "ωt − βz or ωt + βz?", a: "ωt − βz travels toward +z: keeping the phase fixed needs z to grow as t grows. ωt + βz travels toward −z." },
        { id: "u", q: "What is the phase velocity?", a: "u = ω/β, the speed of a crest: 1/√(με) in a lossless medium, and c in free space." },
      ],
      checks: [
        {
          id: "u-c", title: "Check: speed in a medium", show: ["pw", "eq"], patch: { pw: AIR },
          note: "Four checks on reading waves. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "u-c", type: "choose", prompt: "In a lossless nonmagnetic medium with εr = 4, a wave travels at…", dimension: "conceptual",
            options: [
              choice("half", "c/2", true, "Right: c/√εr."),
              choice("c", "c", false, "Only in free space.", "WAVE_MEDIUM"),
              choice("quarter", "c/4", false, "The square root of εr, not εr."),
            ] },
        },
        {
          id: "predict-er", title: "Check: into a dielectric",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-er", type: "predict-drag", prompt: "Fill the space with a lossless dielectric of εr = 4, keeping the frequency. Drag λ to your prediction.", target: { instance: "pw", readout: "lambda" }, range: [0, 4], unit: "m", relTol: 0.05, reveal: { pw: { er: 4 } }, dimension: "conceptual",
            feedback: { close: "Right: halved, to 1.499 m.", far: "λ = c/(f√εr): half, 1.499 m." } },
        },
        {
          id: "lambda-num", title: "Check: a wavelength, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "lambda-num", type: "numeric", prompt: wl.prompt, answer: wl.spec.answer, distractors: wl.spec.distractors, relTol: wl.spec.relTol, hints: wl.hints, template: "wave-lambda", dimension: "computational" },
        },
        {
          id: "beta-c", title: "Check: reading β",
          note: "Last one.",
          interaction: { id: "beta-c", type: "choose", prompt: "E = 10 cos(2π × 10⁸ t − (2π/3)z) ax V/m. The wavelength is…", dimension: "recognition",
            options: [
              choice("three", "three metres", true, "Right: λ = 2π/β with β = 2π/3."),
              choice("beta", "2π/3 metres", false, "That's β, in rad/m.", "WAVE_BETA_LAMBDA"),
              choice("omega", "10⁸ metres", false, "That's from ω, not β."),
            ] },
        },
      ],
      recap: {
        points: ["E₀e^(−αz) cos(ωt − βz + φ): α, ω = 2πf, β = 2π/λ, φ.", "Lossless: β = ω√(με), u = c/√εr, η = 376.7/√εr Ω.", "|E|/|H| = η; E × H along the travel."],
        traps: ["β for λ.", "377 Ω in a dielectric.", "ω for f."],
      },
    },
  ],
});
```

Hand checks: 2.998/√9 × 10⁸ = 0.999308 × 10⁸ m/s; λ = 49.9654 m; η = 376.730/3.00080 = 125.577 Ω; 100 cos 45° = 70.7107; D11.1 λ = 1883.65 m. Note: √εr here is √9 = 3 exactly; the small difference from 10⁸ comes from c = 2.998 × 10⁸.

- [ ] **Step 2: `plates/idea-lossy.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

// R, choice, eqp as in Plan K.
const W51 = { f: 1e9, er: 9, sigma: 0.1, E0: 10, z: 0, t: 0 };
const D114 = { f: 3e6, er: 3.2, sigma: 1.5e-4, E0: 1, z: 0, t: 0 };

export const ideaLossy = defineIdeaPlate({
  id: "idea-lossy",
  title: "Lossy media",
  requires: { objectives: [1], items: ["text:went-ex5.1", "text:went-ex5.3", "text:hayt-d11.4", "text:went-ch4-drill"], misconceptions: ["LOSS_TAN"] },
  instances: [
    { id: "pw", component: "plane-wave", params: W51 },
    { id: "eq", component: "equation", params: eqp(R`\gamma=\alpha+j\beta=\sqrt{j\omega\mu(\sigma+j\omega\varepsilon)}`, "gamma equals alpha plus j beta") },
  ],
  ideas: [
    {
      id: "lossy",
      title: "Lossy media",
      objectives: [1],
      explain: [
        {
          id: "gamma", title: "The propagation constant γ", show: ["pw", "eq"], focus: ["pw", "eq"],
          note: "In a medium with conductivity, the wave both travels and decays: γ = √(jωμ(σ + jωε)) = α + jβ. Wentworth Example 5.1: σ = 0.100 S/m, εr = 9.00 and f = 1.00 GHz give γ = 6.25 + j63.2 per metre. So α = 6.25 Np/m and β = 63.2 rad/m (the book rounds β to 63.1).",
          claims: [{ instance: "pw", readout: "alpha", value: 6.24807, unit: "Np/m" }, { instance: "pw", readout: "beta", value: 63.185, unit: "rad/m" }],
        },
        {
          id: "eta", title: "A complex η", patch: { eq: eqp(R`\eta=\sqrt{\dfrac{j\omega\mu}{\sigma+j\omega\varepsilon}}=|\eta|\angle\theta_\eta`, "eta equals the square root of j omega mu over sigma plus j omega epsilon") }, focus: ["pw", "eq"],
          note: "The intrinsic impedance becomes complex too: η = √(jωμ/(σ + jωε)) = 124∠5.6° Ω here. H now lags E by θη = 5.6°. In Wentworth Example 5.3, a 10.0 V/m field in this medium carries an H of peak 10.0/124.4 = 80.4 mA/m, lagging by 0.0986 rad.",
          claims: [{ instance: "pw", readout: "eta", value: 124.355, unit: "Ω" }, { instance: "pw", readout: "thetaEta", value: 5.64735, unit: "°" }],
        },
        {
          id: "lt", title: "The loss tangent decides", patch: { eq: eqp(R`\tan\delta_\ell=\dfrac{\sigma}{\omega\varepsilon}`, "the loss tangent equals sigma over omega epsilon") }, focus: ["pw", "eq"],
          note: "How lossy is lossy? The loss tangent σ/(ωε) decides; here it is 0.200. Well below 1 the medium is a good dielectric: α ≈ (σ/2)√(μ/ε) and β ≈ ω√(με). Well above 1 it is a good conductor: α ≈ β ≈ √(πfμσ). In between, use the full γ.",
          claims: [{ instance: "pw", readout: "lossTan", value: 0.199723, unit: "" }],
        },
        {
          id: "decay", title: "Decay with depth", patch: { pw: { z: 0.16005 } }, focus: ["pw"],
          note: "The amplitude falls as e^(−αz). After z = 1/α = 16.0 cm it is down to e⁻¹ of its starting value: 3.679 V/m. That's less than two wavelengths into this medium, which is what 'lossy' means in practice.",
          claims: [{ instance: "pw", readout: "Eamp", value: 3.67879, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "d11.4", level: "basic", title: "Hayt D11.4: a slightly lossy material",
          setup: { pw: D114 },
          problem: "A nonmagnetic material has εr = 3.2 and σ = 1.5 × 10⁻⁴ S/m. At 3 MHz find the loss tangent, α, β and η.",
          lines: [
            { text: "σ/(ωε) = 1.5 × 10⁻⁴/(2π × 3 × 10⁶ × 3.2ε₀) = 0.281.", focus: ["pw"], claims: [{ instance: "pw", readout: "lossTan", value: 0.280861, unit: "" }] },
            { text: "γ = √(jωμ(σ + jωε)) gives α = 0.0156 Np/m and β = 0.114 rad/m.", focus: ["pw"], claims: [{ instance: "pw", readout: "alpha", value: 0.0156443, unit: "Np/m" }, { instance: "pw", readout: "beta", value: 0.113558, unit: "rad/m" }] },
            { text: "η = 207∠7.8° Ω.", focus: ["pw"], claims: [{ instance: "pw", readout: "eta", value: 206.639, unit: "Ω" }, { instance: "pw", readout: "thetaEta", value: 7.84399, unit: "°" }] },
          ],
          covers: ["text:hayt-d11.4"],
          trap: "Using f instead of ω in the loss tangent: 1.77, which would wrongly call this a conductor.",
        },
        {
          id: "ex5.3", level: "tutorial", title: "Wentworth Example 5.3: H from E in a lossy medium",
          setup: { pw: W51 },
          problem: "In the medium of Example 5.1 (σ = 0.100 S/m, εr = 9.00, f = 1.00 GHz), E(z, t) = 10.0e^(−6.25z) cos(2π × 10⁹t − 63.2z) ax V/m. Find H(z, t).",
          lines: [
            { text: "Phasor: Es = 10.0e^(−6.25z)e^(−j63.2z) ax. Dividing by η = 124.4∠5.6° Ω gives Hs along ay.", focus: ["pw", "eq"], claims: [{ instance: "pw", readout: "eta", value: 124.355, unit: "Ω" }] },
            { text: "H(z, t) = 80.4e^(−6.25z) cos(2π × 10⁹t − 63.2z − 0.0986) ay mA/m: smaller by |η| and behind by θη = 0.0986 rad.", focus: ["pw"] },
          ],
          covers: ["text:went-ex5.1", "text:went-ex5.3"],
          trap: "Forgetting the phase shift: in a lossy medium H isn't in phase with E.",
        },
        {
          id: "drill", level: "exam", title: "Wentworth Ch. 4 drill: an attenuated wave",
          setup: { pw: W51 },
          givens: [{ value: 34, unit: "V/m" }, { value: 1, unit: "V/m" }, { value: 1e9, unit: "Hz" }],
          problem: "E(z, t) = 34e^(−0.002z) cos(2π × 10⁹t − 10πz + 45°) V/m. Find (a) the initial amplitude, (b) α, (c) f, (d) λ, (e) the phase in radians, (f) how far the wave travels before its amplitude falls to 1.0 V/m.",
          lines: [
            { text: "(a) 34 V/m. (b) α = 0.002 Np/m. (c) ω = 2π × 10⁹ rad/s, so f = 1 GHz.", focus: ["eq"], givens: [{ value: 34, unit: "V/m" }, { value: 1e9, unit: "Hz" }] },
            { text: "(d) β = 10π rad/m, so λ = 2π/β = 20 cm. (e) φ = 45° = π/4 rad.", focus: ["eq"] },
            { text: "(f) 34e^(−0.002z) = 1 gives z = ln 34/0.002 = 1.763 km.", focus: ["eq"] },
          ],
          covers: ["text:went-ch4-drill"],
          trap: "Reading 10π as the wavelength. It's β; λ = 2π/β.",
        },
      ],
      asks: [
        { id: "lt", q: "What's the loss tangent?", tags: ["LOSS_TAN"], a: "σ/(ωε): the ratio of conduction to displacement current. Small means a good dielectric; large means a good conductor." },
        { id: "ab", q: "What are α and β physically?", a: "α (Np/m) sets how fast the amplitude decays, as e^(−αz); β (rad/m) sets how fast the phase advances, giving λ = 2π/β." },
        { id: "lag", q: "Why does H lag E in a lossy medium?", a: "η = |η|∠θη is complex, and H = E/η, so H is smaller by |η| and behind by θη: from 0° (lossless) up to 45° (a good conductor)." },
        { id: "neper", q: "What's a neper?", a: "The natural-log unit of attenuation: 1 Np/m means the amplitude falls by a factor of e every metre. 1 Np ≈ 8.686 dB." },
        { id: "both", q: "Can one material be both a dielectric and a conductor?", a: "Yes, at different frequencies. Seawater conducts strongly at low radio frequencies and leans toward a lossy dielectric in the microwave range, because Jd = ωεE grows with frequency." },
        { id: "full", q: "When must I use the full γ?", a: "When σ/(ωε) is between about 0.1 and 10. Outside that range the dielectric or conductor approximations are within a few per cent." },
      ],
      checks: [
        {
          id: "lt-c", title: "Check: classify the medium", show: ["pw", "eq"], patch: { pw: W51 },
          note: "Four checks on lossy media. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "lt-c", type: "choose", prompt: "A medium with σ/(ωε) = 1000 is…", dimension: "conceptual",
            options: [
              choice("cond", "a good conductor", true, "Right: conduction current dominates."),
              choice("diel", "a good dielectric", false, "The ratio is inverted.", "LOSS_TAN"),
              choice("lossless", "lossless", false, "Lossless needs σ = 0."),
            ] },
        },
        {
          id: "predict-sigma", title: "Check: double the conductivity",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-sigma", type: "predict-drag", prompt: "Double σ to 0.2 S/m in Example 5.1's medium. Drag α to your prediction.", target: { instance: "pw", readout: "alpha" }, range: [0, 30], unit: "Np/m", relTol: 0.05, reveal: { pw: { sigma: 0.2 } }, dimension: "conceptual",
            feedback: { close: "Right: about double, 12.32 Np/m.", far: "Here α is nearly ∝ σ: 12.32 Np/m." } },
        },
        {
          id: "alpha-num", title: "Check: Hayt D11.4's α",
          note: "A number.",
          patch: { pw: D114 },
          interaction: { id: "alpha-num", type: "numeric", prompt: "εr = 3.2, σ = 1.5 × 10⁻⁴ S/m, μr = 1, at 3 MHz. Find α, in Np/m.", answer: { value: 0.0156443, unit: "Np/m" }, relTol: 0.02, dimension: "computational",
            distractors: [{ value: 0.113558, unit: "Np/m", errorClass: "conceptual", tag: "WAVE_BETA_LAMBDA", feedback: "That's β. α is the real part of γ." }],
            hints: ["γ² = jωμ(σ + jωε).", "Or, as a good dielectric: α ≈ (σ/2)√(μ/ε).", "α is the real part."] },
        },
        {
          id: "lag-c", title: "Check: E and H",
          note: "Last one.",
          interaction: { id: "lag-c", type: "choose", prompt: "In a lossy medium, H relative to E…", dimension: "recognition",
            options: [
              choice("lag", "lags by θη", true, "Right."),
              choice("phase", "is in phase", false, "Only when σ = 0."),
              choice("lead", "leads by 90°", false, "The lag is at most 45°."),
            ] },
        },
      ],
      recap: {
        points: ["γ = √(jωμ(σ + jωε)) = α + jβ; η = |η|∠θη.", "The loss tangent σ/(ωε) classifies the medium.", "The amplitude decays as e^(−αz); H lags E by θη."],
        traps: ["f for ω.", "β taken as λ.", "H in phase with E in a lossy medium."],
      },
    },
  ],
});
```

Hand checks: D11.4 gives α = 0.0156443, β = 0.113558, η = 206.639∠7.84399°. The `decay` step uses z = 1/α = 0.16005 m, so Eamp = 10e⁻¹ = 3.67879. With σ = 0.2, α = 12.3232.

- [ ] **Step 3: `plates/idea-conductors.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice, eqp as in Plan K.
const sd = instantiate(templates.find((t) => t.id === "skin-depth")!, 1);
const CU1G = { f: 1e9, er: 1, sigma: 5.8e7, E0: 1, z: 0, t: 0 };

export const ideaConductors = defineIdeaPlate({
  id: "idea-conductors",
  title: "Dielectrics versus conductors; skin depth",
  requires: { objectives: [2], items: ["text:went-ex5.4", "text:went-ex5.7", "f2425r-q4c", "f2324-q4b", "hw04-2425-4.3"], misconceptions: ["SKIN_DEPTH"] },
  instances: [
    { id: "pw", component: "plane-wave", params: CU1G },
    { id: "eq", component: "equation", params: eqp(R`\alpha=\beta=\sqrt{\pi f\mu\sigma},\qquad \delta=\dfrac1\alpha`, "alpha equals beta equals root pi f mu sigma, and delta is one over alpha") },
  ],
  ideas: [
    {
      id: "conductors",
      title: "Dielectrics versus conductors; skin depth",
      objectives: [2],
      explain: [
        {
          id: "good", title: "Good conductors", show: ["pw", "eq"], focus: ["pw", "eq"],
          note: "When σ/(ωε) ≫ 1 the full γ simplifies to α = β = √(πfμσ). Copper at 1 GHz has σ/(ωε₀) = 1.04 × 10⁹, so α = β = 4.785 × 10⁵ per metre (Wentworth Example 5.4). The wave decays as fast as its phase turns: it dies within a fraction of a wavelength.",
          claims: [{ instance: "pw", readout: "alpha", value: 478513, unit: "Np/m" }, { instance: "pw", readout: "lossTan", value: 1.04256e9, unit: "" }],
        },
        {
          id: "skin", title: "Skin depth", focus: ["pw", "eq"],
          note: "The skin depth δ = 1/α = 1/√(πfμσ) is the depth at which the amplitude falls to e⁻¹, or 36.8%. For copper at 1 GHz, δ = 2.090 µm. High-frequency currents crowd into this thin skin, which is why RF conductors are plated or stranded, and why a thin metal sheet shields so well.",
          claims: [{ instance: "pw", readout: "delta", value: 2.08981e-6, unit: "m" }],
        },
        {
          id: "slow", title: "Slow waves, tiny η", focus: ["pw"],
          note: "Inside the metal, u = ω/β = 13.13 km/s, far slower than light, and η = 0.01167 Ω at 45°: almost a short circuit. That mismatch with free space's 377 Ω is why most of an incident wave reflects from a metal surface.",
          claims: [{ instance: "pw", readout: "u", value: 13130.6, unit: "m/s" }, { instance: "pw", readout: "eta", value: 0.0116676, unit: "Ω" }, { instance: "pw", readout: "thetaEta", value: 45, unit: "°" }],
        },
        {
          id: "sea", title: "Seawater", patch: { pw: { f: 1e6, er: 81, sigma: 4 } }, focus: ["pw"],
          note: "Seawater at 1 MHz: σ/(ωε) = 888, a good conductor. δ = 25.18 cm and λ = 1.580 m. A thousand times lower in frequency, δ grows to about 8 metres, which is why submarines communicate at very low frequencies.",
          claims: [{ instance: "pw", readout: "delta", value: 0.251788, unit: "m" }, { instance: "pw", readout: "lambda", value: 1.58025, unit: "m" }],
        },
      ],
      examples: [
        {
          id: "ex5.7", level: "basic", title: "Wentworth Example 5.7: copper at 10 MHz",
          setup: { pw: { ...CU1G, f: 1e7 } },
          problem: "Find α, the skin depth and η for copper (σ = 5.8 × 10⁷ S/m) at 10 MHz.",
          lines: [
            { text: "α = √(πfμσ) = √(π × 10⁷ × 4π × 10⁻⁷ × 5.8 × 10⁷) = 4.785 × 10⁴ Np/m.", focus: ["pw"], claims: [{ instance: "pw", readout: "alpha", value: 47851.3, unit: "Np/m" }] },
            { text: "δ = 1/α = 20.90 µm.", focus: ["pw"], claims: [{ instance: "pw", readout: "delta", value: 2.08981e-5, unit: "m" }] },
            { text: "η = √(ωμ/σ)∠45° = 0.001167 Ω∠45°.", focus: ["pw"], claims: [{ instance: "pw", readout: "eta", value: 0.00116676, unit: "Ω" }] },
          ],
          covers: ["text:went-ex5.7"],
          trap: "Dropping the square root: 1/(πfμσ) is not a length.",
        },
        {
          id: "sea1k", level: "tutorial", title: "Seawater at 1 kHz",
          setup: { pw: { f: 1e3, er: 81, sigma: 4, E0: 1, z: 0, t: 0 } },
          givens: [{ value: 1e6, unit: "Hz" }],
          problem: "Find the skin depth in seawater (σ = 4 S/m, εr = 81) at 1 kHz, and compare it with that at 1 MHz.",
          lines: [
            { text: "σ/(ωε) = 8.877 × 10⁵: a very good conductor, so α ≈ √(πfμσ).", focus: ["pw"], claims: [{ instance: "pw", readout: "lossTan", value: 887659, unit: "" }] },
            { text: "δ = 1/√(π × 10³ × 4π × 10⁻⁷ × 4) = 7.958 m.", focus: ["pw"], claims: [{ instance: "pw", readout: "delta", value: 7.95775, unit: "m" }] },
            { text: "At 1 MHz, δ = 25.18 cm: √1000 ≈ 31.6 times smaller, since δ ∝ 1/√f.", focus: ["pw"], givens: [{ value: 1e6, unit: "Hz" }] },
          ],
          covers: ["text:went-ex5.4"],
          trap: "Scaling δ by 1000 for a 1000× change in f. It scales as 1/√f.",
        },
        {
          id: "compare", level: "exam", title: "Resit Q4(c), Finals 2023-24 Q4(b) and HW04 4.3(a): dielectric versus conductor",
          setup: { pw: CU1G },
          problem: "Using appropriate diagrams, compare the propagation of EM waves in a dielectric and in a conductor.",
          lines: [
            { text: "Lossless dielectric (σ ≈ 0): α = 0, so the amplitude stays constant. β = ω√(με) and u = 1/√(με) < c. η = √(μ/ε) is real, so E and H are in phase.", focus: ["eq"] },
            { text: "Good conductor (σ ≫ ωε): α = β = √(πfμσ), so the wave decays within a few skin depths δ = 1/α. η = √(ωμ/σ)∠45° is tiny, and H lags E by 45°.", focus: ["pw"] },
            { text: "Diagrams: a constant-amplitude sinusoid for the dielectric; a sinusoid inside a shrinking exponential envelope for the conductor.", focus: ["pw"] },
          ],
          covers: ["f2425r-q4c", "f2324-q4b", "hw04-2425-4.3"],
          trap: "Saying waves can't enter conductors at all. They do, but only about a skin depth.",
        },
      ],
      asks: [
        { id: "skin-diel", q: "Is there a skin depth in a lossless dielectric?", tags: ["SKIN_DEPTH"], a: "No. There α = 0, so the wave never decays and δ = 1/α is infinite. Skin depth matters only in lossy media, above all in conductors." },
        { id: "sqrt", q: "Why the square root in δ?", tags: ["SKIN_DEPTH"], a: "In a good conductor α = √(πfμσ): attenuation grows as the square root of frequency and conductivity, not in proportion." },
        { id: "45", q: "Why is η's angle 45° in a conductor?", a: "η ≈ √(jωμ/σ) = √(ωμ/σ)∠45°. The j under the square root gives exactly 45°." },
        { id: "shield", q: "How thick must a shield be?", a: "A few skin depths. Five δ cuts the field to e⁻⁵, under 1%: about 10 µm of copper in the gigahertz range." },
        { id: "diel", q: "How does a wave in a good dielectric behave?", a: "It barely decays (α is small), travels at almost 1/√(με), and E and H stay almost in phase." },
        { id: "rf", q: "Why does the skin effect matter in RF engineering?", a: "Current flows only in the outer δ of a conductor, so its AC resistance is far above its DC resistance. Hayt D11.7's steel pipe shows the effect." },
      ],
      checks: [
        {
          id: "cond-c", title: "Check: a good conductor", show: ["pw", "eq"], patch: { pw: CU1G },
          note: "Four checks on conductors and skin depth. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "cond-c", type: "choose", prompt: "In a good conductor, α and β…", dimension: "recognition",
            options: [
              choice("equal", "are equal, both √(πfμσ)", true, "Right."),
              choice("zero", "α = 0", false, "That's a lossless medium."),
              choice("c", "β = ω/c", false, "That's free space.", "WAVE_MEDIUM"),
            ] },
        },
        {
          id: "predict-4f", title: "Check: four times the frequency",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-4f", type: "predict-drag", prompt: "Quadruple the frequency in the copper. Drag δ to your prediction.", target: { instance: "pw", readout: "delta" }, range: [0, 3e-6], unit: "m", relTol: 0.05, reveal: { pw: { f: 4e9 } }, dimension: "conceptual",
            feedback: { close: "Right: halved, to 1.045 µm.", far: "δ ∝ 1/√f: half, 1.045 µm." } },
        },
        {
          id: "skin-num", title: "Check: a skin depth, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "skin-num", type: "numeric", prompt: sd.prompt, answer: sd.spec.answer, distractors: sd.spec.distractors, relTol: sd.spec.relTol, hints: sd.hints, template: "skin-depth", dimension: "computational" },
        },
        {
          id: "compare-c", title: "Check: dielectric or conductor",
          note: "Last one.",
          interaction: { id: "compare-c", type: "choose", prompt: "Compared with a wave in a lossless dielectric, a wave in a good conductor…", dimension: "conceptual",
            options: [
              choice("right", "decays within a few skin depths, with H lagging E by 45°", true, "Right."),
              choice("faster", "travels faster", false, "It's far slower: u = ω/β with a huge β."),
              choice("same", "behaves the same", false, "σ changes everything."),
            ] },
          covers: ["f2425r-q4c"],
        },
      ],
      recap: {
        points: ["Good conductor: α = β = √(πfμσ); η = √(ωμ/σ)∠45°.", "Skin depth δ = 1/α; δ ∝ 1/√f.", "Good dielectric: α small, u ≈ 1/√(με), E and H nearly in phase."],
        traps: ["No square root in δ.", "A skin depth in a lossless medium.", "δ scaled by f instead of √f."],
      },
    },
  ],
});
```

Hand checks:
- Copper at 1 GHz: α = 478513, δ = 2.08981 µm, u = 13 130.6 m/s, η = 0.0116676 Ω, θη = 45.000°.
- Seawater at 1 MHz: δ = 0.251788 m, λ = 1.58025 m. At 1 kHz: δ = 7.95775 m.
- Copper at 4 GHz: δ = 1.04490 µm.

- [ ] **Step 4: `plates/idea-poynting.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice, eqp as in Plan K.
const pa = instantiate(templates.find((t) => t.id === "poynting-avg")!, 1);
const AIR = { f: 1e8, er: 1, sigma: 0, E0: 1, z: 0, t: 0 };
const CU10 = { f: 1e7, er: 1, sigma: 5.8e7, E0: 1, z: 0, t: 0 };

export const ideaPoynting = defineIdeaPlate({
  id: "idea-poynting",
  title: "Poynting's theorem and power",
  requires: { objectives: [3], items: ["text:went-ex5.6", "text:went-ex5.7", "f2425-q4c", "f2324-q4c", "hw04-2425-4.3"], misconceptions: ["POYNTING_HALF"] },
  instances: [
    { id: "pw", component: "plane-wave", params: AIR },
    { id: "eq", component: "equation", params: eqp(R`-\oint_S(\mathbf E\times\mathbf H)\cdot d\mathbf S=\dfrac{d}{dt}\int_v\left(\tfrac12\varepsilon E^2+\tfrac12\mu H^2\right)dv+\int_v\sigma E^2\,dv`, "Poynting's theorem") },
  ],
  ideas: [
    {
      id: "poynting",
      title: "Poynting's theorem and power",
      objectives: [3],
      explain: [
        {
          id: "theorem", title: "Energy conservation for fields", show: ["pw", "eq"], focus: ["eq"],
          note: "Poynting's theorem is the conservation of energy for fields (Wentworth §5.5). The power flowing into a volume through its surface, −∮(E × H)·dS, equals the rate of rise of the stored energy, (d/dt)∫(½εE² + ½μH²) dv, plus the power lost as heat, ∫σE² dv. The Poynting vector P = E × H, in W/m², is the power flow per unit area; it points along the wave's travel.",
        },
        {
          id: "avg", title: "The average power", patch: { eq: eqp(R`\mathbf P_{\text{ave}}=\dfrac{E_0^2}{2|\eta|}e^{-2\alpha z}\cos\theta_\eta\,\mathbf a_z`, "P average equals E nought squared over two eta, times e to the minus two alpha z, times cos theta eta") }, focus: ["pw", "eq"],
          note: "For a plane wave the time average is P_ave = (E₀²/2|η|)e^(−2αz) cos θη, along the travel. The ½ is the average of cos². Wentworth Example 5.6: 1 V/m at 100 MHz in air gives 1.327 mW/m², so a dish 20 cm across, of area π(0.1)², collects 41.7 µW.",
          claims: [{ instance: "pw", readout: "Pave", value: 0.00132721, unit: "W/m^2" }],
        },
        {
          id: "copper", title: "Into copper", patch: { pw: CU10 }, focus: ["pw"],
          note: "In a lossy medium, cos θη and the decay both matter. Wentworth Example 5.7: 1 V/m at the surface of copper at 10 MHz, where η = 0.001167 Ω at 45°, gives P_ave = cos 45°/(2 × 0.001167) = 303 W/m² at the surface. The tiny η makes a small field carry a lot of power density.",
          claims: [{ instance: "pw", readout: "Pave", value: 303.022, unit: "W/m^2" }],
        },
        {
          id: "depth", title: "One skin depth in", patch: { pw: { z: 2.08981e-5 } }, focus: ["pw"],
          note: "Power decays twice as fast as the field, as e^(−2αz). One skin depth, 20.9 µm, into the copper, it's down to e⁻², or 13.5%: 41.0 W/m². The power isn't lost; it heats the metal, which is the ∫σE² term of the theorem.",
          claims: [{ instance: "pw", readout: "Pave", value: 41.0096, unit: "W/m^2" }],
        },
      ],
      examples: [
        {
          id: "dish", level: "basic", title: "Wentworth Example 5.6: power into a dish",
          setup: { pw: AIR },
          problem: "E(z, t) = 1.0 cos(2π × 10⁸t − βz) ax V/m travels in air. Find the power normally incident on a receiving dish 20 cm in diameter.",
          lines: [
            { text: "P_ave = E₀²/(2η₀) = 1/(2 × 376.7) = 1.327 mW/m².", focus: ["pw"], claims: [{ instance: "pw", readout: "Pave", value: 0.00132721, unit: "W/m^2" }] },
            { text: "The area is π(0.1)² = 0.0314, in square metres, so P = 1.327 × 10⁻³ × 0.0314 = 41.7 µW.", focus: ["pw"] },
          ],
          covers: ["text:went-ex5.6"],
          trap: "Using the 20 cm diameter as the radius gives four times the power.",
        },
        {
          id: "er4", level: "tutorial", title: "A wave in a dielectric",
          setup: { pw: { ...AIR, er: 4, E0: 10 } },
          problem: "A 100 MHz plane wave of amplitude 10 V/m travels in a lossless nonmagnetic medium with εr = 4. Find η and the average power density.",
          lines: [
            { text: "η = 376.7/√4 = 188.4 Ω.", focus: ["pw"], claims: [{ instance: "pw", readout: "eta", value: 188.365, unit: "Ω" }] },
            { text: "P_ave = 10²/(2 × 188.4) = 0.2654 W/m².", focus: ["pw"], claims: [{ instance: "pw", readout: "Pave", value: 0.265442, unit: "W/m^2" }] },
          ],
          covers: ["text:went-ex5.7"],
          trap: "Using 377 Ω in the dielectric halves the answer.",
        },
        {
          id: "state", level: "exam", title: "Finals 2024-25 Q4(c), 2023-24 Q4(c) and HW04 4.3(b): describe it",
          setup: { pw: AIR },
          problem: "Briefly describe the transmission of electromagnetic wave power using Poynting's theorem. On what principle is it based, and how are the Poynting vector and the average power computed?",
          lines: [
            { text: "Poynting's theorem: the net power flowing into a volume equals the rate of increase of the stored electric and magnetic energy plus the ohmic power dissipated.", focus: ["eq"] },
            { text: "It rests on the conservation of energy.", focus: ["eq"] },
            { text: "P = E × H W/m², along the travel. For a plane wave, P_ave = ½Re(Es × Hs*) = (E₀²/2|η|)e^(−2αz) cos θη; multiply by an area for watts.", focus: ["eq"] },
          ],
          covers: ["f2425-q4c", "f2324-q4c", "hw04-2425-4.3"],
          trap: "Writing P = E·H. The Poynting vector is a cross product.",
        },
      ],
      asks: [
        { id: "half", q: "Why the ½ in P_ave?", tags: ["POYNTING_HALF"], a: "The instantaneous power goes as cos²(ωt − βz), whose time average is ½. Leaving it out doubles the answer." },
        { id: "dir", q: "Which way does P point?", a: "Along E × H, which for a plane wave is the direction of travel. The energy flows with the wave." },
        { id: "principle", q: "What principle is Poynting's theorem based on?", a: "Conservation of energy: power in through the surface equals the rise in stored field energy plus the power dissipated as heat." },
        { id: "phasor", q: "How do I write P_ave with phasors?", a: "P_ave = ½Re(Es × Hs*), with Hs* the complex conjugate. For a plane wave it reduces to (E₀²/2|η|)e^(−2αz) cos θη." },
        { id: "e2a", q: "Why does power decay as e^(−2αz)?", a: "Power goes as the field squared, and each field decays as e^(−αz)." },
        { id: "units", q: "What are the units?", a: "W/m²: power per unit area crossing a surface normal to the travel. Multiply by an area for watts, as with the dish." },
      ],
      checks: [
        {
          id: "half-c", title: "Check: average power", show: ["pw", "eq"], patch: { pw: AIR },
          note: "Four checks on Poynting's theorem. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "half-c", type: "choose", prompt: "In a lossless medium, a plane wave's average power density is…", dimension: "recognition",
            options: [
              choice("right", "E₀²/(2η)", true, "Right."),
              choice("full", "E₀²/η", false, "Missing the ½ from the time average.", "POYNTING_HALF"),
              choice("mult", "E₀η/2", false, "Power goes as E²/η."),
            ] },
        },
        {
          id: "predict-e", title: "Check: twice the field",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-e", type: "predict-drag", prompt: "Double the wave's amplitude. Drag P_ave to your prediction.", target: { instance: "pw", readout: "Pave" }, range: [0, 0.01], unit: "W/m^2", relTol: 0.05, reveal: { pw: { E0: 2 } }, dimension: "conceptual",
            feedback: { close: "Right: four times, 5.309 mW/m².", far: "P ∝ E₀²: four times, 5.309 mW/m²." } },
        },
        {
          id: "pave-num", title: "Check: power, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "pave-num", type: "numeric", prompt: pa.prompt, answer: pa.spec.answer, distractors: pa.spec.distractors, relTol: pa.spec.relTol, hints: pa.hints, template: "poynting-avg", dimension: "computational" },
        },
        {
          id: "decay-c", title: "Check: a skin depth in",
          note: "Last one.",
          interaction: { id: "decay-c", type: "choose", prompt: "One skin depth into a conductor, the average power density is…", dimension: "conceptual",
            options: [
              choice("e2", "e⁻² ≈ 13.5% of its surface value", true, "Right: power goes as the field squared."),
              choice("e1", "e⁻¹ ≈ 36.8% of its surface value", false, "That's the field; the power falls faster."),
              choice("zero", "zero", false, "It decays, but not to zero."),
            ] },
        },
      ],
      recap: {
        points: ["Poynting's theorem: energy conservation for fields.", "P = E × H (W/m²), along the travel.", "P_ave = (E₀²/2|η|)e^(−2αz) cos θη.", "Power decays as e^(−2αz): one skin depth gives e⁻²."],
        traps: ["Missing the ½.", "377 Ω in a medium.", "Power decaying as e^(−αz)."],
      },
    },
  ],
});
```

Hand checks:
- In air, 1/(2η₀) = 1.32721 mW/m².
- Copper at 10 MHz: cos 45°/(2 × 1.16676 × 10⁻³) = 303.022; one skin depth in, × e⁻² = 41.0096.
- εr = 4: η = 188.365, P = 0.265442.
- Twice the field in air: 5.30884 mW/m².

- [ ] **Step 5: Register and commit.**
  - In `plates/index.ts`, add the four plates.
  - In `electrostatics.ts`, delete `locked("em1.waves.plane-waves", …)`.
  - In `index.ts`, import `{ wavesConcept }` and add it after `faradayConcept`.
  - Run `pnpm test && pnpm typecheck`. Expected: PASS.

  ```bash
  git add packages/course-em1 && git commit -m "feat(course-em1): plane waves concept; reading TEM waves (Wentworth 4.1, P4.31; Hayt D11.1, D11.3), lossy media (Wentworth 5.1, 5.3; Hayt D11.4), conductors and skin depth (Wentworth 5.4, 5.7), Poynting (Wentworth 5.6, 5.7; Finals Q4(c))

  Co-Authored-By: Codex <noreply@openai.com>"
  ```

---

### Task 7: Coverage and verification

- [ ] **Step 1: Coverage loop (the only test edit).** In `f3-coverage.test.ts`, add `"em1.dynamic.faraday"` and `"em1.waves.plane-waves"` to the existing concept loop. Add no new assertions.
- [ ] **Step 2: Run** `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`. Expected: PASS.
  - If visual baselines of the map or concept list change (the locked list shrinks to none), update only those baselines and log a ruling naming them.
  - Add no new e2e specs.
- [ ] **Step 3: Walk at 1360×900:**
  - The plane-wave view shows E and H perpendicular and the travel arrow.
  - Its envelope appears only when α > 0.
  - The `move` step visibly shifts the crests.
  - The emf-loop arrows reverse with the emf's sign.
- [ ] **Step 4: Commit** the coverage edit and any baselines:

  ```bash
  git add -A packages/course-em1/test apps/web && git commit -m "test: dynamic fields and waves in the coverage loop

  Co-Authored-By: Codex <noreply@openai.com>"
  ```

  Then write the ledger line `Task 7: verification — <counts>` and stop for review.

## Self-Review Notes (Python, exact complex γ and η; ε₀ = 8.8541878128 × 10⁻¹², μ₀ = 4π × 10⁻⁷)

- **Faraday:** Wentworth Problem 4.9 gives 0.1 V and 10 mA; Problem 4.21 gives 67.8584 mV. Transformer peak 37.6991 V; at 120 Hz, 75.3982 V.
- **Displacement:**
  - Wentworth Problem 4.27: C = 239.063 pF, i_d = 1.50208 µA. Problem 4.29: C = 516.517 pF, i_d = 97.3611 µA.
  - Seawater: σ/(ωε) = 887.659 at 1 MHz; crossover 887.659 MHz; 88.7659 at 10 MHz.
  - Copper at 60 Hz: 1.73759 × 10¹⁶; Hayt D9.3(d) 57.55 pA/m² (book 57.6).
- **c** = 2.99792 × 10⁸ m/s.
- **TEM:**
  - 100 MHz in air: λ = 2.99792 m, β = 2.09585.
  - Wentworth Problem 4.31: u = 9.99308 × 10⁷, λ = 49.9654, η = 125.577, H = 0.796326, εr ≈ 9.005 (the paper's 0.1257 is rounded from π/25).
  - Hayt D11.1: f = 159.155 kHz, λ = 1883.65 m, T = 6.28319 µs, H = 0.663605 (book 159 kHz, 1.88 km, 6.28 µs, 0.663).
  - Hayt D11.3: β = 295.382, λ = 2.12714 cm, u = 1.99419 × 10⁸, η = 250.597, H = 1.99523 (book 295, 2.13, 1.99, 251, 1.99).
- **Lossy:**
  - Wentworth Example 5.1: α = 6.24807, β = 63.1850, η = 124.355∠5.64735°, loss tangent 0.199723 (book 6.25, 63.1, 124∠5.6°).
  - Example 5.3: H peak 80.42 mA/m with phase −0.0986 rad. The book's printed 81.0 mA/m uses a rounded η, so the plan teaches 80.4 and does not quote 81.0.
  - Hayt D11.4: 0.280861, 0.0156443, 0.113558, 206.639∠7.84399° (book 0.28, 0.016, 0.11, 207∠7.8°).
  - σ doubled: α = 12.3232.
- **Conductors:**
  - Copper at 1 GHz: α = β = 478 513, δ = 2.08981 µm, u = 13 130.6, η = 11.6676 mΩ∠45° (book 480 × 10³, 13 km/s).
  - Copper at 10 MHz: 47 851.3, 20.8981 µm, 1.16676 mΩ (book 47.8 × 10³, 21 µm, 1.17 mΩ).
  - Seawater: 1 MHz δ = 0.251788 m, λ = 1.58025 m; 1 kHz δ = 7.95775 m.
- **Poynting:**
  - Air at 1 V/m: 1.32721 mW/m²; the dish 41.70 µW (book 42 µW).
  - Copper at 10 MHz: 303.022 W/m² (book 300); at one δ, 41.0096.
  - εr = 4 at 10 V/m: 0.265442.
