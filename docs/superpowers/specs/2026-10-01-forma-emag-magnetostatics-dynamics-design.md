# Forma EMag Waves 6b and 6c: Magnetostatics, Dynamic Fields and Plane Waves

Date: 2026-10-01. Author: Claude (planning lead). Implementer: Codex, through Plans K and L.
Parent spec: `2026-09-26-forma-emag-electrostatics-assessments-design.md` (§6 sets the order: 6b, then 6c).

## 0. Intent

- Finish the course content for Units 3, 4 and 5 at the same depth as wave 6a. Every idea keeps the floor:
  - ≥ 3 explanations of ≤ 180 words;
  - basic, tutorial and exam worked examples;
  - ≥ 6 asks of ≤ 80 words;
  - ≥ 4 checks;
  - a recap.
- **The textbook is the spine.** The module outline sets Wentworth (Ch. 3, 4 and 5) as the reading, and the lecturer's illustrative problems come from Hayt's drill problems (D7.x, D8.x, D9.x, D11.x), which print their answers.
  - Every idea cites its Wentworth section.
  - Worked examples come from, in order: lectures 3a and 3b; homework; ICT 2; finals; Hayt drills; Wentworth examples.
  - Every value is solved independently and cross-checked against the printed answer.
- **Assessments.** ICT 2 (16 Nov) covers Units 3 and 4. Finals (15 Dec) cover everything; Q3 is always magnetostatics and Q4 always dynamic fields and waves. ICT 1 (12 Oct) includes Ampère (week 6), so Plan K's first concept matters for ICT 1 too.
- **Workflow (user, 2026-10-01): no new tests.** Verification is:
  - plate claims, checked by `validatePlate`/`validateIdeas` against the model;
  - the existing generic loops (template seeds, F2's field finite differences, concept coverage);
  - typecheck, build and e2e.

  Physics is checked by the claims that use it, and by independent solving recorded in each plan.

## 1. Content map

| Concept id | Title | Unit | Ideas | Mapped items (bank) |
|---|---|---|---|---|
| `em1.magnetostatics.ampere` (unlock) | Biot–Savart and Ampère's law | 3 | 4: H, B, flux and force; Biot–Savart; Ampère's circuital law; curl and Stokes | f2425 q3a, q4a; f2324 q3a, q3b, q4a; f1415 q2a, q3a, q3b, q4; f1516 q2c; f1718 q3a–c; f2425r q3a; hw03 3.1a, 3.1b; ict2 q1 |
| `em1.magnetostatics.materials` (new) | Magnetic materials and boundaries | 3 | 2: magnetization, χm and μr; boundary conditions and refraction | f2425 q3b; f2324 q3c; f1718 q4a; f2425r q3b; f1516 q4c; ict2 q3; hw03 3.3; drill25 q8, q9 |
| `em1.magnetostatics.inductance` (new) | Inductance and magnetic energy | 3 | 2: self-inductance (coax, two-wire, solenoid, toroid); energy and mutual inductance | f1415 q2b; f1718 q4b |
| `em1.dynamic.faraday` (unlock) | Faraday's law and Maxwell's equations | 4 | 3: Faraday's law (transformer and motional emf; proof via Stokes); displacement current; Maxwell's equations and their significance | f2425 q4b; f2324 q3a; f1516 q4a; f2425r q4a; hw04 4.1; drill24 q8 |
| `em1.waves.plane-waves` (unlock) | Plane waves and power | 5 | 4: the wave equation and lossless TEM waves; lossy media and skin depth; dielectric versus conductor; Poynting's theorem | f2425 q4c; f2324 q4b, q4c; f2425r q4b, q4c; hw04 4.2, 4.3 |

**Bank remap.** Plan J maps every magnetostatics item to `em1.magnetostatics.ampere`. Plan K moves the materials and inductance items to their new concepts. The ICT 1 scope (units 1–2 plus `em1.magnetostatics.ampere`) is unchanged.

## 2. Plate engine additions

- **Plan K:**
  - `currents`: H from a list of currents at a probe. The kinds are:
    - an infinite `line` (any direction);
    - a finite `segment`;
    - a circular `loop` (N turns, axis z; Biot–Savart by quadrature);
    - a uniform `cylinder` (a ≤ ρ ≤ b, solid when a = 0);
    - a cylindrical `sheet` K.

    Readouts: H components, |H|, Hφ about z, |B| = μrμ₀|H|, and I_enc inside the circle through the probe (Ampère).
  - `mag-boundary`: the magnetic twin of Plan I's `boundary`. It reuses `dielectricBoundary` with B ↔ D, H ↔ E, μ ↔ ε and M ↔ P/μ₀, and is given H₁ or B₁. It assumes K = 0, as every course question does. Readouts: the split of H₁, H, B, M, angles and magnitudes.
  - `inductor`: coax (external, plus optional internal), two-wire, solenoid and square-section toroid. Readouts: L, flux linkage and W = ½LI².
  - `vector-slice` gains a rectangular loop (`loopH`), for Stokes' theorem on Hayt D7.6.
  - New fields: `d7.6`, `d7.5a`, `f1718-3c` and `filament` (I = 1).
  - Units: T, A/m, Wb and H (henry).
- **Plan L:**
  - `emf-loop`: Faraday's law for an N-turn loop of area S, in B(t) = B₀ sin ωt (transformer emf) or as a sliding bar (motional emf). Readouts: Φ, peak emf and emf at time t.
  - `plane-wave`: a uniform plane wave in a medium (f, εr, μr, σ, E₀). Readouts:
    - α, β, λ, u, |η|, θη, δ and the loss tangent σ/ωε;
    - E and H at (z, t);
    - the average Poynting power density.

    Its view draws E and H along z, with decay in lossy media. Plate time t is a parameter the steps tween, so the wave moves between steps.
  - Units: Np/m, rad/m, rad/s, W/m² and Ω (existing).

## 3. Plans

| Plan | Covers | Ideas |
|---|---|---|
| J | Bank: 52 past-paper and drill items with worked solutions | 0 |
| K | 6b magnetostatics (three concepts) | 8 |
| L | 6c dynamic fields and plane waves (two concepts) | 7 |

The Codex queue is J → K → L. J first because ICT 1 is on 12 Oct and most new items are Unit 2 or Ampère.

## 4. Success criteria

- Every bank item from §1 is worked or checked in its concept's ideas.
- The magnetic boundary reproduces:
  - Finals 2024-25 Q3(b), Finals 2023-24 Q3(c), HW03 3.3 and ICT 2 Q3;
  - the lecturer's numbers: HW03 3.3 H₂ = (10.00, 7.317, −11.08)/μ₀ with 76.35° and 80.80°; ICT 2 θ₂ = 79.41°.
- `currents` reproduces Hayt D7.2, D7.3 and D7.7, and HW03 3.1(a) (128.0 A/m).
- `inductor` reproduces Hayt D8.12(a) (56.3 µH), D8.12(b) (1.01 mH) and D8.13(a) (133.2 mH).
- `plane-wave` reproduces Hayt D11.1, D11.3 and D11.4, and the Wentworth chapter 5 examples used.
- No new test files or test cases. The suite stays green.
