import { F2324, F2425 } from "./sources";

export type BankItem = {
  id: string;
  /** Catalog id in docs/superpowers/resources/emag-catalog.md. */
  source: string;
  kind: "finals" | "mst" | "ict" | "hw" | "tutorial";
  paper: string;
  question: string;
  marks?: number;
  text: string;
  concepts: { conceptId: string; weight: number }[];
  /** Catalog ids of every paper this question appeared in (the lecturer reuses homework). */
  seenIn?: string[];
  /** conceptId/lessonId to practise it, when a lesson exists. */
  practice?: string;
};

const K = {
  vec: "em1.math.vectors",
  calc: "em1.math.vector-calculus",
  surf: "em1.math.surface-integrals",
  world: "em1.intro.em-world",
  coul: "em1.electrostatics.coulomb",
  field: "em1.electrostatics.field",
  flux: "em1.electrostatics.flux-density",
  gauss: "em1.electrostatics.gauss-law",
  gapp: "em1.electrostatics.gauss-applications",
  div: "em1.electrostatics.divergence",
  cur: "em1.electrostatics.current",
  pot: "em1.electrostatics.potential",
  diel: "em1.electrostatics.dielectrics",
  cap: "em1.electrostatics.capacitance",
  amp: "em1.magnetostatics.ampere",
  dyn: "em1.dynamic.faraday",
  wave: "em1.waves.plane-waves",
} as const;
const w = (...pairs: [string, number][]) => pairs.map(([conceptId, weight]) => ({ conceptId, weight }));

const MST = "Mid-semester test 2023-24";
const ICT2 = "ICT 2 2024-25";
const HW2324 = "HW02 2023-24 (reissued as HW01 2024-25)";
const HW03 = "HW03 2024-25";
const HW04 = "HW04 2024-25";

