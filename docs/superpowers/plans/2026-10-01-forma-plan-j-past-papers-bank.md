# Forma Plan J: Past Papers 2014–2019, the 24-25 Resit and the Drills, Mined into the Question Bank

> **For agentic workers (Codex):** read `AGENTS.md` first. Plans F1–I must be complete. Transcribe item text and solutions exactly. Every answer below was solved independently in Python and SymPy (`scratchpad/j_solve.py`; outputs in the Self-Review Notes). Lecturer drafts were used only as cross-checks.
>
> **Workflow rule (user, 2026-10-01): add no new test files and no new test cases.** The suite is already large. Verification is the existing suite plus typecheck, build and e2e. The single test edit allowed is the one this plan names: the exact id list in `questions.test.ts`, which must grow because it is an exact inventory.

**Goal:** add every remaining past-paper and drill question to the question bank, each with a worked solution, and show the solutions on the Question bank page.

**Why now:**
- ICT 1 (12 Oct) covers Unit 2 and Ampère. Most of the new items are electrostatics or Ampère.
- The drills are the lecturer's own revision sets, and he reuses questions: the same few questions appear in 2015, 2018, 2019 and both drills. `seenIn` records each reuse.

**Sources (catalog ids):**
- Finals: `f1415` (Apr/May 2015), `f1516`, `f1718`, `f1819s1`, `f1819s3`, `f2425r` (Dec 2024 resit, with the lecturer's solution).
- Drills: `drill23` (10 questions, 3 of them from papers not in the drop: Finals 2015 Sem 3 Q1 and Q5, Finals 2014 Sem 2 Q1), `drill24`, `drill25`.

**Ledger:** `.superpowers/sdd/2026-10-01-forma-plan-j-past-papers-bank/progress.md`

## Global Constraints

- Item ids are `<catalog id>-q<n><part>`, for example `f1718-q4a`. When a question was set more than once, it lives under its earliest paper, and `seenIn` lists every catalog id that set it, earliest first.
- Magnetostatics items map to `em1.magnetostatics.ampere`, dynamic-field items to `em1.dynamic.faraday`, and wave items to `em1.waves.plane-waves`. Plan K splits magnetostatics into three concepts and remaps these items.
- **Constants.** The 2014–2019 papers print ε₀ = 8.85 × 10⁻¹² F/m and μ₀ = 4π × 10⁻⁷ H/m. Solutions use the package's ε₀ = 8.854 × 10⁻¹². Where the paper's constant changes the fourth significant figure, the solution gives both values.
- Solutions are plain text with Unicode maths, one step per array entry, ending with the answer. They are not linted (they are not plate text), so every number in them comes from the Self-Review Notes.
- **Paper errors are kept and labelled, never silently fixed:**
  - `f1516` Q4(c) says "in medium 2" but labels the vector B₁; the solution reads it as medium 1.
  - `drill24` Q3 says "relative permeability" where it means permittivity.
  - `f2425r` Q2(b): the lecturer's handwritten flux is 2.557 µC, exactly half the correct 5.115 µC. The solution notes this.

## Review Focus

1. **Duplicates.** No question appears twice under different ids. The shared ones carry `seenIn`:
   - the cylinder and the spheres (`f1415`, `f1819s1`, `drill24`);
   - the coax and the two-wire line (`f1415`, `f1516`, `f1819s1`);
   - the current sheets (`f1415`, `f1819s1`, `drill23`);
   - the `f1718` Q3 and Q4 set (`f1718`, `f1819s3`, `drill23`, `drill24`);
   - the z = 0 dielectric with energy (`f1819s1`, `f1819s3`, `drill23`);
   - V = 10 sin θ cos φ / r² (`f1819s3`, `drill23`).
2. **Signs.**
   - The resit Q1(a) force on Q₂ is attractive: every component is negative.
   - In resit Q3(a) the current flows down, so J points along −âz and B along −âφ.
   - In `f1415` Q3(a) the current also flows down, so H points along −âφ outside the sphere.
3. **The solution panel** stays collapsed by default (a `<details>` element), so the page doesn't spoil answers. It is keyboard-operable and passes axe.
4. **Locked concepts.** Items on still-locked concepts (magnetostatics, dynamic fields, waves) show "Coming in a later build" today. The worked solution still shows.

---

### Task 1: Solutions on bank items, and on the page

**Files:**
- Modify: `app/packages/course-em1/src/questions.ts` (type)
- Modify: `app/apps/web/app/past-papers/page.tsx`

- [ ] **Step 1: The type.** Add this field to `BankItem`:

```ts
  /** Worked solution, one step per entry, ending with the answer. Solved independently; see the plan that added it. */
  solution?: string[];
```

- [ ] **Step 2: The page.** In `page.tsx`, directly after `<p className="read">{q.text}</p>`, insert:

```tsx
            {q.solution && (
              <details>
                <summary className="label cursor-pointer">Worked solution</summary>
                <ol className="read mt-2 list-decimal space-y-1 pl-5">
                  {q.solution.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </details>
            )}
```

- [ ] **Step 3: Run** `pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1/src/questions.ts apps/web/app/past-papers/page.tsx && git commit -m "feat: worked solutions on question-bank items, collapsed by default

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 2: The items

**Files:** `app/packages/course-em1/src/questions.ts`; `app/packages/course-em1/test/questions.test.ts` (the `want` list only).

- [ ] **Step 1: Paper labels.** Add these next to the existing `MST`, `ICT2`… constants:

```ts
const F1415 = "Finals 2014-15 (Apr/May 2015)";
const F1516 = "Finals 2015-16 Sem 1";
const F1718 = "Finals 2017-18 Sem 1";
const F1819S1 = "Finals 2018-19 Sem 1";
const F1819S3 = "Finals 2018-19 Sem 3";
const F2425R = "Finals 2024-25 Sem 1 (resit)";
const DR23 = "Drill 2023";
const DR24 = "Drill 2024";
const DR25 = "Drill 2025";
```

- [ ] **Step 2: Append the items** to the end of `questionBank`, in this order.

```ts
  // Finals 2014-15, Apr/May 2015 (catalog: f1415). ε₀ printed as 8.85 × 10⁻¹².
  {
    id: "f1415-q1a", source: "f1415", kind: "finals", paper: F1415, question: "Q1(a)", marks: 10, seenIn: ["f1415", "f1819s1", "drill24"],
    text: "Determine the electric field outside and within an infinitely long cylinder of radius a that bears a surface charge distribution ρS C/m², uniformly distributed both along the cylinder's length and around its periphery.",
    concepts: w([K.gapp, 1]), practice: "em1.electrostatics.gauss-applications/main",
    solution: [
      "Symmetry: D is radial (aρ) and depends only on ρ. Use a closed cylinder of radius ρ and length L.",
      "Inside (ρ < a): the surface encloses no charge, so D = 0 and E = 0.",
      "Outside (ρ > a): D · 2πρL = ρS · 2πaL, so D = aρS/ρ.",
      "E = aρS/(ε₀ρ) aρ V/m for ρ > a; E = 0 for ρ < a.",
    ],
  },
  {
    id: "f1415-q1b", source: "f1415", kind: "finals", paper: F1415, question: "Q1(b)", marks: 15, seenIn: ["f1415", "f1819s1", "drill24"],
    text: "Determine the voltage between two concentric spheres of radii a and b, a < b. The inner sphere carries total charge Q uniformly over its surface, and the outer sphere carries −Q over its inner surface.",
    concepts: w([K.pot, 0.6], [K.gapp, 0.4]), practice: "em1.electrostatics.potential/main",
    solution: [
      "Gauss's law with a sphere of radius r between them: E = Q/(4πε₀r²) ar for a < r < b.",
      "V_ab = −∫ from b to a of E·dL = −∫_b^a Q/(4πε₀r²) dr.",
      "V_ab = (Q/4πε₀)(1/a − 1/b), positive: the inner sphere is at the higher potential.",
    ],
  },
  {
    id: "f1415-q2a", source: "f1415", kind: "finals", paper: F1415, question: "Q2(a)", marks: 10, seenIn: ["f1415", "f1516", "f1819s1"],
    text: "Determine the magnetic field of a coaxial cable having an inner conductor of radius a and an outer cylinder of interior radius b.",
    concepts: w([K.amp, 1]),
    solution: [
      "Let the inner conductor carry I (uniform), with −I returning on the outer cylinder. Ampère's law on a circle of radius ρ: H · 2πρ = I_enc.",
      "ρ < a: I_enc = I ρ²/a², so H = Iρ/(2πa²) aφ.",
      "a < ρ < b: I_enc = I, so H = I/(2πρ) aφ.",
      "Outside the outer conductor: I_enc = I − I = 0, so H = 0.",
    ],
  },
  {
    id: "f1415-q2b", source: "f1415", kind: "finals", paper: F1415, question: "Q2(b)", marks: 15, seenIn: ["f1415", "f1516", "f1819s1"],
    text: "Determine the per-unit-length inductance of a transmission line of two parallel cylindrical wires of radius a and separation s, in air.",
    concepts: w([K.amp, 1]),
    solution: [
      "Currents I and −I. Between the wires on the line joining them, each wire's field is μ₀I/(2πx) and the two add.",
      "Flux per metre between the wires: Φ' = ∫_a^(s−a) [μ₀I/(2πx) + μ₀I/(2π(s − x))] dx = (μ₀I/π) ln((s − a)/a).",
      "External inductance: L'_ext = Φ'/I = (μ₀/π) ln((s − a)/a) ≈ (μ₀/π) ln(s/a) for s ≫ a.",
      "Each wire adds an internal μ₀/(8π), so L' = (μ₀/π)[¼ + ln((s − a)/a)] H/m.",
    ],
  },
  {
    id: "f1415-q3a", source: "f1415", kind: "finals", paper: F1415, question: "Q3(a)", marks: 15, seenIn: ["f1415", "f1819s1"],
    text: "A hollow spherical conducting shell of radius a has filamentary connections at the top (r = a, θ = 0) and bottom (r = a, θ = π). A direct current I flows down the upper filament, down the spherical surface and out the lower filament. Find H in spherical coordinates (a) inside and (b) outside the sphere. (Hayt Problem 7.10.)",
    concepts: w([K.amp, 1]),
    solution: [
      "Symmetry about the z axis: H = Hφ aφ. Take a circle of radius r sin θ at constant r and θ.",
      "Inside (r < a): any surface on that circle that stays inside the sphere carries no current, so H = 0.",
      "Outside (r > a): a cap on the circle is pierced by the filament carrying I in the −z direction.",
      "H · 2πr sin θ = −I, so H = −I/(2πr sin θ) aφ A/m for r > a (the current flows down, so H circulates in −aφ).",
    ],
  },
  {
    id: "f1415-q3b", source: "f1415", kind: "finals", paper: F1415, question: "Q3(b)", marks: 10, seenIn: ["f1415", "f1819s1", "drill23"],
    text: "An infinite filament on the z axis carries 20π mA in the az direction. Three uniform cylindrical current sheets are also present: 400 mA/m at ρ = 1 cm, −250 mA/m at ρ = 2 cm and −300 mA/m at ρ = 3 cm. Calculate Hφ at ρ = 0.5, 1.5, 2.5 and 3.5 cm. (Hayt Problem 7.11.)",
    concepts: w([K.amp, 1]),
    solution: [
      "Hφ = I_enc/(2πρ). A sheet K at radius R carries 2πRK.",
      "Sheet currents: 2π(0.01)(0.4) = 25.13 mA; 2π(0.02)(−0.25) = −31.42 mA; 2π(0.03)(−0.3) = −56.55 mA. The filament: 20π = 62.83 mA.",
      "ρ = 0.5 cm: 62.83 mA → Hφ = 2.000 A/m.",
      "ρ = 1.5 cm: 87.96 mA → Hφ = 0.9333 A/m.",
      "ρ = 2.5 cm: 56.55 mA → Hφ = 0.3600 A/m.",
      "ρ = 3.5 cm: 0 mA (the currents cancel) → Hφ = 0.",
    ],
  },
  {
    id: "f1415-q4", source: "f1415", kind: "finals", paper: F1415, question: "Q4", marks: 25,
    text: "A long straight nonmagnetic conductor of 0.2 mm radius carries a uniformly distributed 2 A d.c. (a) Find J within it. (b) Use Ampère's circuital law to find H and B within it. (c) Show that ∇ × H = J within it. (d) Find H and B outside it. (e) Show that ∇ × H = J outside it.",
    concepts: w([K.amp, 0.8], [K.calc, 0.2]),
    solution: [
      "(a) J = I/(πa²) = 2/(π(2 × 10⁻⁴)²) = 1.592 × 10⁷ az A/m².",
      "(b) Inside, I_enc = Iρ²/a²: H = Iρ/(2πa²) = 7.958 × 10⁶ ρ aφ A/m, and B = μ₀H = 10.00ρ aφ T.",
      "(c) ∇ × H = (1/ρ) d(ρHφ)/dρ az = (1/ρ) d(Iρ²/(2πa²))/dρ az = I/(πa²) az = J. ✓",
      "(d) Outside: H = I/(2πρ) = 0.3183/ρ aφ A/m, and B = 4 × 10⁻⁷/ρ aφ T.",
      "(e) ∇ × H = (1/ρ) d(ρ · I/(2πρ))/dρ az = 0, and J = 0 outside. ✓",
    ],
  },

  // Finals 2015-16 Sem 1 (catalog: f1516). ε₀ printed as 8.85 × 10⁻¹².
  {
    id: "f1516-q1a", source: "f1516", kind: "finals", paper: F1516, question: "Q1(a)", marks: 5,
    text: "Charge is distributed non-uniformly over a disk of radius 2 m with ρS = 10⁻⁶ r C/m². Determine the total charge on the disk.",
    concepts: w([K.gapp, 0.6], [K.vec, 0.4]), practice: "em1.electrostatics.gauss-applications/main",
    solution: [
      "dS = r dr dφ on the disk.",
      "Q = ∫₀^2π ∫₀² 10⁻⁶ r · r dr dφ = 2π × 10⁻⁶ × (2³/3).",
      "Q = 1.676 × 10⁻⁵ C = 16.76 µC.",
    ],
  },
  {
    id: "f1516-q1b", source: "f1516", kind: "finals", paper: F1516, question: "Q1(b)", marks: 10,
    text: "An infinite sheet with uniform charge density ρS C/m² lies in the xz plane. Determine the electric field at a distance d from it.",
    concepts: w([K.field, 1]), practice: "em1.electrostatics.field/main",
    solution: [
      "By symmetry E is normal to the sheet (±ay) and the same size on both sides. Use a pillbox of face area A straddling the sheet.",
      "Gauss: 2DA = ρS A, so D = ρS/2.",
      "E = ρS/(2ε₀) ay for y = d > 0, and −ρS/(2ε₀) ay for y = −d. Its size doesn't depend on d.",
    ],
  },
  {
    id: "f1516-q2a", source: "f1516", kind: "finals", paper: F1516, question: "Q2(a)", marks: 5,
    text: "A coaxial line has an inner cylinder of radius a and an outer cylinder of radius b. Determine the electric field between them.",
    concepts: w([K.gapp, 1]), practice: "em1.electrostatics.gauss-applications/main",
    solution: [
      "Let the inner conductor carry ρL per metre. A Gaussian cylinder of radius ρ (a < ρ < b) and length L encloses ρL L.",
      "D · 2πρL = ρL L, so D = ρL/(2πρ).",
      "E = ρL/(2πε ρ) aρ for a < ρ < b (ε = ε₀ in air), and zero elsewhere.",
    ],
  },
  {
    id: "f1516-q2b", source: "f1516", kind: "finals", paper: F1516, question: "Q2(b)", marks: 10,
    text: "Determine the voltage between the inner and outer cylinders of a coaxial cable.",
    concepts: w([K.pot, 0.6], [K.cap, 0.4]), practice: "em1.electrostatics.capacitance/main",
    solution: [
      "V_ab = −∫ from b to a of ρL/(2περ) dρ.",
      "V_ab = (ρL/2πε) ln(b/a), the inner conductor positive.",
      "So the capacitance per metre is C' = ρL/V_ab = 2πε/ln(b/a).",
    ],
  },
  {
    id: "f1516-q2c", source: "f1516", kind: "finals", paper: F1516, question: "Q2(c)", marks: 10,
    text: "Determine the magnetic flux density due to a circular current loop of radius a at a distance d from its centre, on the axis perpendicular to the loop.",
    concepts: w([K.amp, 1]),
    solution: [
      "Biot–Savart: dH = I dL × aR/(4πR²), with R = √(a² + d²) from every element.",
      "By symmetry the radial parts cancel; each element contributes dH cos α along the axis, with cos α = a/R.",
      "H = I · 2πa · a/(4πR³) = Ia²/(2(a² + d²)^(3/2)) az.",
      "B = μ₀Ia²/(2(a² + d²)^(3/2)) az T.",
    ],
  },
  {
    id: "f1516-q4a", source: "f1516", kind: "finals", paper: F1516, question: "Q4(a)", marks: 4, seenIn: ["f1516", "f1819s1", "drill23"],
    text: "State Maxwell's equations in both integral and point form.",
    concepts: w([K.dyn, 1]),
    solution: [
      "Gauss (electric): ∇·D = ρv ⇔ ∮S D·dS = ∫v ρv dv.",
      "Gauss (magnetic): ∇·B = 0 ⇔ ∮S B·dS = 0.",
      "Faraday: ∇ × E = −∂B/∂t ⇔ ∮L E·dL = −(d/dt)∫S B·dS.",
      "Ampère–Maxwell: ∇ × H = J + ∂D/∂t ⇔ ∮L H·dL = ∫S (J + ∂D/∂t)·dS.",
    ],
  },
  {
    id: "f1516-q4b", source: "f1516", kind: "finals", paper: F1516, question: "Q4(b)", marks: 11, seenIn: ["f1516", "drill23"],
    text: "The boundary between two media lies in the xy plane (Figure 3: εr1 = 9 for z < 0, εr2 = 4 for z > 0). In medium 1 at the boundary, E1 = 2ax + 3ay + 4az V/m. Determine the electric field intensity and the electric flux density in medium 2 at the boundary.",
    concepts: w([K.diel, 1]), practice: "em1.electrostatics.dielectrics/main",
    solution: [
      "The normal is az. Tangential E is continuous: E2x = 2, E2y = 3.",
      "Normal D is continuous (no surface charge): εr1E1z = εr2E2z, so E2z = 9 × 4/4 = 9.",
      "E2 = 2ax + 3ay + 9az V/m.",
      "D2 = 4ε₀E2 = (7.083ax + 10.63ay + 31.88az) × 10⁻¹¹ C/m². (With ε₀ = 8.85 × 10⁻¹²: (7.080, 10.62, 31.86) × 10⁻¹¹.)",
    ],
  },
  {
    id: "f1516-q4c", source: "f1516", kind: "finals", paper: F1516, question: "Q4(c)", marks: 10, seenIn: ["f1516", "drill23"],
    text: "In Q4(b)'s geometry (μr1 = 1, μr2 = 16), the magnetic flux density at the boundary is B1 = 5ax + 6ay + 7az Wb/m². Determine the magnetic field intensity in medium 2 at the boundary. (The paper says \"in medium 2\" but labels the vector B1; it is read as medium 1.)",
    concepts: w([K.amp, 1]),
    solution: [
      "The normal is az. Normal B is continuous: B2z = 7, so H2z = 7/(16μ₀).",
      "Tangential H is continuous (no surface current): H2x = H1x = 5/μ₀ and H2y = 6/μ₀.",
      "H2 = (5ax + 6ay + 0.4375az)/μ₀ = 3.979 × 10⁶ ax + 4.775 × 10⁶ ay + 3.482 × 10⁵ az A/m.",
    ],
  },

  // Finals 2017-18 Sem 1 (catalog: f1718). ε₀ printed as 8.85 × 10⁻¹².
  {
    id: "f1718-q1a", source: "f1718", kind: "finals", paper: F1718, question: "Q1(a)", marks: 15,
    text: "Region 1 (x < 0) is free space; region 2 (x > 0) is a dielectric with εr2 = 2.4. Given D1 = 3ax − 4ay + 6az C/m², find E2 and the angles θ1 and θ2 (from the normal).",
    concepts: w([K.diel, 1]), practice: "em1.electrostatics.dielectrics/main",
    solution: [
      "n̂ = ax. D1n = 3ax; D1t = −4ay + 6az.",
      "D2n = 3ax (ρS = 0), so E2x = 3/(2.4ε₀). E2t = E1t = (−4ay + 6az)/ε₀.",
      "E2 = (1.25ax − 4ay + 6az)/ε₀ = 1.412 × 10¹¹ ax − 4.518 × 10¹¹ ay + 6.776 × 10¹¹ az V/m.",
      "θ1 = tan⁻¹(√52/3) = 67.41°; θ2 = tan⁻¹(2.4 × √52/3) = 80.17°.",
    ],
  },
  {
    id: "f1718-q1b", source: "f1718", kind: "finals", paper: F1718, question: "Q1(b)", marks: 10,
    text: "A parallel-plate capacitor of plate area 1 m² holds two layers: 1 mm of dielectric with εr1 = 5 and 3 mm of free space (Figure 2). Find the voltage across each dielectric when 200 V is applied.",
    concepts: w([K.cap, 1]), practice: "em1.electrostatics.capacitance/main",
    solution: [
      "Series layers: C1 = 5ε₀(1)/10⁻³ = 5000ε₀ and C2 = ε₀(1)/(3 × 10⁻³) = 1000ε₀/3.",
      "C = C1C2/(C1 + C2) = 312.5ε₀ = 2.767 nF. Q = CV is the same on both.",
      "V1 = Q/C1 = 200 × 312.5/5000 = 12.5 V across the dielectric.",
      "V2 = Q/C2 = 187.5 V across the free space: the thin low-εr gap takes most of the voltage.",
    ],
  },
  {
    id: "f1718-q2", source: "f1718", kind: "finals", paper: F1718, question: "Q2", marks: 25, seenIn: ["f1718", "drill23"],
    text: "Find the force on a point charge of 50 µC at (0, 0, 5) m due to a charge of 500π µC uniformly distributed over the disk r ≤ 5 m, z = 0.",
    concepts: w([K.field, 0.6], [K.coul, 0.4]), practice: "em1.electrostatics.field/main",
    solution: [
      "ρS = 500π µC/(π · 5²) = 20 µC/m².",
      "On the axis at height h, a uniform disk gives Ez = (ρS/2ε₀)(1 − h/√(h² + a²)); the radial parts cancel.",
      "Ez = (20 × 10⁻⁶/(2ε₀))(1 − 5/√50) = 3.308 × 10⁵ V/m.",
      "F = qE = 50 × 10⁻⁶ × 3.308 × 10⁵ = 16.54 az N (repulsive, along +z).",
    ],
  },
  {
    id: "f1718-q3a", source: "f1718", kind: "finals", paper: F1718, question: "Q3(a)", marks: 5, seenIn: ["f1718", "f1819s3", "drill23"],
    text: "State Ampère's circuital law.",
    concepts: w([K.amp, 1]),
    solution: [
      "The line integral of H around any closed path equals the net current enclosed by that path: ∮L H·dL = I_enc.",
      "In terms of current density: ∮L H·dL = ∫S J·dS; point form: ∇ × H = J (statics).",
    ],
  },
  {
    id: "f1718-q3b", source: "f1718", kind: "finals", paper: F1718, question: "Q3(b)", marks: 5, seenIn: ["f1718", "f1819s3", "drill23"],
    text: "A hollow conducting cylinder has inner radius a and outer radius b and carries current I along the z direction. Find H everywhere.",
    concepts: w([K.amp, 1]),
    solution: [
      "J = I/(π(b² − a²)) az in the wall. Ampère's law on a circle of radius ρ: H · 2πρ = I_enc.",
      "ρ < a: I_enc = 0, so H = 0.",
      "a < ρ < b: I_enc = I(ρ² − a²)/(b² − a²), so H = I(ρ² − a²)/(2πρ(b² − a²)) aφ.",
      "ρ > b: H = I/(2πρ) aφ.",
    ],
  },
  {
    id: "f1718-q3c", source: "f1718", kind: "finals", paper: F1718, question: "Q3(c)", marks: 15, seenIn: ["f1718", "f1819s3", "drill23"],
    text: "In a conducting region, H = yz(x² + y²) ax − y²xz ay + 4x²y² az A/m. (i) Determine J at (5, 2, −3). (ii) Find the current through x = −1, 0 < y, z < 2. (iii) Show that ∇·B = 0.",
    concepts: w([K.amp, 0.6], [K.calc, 0.4]),
    solution: [
      "J = ∇ × H = xy(8x + y) ax + y(x² − 8xy + y²) ay − z(x² + 4y²) az.",
      "(i) At (5, 2, −3): J = 420ax − 102ay + 123az A/m².",
      "(ii) On x = −1, Jx = 8y − y², so I = ∫₀² ∫₀² (8y − y²) dy dz = 2 × (16 − 8/3) = 26.67 A (along +ax).",
      "(iii) ∇·H = 2xyz − 2xyz + 0 = 0, so ∇·B = μ₀∇·H = 0. ✓",
    ],
  },
  {
    id: "f1718-q4a", source: "f1718", kind: "finals", paper: F1718, question: "Q4(a)", marks: 15, seenIn: ["f1718", "f1819s3", "drill23"],
    text: "Given H1 = −2ax + 6ay + 4az A/m in the region y − x − 2 ≤ 0, where μ1 = μ0, calculate (i) M1 and B1, (ii) H2 and B2 in the region y − x − 2 ≥ 0, where μ2 = 2μ0.",
    concepts: w([K.amp, 1]),
    solution: [
      "(i) μr1 = 1, so χm1 = 0 and M1 = 0. B1 = μ₀H1 = −2.513ax + 7.540ay + 5.027az µT.",
      "Normal: n̂ = (−ax + ay)/√2. H1·n̂ = 8/√2, so H1n = −4ax + 4ay and H1t = 2ax + 2ay + 4az.",
      "Tangential H is continuous: H2t = 2ax + 2ay + 4az. Normal B is continuous: H2n = (μ1/μ2)H1n = −2ax + 2ay.",
      "(ii) H2 = 4ay + 4az A/m; B2 = 2μ₀H2 = 10.05ay + 10.05az µT. (M2 = χm2H2 = 4ay + 4az A/m.)",
    ],
  },
  {
    id: "f1718-q4b", source: "f1718", kind: "finals", paper: F1718, question: "Q4(b)", marks: 10, seenIn: ["f1718", "f1819s3", "drill23"],
    text: "Determine the self-inductance of a coaxial cable of inner radius a and outer radius b.",
    concepts: w([K.amp, 1]),
    solution: [
      "Between the conductors H = I/(2πρ), so the flux per metre is Φ' = ∫_a^b μI/(2πρ) dρ = (μI/2π) ln(b/a).",
      "External inductance per metre: L'_ext = (μ/2π) ln(b/a) H/m.",
      "The inner conductor's own field adds the internal inductance μ/(8π) H/m, so L' = μ/(8π) + (μ/2π) ln(b/a).",
    ],
  },

  // Finals 2018-19 Sem 1 (catalog: f1819s1): Q1–Q3 repeat f1415; Q4(a) repeats f1516 Q4(a).
  {
    id: "f1819s1-q4", source: "f1819s1", kind: "finals", paper: F1819S1, question: "Q4(b)–(e)", marks: 20, seenIn: ["f1819s1", "f1819s3", "drill23"],
    text: "Two extensive homogeneous isotropic dielectrics meet on the plane z = 0: εr1 = 4 for z ≥ 0 and εr2 = 3 for z ≤ 0. A uniform E1 = 5ax − 2ay + 3az kV/m exists for z ≥ 0. Find (b) E2 for z ≤ 0, (c) the angles E1 and E2 make with the interface, (d) the energy densities in J/m³ in both dielectrics, (e) the energy within a cube of side 2 m centred at (3, 4, −5).",
    concepts: w([K.diel, 0.7], [K.cap, 0.3]), practice: "em1.electrostatics.dielectrics/main",
    solution: [
      "(b) Tangential E is continuous: E2x = 5, E2y = −2. Normal D: 4 × 3 = 3E2z, so E2z = 4. E2 = 5ax − 2ay + 4az kV/m.",
      "(c) Angle with the interface: tan α = |En|/|Et|. α1 = tan⁻¹(3/√29) = 29.12°; α2 = tan⁻¹(4/√29) = 36.60°.",
      "(d) w1 = ½(4ε₀)|E1|² = ½ × 4ε₀ × 38 × 10⁶ = 6.729 × 10⁻⁴ J/m³; w2 = ½(3ε₀) × 45 × 10⁶ = 5.977 × 10⁻⁴ J/m³.",
      "(e) The cube spans −6 ≤ z ≤ −4, entirely in region 2, where the field is uniform: W = w2 × 8 = 4.781 × 10⁻³ J.",
      "(With ε₀ = 8.85 × 10⁻¹²: 6.726 × 10⁻⁴, 5.974 × 10⁻⁴ and 4.779 × 10⁻³.)",
    ],
  },

  // Finals 2018-19 Sem 3 (catalog: f1819s3): Q2(a)–(b) repeat f1819s1 Q4; Q3–Q4 repeat f1718.
  {
    id: "f1819s3-q1", source: "f1819s3", kind: "finals", paper: F1819S3, question: "Q1", marks: 25, seenIn: ["f1819s3", "drill23"],
    text: "Given V = (10/r²) sin θ cos φ: (a) find D at (2, π/2, 0); (b) calculate the work done moving a 10 µC charge from A(1, 30°, 120°) to B(4, 90°, 60°); (c) state and explain Maxwell's equations for static EM fields.",
    concepts: w([K.pot, 0.7], [K.dyn, 0.3]), practice: "em1.electrostatics.potential/main",
    solution: [
      "(a) E = −∇V: ∂V/∂r = −20 sin θ cos φ/r³, (1/r)∂V/∂θ = 10 cos θ cos φ/r³, (1/(r sin θ))∂V/∂φ = −10 sin φ/r³.",
      "At (2, π/2, 0) only the r term survives: E = 2.5 ar V/m, so D = ε₀E = 2.214 × 10⁻¹¹ ar C/m².",
      "(b) V_A = 10 × 0.5 × (−0.5)/1 = −2.5 V; V_B = 10 × 1 × 0.5/16 = 0.3125 V.",
      "W = Q(V_B − V_A) = 10 × 10⁻⁶ × 2.8125 = 28.13 µJ.",
      "(c) Statics: ∇·D = ρv; ∇·B = 0; ∇ × E = 0 (conservative E); ∇ × H = J. Integral forms as in Maxwell's equations with the time derivatives set to zero.",
    ],
  },
  {
    id: "f1819s3-q2c", source: "f1819s3", kind: "finals", paper: F1819S3, question: "Q2(c)", marks: 8,
    text: "In cylindrical coordinates, V(r) = ½(a² − r²) + a² ln(b/a) + V0 for r ≤ a, and V(r) = −a² ln(r/b) + V0 for r ≥ a. (i) Determine E everywhere. (ii) Determine ρv everywhere. (The paper's bracket can be read as ½[(a² − r²) + a² ln(b/a) + V0]; only the reading given here makes V continuous at r = a.)",
    concepts: w([K.pot, 0.5], [K.div, 0.5]), practice: "em1.electrostatics.potential/main",
    solution: [
      "(i) E = −dV/dr ar. Inside: E = r ar. Outside: E = (a²/r) ar. Both give E = a at r = a.",
      "(ii) ρv = ε₀∇·E = ε₀(1/r) d(rEr)/dr.",
      "Inside: (1/r) d(r²)/dr = 2, so ρv = 2ε₀ C/m³. Outside: (1/r) d(a²)/dr = 0, so ρv = 0.",
    ],
  },

  // Finals 2024-25 Sem 1 resit (catalog: f2425r), with the lecturer's solution.
  {
    id: "f2425r-q1a", source: "f2425r", kind: "finals", paper: F2425R, question: "Q1(a)", marks: 15,
    text: "Q1 = +10.0 µC is at the origin and Q2 = −15.0 µC is at (4, 2, 6) cm. (i) State Coulomb's law in vector form. (ii) Calculate F12, the force Q1 exerts on Q2. (iii) Calculate E at the midpoint (2, 1, 3) cm due only to Q1.",
    concepts: w([K.coul, 0.7], [K.field, 0.3]), practice: "em1.electrostatics.coulomb/main",
    solution: [
      "(i) F12 = Q1Q2 R12/(4πε₀|R12|³), with R12 from Q1 to Q2.",
      "(ii) R12 = (0.04, 0.02, 0.06) m; |R12| = 0.07483 m.",
      "F12 = 8.988 × 10⁹ × (10 × 10⁻⁶)(−15 × 10⁻⁶)(0.04, 0.02, 0.06)/0.07483³ = −128.7ax − 64.34ay − 193.0az N: an attraction, toward Q1.",
      "(iii) R = (0.02, 0.01, 0.03) m: E = 3.431 × 10⁷ ax + 1.716 × 10⁷ ay + 5.147 × 10⁷ az V/m.",
      "(The lecturer used k = 9.00 × 10⁹ and got 128.9, 64.43 and 193.3 N in size.)",
    ],
  },
  {
    id: "f2425r-q1b", source: "f2425r", kind: "finals", paper: F2425R, question: "Q1(b)", marks: 10,
    text: "In a medium with εr = 10, V = x³z + 2e^(3y) kV. (i) State the relationship between D and V in point form. (ii) Find D at P(−2, 0, 5) m.",
    concepts: w([K.pot, 1]), practice: "em1.electrostatics.potential/main",
    solution: [
      "(i) D = εE = −ε∇V.",
      "(ii) ∇V = 3x²z ax + 6e^(3y) ay + x³ az kV/m = 60ax + 6ay − 8az kV/m at P.",
      "D = −10ε₀ × (60, 6, −8) × 10³ = −5.313ax − 0.5313ay + 0.7083az µC/m².",
    ],
  },
  {
    id: "f2425r-q2a", source: "f2425r", kind: "finals", paper: F2425R, question: "Q2(a)", marks: 16,
    text: "Region 1 is a dielectric with ε1 = 5ε0; D1 = 2ax − 6ay + 3az C/m² meets the charge-free plane 12x + 20y − 30z = 0 at θ1 = 45.63° to the normal. Region 2 is free space. To 3 significant figures, compute (i) the refracted E2 and (ii) the angle of refraction θ2 to the normal.",
    concepts: w([K.diel, 1]), practice: "em1.electrostatics.dielectrics/main",
    solution: [
      "n̂ = (12, 20, −30)/38 = (6, 10, −15)/19. D1·n̂ = −93/19 = −4.895, and cos θ1 = 4.895/7 gives θ1 = 45.63°. ✓",
      "D1n = −1.546ax − 2.576ay + 3.864az; D1t = D1 − D1n = 3.546ax − 3.424ay − 0.864az C/m².",
      "D2 = D1n + (ε2/ε1)D1t = D1n + D1t/5 = −0.837ax − 3.26ay + 3.69az C/m².",
      "(i) E2 = D2/ε₀ = (−94.5ax − 368ay + 417az) × 10⁹ V/m.",
      "(ii) tan θ2 = tan θ1 × (ε2/ε1) = tan 45.63°/5, so θ2 = 11.6°.",
    ],
  },
  {
    id: "f2425r-q2b", source: "f2425r", kind: "finals", paper: F2425R, question: "Q2(b)", marks: 9,
    text: "D = (50e^(−ρ)/z²) aρ µC/m² around a charged wire. A cylindrical surface is defined by ρ = 4 m, π/4 ≤ φ ≤ 3π/4, 1 < z < 9 m. (i) State dS on it. (ii) Calculate the total flux ψ crossing it.",
    concepts: w([K.gapp, 1]), practice: "em1.electrostatics.gauss-applications/main",
    solution: [
      "(i) dS = ρ dφ dz aρ.",
      "(ii) ψ = ∫∫ (50e^(−4)/z²)(4) dφ dz µC = 200e^(−4) × (π/2) × (1 − 1/9) µC.",
      "ψ = 5.115 µC.",
      "(The lecturer's draft gives 2.557 µC, exactly half: the φ range is π/2 wide, not π/4.)",
    ],
  },
  {
    id: "f2425r-q3a", source: "f2425r", kind: "finals", paper: F2425R, question: "Q3(a)", marks: 10,
    text: "A long solid conductor of permeability μ and radius 12.5 mm carries a uniform current I = 100 A downward along the z axis. (i) Using Ampère's circuital law or Biot–Savart's law, develop B outside the conductor. (ii) Find J everywhere.",
    concepts: w([K.amp, 1]),
    solution: [
      "(i) Outside, a circle of radius ρ encloses 100 A flowing in −az: H · 2πρ = 100, and H circulates in −aφ.",
      "H = −15.92/ρ aφ A/m; in the surrounding air B = μ₀H = −(2.000 × 10⁻⁵/ρ) aφ T.",
      "(ii) Inside: J = −I/(πa²) az = −2.037 × 10⁵ az A/m² (downward). Outside: J = 0.",
    ],
  },
  {
    id: "f2425r-q3b", source: "f2425r", kind: "finals", paper: F2425R, question: "Q3(b)", marks: 15,
    text: "H1 = 6ax + 3ay + 2az A/m fills the region 3x + 4z ≤ 19, where μ1 = 2μ0. Leaving μ0 as a constant where appropriate, calculate (i) H2 in the region 3x + 4z > 19, where μ2 = 4μ0, and (ii) B2.",
    concepts: w([K.amp, 1]),
    solution: [
      "n̂ = (3, 0, 4)/5 = (0.6, 0, 0.8). H1·n̂ = 5.2, so H1n = 3.12ax + 4.16az and H1t = 2.88ax + 3ay − 2.16az A/m.",
      "Tangential H is continuous; normal B is continuous, so H2n = (μ1/μ2)H1n = 1.56ax + 2.08az.",
      "(i) H2 = 4.44ax + 3ay − 0.08az A/m.",
      "(ii) B2 = 4μ₀H2 = μ₀(17.76ax + 12ay − 0.32az) = 22.32ax + 15.08ay − 0.402az µT.",
    ],
  },
  {
    id: "f2425r-q4a", source: "f2425r", kind: "finals", paper: F2425R, question: "Q4(a)", marks: 8,
    text: "(i) State, in integral form, Maxwell's equation that embodies Faraday's work. (ii) Deduce two important implications of Faraday's discovery. (iii) Express in point form Maxwell's equation that completes Ampère's circuital law, and name the additional term.",
    concepts: w([K.dyn, 1]),
    solution: [
      "(i) ∮L E·dL = −(d/dt)∫S B·dS: the emf round a loop equals minus the rate of change of the flux through it.",
      "(ii) A changing magnetic field creates a circulating electric field, with no charges needed (transformers, generators). And E is no longer conservative when B changes: ∮E·dL ≠ 0.",
      "(iii) ∇ × H = J + ∂D/∂t. The added term ∂D/∂t is the displacement current density.",
    ],
  },
  {
    id: "f2425r-q4b", source: "f2425r", kind: "finals", paper: F2425R, question: "Q4(b)", marks: 9, seenIn: ["hw04-2425", "f2425r"],
    text: "A TEM wave's electric field is E(z, t) = E0 e^(−αz) cos(ωt ± βz + φ) ay. (i) What are α, ω, β and φ? (ii) State an expression for H(z, t). (iii) When E and H are orthogonal, state the relationship connecting E, H and the wave velocity u.",
    concepts: w([K.wave, 1]),
    solution: [
      "(i) α: attenuation constant (Np/m). ω: angular frequency (rad/s). β: phase constant (rad/m). φ: phase angle (rad).",
      "(ii) For the wave travelling in +z (cos(ωt − βz + φ)): H(z, t) = −(E0/|η|) e^(−αz) cos(ωt − βz + φ − θη) ax, where η = |η|∠θη is the intrinsic impedance.",
      "(iii) E, H and the direction of travel are mutually perpendicular, E × H points along the propagation, |E|/|H| = |η|, and u = ω/β.",
    ],
  },
  {
    id: "f2425r-q4c", source: "f2425r", kind: "finals", paper: F2425R, question: "Q4(c)", marks: 8, seenIn: ["hw04-2425", "f2425r"],
    text: "Using appropriate diagrams, give a brief comparative discussion of the propagation of EM waves in a dielectric and in a conductor.",
    concepts: w([K.wave, 1]),
    solution: [
      "Lossless dielectric (σ ≈ 0): α = 0, so the amplitude doesn't decay. β = ω√(με), u = 1/√(με) < c, η = √(μ/ε) is real, and E and H are in phase.",
      "Good conductor (σ ≫ ωε): α = β = √(πfμσ). The wave decays within a few skin depths δ = 1/α, and η = (1 + j)/(σδ) puts H 45° behind E.",
      "Diagrams: a constant-amplitude sinusoid for the dielectric; an exponentially shrinking sinusoid for the conductor.",
    ],
  },

  // Drill 2023 (catalog: drill23). Questions 1–6, 9 and 10 repeat papers above; 7 and 8 come from Finals 2015 Sem 3 (not in the drop).
  {
    id: "drill23-q7", source: "drill23", kind: "finals", paper: DR23, question: "Q7 (Finals 2015 Sem 3, Q1)", marks: 15, seenIn: ["drill23", "drill24"],
    text: "(b) Explain divergence of a vector field, and why an electric field can have divergence but a magnetic field cannot. (c) A soap bubble with charge 10 µC has radius 3 cm and thickness 2 mm. It collapses into a spherical drop; find the drop's surface potential. (d) In vacuum, E(r) = πr³ for 0 < r ≤ 2 m and 32π/r² for r > 2 m (radial). Use Gauss's law to find ρv at (i) r = 1 m and (ii) r = 3 m.",
    concepts: w([K.div, 0.6], [K.pot, 0.4]), practice: "em1.electrostatics.divergence/main",
    solution: [
      "(b) Divergence is the net outward flux per unit volume at a point. ∇·D = ρv: charges are sources and sinks of E. ∇·B = 0: there are no magnetic monopoles, so B lines always close.",
      "(c) The soap film's volume is kept: 4πa²t = (4/3)πR³, so R³ = 3a²t = 3 × 0.03² × 0.002, giving R = 1.754 cm.",
      "V = Q/(4πε₀R) = 8.988 × 10⁹ × 10⁻⁵/0.01754 = 5.123 MV. (Using the exact shell volume, 3³ − 2.8³ cm³, gives R = 1.715 cm and 5.239 MV.)",
      "(d) ρv = ε₀(1/r²) d(r²Er)/dr. Inside: (1/r²) d(πr⁵)/dr = 5πr², so ρv(1) = 5πε₀ = 1.391 × 10⁻¹⁰ C/m³.",
      "Outside: r²Er = 32π is constant, so ρv(3) = 0.",
    ],
  },
  {
    id: "drill23-q8", source: "drill23", kind: "finals", paper: DR23, question: "Q8 (Finals 2015 Sem 3, Q5)", marks: 25,
    text: "In free space: a point charge Q = 8 nC at (−2, 0, 0) m, a line charge ρL = 10 nC/m along the line y = −9 m (in the plane z = 0), and a sheet ρS = 12 nC/m² at z = −2 m. (a) Find E at the origin due to each. (b) Find the total E at the origin. (c) If D = 5az in a region, is the region free of charge?",
    concepts: w([K.field, 0.8], [K.div, 0.2]), practice: "em1.electrostatics.field/main",
    solution: [
      "(a)(i) Point: R = (2, 0, 0), so E = 8.988 × 10⁹ × 8 × 10⁻⁹/4 ax = 17.98ax V/m.",
      "(ii) Line, at distance 9 m, pointing away from it: E = ρL/(2πε₀ × 9) ay = 19.97ay V/m.",
      "(iii) Sheet below the origin: E = ρS/(2ε₀) az = 677.6az V/m.",
      "(b) E = 17.98ax + 19.97ay + 677.6az V/m.",
      "(c) ∇·D = ∂(5)/∂z = 0, so ρv = 0: yes, the region is free of charge.",
    ],
  },
  {
    id: "drill23-q10", source: "drill23", kind: "finals", paper: DR23, question: "Q10 (Finals 2014 Sem 2, Q1)", marks: 25,
    text: "(a) Using dl, find the length of the curve r = 10, 30° ≤ φ ≤ 90°, z constant. (b) Find the charge density for D = r sin φ ar + 2r cos φ aφ + 2z² az (cylindrical). (c) Q1 = −3 C at (1, 0, 3), Q2 = −6 C at (−2, 1, 0) and Q3 = 4 C at (1, 2, 3) are in free space. Find (i) E and (ii) V at the origin.",
    concepts: w([K.vec, 0.3], [K.div, 0.3], [K.field, 0.4]), practice: "em1.math.vectors/main",
    solution: [
      "(a) dl = r dφ: L = 10 × (π/2 − π/6) = 10π/3 = 10.47 m.",
      "(b) ρv = ∇·D = (1/r)∂(r² sin φ)/∂r + (1/r)∂(2r cos φ)/∂φ + 4z = 2 sin φ − 2 sin φ + 4z = 4z C/m³.",
      "(c)(i) E = Σ kQi(0 − ri)/|ri|³ = −9.480 × 10⁹ ax + 3.451 × 10⁹ ay + 4.990 × 10⁸ az V/m.",
      "(ii) V = Σ kQi/|ri| = −2.303 × 10¹⁰ V.",
    ],
  },

  // Drill 2024 (catalog: drill24). Questions 5–7, 9 and 10 repeat papers above.
  {
    id: "drill24-q1", source: "drill24", kind: "finals", paper: DR24, question: "Q01", marks: 16,
    text: "In free space, QX = 34 µC is at (3, 2, 1) and QY = −43 µC at (−4, 0, 6). Calculate (a) the force due to QY on QX, (b) the system's electric potential energy, (c) E midway between the charges, (d) the potential at QX's location (due to QY).",
    concepts: w([K.coul, 0.4], [K.field, 0.3], [K.pot, 0.3]), practice: "em1.electrostatics.coulomb/main",
    solution: [
      "R from Y to X = (7, 2, −5) m; |R| = √78 = 8.832 m.",
      "(a) F = kQXQY R/|R|³ = −0.1335ax − 0.03815ay + 0.09537az N (attractive).",
      "(b) U = kQXQY/|R| = −1.488 J.",
      "(c) At (−0.5, 1, 3.5): E = −2.813 × 10⁴ ax − 8037ay + 2.009 × 10⁴ az V/m.",
      "(d) V = kQY/|R| = −4.376 × 10⁴ V.",
    ],
  },
  {
    id: "drill24-q2", source: "drill24", kind: "finals", paper: DR24, question: "Q02", marks: 10,
    text: "QA = 2.45 nC at (1, 0, 3) and QB = −4.77 nC at (−2, 1, 5), in air (metres). At P(1, −2, 3), determine (a) VP and (b) EP.",
    concepts: w([K.pot, 0.5], [K.field, 0.5]), practice: "em1.electrostatics.potential/main",
    solution: [
      "From A: R = (0, −2, 0), |R| = 2. From B: R = (3, −3, −2), |R| = √22 = 4.690.",
      "(a) VP = k(2.45 × 10⁻⁹/2 − 4.77 × 10⁻⁹/4.690) = 1.870 V.",
      "(b) EP = −1.246ax − 4.259ay + 0.8309az V/m.",
    ],
  },
  {
    id: "drill24-q3", source: "drill24", kind: "finals", paper: DR24, question: "Q03", marks: 10,
    text: "In a charged region with relative permittivity 120 (the drill says \"permeability\"), V = 2e^(2r−3) sin θ cos φ kV. At P(2.34, −30°, 135°), compute (a) D and (b) E.",
    concepts: w([K.pot, 1]), practice: "em1.electrostatics.potential/main",
    solution: [
      "∂V/∂r = 4e^(2r−3) sin θ cos φ; (1/r)∂V/∂θ = (2/r)e^(2r−3) cos θ cos φ; (1/(r sin θ))∂V/∂φ = −(2/r)e^(2r−3) sin φ/sin θ.",
      "At P: ∇V = 7.588ar − 2.808aθ − 3.243aφ kV/m.",
      "(b) E = −∇V = −7.588ar + 2.808aθ + 3.243aφ kV/m.",
      "(a) D = 120ε₀E = −8.062ar + 2.984aθ + 3.445aφ µC/m².",
    ],
  },
  {
    id: "drill24-q4", source: "drill24", kind: "finals", paper: DR24, question: "Q04", marks: 30,
    text: "(a) D = 4xy ax − πx² ay C/m². Find (i) ρv, (ii) the flux through y = 3, 0 < x < 2, −1 < z < 3, (iii) the total charge in 0 < x < 7, 2 < y < 4, 1 < z < 6. (b) Find ρv for DA = 4xy ax + 8x² ay; DB = −10ρ sin φ aρ + 3ρ cos φ aφ − 7z² az; DC = (sin θ/r³) ar + (5 cos θ/r³) aθ.",
    concepts: w([K.div, 0.6], [K.gauss, 0.4]), practice: "em1.electrostatics.divergence/main",
    solution: [
      "(a)(i) ρv = ∂(4xy)/∂x + ∂(−πx²)/∂y = 4y C/m³.",
      "(ii) Through y = 3 (normal ay): ψ = ∫₋₁³ ∫₀² (−πx²) dx dz = −32π/3 = −33.51 C.",
      "(iii) Q = ∫∫∫ 4y dv = 4 × 6 × 7 × 5 = 840 C.",
      "(b) A: ρv = 4y. B: ρv = −20 sin φ − 3 sin φ − 14z = −23 sin φ − 14z.",
      "C: ρv = −sin θ/r⁴ + 5 cos 2θ/(r⁴ sin θ) = (5/sin θ − 11 sin θ)/r⁴ C/m³.",
    ],
  },
  {
    id: "drill24-q8", source: "drill24", kind: "finals", paper: DR24, question: "Q08 (Finals 2015 Sem 3, Q1)", marks: 18,
    text: "(a) Explain briefly the significance of (i) ∇ × E = 0 and (ii) ∇ × H = Jc + ∂D/∂t. (b) Explain what is meant by the divergence of a vector field. (c) Discuss why an electric field can have divergence and a magnetic field cannot.",
    concepts: w([K.dyn, 0.6], [K.div, 0.4]),
    solution: [
      "(a)(i) A static E is conservative: the work round any closed path is zero, and E = −∇V.",
      "(ii) Both conduction current and a changing D produce a circulating H. Maxwell's ∂D/∂t term keeps charge conserved and lets H exist in empty space, which makes waves possible.",
      "(b) Divergence is the net outward flux of a field per unit volume as the volume shrinks to a point: a measure of source strength there.",
      "(c) Electric field lines begin and end on charges, so ∇·D = ρv ≠ 0 where charge exists. There are no magnetic charges: B lines close on themselves, so ∇·B = 0 everywhere.",
    ],
  },

  // Drill 2025, final tutorial (catalog: drill25).
  {
    id: "drill25-q1", source: "drill25", kind: "finals", paper: DR25, question: "Q1",
    text: "A uniform line charge of 2 µC/m lies on the z axis. Find E in rectangular coordinates at P(1, 2, 3) if the charge exists (a) over −∞ < z < ∞, (b) over −5 < z < 5.",
    concepts: w([K.field, 1]), practice: "em1.electrostatics.field/main",
    solution: [
      "(a) ρ = √5: E = ρL/(2πε₀ρ) aρ = (ρL/(2πε₀ × 5))(ax + 2ay) = 7190ax + 1.438 × 10⁴ ay V/m.",
      "(b) Integrate dE = kρL dz′ (P − z′az)/|P − z′az|³ from −5 to 5.",
      "E = 5859ax + 1.172 × 10⁴ ay + 3828az V/m. The finite line is weaker radially, and asymmetric about P, so Ez ≠ 0.",
    ],
  },
  {
    id: "drill25-q2", source: "drill25", kind: "finals", paper: DR25, question: "Q2",
    text: "A −2 nC charge is at the origin in free space. What charge must be placed at Y(15, 5, 10) so that E = 0 at X(3, 1, 2)? (Why must the three points be collinear?)",
    concepts: w([K.field, 1]), practice: "em1.electrostatics.field/main",
    solution: [
      "X = Y/5, so the points are collinear: the two fields must point along the same line to cancel.",
      "|OX| = √14 and |XY| = 4√14. The origin charge's field at X is −k(2 nC)/14 along OX (toward the origin).",
      "Q at Y gives kQ/(16 × 14) along YX, which points toward the origin too, so Q must be negative to reverse it.",
      "Cancelling: Q/16 = −2 nC, so Q = −32 nC.",
    ],
  },
  {
    id: "drill25-q3", source: "drill25", kind: "finals", paper: DR25, question: "Q3",
    text: "Determine the charge density due to (a) D = 8xy ax + 4x² ay; (b) D = 4ρ sin φ aρ + 2ρ cos φ aφ + 2z² az; (c) D = (2 cos θ/r³) ar + (sin θ/r³) aθ (all C/m²).",
    concepts: w([K.div, 1]), practice: "em1.electrostatics.divergence/main",
    solution: [
      "(a) ρv = ∂(8xy)/∂x + ∂(4x²)/∂y = 8y C/m³.",
      "(b) ρv = (1/ρ)∂(4ρ² sin φ)/∂ρ + (1/ρ)∂(2ρ cos φ)/∂φ + 4z = 8 sin φ − 2 sin φ + 4z = 6 sin φ + 4z C/m³.",
      "(c) (1/r²)∂(2 cos θ/r)/∂r = −2 cos θ/r⁴ and (1/(r sin θ))∂(sin²θ/r³)/∂θ = 2 cos θ/r⁴, so ρv = 0 (a dipole's field, outside the source).",
    ],
  },
  {
    id: "drill25-q4", source: "drill25", kind: "finals", paper: DR25, question: "Q4",
    text: "An infinitely long cylindrical dielectric of radius b holds charge density ρv = aρ², where a is a constant. Find E (a) inside and (b) outside the cylinder.",
    concepts: w([K.gapp, 1]), practice: "em1.electrostatics.gauss-applications/main",
    solution: [
      "Gaussian cylinder of radius ρ, length L: D · 2πρL = ∫₀^ρ aρ′² · 2πρ′L dρ′ = 2πaLρ⁴/4.",
      "(a) ρ < b: D = aρ³/4, so E = aρ³/(4ε₀) aρ (with ε = ε₀; use ε for the dielectric's permittivity).",
      "(b) ρ > b: D = ab⁴/(4ρ), so E = ab⁴/(4ε₀ρ) aρ.",
    ],
  },
  {
    id: "drill25-q5", source: "drill25", kind: "finals", paper: DR25, question: "Q5",
    text: "A sphere of radius a is centred at the origin, with ρv = 5r^(1/2) C/m³ for 0 < r < a and 0 elsewhere. Determine E everywhere.",
    concepts: w([K.gapp, 1]), practice: "em1.electrostatics.gauss-applications/main",
    solution: [
      "Q(r) = ∫₀^r 5r′^(1/2) · 4πr′² dr′ = (40π/7)r^(7/2).",
      "r < a: E = Q(r)/(4πε₀r²) = (10/7ε₀) r^(3/2) ar V/m.",
      "r > a: E = (10/7ε₀) a^(7/2)/r² ar V/m.",
    ],
  },
  {
    id: "drill25-q6", source: "drill25", kind: "finals", paper: DR25, question: "Q6",
    text: "A spherically symmetric charge in free space produces E = r²/(100ε0) ar V/m for r ≤ 10 and 100/(ε0r²) ar V/m for r ≥ 10. (a) Find ρv as a function of position. (b) Find the absolute potential in both regions.",
    concepts: w([K.pot, 0.5], [K.div, 0.5]), practice: "em1.electrostatics.potential/main",
    solution: [
      "(a) ρv = ε₀(1/r²) d(r²Er)/dr. Inside: (1/r²) d(r⁴/100)/dr = 0.04r, so ρv = 0.04r C/m³. Outside: r²Er is constant, so ρv = 0.",
      "(b) r ≥ 10: V = ∫_r^∞ 100/(ε₀r′²) dr′ = 100/(ε₀r) V.",
      "r ≤ 10: V = V(10) + ∫_r^10 r′²/(100ε₀) dr′ = 10/ε₀ + (1000 − r³)/(300ε₀) = (4000 − r³)/(300ε₀) V.",
    ],
  },
  {
    id: "drill25-q7", source: "drill25", kind: "finals", paper: DR25, question: "Q7",
    text: "For a hydrogen atom (orbital radius r ≈ 5.29 × 10⁻¹¹ m, electronic charge −1.602 × 10⁻¹⁹ C, one proton and one electron), calculate (a) the total electric potential energy and (b) the electric potential of the electron relative to the nucleus.",
    concepts: w([K.pot, 1]), practice: "em1.electrostatics.potential/main",
    solution: [
      "(a) U = k(+e)(−e)/r = −8.988 × 10⁹ × (1.602 × 10⁻¹⁹)²/5.29 × 10⁻¹¹ = −4.360 × 10⁻¹⁸ J (−27.2 eV).",
      "(b) The nucleus's potential at the electron: V = ke/r = 27.22 V.",
    ],
  },
  {
    id: "drill25-q8", source: "drill25", kind: "finals", paper: DR25, question: "Q8",
    text: "Region 1 (z < 0, μr1 = 15) has B1 = 12ax + 10ay − 14az T; region 2 (z > 0) has μr2 = 1. Calculate (a) H2 and (b) the angles the field vectors make with a tangent to the interface.",
    concepts: w([K.amp, 1]),
    solution: [
      "The normal is az. B2z = B1z = −14 T, so H2z = −14/μ₀.",
      "H2t = H1t = (12ax + 10ay)/(15μ₀) = (0.8ax + 0.6667ay)/μ₀.",
      "(a) H2 = (0.8ax + 0.6667ay − 14az)/μ₀ = 6.366 × 10⁵ ax + 5.305 × 10⁵ ay − 1.114 × 10⁷ az A/m.",
      "(b) From the tangent: tan θ1 = 14/√(12² + 10²) gives θ1 = 41.87°; tan θ2 = 14/√(0.8² + 0.6667²) gives θ2 = 85.75°.",
    ],
  },
  {
    id: "drill25-q9", source: "drill25", kind: "finals", paper: DR25, question: "Q9",
    text: "A plane interface between two magnetic regions is normal to one Cartesian axis. B1 = μ0(40.0ax − 25.0az) T and B2 = μ0(35.0ax − 25.0az) T. Find tan θ1/tan θ2, with the angles measured from the interface.",
    concepts: w([K.amp, 1]),
    solution: [
      "Normal B is continuous, and only the z components match, so the interface is normal to az.",
      "From the interface, tan θ = |Bn|/|Bt|: tan θ1 = 25/40 and tan θ2 = 25/35.",
      "tan θ1/tan θ2 = 35/40 = 0.875 (= μ2/μ1, since Ht is continuous).",
    ],
  },
```

Notes:
- `drill23-q7` and `drill24-q8` come from the same 2015 Sem 3 paper but ask different parts, so they are separate items.

- [ ] **Step 3: Update the inventory.** In `questions.test.ts`, append these ids to `want`:

```ts
      "f1415-q1a", "f1415-q1b", "f1415-q2a", "f1415-q2b", "f1415-q3a", "f1415-q3b", "f1415-q4",
      "f1516-q1a", "f1516-q1b", "f1516-q2a", "f1516-q2b", "f1516-q2c", "f1516-q4a", "f1516-q4b", "f1516-q4c",
      "f1718-q1a", "f1718-q1b", "f1718-q2", "f1718-q3a", "f1718-q3b", "f1718-q3c", "f1718-q4a", "f1718-q4b",
      "f1819s1-q4", "f1819s3-q1", "f1819s3-q2c",
      "f2425r-q1a", "f2425r-q1b", "f2425r-q2a", "f2425r-q2b", "f2425r-q3a", "f2425r-q3b", "f2425r-q4a", "f2425r-q4b", "f2425r-q4c",
      "drill23-q7", "drill23-q8", "drill23-q10",
      "drill24-q1", "drill24-q2", "drill24-q3", "drill24-q4", "drill24-q8",
      "drill25-q1", "drill25-q2", "drill25-q3", "drill25-q4", "drill25-q5", "drill25-q6", "drill25-q7", "drill25-q8", "drill25-q9",
```

That is 52 new items; the bank grows from 48 to 100. Edit no other test.

- [ ] **Step 4: Run** `pnpm vitest run packages/course-em1 && pnpm typecheck`. Expected: PASS.
  - The catalog check finds every source id: `f1415`…`f2425r` are on catalog line 15, and `drill23`, `drill24` and `drill25` on lines 16–17.
  - Every `practice` reference names a concept and lesson that exist.

- [ ] **Step 5: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): 52 past-paper and drill questions with worked solutions (2014-19 finals, 24-25 resit, drills 2023-25)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 3: Catalog and verification

- [ ] **Step 1: Catalog.** In `docs/superpowers/resources/emag-catalog.md`:
  - Replace the "Mined per plan" cells on lines 15–17 with "Mined in Plan J: see `questions.ts`".
  - Add a sentence to the `drill23` row: "Q7 and Q8 come from Finals 2015 Sem 3, and Q10 from Finals 2014 Sem 2; those papers are not in the drop."
- [ ] **Step 2:** Run `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`. Expected: PASS.
  - If a visual baseline includes the Question bank page, it changes now: there are more items, and each has a solution toggle. Update only that baseline, inspect it, and log a ruling.
- [ ] **Step 3:** Open `/past-papers` at 1360×900 and check four things:
  - "ICT 1" shows the new electrostatics and Ampère items.
  - A solution opens and closes from the keyboard.
  - `f2425r-q2b` shows the note about the lecturer's draft.
  - The page passes axe.
- [ ] **Step 4:** Commit:

  ```bash
  git add -A ../docs/superpowers/resources/emag-catalog.md apps/web && git commit -m "docs: catalog records the mined papers

  Co-Authored-By: Codex <noreply@openai.com>"
  ```

  Then write the ledger line `Task 3: verification — <counts>` and stop for review.

## Self-Review Notes (Python and SymPy, package ε₀ = 8.8541878128 × 10⁻¹²)

- **f1415 Q4:** J = 1.5915 × 10⁷ A/m²; inside H = 7.9577 × 10⁶ρ A/m and B = 10.000ρ T; outside Hρ = 0.31831 A and Bρ = 4.0000 × 10⁻⁷ T·m.
- **f1415 Q3(b):** I_enc = 62.832, 87.965, 56.549 and 0 mA; Hφ = 2.0000, 0.93333, 0.36000 and 0 A/m.
- **f1516:**
  - Q1(a): Q = 1.6755 × 10⁻⁵ C.
  - Q4(b): E2 = (2, 3, 9); D2 = (7.0834, 10.625, 31.875) × 10⁻¹¹ (with 8.85 × 10⁻¹²: 7.080, 10.62, 31.86).
  - Q4(c): H2 = (3.97887 × 10⁶, 4.77465 × 10⁶, 3.48151 × 10⁵).
- **f1718:**
  - Q1(a): E2 = (1.41176, −4.51764, 6.77645) × 10¹¹ (paper ε₀: 1.4124, −4.5198, 6.7797); θ1 = 67.4115° and θ2 = 80.1659°.
  - Q1(b): C = 2.76693 nF; V1 = 12.500 V and V2 = 187.50 V.
  - Q2: ρS = 20 µC/m²; Ez = 3.30796 × 10⁵ V/m; F = 16.5398 N (paper ε₀: 16.548).
  - Q3(c): curl as stated; J(5, 2, −3) = (420, −102, 123); I = 80/3 = 26.667 A.
  - Q4(a): H1n = (−4, 4, 0); H2 = (0, 4, 4); B1 = (−2.51327, 7.53982, 5.02655) µT; B2 = (0, 10.0531, 10.0531) µT.
- **f1819s1 Q4:** angles 29.1216° and 36.6043°; w1 = 6.72918 × 10⁻⁴ and w2 = 5.97658 × 10⁻⁴ J/m³; W = 4.78126 × 10⁻³ J (paper ε₀: 6.726, 5.974 and 4.779).
- **f1819s3 Q1:** E = 2.5ar; D = 2.21355 × 10⁻¹¹; V_A = −5/2 and V_B = 5/16; W = 2.8125 × 10⁻⁵ J.
- **f2425r:**
  - Q1(a): |R| = 0.0748331; F12 = (−128.680, −64.3399, −193.020) N; Em1 = (3.43146, 1.71573, 5.14719) × 10⁷.
  - Q1(b): ∇V = (60, 6, −8) kV/m; D = (−5.31251, −0.531251, 0.708335) µC/m².
  - Q2(a): θ1 = 45.6333°; D1n = (−1.54571, −2.57618, 3.86427); D2 = (−0.836565, −3.26094, 3.69141); E2 = (−9.44824, −36.8294, 41.6912) × 10¹⁰; θ2 = 11.5560°.
  - Q2(b): ψ = 5.11469 µC.
  - Q3(a): J = 2.03718 × 10⁵; Bρ = 2.0000 × 10⁻⁵.
  - Q3(b): H2 = (4.44, 3, −0.08); B2 = (22.3179, 15.0796, −0.402124) µT.
- **drill23:**
  - Q7: thin shell R = 1.75441 cm, V = 5.12283 MV (exact shell 1.71543 cm, 5.23924 MV); ρv(1) = 1.39081 × 10⁻¹⁰.
  - Q8: 17.9751, 19.9723 and 677.645 V/m.
  - Q10: arc 10.4720 m; E = (−9.48011 × 10⁹, 3.45064 × 10⁹, 4.99024 × 10⁸); V = −2.30344 × 10¹⁰.
- **drill24:**
  - Q1: F = (−0.133520, −0.0381485, 0.0953711) N; U = −1.48779 J; E_mid = (−28128.6, −8036.75, 20091.9); V = −43758.5 V.
  - Q2: E = (−1.24637, −4.25851, 0.830913); V = 1.86970.
  - Q3: ∇V = (7.58804, −2.80831, −3.24275) kV/m; D = (−8.06231, 2.98383, 3.44543) µC/m².
  - Q4: ψ = −32π/3 = −33.5103; Q = 840; ∇·DB = −23 sin φ − 14z; ∇·DC = (5/sin θ − 11 sin θ)/r⁴.
- **drill25:**
  - Q1: infinite (7190.04, 14380.1, 0); finite (5859.00, 11718.0, 3827.75).
  - Q3: (b) 6 sin φ + 4z, (c) 0.
  - Q7: U = −4.36024 × 10⁻¹⁸ J; V = 27.2175 V.
  - Q8: H2μ₀ = (0.8, 0.666667, −14); H2 = (6.36620 × 10⁵, 5.30516 × 10⁵, −1.11408 × 10⁷); angles 41.8685° and 85.7460°.
- **Lecturer cross-checks:**
  - Resit Q2(a): θ2 = 11.6° matches.
  - Resit Q3(b): H1n = (3.12, 0, 4.16) matches.
  - Resit Q2(b): the lecturer's 2.557 µC is half of 5.115 µC; the solution says so.
  - The f1718 paper prints C = 312.5ε₀ = 2.77 nF, which matches.
