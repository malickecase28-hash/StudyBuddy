import { defineTemplate, type TemplateDef } from "@forma/engine";

const EPS0 = 8.8541878128e-12;
const KE = 1 / (4 * Math.PI * EPS0);
const concept = "em1.electrostatics.gauss-applications";
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;

const q06 = defineTemplate<{ Q: number }>({
  id: "q06-octant",
  params: { Q: { min: 10, max: 90, step: 5 } },
  prompt: (p) => `A ${p.Q} µC point charge sits at the origin. Find the flux through the part of the sphere r = 26 cm with 0 < θ < π/2 and 0 < φ < π/2.`,
  solve: (p) => ({
    answer: { value: r4(p.Q / 8), unit: "µC" },
    distractors: [
      { value: r4(p.Q / 4), unit: "µC", errorClass: "conceptual", feedback: "That range is 1/8 of the sphere: half in θ, a quarter in φ." },
      { value: p.Q, unit: "µC", errorClass: "conceptual", feedback: "The whole closed sphere gets Q; this is only part of it." },
    ],
  }),
  hints: () => ["The charge is at the centre, so the flux spreads evenly.", "What fraction of the sphere is this?", "Half in θ × a quarter in φ."],
  worked: (p) => [
    { text: `The charge is at the centre, so its ${p.Q} µC of flux spreads evenly over the sphere; the radius doesn't matter.` },
    { text: "0 < θ < π/2 is the top half; 0 < φ < π/2 is a quarter of the way round. Together: 1/2 × 1/4 = 1/8 of the sphere." },
    { text: `Ψ = ${p.Q}/8 = ${r4(p.Q / 8)} µC.` },
  ],
  dimension: "application",
  tags: { concepts: [concept], misconceptions: [], difficulty: 2 },
});

const q08e = defineTemplate<{ a: number; r: number }>({
  id: "q08-e",
  params: { a: { min: 0.1, max: 0.9, step: 0.1 }, r: { min: 1, max: 5, step: 1 } },
  prompt: (p) => `In free space D = ${p.a}r² a_r nC/m². Find |E| at r = ${p.r} m.`,
  solve: (p) => {
    const d = p.a * p.r * p.r; // nC/m²
    return {
      answer: { value: r4((d * 1e-9) / EPS0), unit: "V/m" },
      distractors: [{ value: r4(d), unit: "V/m", errorClass: "conceptual", tag: "D_VS_E_PERMITTIVITY", feedback: `${r4(d)} is D in nC/m². E = D/ε₀.` }],
    };
  },
  hints: (p) => ["In free space E = D/ε₀.", `D(${p.r}) = ${p.a} × ${p.r}² nC/m².`, "Divide by 8.854×10⁻¹² F/m."],
  dimension: "computational",
  tags: { concepts: [concept], misconceptions: ["D_VS_E_PERMITTIVITY"], difficulty: 2 },
});

const q08q = defineTemplate<{ a: number; r: number }>({
  id: "q08-q",
  params: { a: { min: 0.1, max: 0.9, step: 0.1 }, r: { min: 1, max: 5, step: 1 } },
  prompt: (p) => `In free space D = ${p.a}r² a_r nC/m². Find the total charge within the sphere r = ${p.r} m.`,
  solve: (p) => ({
    answer: { value: r4(p.a * p.r ** 4 * 4 * Math.PI), unit: "nC" },
    distractors: [{ value: r4(p.a * p.r * p.r), unit: "nC", errorClass: "conceptual", feedback: "That's D on the sphere. Multiply by its area, 4πr²." }],
  }),
  hints: (p) => ["Q_enc = ∮ D·dS.", "D is radial and constant on the sphere: ∮ D·dS = D × 4πr².", `${p.a} × ${p.r}² × 4π × ${p.r}² nC.`],
  worked: (p) => [
    { text: `On the sphere r = ${p.r} m, D = ${p.a} × ${p.r}² = ${r4(p.a * p.r * p.r)} nC/m², radial and the same everywhere.` },
    { text: `Its area is 4π × ${p.r}² = ${r4(4 * Math.PI * p.r * p.r)} m².` },
    { text: `Q = ∮ D·dS = ${r4(p.a * p.r * p.r)} × ${r4(4 * Math.PI * p.r * p.r)} = ${r4(p.a * p.r ** 4 * 4 * Math.PI)} nC.` },
  ],
  dimension: "computational",
  tags: { concepts: [concept], misconceptions: [], difficulty: 3 },
});