export const questionBank: BankItem[] = [
  // Mid-semester test, 23 Oct 2023 (catalog: mst2324)
  { id: "mst-2324-q1a", source: "mst2324", kind: "mst", paper: MST, question: "Q1(a)", marks: 3, text: "State the vector form of Coulomb's law for two isolated charges.", concepts: w([K.coul, 1]) },
  { id: "mst-2324-q1b", source: "mst2324", kind: "mst", paper: MST, question: "Q1(b)", marks: 13, text: "In a vacuum, q1 = +25.0 nC at P1(2, 2, 13) mm and q2 = −42.0 nC at P2(10, 2, 7) mm. (i) Find the displacement vector R12 and its length, in metres. (ii) Calculate F12, the electrostatic force on q2 due to q1. (iii) State the effect of changing only q2 to +42.0 nC.", concepts: w([K.coul, 0.7], [K.vec, 0.3]) },
  { id: "mst-2324-q2a", source: "mst2324", kind: "mst", paper: MST, question: "Q2(a)", marks: 2, text: "Define electric field intensity, E, at a point.", concepts: w([K.field, 1]) },
  { id: "mst-2324-q2b", source: "mst2324", kind: "mst", paper: MST, question: "Q2(b)", marks: 10, text: "In a vacuum, QA = 0.5 µC at A(4, −3, 7) µm and QB = −0.3 µC at B(2, −3, 1) µm. Calculate E at P(1, 2, 5) µm.", concepts: w([K.field, 0.8], [K.vec, 0.2]) },
  { id: "mst-2324-q2c", source: "mst2324", kind: "mst", paper: MST, question: "Q2(c)", marks: 5, text: "A thin metallic sphere of diameter 12.8 cm is charged to +200 mC. Calculate V, the electric potential at its surface.", concepts: w([K.pot, 1]) },
  { id: "mst-2324-q3a", source: "mst2324", kind: "mst", paper: MST, question: "Q3(a)", marks: 10, text: "A 100 µC point charge is at the origin. Calculate the total electric flux Ψ through the part of the sphere r = 25.0 cm bounded by 0 < θ < π/3 and π/6 < φ < π/4.", concepts: w([K.gapp, 0.5], [K.surf, 0.5]) },
  { id: "mst-2324-q3b", source: "mst2324", kind: "mst", paper: MST, question: "Q3(b)", marks: 7, text: "An infinite plane at z = 5.00 m in free space carries ρS = 120 µC/m². (i) State the formula relating E, D and ε0. (ii) Calculate E at P(4, 5, 6) m. (iii) Hence compute D at the same point.", concepts: w([K.gapp, 0.6], [K.flux, 0.4]) },
  { id: "mst-2324-q4a", source: "mst2324", kind: "mst", paper: MST, question: "Q4(a)", marks: 4, text: "State Gauss's law (i) descriptively and (ii) in integral form.", concepts: w([K.gauss, 1]) },
  { id: "mst-2324-q4b", source: "mst2324", kind: "mst", paper: MST, question: "Q4(b)", marks: 10, text: "Calculate Q_T, the total charge within 0 ≤ ρ ≤ 0.2 m, 0 ≤ φ ≤ π, −4 ≤ z ≤ −2 m, for the nonlinear charge density ρv = ρ² sin φ µC/m³.", concepts: w([K.gapp, 0.6], [K.vec, 0.4]) },
  { id: "mst-2324-q4c", source: "mst2324", kind: "mst", paper: MST, question: "Q4(c)", marks: 6, text: "Calculate the capacitance of a 100 km coaxial cable with a solid core of radius 0.28 inch, insulated to a 0.90 inch diameter by a material of dielectric constant εr = 6.78.", concepts: w([K.cap, 1]) },
  { id: "mst-2324-q5a", source: "mst2324", kind: "mst", paper: MST, question: "Q5(a)", marks: 10, text: "(i) State the equation relating E to the potential V. (ii) Given V = ρ²z³ + 5z cos φ (volts), find E at P(2, π, 3).", concepts: w([K.pot, 0.6], [K.calc, 0.4]) },
  { id: "mst-2324-q5b", source: "mst2324", kind: "mst", paper: MST, question: "Q5(b)", marks: 10, text: "A parallel-plate capacitor has plate area S = 0.120 m² and separation d = 80 µm. At V0 = 15.0 V it stores WE = 50.0 µJ. Calculate (i) the energy density wE (the paper asks for J·m⁻²), (ii) the capacitance C, (iii) the relative permittivity εr of its dielectric.", concepts: w([K.cap, 1]) },

  // Finals, Dec 2024 (catalog: f2425)
  { id: "f2425-q1a", source: "f2425", kind: "finals", paper: F2425, question: "Q1(a)", marks: 4, text: "Very briefly comment on how electromagnetics theory has been important to technological advances in a chosen critical infrastructure.", concepts: w([K.world, 1]) },
  { id: "f2425-q1b", source: "f2425", kind: "finals", paper: F2425, question: "Q1(b)", marks: 11, text: "qA = +2.5 µC and qB = −3.8 µC are fixed at A(1, 2, 3) nm and B(0, 2, 8) nm. (i) Calculate F_AB, the force qA exerts on qB. (ii) Hence compute E_B, the field at the location of qB.", concepts: w([K.coul, 0.6], [K.field, 0.3], [K.vec, 0.1]) },
  { id: "f2425-q1c", source: "f2425", kind: "finals", paper: F2425, question: "Q1(c)", marks: 10, text: "In a region of permittivity ε, the potential is V = x³ sin y + 10z² kV. (i) Develop an expression for D in C·m⁻². (ii) Evaluate D at P(2, −2, 1) m.", concepts: w([K.pot, 0.5], [K.calc, 0.3], [K.flux, 0.2]) },
  {
    id: "f2425-q2a", source: "f2425", kind: "finals", paper: F2425, question: "Q2(a)", marks: 8,
    text: "In a region of free space, D = 5.0r² a_r (nC/m²). A sphere of radius r = 10.0 m is centred at the origin. (i) Compute Q_T, the total charge inside the sphere. (ii) Stating your reason, deduce the total electric flux leaving the sphere.",
    concepts: w([K.gauss, 0.5], [K.gapp, 0.3], [K.surf, 0.2]),
    practice: "em1.electrostatics.gauss-applications/past-paper",
  },
  { id: "f2425-q2b", source: "f2425", kind: "finals", paper: F2425, question: "Q2(b)", marks: 17, text: "Region 1 (x < 0) is a dielectric with εr1 = 5; region 2 (x > 0) is free space. Given D1 = ax + 3ay − 7az C·m⁻², calculate (i) E2, (ii) D2, (iii) the angle θ2.", concepts: w([K.diel, 1]) },
  { id: "f2425-q3a", source: "f2425", kind: "finals", paper: F2425, question: "Q3(a)", marks: 8, text: "A coaxial line has inner radius a and outer radius b, separated by an insulator of relative permeability μr. The inner conductor carries total current I along the x-axis. Develop an expression for H between the conductors.", concepts: w([K.amp, 1]) },
  { id: "f2425-q3b", source: "f2425", kind: "finals", paper: F2425, question: "Q3(b)", marks: 17, text: "H1 = ax + 3ay + 2az A·m⁻¹ fills the region y + 2x − 4 ≤ 0, where μ1 = 2μ0. Calculate (i) the magnetization M1, (ii) B1, (iii) H2 and B2 in the region y + 2x − 4 > 0, where μ2 = 8μ0.", concepts: w([K.amp, 1]) },
  { id: "f2425-q4a", source: "f2425", kind: "finals", paper: F2425, question: "Q4(a)", marks: 15, text: "A long, straight, nonmagnetic conductor of radius 8.00 mm carries a uniformly distributed direct current I = 50.0 A along the z-axis. (i) State Ampère's circuital law. (ii) Find J within the conductor. (iii) Develop H and B inside (0 < ρ ≤ r). (iv) State and justify ∇ × H outside.", concepts: w([K.amp, 0.8], [K.calc, 0.2]) },
  { id: "f2425-q4b", source: "f2425", kind: "finals", paper: F2425, question: "Q4(b)", marks: 5, text: "From the principle of conservation of charge, prove the continuity equation in point form, ∇·J = −∂ρv/∂t.", concepts: w([K.cur, 1]) },
  { id: "f2425-q4c", source: "f2425", kind: "finals", paper: F2425, question: "Q4(c)", marks: 5, text: "State Poynting's theorem and comment on how it supports an important conservation law.", concepts: w([K.wave, 1]) },

  // Finals 2023-24, Sem 1 (catalog: f2324)
  { id: "f2324-q1a", source: "f2324", kind: "finals", paper: F2324, question: "Q1(a)", marks: 7, text: "Calculate the force that Q1 = −10 µC at A(0, 3, 7) nm exerts on Q2 = +8 µC at B(2, 0, 1) nm, in a vacuum.", concepts: w([K.coul, 0.8], [K.vec, 0.2]) },
  { id: "f2324-q1b", source: "f2324", kind: "finals", paper: F2324, question: "Q1(b)", marks: 18, text: "In a region where V = r³ sin θ cos φ volts: (i) find D at P(5, π/3, −π/2); (ii) calculate the energy required to move a 10 µC charge from X(2, 0°, 100°) to Y(5, 45°, 90°).", concepts: w([K.pot, 0.7], [K.calc, 0.3]) },
  { id: "f2324-q2a", source: "f2324", kind: "finals", paper: F2324, question: "Q2(a)", marks: 13, text: "Region 1 (x < 0) is free space; region 2 (x > 0) is a dielectric with εr2 = 3.5. Given D1 = 3ax − 4ay + 6az C·m⁻², compute (i) E2 and (ii) the angle θ1.", concepts: w([K.diel, 1]) },
  {
    id: "f2324-q2b", source: "f2324", kind: "finals", paper: F2324, question: "Q2(b)", marks: 12,
    text: "In a vacuum, E(r) = πr² for 0 < r ≤ 3 m and 6π/r³ for r > 3 m (N·C⁻¹, radial). (i) State Gauss's law. Compute ρv at (ii) r = 2 m and (iii) r = 5 m.",
    concepts: w([K.gauss, 0.4], [K.div, 0.6]),
  },
  { id: "f2324-q3a", source: "f2324", kind: "finals", paper: F2324, question: "Q3(a)", marks: 4, text: "State Maxwell's equations for static electromagnetic fields in point form.", concepts: w([K.dyn, 0.5], [K.div, 0.25], [K.amp, 0.25]) },
  { id: "f2324-q3b", source: "f2324", kind: "finals", paper: F2324, question: "Q3(b)", marks: 6, text: "A vertical hollow conducting cylinder has inner radius r and outer radius R and carries current I along the z-axis. Develop an expression for H everywhere.", concepts: w([K.amp, 1]) },
  { id: "f2324-q3c", source: "f2324", kind: "finals", paper: F2324, question: "Q3(c)", marks: 15, text: "H1 = 2ax + 3ay − az A·m⁻¹ in the region y − x − 2 ≤ 0, where μ1 = μ0. Calculate (i) M1 and B1, (ii) H2 and B2 in y − x − 2 > 0, where μ2 = 3μ0.", concepts: w([K.amp, 1]) },
  { id: "f2324-q4a", source: "f2324", kind: "finals", paper: F2324, question: "Q4(a)", marks: 15, text: "A long, straight, nonmagnetic conductor of radius 0.50 mm carries a uniform d.c. current of 8.0 A along z. Within the conductor: (i) find J; (ii) compute H and B (Ampère's law); (iii) show that ∇ × H = J.", concepts: w([K.amp, 0.8], [K.calc, 0.2]) },
  { id: "f2324-q4b", source: "f2324", kind: "finals", paper: F2324, question: "Q4(b)", marks: 5, text: "With an appropriate diagram, describe the principle of electromagnetic wave propagation in dielectrics.", concepts: w([K.wave, 1]) },
  { id: "f2324-q4c", source: "f2324", kind: "finals", paper: F2324, question: "Q4(c)", marks: 5, text: "Briefly describe the transmission of electromagnetic wave power using Poynting's theorem.", concepts: w([K.wave, 1]) },

  // ICT 02, 18 Nov 2024 (catalog: ict2-2425; solved by hand, so exact data comes from the source in content plans)
  { id: "ict2-2425-q1", source: "ict2-2425", kind: "ict", paper: ICT2, question: "Q1", text: "(a) State Biot-Savart's law and use it to find H on the axis of an N-turn circular coil. (b) State Ampère's circuital law in point and integral form, and use it to find H and J for a current-carrying conductor (see source).", concepts: w([K.amp, 1]) },
  { id: "ict2-2425-q2", source: "ict2-2425", kind: "ict", paper: ICT2, question: "Q2", text: "A dielectric boundary lies on the plane 6x + 8y = 16. Split D1 into normal and tangential parts, then find D2, E2 and the field angles (see source).", concepts: w([K.diel, 1]) },
  { id: "ict2-2425-q3", source: "ict2-2425", kind: "ict", paper: ICT2, question: "Q3", text: "A magnetic boundary across a general plane: find B2 and H2, the angle B2 makes with the normal, and the magnetizations (see source).", concepts: w([K.amp, 1]) },

  // HW02 2023-24 = HW01 2024-25 (catalog: hw02-2324, hw01-2425)
  { id: "hw-2324-2.1", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.1", marks: 15, seenIn: ["hw02-2324", "hw01-2425"], text: "Find the gradient and evaluate it at the point: (a) V = 10xyz − 2x²z at P(−1, 4, 3); (b) U = 2ρ sin φ + ρz at Q(2, 90°, −1); (c) W = (4/r) sin θ cos φ at R(1, π/6, π/2).", concepts: w([K.calc, 1]) },
  { id: "hw-2324-2.2", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.2", marks: 12, seenIn: ["hw02-2324", "hw01-2425"], text: "Evaluate the divergence of three vector fields, one each in rectangular, cylindrical and spherical coordinates (see source).", concepts: w([K.calc, 1]) },
  { id: "hw-2324-2.3", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.3", marks: 9, seenIn: ["hw02-2324", "hw01-2425"], text: "(a) State Coulomb's law in vector form for two point charges. (b) Define electric field intensity, E. (c) State Gauss's law, and deduce Coulomb's law from it.", concepts: w([K.coul, 0.4], [K.field, 0.2], [K.gauss, 0.4]) },
  { id: "hw-2324-2.4", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.4", marks: 10, seenIn: ["hw02-2324", "hw01-2425"], text: "(a) Q1 = 5 µC and Q2 = −4 µC are at (2, 1, 3) cm and (−4, 0, 6) cm. Determine the force on Q1. (b) Calculate the field intensity 2.45 nm from a −6.76 µC point charge.", concepts: w([K.coul, 0.6], [K.field, 0.4]) },
  { id: "hw-2324-2.5", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.5", marks: 21, seenIn: ["hw02-2324", "hw01-2425"], text: "Determine the total charge: (a) on the line 1 < x < 5 m with ρL = 12x² mC/m; (b) on the cylinder 0 < z < 7 m, ρ = 4 m, with ρS = πρz² pC/m²; (c) within the sphere r = 5.25 m if ρv = 3.05/(r sin θ) C/m³.", concepts: w([K.gapp, 0.6], [K.vec, 0.4]) },
  { id: "hw-2324-2.6", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.6", marks: 18, seenIn: ["hw02-2324", "hw01-2425"], text: "Given D = 3xy ax + x² ay C/m², calculate (a) the volume charge density ρv, (b) the total flux through the surface 0 < x, y < 1 m at z = −3 m, (c) the total charge in the region 0 < x, y, z < 2 m.", concepts: w([K.div, 0.6], [K.gauss, 0.4]) },

  // HW03 2024-25 (catalog: hw03-2425)
  { id: "hw03-2425-3.1a", source: "hw03-2425", kind: "hw", paper: HW03, question: "3.1(a)", marks: 15, text: "A 200-turn coil of radius 30.0 cm, parallel to the x–y plane and centred at the origin, carries 2.82 A in the −aφ direction. (i) State Biot-Savart's law with a diagram. (ii) Calculate H at P(0, 0, −50) cm.", concepts: w([K.amp, 1]) },
  { id: "hw03-2425-3.1b", source: "hw03-2425", kind: "hw", paper: HW03, question: "3.1(b)", marks: 15, text: "A long vertical solid conductor of radius 20.0 mm carries current uniformly, with J = 95.49 kA·m⁻² inside. (i) State Ampère's circuital law and express it mathematically. (ii) Give one drawback and one advantage of the law. (iii) Using it, find B at P(0, 0, 15) mm.", concepts: w([K.amp, 1]) },
  { id: "hw03-2425-3.2", source: "hw03-2425", kind: "hw", paper: HW03, question: "3.2", marks: 25, text: "Region 1 (ε1 = 8ε0) and region 2 (ε2 = 5ε0) meet at the plane −3x + 4z = 15. In region 1, D1 = −10.0ax − 20.0ay + 14.0az C·m⁻². Stating assumptions, calculate (a) D2, (b) E2 in terms of ε0, (c) θ1 and θ2, the angles between the field vectors and the interface tangent, (d) the ratio cos θ1 / cos θ2, and comment on it.", concepts: w([K.diel, 1]) },
  { id: "hw03-2425-3.3", source: "hw03-2425", kind: "hw", paper: HW03, question: "3.3", marks: 25, text: "Region 1 (μr1 = 4.66) and region 2 (μr2 = 1.5μr1) meet at the plane 5x + 4y + 10z − 12 = 0. In region 1, H1 = (1/μ0)(9.44ax + 6.87ay − 12.2az) A·m⁻¹. Calculate (a) H2 in terms of μ0, (b) B2, (c) θ1 and θ2 from the interface normal, (d) the magnetizations M1 and M2.", concepts: w([K.amp, 1]) },

  // HW04 2024-25 (catalog: hw04-2425)
  { id: "hw04-2425-4.1", source: "hw04-2425", kind: "hw", paper: HW04, question: "4.1", marks: 8, text: "State, and express mathematically, (a) the current continuity equation and (b) Faraday's law of induction.", concepts: w([K.cur, 0.5], [K.dyn, 0.5]) },
  { id: "hw04-2425-4.2", source: "hw04-2425", kind: "hw", paper: HW04, question: "4.2", marks: 12, text: "For E(z, t) = E0 e^(−αz) cos(ωt ± βz + φ) ay: (a) What is a TEM wave? (b) Name the terms α, ω, β and φ. (c) State the matching H(z, t). (d) Relate E(z, t), H(z, t) and the wave velocity u.", concepts: w([K.wave, 1]) },
  { id: "hw04-2425-4.3", source: "hw04-2425", kind: "hw", paper: HW04, question: "4.3", marks: 20, text: "(a) With diagrams, describe how wave propagation in dielectrics differs from propagation in conductors. (b) (i) What is Poynting's theorem? (ii) On what conservation principle is it based? (iii) State how the Poynting vector and the average power of a TEM wave are computed.", concepts: w([K.wave, 1]) },
];