const q09a = defineTemplate<{ q1: number; q2: number }>({
  id: "q09a-cube",
  params: { q1: { min: 0.1, max: 0.9, step: 0.1 }, q2: { min: 0.1, max: 0.9, step: 0.1 } },
  prompt: (p) => `Find the total flux leaving the cube x, y, z = ±5 m for point charges ${p.q1} µC at (1, −2, 3) and ${p.q2} µC at (−1, 2, −2).`,
  solve: (p) => ({
    answer: { value: r4(p.q1 + p.q2), unit: "µC" },
    distractors: [{ value: r4(Math.abs(p.q1 - p.q2)) || r4(p.q1 + p.q2 + 1), unit: "µC", errorClass: "sign", feedback: "Both charges are positive and inside: add them." }],
  }),
  hints: () => ["Are both charges inside |x|, |y|, |z| < 5?", "Both are inside.", "Ψ = Q_enc."],
  worked: (p) => [
    { text: "The cube runs from −5 to 5 m on every axis. (1, −2, 3) and (−1, 2, −2) have every coordinate inside that range, so both charges are enclosed." },
    { text: `Gauss's law: Ψ = Q_enc = ${p.q1} + ${p.q2} = ${r4(p.q1 + p.q2)} µC.` },
  ],
  dimension: "computational",
  tags: { concepts: [concept], misconceptions: ["OUTSIDE_CHARGE_CONTRIBUTES"], difficulty: 1 },
});

const f2425 = defineTemplate<{ a: number; R: number }>({
  id: "f2425-qt",
  params: { a: { min: 1, max: 9, step: 1 }, R: { min: 5, max: 15, step: 1 } },
  prompt: (p) => `Finals 2024-25 Q2(a) style: in free space D = ${p.a}.0r² a_r nC/m². A sphere of radius r = ${p.R} m is centred at the origin. Compute Q_T, the total charge inside.`,
  solve: (p) => ({
    answer: { value: r4((p.a * p.R ** 4 * 4 * Math.PI) / 1000), unit: "µC" },
    distractors: [
      { value: r4((p.a * p.R ** 4 * 4 * Math.PI) / 1e6), unit: "µC", errorClass: "unit", feedback: "Check your prefixes: nC to µC is ÷1000, not ÷10⁶." },
      { value: r4((p.a * p.R * p.R) / 1000), unit: "µC", errorClass: "conceptual", feedback: "Multiply D by the sphere's area, 4πr²." },
    ],
  }),
  hints: (p) => [`|D| on the sphere = ${p.a} × ${p.R}² nC/m².`, "∮ D·dS = D × 4πR².", "Convert nC to µC at the end."],
  worked: (p) => [
    { text: `On the sphere, D = ${p.a} × ${p.R}² = ${p.a * p.R * p.R} nC/m², radial and constant.` },
    { text: `Area: 4π × ${p.R}² = ${r4(4 * Math.PI * p.R * p.R)} m².` },
    { text: `Q_T = ${p.a * p.R * p.R} × ${r4(4 * Math.PI * p.R * p.R)} = ${r4(p.a * p.R ** 4 * 4 * Math.PI)} nC = ${r4((p.a * p.R ** 4 * 4 * Math.PI) / 1000)} µC.` },
  ],
  dimension: "application",
  tags: { concepts: [concept], misconceptions: [], difficulty: 3 },
});

const fluxFlat = defineTemplate<{ D: number; a: number; b: number; theta: number }>({
  id: "flux-flat-patch",
  params: { D: { min: 2, max: 9, step: 1 }, a: { min: 0.5, max: 3, step: 0.5 }, b: { min: 1, max: 4, step: 0.5 }, theta: { min: 20, max: 80, step: 10 } },
  prompt: (p) => `A flat ${p.a} m × ${p.b} m rectangle sits in a uniform field D = ${p.D} µC/m², with its normal at ${p.theta}° to D. Find the flux through it.`,
  solve: (p) => {
    const A = p.a * p.b;
    const c = Math.cos((p.theta * Math.PI) / 180);
    const s = Math.sin((p.theta * Math.PI) / 180);
    return {
      answer: { value: r4(p.D * A * c), unit: "µC" },
      distractors: [
        { value: r4(p.D * A * s), unit: "µC", errorClass: "conceptual", feedback: "That's sin θ. The angle is measured from the normal, so use cos θ." },
        { value: r4(p.D * A), unit: "µC", errorClass: "conceptual", feedback: "That ignores the tilt. Only the part of D along the normal, D cos θ, crosses." },
      ],
    };
  },
  hints: () => ["The field is uniform and the surface flat: one multiplication will do.", "Ψ = |D| A cos θ, with θ measured from the normal.", "Area first, then D cos θ, then multiply."],
  worked: (p) => {
    const A = r4(p.a * p.b);
    const dn = r4(p.D * Math.cos((p.theta * Math.PI) / 180));
    return [
      { text: `Area: A = ${p.a} × ${p.b} = ${A} m².` },
      { text: `Part of D along the normal: D cos θ = ${p.D} × cos ${p.theta}° = ${dn} µC/m².` },
      { text: `Multiply: Ψ = ${dn} × ${A} = ${r4(p.D * p.a * p.b * Math.cos((p.theta * Math.PI) / 180))} µC.` },
    ];
  },
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.gauss-law"], misconceptions: [], difficulty: 2 },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const C0 = 299_792_458;
const sig = (x: number, n = 4) => Number(x.toPrecision(n));
const DEG = Math.PI / 180;

const emWavelength = defineTemplate<{ f: number }>({
  id: "em-wavelength",
  params: { f: { min: 60, max: 990, step: 10 } },
  prompt: (p) => `A transmitter broadcasts at ${p.f} MHz. Find the wavelength in metres.`,
  solve: (p) => ({
    answer: { value: sig(C0 / (p.f * 1e6)), unit: "m" },
    distractors: [{ value: sig(C0 / p.f), unit: "m", errorClass: "unit", feedback: "That divides by the frequency in MHz. Convert to hertz first: multiply by 10⁶." }],
  }),
  hints: (p) => ["λ = c/f, with c = 299 792 458 m/s.", "The frequency must be in hertz.", `299 792 458 ÷ (${p.f} × 10⁶).`],
  worked: (p) => [{ text: `f = ${p.f} MHz = ${p.f} × 10⁶ Hz.` }, { text: `λ = c/f = 299 792 458 ÷ (${p.f} × 10⁶) = ${sig(C0 / (p.f * 1e6))} m.` }],
  dimension: "computational",
  tags: { concepts: ["em1.intro.em-world"], misconceptions: [], difficulty: 1 },
});

const LEN: [string, number, number][] = [["mm", 1e-3, 1e-2], ["µm", 1e-6, 1e-3], ["cm", 1e-2, 1e-3], ["inch", 0.0254, 1e-2]];
const unitSiLength = defineTemplate<{ v: number; k: number }>({
  id: "unit-si-length",
  params: { v: { min: 1, max: 99, step: 1 }, k: { min: 0, max: 3, step: 1 } },
  prompt: (p) => `Convert ${p.v} ${LEN[p.k]![0]} to metres.`,
  solve: (p) => {
    const [, f, wrong] = LEN[p.k]!;
    return {
      answer: { value: sig(p.v * f, 6), unit: "m" },
      distractors: [{ value: sig(p.v * wrong, 6), unit: "m", errorClass: "unit", feedback: "Check the ladder: milli is 10⁻³, micro 10⁻⁶, centi 10⁻², and an inch is exactly 0.0254 m." }],
    };
  },
  hints: (p) => [`What power of ten is one ${LEN[p.k]![0]}?`, `1 ${LEN[p.k]![0]} = ${LEN[p.k]![1]} m.`, `${p.v} × ${LEN[p.k]![1]}.`],
  worked: (p) => [{ text: `1 ${LEN[p.k]![0]} = ${LEN[p.k]![1]} m, so ${p.v} ${LEN[p.k]![0]} = ${p.v} × ${LEN[p.k]![1]} = ${sig(p.v * LEN[p.k]![1], 6)} m.` }],
  dimension: "computational",
  tags: { concepts: ["em1.intro.em-world"], misconceptions: ["PREFIX_POWER"], difficulty: 1 },
});

const vecSumMag = defineTemplate<{ a: number; b: number; c: number }>({
  id: "vec-sum-mag",
  params: { a: { min: 1, max: 5, step: 1 }, b: { min: 1, max: 5, step: 1 }, c: { min: 1, max: 9, step: 1 } },
  prompt: (p) => `A = ${p.a}âₓ + 3âz and B = 5âₓ + ${p.b}âᵧ − ${p.c}âz. Find |A + B|.`,
  solve: (p) => ({
    answer: { value: sig(Math.hypot(p.a + 5, p.b, 3 - p.c), 5), unit: "" },
    distractors: [{ value: sig(Math.hypot(p.a, 3) + Math.hypot(5, p.b, p.c), 5), unit: "", errorClass: "conceptual", feedback: "Magnitudes don't add unless the vectors are parallel. Add the components first, then take the length." }],
  }),
  hints: () => ["Add matching components.", "Then |V| = √(Vₓ² + Vᵧ² + V_z²).", "Watch the sign of the z part."],
  worked: (p) => [
    { text: `A + B = ${p.a + 5}âₓ + ${p.b}âᵧ + (${3 - p.c})âz.` },
    { text: `|A + B| = √(${(p.a + 5) ** 2} + ${p.b ** 2} + ${(3 - p.c) ** 2}) = ${sig(Math.hypot(p.a + 5, p.b, 3 - p.c), 5)}.` },
  ],
  dimension: "computational",
  tags: { concepts: ["em1.math.vectors"], misconceptions: [], difficulty: 1 },
});

const vecDistanceMm = defineTemplate<{ dx: number; dz: number }>({
  id: "vec-distance-mm",
  params: { dx: { min: 1, max: 9, step: 1 }, dz: { min: 1, max: 9, step: 1 } },
  prompt: (p) => `Charges sit at P1(2, 2, 13) mm and P2(${2 + p.dx}, 2, ${13 - p.dz}) mm. Find the length of R12 in metres.`,
  solve: (p) => ({
    answer: { value: sig(Math.hypot(p.dx, p.dz) / 1000), unit: "m" },
    distractors: [{ value: sig(Math.hypot(p.dx, p.dz)), unit: "m", errorClass: "unit", feedback: "That is the length in millimetres. Divide by 1000 for metres." }],
  }),
  hints: () => ["R12 = P2 − P1, end minus start.", "Length by 3D Pythagoras.", "Then convert mm to m."],
  worked: (p) => [
    { text: `R12 = (${p.dx}, 0, −${p.dz}) mm.` },
    { text: `|R12| = √(${p.dx ** 2} + ${p.dz ** 2}) = ${sig(Math.hypot(p.dx, p.dz))} mm = ${sig(Math.hypot(p.dx, p.dz) / 1000)} m.` },
  ],
  dimension: "computational",
  tags: { concepts: ["em1.math.vectors"], misconceptions: [], difficulty: 1 },
});

const vecAngle = defineTemplate<{ a: number; b: number }>({
  id: "vec-angle",
  params: { a: { min: 1, max: 5, step: 1 }, b: { min: 1, max: 6, step: 1 } },
  prompt: (p) => `A = âₓ + ${p.a}âz and B = ${p.b}âₓ + 2âᵧ − 6âz. Find the angle between them, in degrees.`,
  solve: (p) => {
    const dotAB = p.b - 6 * p.a;
    const th = Math.acos(dotAB / (Math.hypot(1, p.a) * Math.hypot(p.b, 2, 6))) / DEG;
    return {
      answer: { value: sig(th, 5), unit: "°" },
      distractors: Math.abs(th - 90) > 0.5 ? [{ value: sig(180 - th, 5), unit: "°", errorClass: "sign", feedback: "Keep the sign of A·B: a negative dot product means the angle is more than 90°." }] : [],
    };
  },
  hints: () => ["cos θ = A·B / (|A||B|).", "A·B = AₓBₓ + AᵧBᵧ + A_zB_z.", "Keep the sign, then take cos⁻¹."],
  worked: (p) => {
    const dotAB = p.b - 6 * p.a;
    const ma = Math.hypot(1, p.a), mb = Math.hypot(p.b, 2, 6);
    return [
      { text: `A·B = (1)(${p.b}) + (0)(2) + (${p.a})(−6) = ${dotAB}.` },
      { text: `|A| = ${sig(ma, 5)}, |B| = ${sig(mb, 5)}.` },
      { text: `cos θ = ${dotAB} / (${sig(ma, 5)} × ${sig(mb, 5)}) = ${sig(dotAB / (ma * mb), 5)}, so θ = ${sig(Math.acos(dotAB / (ma * mb)) / DEG, 5)}°.` },
    ];
  },
  dimension: "computational",
  tags: { concepts: ["em1.math.vectors"], misconceptions: [], difficulty: 2 },
});

const QUAD: [number, number][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
const coordPhi = defineTemplate<{ qx: number; qy: number; quad: number }>({
  id: "coord-phi",
  params: { qx: { min: 1, max: 5, step: 1 }, qy: { min: 1, max: 5, step: 1 }, quad: { min: 0, max: 3, step: 1 } },
  prompt: (p) => {
    const [sx, sy] = QUAD[p.quad]!;
    return `Find φ, from 0° to 360°, for the point (${sx * p.qx}, ${sy * p.qy}, 2).`;
  },
  solve: (p) => {
    const [sx, sy] = QUAD[p.quad]!;
    const x = sx * p.qx, y = sy * p.qy;
    const phi = ((Math.atan2(y, x) / DEG) % 360 + 360) % 360;
    const raw = Math.atan(y / x) / DEG;
    return {
      answer: { value: sig(phi, 5), unit: "°" },
      distractors: Math.abs(raw - phi) > 0.5 ? [{ value: sig(raw, 5), unit: "°", errorClass: "conceptual", tag: "PHI_QUADRANT", feedback: "That is the calculator's tan⁻¹(y/x). Place the point in its quadrant from the signs of x and y, then correct the angle." }] : [],
    };
  },
  hints: () => ["Which quadrant? Look at the signs of x and y.", "tan⁻¹(y/x) only knows the ratio.", "Quadrants II and III: add 180°. Quadrant IV: add 360°."],
  worked: (p) => {
    const [sx, sy] = QUAD[p.quad]!;
    const x = sx * p.qx, y = sy * p.qy;
    const raw = Math.atan(y / x) / DEG;
    const phi = ((Math.atan2(y, x) / DEG) % 360 + 360) % 360;
    return [
      { text: `x = ${x}, y = ${y}: quadrant ${["I", "II", "III", "IV"][p.quad]}.` },
      { text: `tan⁻¹(y/x) = ${sig(raw, 5)}°; corrected for the quadrant, φ = ${sig(phi, 5)}°.` },
    ];
  },
  dimension: "computational",
  tags: { concepts: ["em1.math.vectors"], misconceptions: ["PHI_QUADRANT"], difficulty: 2 },
});

const TH2 = [30, 45, 60, 90];
const sphPatchArea = defineTemplate<{ rc: number; t: number; dp: number }>({
  id: "sph-patch-area",
  params: { rc: { min: 10, max: 50, step: 5 }, t: { min: 0, max: 3, step: 1 }, dp: { min: 15, max: 90, step: 15 } },
  prompt: (p) => `Find the area of the part of the sphere r = ${p.rc} cm with 0 < θ < ${TH2[p.t]}° and 0 < φ < ${p.dp}°.`,
  solve: (p) => {
    const r = p.rc / 100, t2 = TH2[p.t]! * DEG, dphi = p.dp * DEG;
    return {
      answer: { value: sig(r * r * (1 - Math.cos(t2)) * dphi), unit: "m^2" },
      distractors: [
        { value: sig(r * r * t2 * dphi), unit: "m^2", errorClass: "conceptual", tag: "ELEMENT_SCALE_FACTOR", feedback: "That leaves out sin θ. On a sphere, dS = r² sin θ dθ dφ." },
        { value: sig(p.rc * p.rc * (1 - Math.cos(t2)) * dphi), unit: "m^2", errorClass: "unit", feedback: "That squares the radius in centimetres. Convert r to metres first." },
      ],
    };
  },
  hints: () => ["dS = r² sin θ dθ dφ on a sphere.", "∫ sin θ dθ from 0 to θ₂ = 1 − cos θ₂.", "Angles in radians; r in metres."],
  worked: (p) => {
    const r = p.rc / 100, t2 = TH2[p.t]! * DEG, dphi = p.dp * DEG;
    return [
      { text: `r = ${r} m; ∫₀^θ₂ sin θ dθ = 1 − cos ${TH2[p.t]}° = ${sig(1 - Math.cos(t2), 5)}; Δφ = ${p.dp}° = ${sig(dphi, 5)} rad.` },
      { text: `S = r²(1 − cos θ₂)Δφ = ${sig(r * r, 5)} × ${sig(1 - Math.cos(t2), 5)} × ${sig(dphi, 5)} = ${sig(r * r * (1 - Math.cos(t2)) * dphi)} m².` },
    ];
  },
  dimension: "computational",
  tags: { concepts: ["em1.math.vectors"], misconceptions: ["ELEMENT_SCALE_FACTOR"], difficulty: 2 },
});

const CALC = "em1.math.vector-calculus";

const gradComp = defineTemplate<{ a: number; b: number; y: number }>({
  id: "grad-comp",
  params: { a: { min: 2, max: 10, step: 2 }, b: { min: 1, max: 4, step: 1 }, y: { min: 1, max: 5, step: 1 } },
  prompt: (p) => `V = ${p.a}xyz − ${p.b}x²z. Find ∂V/∂x, the x-component of ∇V, at P(−1, ${p.y}, 3).`,
  solve: (p) => ({
    answer: { value: 3 * p.a * p.y + 6 * p.b, unit: "" },
    distractors: [{ value: 3 * p.a * p.y - 6 * p.b, unit: "", errorClass: "sign", feedback: "∂(−bx²z)/∂x = −2bxz, and x = −1 makes it +2bz. Substitute the sign of x carefully." }],
  }),
  hints: () => ["Treat y and z as constants.", "∂V/∂x = ayz − 2bxz.", "Now substitute x = −1, keeping the sign."],
  worked: (p) => [
    { text: `∂V/∂x = ${p.a}yz − ${2 * p.b}xz.` },
    { text: `At (−1, ${p.y}, 3): ${p.a}(${p.y})(3) − ${2 * p.b}(−1)(3) = ${3 * p.a * p.y} + ${6 * p.b} = ${3 * p.a * p.y + 6 * p.b}.` },
  ],
  dimension: "computational",
  tags: { concepts: [CALC], misconceptions: [], difficulty: 2 },
});

const PHIS = [0, 60, 120, 180];
const gradCylPhi = defineTemplate<{ c: number; rho: number; k: number }>({
  id: "grad-cyl-phi",
  params: { c: { min: 1, max: 6, step: 1 }, rho: { min: 2, max: 5, step: 1 }, k: { min: 0, max: 3, step: 1 } },
  prompt: (p) => `U = ${p.c}ρ sin φ + ρz. Find the φ-component of ∇U at (${p.rho}, ${PHIS[p.k]}°, 1).`,
  solve: (p) => {
    const cosp = Math.cos(PHIS[p.k]! * DEG);
    return {
      answer: { value: sig(p.c * cosp, 6), unit: "" },
      distractors: [{ value: sig(p.rho * p.c * cosp, 6), unit: "", errorClass: "conceptual", tag: "MISSING_SCALE_FACTORS", feedback: "That's ∂U/∂φ without the 1/ρ. The φ-component of the gradient is (1/ρ)∂U/∂φ." }],
    };
  },
  hints: () => ["The φ-component is (1/ρ)∂U/∂φ.", `∂U/∂φ = cρ cos φ.`, "The ρ cancels."],
  worked: (p) => [
    { text: `∂U/∂φ = ${p.c}ρ cos φ; divide by ρ: ${p.c} cos φ.` },
    { text: `At φ = ${PHIS[p.k]}°: ${p.c} × ${sig(Math.cos(PHIS[p.k]! * DEG), 4)} = ${sig(p.c * Math.cos(PHIS[p.k]! * DEG), 6)}.` },
  ],
  dimension: "computational",
  tags: { concepts: [CALC], misconceptions: ["MISSING_SCALE_FACTORS"], difficulty: 2 },
});

const divCart = defineTemplate<{ p: number; q: number; s: number; x0: number; y0: number }>({
  id: "div-cart",
  params: { p: { min: 1, max: 5, step: 1 }, q: { min: 1, max: 5, step: 1 }, s: { min: 1, max: 5, step: 1 }, x0: { min: -3, max: 3, step: 1 }, y0: { min: -3, max: 3, step: 1 } },
  prompt: (v) => `A = ${v.p}xy âₓ + ${v.q}y² âᵧ − ${v.s}xz âz. Find ∇·A at (${v.x0}, ${v.y0}, 2).`,
  solve: (v) => {
    const ans = v.p * v.y0 + 2 * v.q * v.y0 - v.s * v.x0;
    const wrong = v.p * v.y0 + v.q * v.y0 - v.s * v.x0;
    return {
      answer: { value: ans, unit: "" },
      distractors: wrong !== ans ? [{ value: wrong, unit: "", errorClass: "arithmetic", feedback: "∂(qy²)/∂y = 2qy. The power comes down." }] : [],
    };
  },
  hints: () => ["Differentiate each component along its own axis.", "∂(pxy)/∂x = py; ∂(qy²)/∂y = 2qy; ∂(−sxz)/∂z = −sx.", "Add, then substitute."],
  worked: (v) => [
    { text: `∇·A = ${v.p}y + ${2 * v.q}y − ${v.s}x.` },
    { text: `At (${v.x0}, ${v.y0}, 2): ${v.p * v.y0} + ${2 * v.q * v.y0} − ${v.s * v.x0} = ${v.p * v.y0 + 2 * v.q * v.y0 - v.s * v.x0}.` },
  ],
  dimension: "computational",
  tags: { concepts: [CALC], misconceptions: [], difficulty: 2 },
});

const curlZ = defineTemplate<{ a: number; b: number; x0: number; y0: number; z0: number }>({
  id: "curl-z",
  params: { a: { min: 1, max: 5, step: 1 }, b: { min: 1, max: 5, step: 1 }, x0: { min: -3, max: 3, step: 1 }, y0: { min: -3, max: 3, step: 1 }, z0: { min: -3, max: 3, step: 1 } },
  prompt: (v) => `A = ${v.a}yz âₓ + ${v.b}xy âᵧ. Find the z-component of ∇ × A at (${v.x0}, ${v.y0}, ${v.z0}).`,
  solve: (v) => {
    const ans = v.b * v.y0 - v.a * v.z0;
    return {
      answer: { value: ans, unit: "" },
      distractors: ans !== 0 ? [{ value: -ans, unit: "", errorClass: "sign", feedback: "(∇ × A)_z = ∂Aᵧ/∂x − ∂Aₓ/∂y, in that order." }] : [],
    };
  },
  hints: () => ["(∇ × A)_z = ∂Aᵧ/∂x − ∂Aₓ/∂y.", "∂(bxy)/∂x = by; ∂(ayz)/∂y = az.", "Subtract in that order."],
  worked: (v) => [
    { text: `(∇ × A)_z = ${v.b}y − ${v.a}z.` },
    { text: `At (${v.x0}, ${v.y0}, ${v.z0}): ${v.b * v.y0} − ${v.a * v.z0} = ${v.b * v.y0 - v.a * v.z0}.` },
  ],
  dimension: "computational",
  tags: { concepts: [CALC], misconceptions: [], difficulty: 2 },
});

const coulombMag = defineTemplate<{ q1: number; q2: number; d: number }>({
  id: "coulomb-mag",
  params: { q1: { min: 1, max: 9, step: 1 }, q2: { min: 1, max: 9, step: 1 }, d: { min: 5, max: 50, step: 5 } },
  prompt: (p) => `Two point charges, ${p.q1} µC and −${p.q2} µC, are ${p.d} cm apart in free space. Find the size of the force between them.`,
  solve: (p) => ({
    answer: { value: sig((KE * p.q1 * 1e-6 * p.q2 * 1e-6) / (p.d / 100) ** 2), unit: "N" },
    distractors: [{ value: sig((KE * p.q1 * 1e-6 * p.q2 * 1e-6) / p.d ** 2), unit: "N", errorClass: "unit", feedback: "That leaves the distance in centimetres. Convert to metres before squaring." }],
  }),
  hints: () => ["|F| = |Q1Q2| / (4πε₀R²).", "Charges in coulombs, R in metres.", "k = 1/(4πε₀) ≈ 8.988 × 10⁹ N·m²/C²."],
  worked: (p) => [
    { text: `Q1 = ${p.q1} × 10⁻⁶ C, Q2 = ${p.q2} × 10⁻⁶ C, R = ${p.d / 100} m.` },
    { text: `|F| = 8.988 × 10⁹ × ${p.q1 * p.q2} × 10⁻¹² / ${sig((p.d / 100) ** 2, 4)} = ${sig((KE * p.q1 * 1e-6 * p.q2 * 1e-6) / (p.d / 100) ** 2)} N, attractive (opposite signs).` },
  ],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.coulomb"], misconceptions: [], difficulty: 1 },
});

const ePoint = defineTemplate<{ q: number; r: number }>({
  id: "e-point",
  params: { q: { min: 1, max: 9, step: 1 }, r: { min: 5, max: 50, step: 5 } },
  prompt: (p) => `Find |E| at ${p.r} cm from a ${p.q} nC point charge in free space.`,
  solve: (p) => ({
    answer: { value: sig((KE * p.q * 1e-9) / (p.r / 100) ** 2), unit: "V/m" },
    distractors: [{ value: sig((KE * p.q * 1e-9) / (p.r / 100)), unit: "V/m", errorClass: "conceptual", feedback: "E falls as 1/R², not 1/R. Square the distance." }],
  }),
  hints: () => ["|E| = Q / (4πε₀R²).", "R in metres, Q in coulombs.", "Square R."],
  worked: (p) => [{ text: `|E| = 8.988 × 10⁹ × ${p.q} × 10⁻⁹ / (${p.r / 100})² = ${sig((KE * p.q * 1e-9) / (p.r / 100) ** 2)} V/m.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.field"], misconceptions: [], difficulty: 1 },
});

const eLine = defineTemplate<{ rl: number; rho: number }>({
  id: "e-line",
  params: { rl: { min: 500, max: 5000, step: 500 }, rho: { min: 10, max: 100, step: 10 } },
  prompt: (p) => `An infinite line carries ρL = ${p.rl} nC/m. Find |E| at ${p.rho} cm from it.`,
  solve: (p) => ({
    answer: { value: sig((p.rl * 1e-9) / (2 * Math.PI * EPS0 * (p.rho / 100))), unit: "V/m" },
    distractors: [{ value: sig((p.rl * 1e-9) / (4 * Math.PI * EPS0 * (p.rho / 100))), unit: "V/m", errorClass: "conceptual", tag: "LINE_FIELD_FORM", feedback: "A line's field is ρL/(2πε₀ρ): 2π, not 4π." }],
  }),
  hints: () => ["E = ρL / (2πε₀ρ) for an infinite line.", "ρ in metres.", "It falls as 1/ρ, not 1/ρ²."],
  worked: (p) => [{ text: `E = ${p.rl} × 10⁻⁹ / (2π × 8.854 × 10⁻¹² × ${p.rho / 100}) = ${sig((p.rl * 1e-9) / (2 * Math.PI * EPS0 * (p.rho / 100)))} V/m.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.field"], misconceptions: ["LINE_FIELD_FORM"], difficulty: 2 },
});

const chargeLinePoly = defineTemplate<{ a: number; x1: number; x2: number }>({
  id: "charge-line-poly",
  params: { a: { min: 3, max: 15, step: 3 }, x1: { min: 0, max: 2, step: 1 }, x2: { min: 3, max: 6, step: 1 } },
  prompt: (p) => `A line charge on ${p.x1} < x < ${p.x2} m has density ρL = ${p.a}x² mC/m. Find the total charge.`,
  solve: (p) => {
    const Q = (p.a * (p.x2 ** 3 - p.x1 ** 3)) / 3;
    return {
      answer: { value: sig(Q, 6), unit: "mC" },
      distractors: [{ value: sig(p.a * (p.x2 ** 3 - p.x1 ** 3), 6), unit: "mC", errorClass: "arithmetic", feedback: "∫x² dx = x³/3: don't forget the 3." }],
    };
  },
  hints: () => ["Q = ∫ρL dl, and on the x-axis dl = dx.", "∫ax² dx = a x³/3.", "Upper limit minus lower limit."],
  worked: (p) => [{ text: `Q = ∫ ${p.a}x² dx = ${p.a}[x³/3] from ${p.x1} to ${p.x2} = ${sig((p.a * (p.x2 ** 3 - p.x1 ** 3)) / 3, 6)} mC.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.gauss-applications"], misconceptions: [], difficulty: 1 },
});

const TH = [30, 45, 60, 90];
const fluxPatch = defineTemplate<{ q: number; t: number; dp: number; rc: number }>({
  id: "flux-patch",
  params: { q: { min: 10, max: 90, step: 10 }, t: { min: 0, max: 3, step: 1 }, dp: { min: 15, max: 90, step: 15 }, rc: { min: 10, max: 50, step: 10 } },
  prompt: (p) => `A ${p.q} µC point charge is at the origin. Find the flux through the part of the sphere r = ${p.rc} cm with 0 < θ < ${TH[p.t]}° and 0 < φ < ${p.dp}°.`,
  solve: (p) => {
    const frac = ((1 - Math.cos(TH[p.t]! * DEG)) * p.dp * DEG) / (4 * Math.PI);
    const r = p.rc / 100;
    return {
      answer: { value: sig(p.q * frac), unit: "µC" },
      distractors: [{ value: sig(p.q * frac * 4 * Math.PI * r * r), unit: "µC", errorClass: "conceptual", tag: "FLUX_PATCH_AREA", feedback: "That multiplies Q by the patch's area. The flux is Q times the patch's share of the whole sphere: area ÷ 4πr²." }],
    };
  },
  hints: () => ["The charge is at the centre: flux spreads evenly over the sphere.", "Share = patch area ÷ 4πr² = (1 − cos θ₂)Δφ / 4π.", "The radius cancels."],
  worked: (p) => {
    const frac = ((1 - Math.cos(TH[p.t]! * DEG)) * p.dp * DEG) / (4 * Math.PI);
    return [
      { text: `Share = (1 − cos ${TH[p.t]}°)(${p.dp}° in radians)/(4π) = ${sig(frac, 5)}.` },
      { text: `Ψ = ${p.q} µC × ${sig(frac, 5)} = ${sig(p.q * frac)} µC; the radius doesn't matter.` },
    ];
  },
  dimension: "application",
  tags: { concepts: ["em1.electrostatics.gauss-applications"], misconceptions: ["FLUX_PATCH_AREA"], difficulty: 2 },
});

const ballD = defineTemplate<{ rv: number; a: number; r: number }>({
  id: "ball-d",
  params: { rv: { min: 1, max: 9, step: 1 }, a: { min: 10, max: 20, step: 5 }, r: { min: 5, max: 30, step: 5 } },
  prompt: (p) => `A ball of radius ${p.a / 10} m carries a uniform ρv = ${p.rv} µC/m³. Find |D| at r = ${p.r / 10} m from its centre.`,
  solve: (p) => {
    const a = p.a / 10, r = p.r / 10;
    const inside = (p.rv * r) / 3;
    const outside = (p.rv * a ** 3) / (3 * r * r);
    const ans = r < a ? inside : outside;
    const wrong = r < a ? outside : inside;
    return {
      answer: { value: sig(ans, 6), unit: "µC/m^2" },
      distractors: Math.abs(wrong - ans) > 1e-9 ? [{ value: sig(wrong, 6), unit: "µC/m^2", errorClass: "conceptual", tag: "BALL_INSIDE_OUTSIDE", feedback: r < a ? "Inside the ball only the charge within r counts: D = ρv r / 3." : "Outside, the whole ball counts: D = ρv a³ / (3r²)." }] : [],
    };
  },
  hints: () => ["Gaussian sphere of radius r: D × 4πr² = Q_enc.", "Inside: Q_enc = ρv (4/3)πr³. Outside: ρv (4/3)πa³.", "Is r inside or outside the ball?"],
  worked: (p) => {
    const a = p.a / 10, r = p.r / 10;
    return r < a
      ? [{ text: `r < a, so Q_enc = ρv(4/3)πr³ and D = ρv r/3 = ${p.rv} × ${r}/3 = ${sig((p.rv * r) / 3, 6)} µC/m².` }]
      : [{ text: `r ≥ a, so Q_enc = ρv(4/3)πa³ and D = ρv a³/(3r²) = ${p.rv} × ${a}³/(3 × ${r}²) = ${sig((p.rv * a ** 3) / (3 * r * r), 6)} µC/m².` }];
  },
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.gauss-applications"], misconceptions: ["BALL_INSIDE_OUTSIDE"], difficulty: 2 },
});

const rhovFromD = defineTemplate<{ a: number; b: number; x0: number; y0: number }>({
  id: "rhov-from-d",
  params: { a: { min: 1, max: 6, step: 1 }, b: { min: 1, max: 6, step: 1 }, x0: { min: 1, max: 4, step: 1 }, y0: { min: 1, max: 4, step: 1 } },
  prompt: (p) => `D = ${p.a}xy ax + ${p.b}x² ay C/m². Find ρv at (${p.x0}, ${p.y0}, 1).`,
  solve: (p) => ({
    answer: { value: p.a * p.y0, unit: "C/m^3" },
    distractors: [{ value: p.a * p.y0 + 2 * p.b * p.x0, unit: "C/m^3", errorClass: "conceptual", feedback: "∂D_y/∂y, not ∂D_y/∂x: bx² doesn't depend on y, so it contributes nothing." }],
  }),
  hints: () => ["ρv = ∇·D.", "∂(axy)/∂x = ay; ∂(bx²)/∂y = 0.", "Substitute y."],
  worked: (p) => [{ text: `∇·D = ∂(${p.a}xy)/∂x + ∂(${p.b}x²)/∂y = ${p.a}y + 0, so ρv = ${p.a} × ${p.y0} = ${p.a * p.y0} C/m³.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.divergence"], misconceptions: [], difficulty: 1 },
});

export const templates: TemplateDef<any>[] = [q06, q08e, q08q, q09a, f2425, fluxFlat, emWavelength, unitSiLength, vecSumMag, vecDistanceMm, vecAngle, coordPhi, sphPatchArea, gradComp, gradCylPhi, divCart, curlZ, coulombMag, ePoint, eLine, chargeLinePoly, fluxPatch, ballD, rhovFromD];
export const templatesFor = (conceptId: string) => templates.filter((t) => t.tags.concepts.includes(conceptId));
