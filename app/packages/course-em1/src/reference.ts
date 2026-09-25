import { F2324, F2425, SLIDES, WENT } from "./sources";

/** Formula-sheet entries shown in the context drawer. */
export const formulaSheet = [
  { id: "coulomb", title: "Coulomb's law", latex: String.raw`\mathbf F_{12}=\dfrac{Q_1Q_2}{4\pi\varepsilon_0R^2}\,\mathbf a_{R}`, source: `${SLIDES}, p. 11` },
  { id: "e-point", title: "E of a point charge", latex: String.raw`\mathbf E=\dfrac{Q}{4\pi\varepsilon_0 r^2}\,\mathbf a_r`, source: `${SLIDES}, p. 17` },
  { id: "e-line", title: "E of an infinite line", latex: String.raw`\mathbf E=\dfrac{\rho_L}{2\pi\varepsilon_0\rho}\,\mathbf a_\rho`, source: `${SLIDES}, p. 27` },
  { id: "d", title: "Flux density", latex: String.raw`\mathbf D=\varepsilon\mathbf E,\quad \varepsilon=\varepsilon_r\varepsilon_0`, source: `${WENT}, §2.6` },
  { id: "psi", title: "Flux through a surface", latex: String.raw`\Psi=\int_S \mathbf D\cdot d\mathbf S`, source: `${SLIDES}, p. 36` },
  { id: "gauss", title: "Gauss's law", latex: String.raw`\oint_S \mathbf D\cdot d\mathbf S=Q_{\mathrm{enc}}`, source: `${SLIDES}, p. 38` },
  { id: "ds-sphere", title: "Sphere surface element", latex: String.raw`d\mathbf S=r^2\sin\theta\,d\theta\,d\phi\,\mathbf a_r`, source: `${WENT}, §2.3` },
  { id: "div", title: "Point form", latex: String.raw`\nabla\cdot\mathbf D=\rho_v`, source: `${SLIDES}, p. 39` },
  { id: "eps0", title: "Permittivity of free space", latex: String.raw`\varepsilon_0=8.854\times10^{-12}\ \mathrm{F/m}`, source: `${SLIDES}, p. 12` },
];

/** Past-paper questions with the concepts they test (weights sum to 1). */
export const pastPapers = [
  {
    id: "f2425-q2a",
    paper: F2425,
    question: "Q2(a)",
    marks: 8,
    text: "In a region of free space, D = 5.0r² a_r (nC/m²). A sphere of radius r = 10.0 m is centred at the origin. (i) Compute Q_T, the total charge inside the sphere. (ii) Stating your reason, deduce the total electric flux leaving the sphere.",
    concepts: [
      { conceptId: "em1.electrostatics.gauss-law", weight: 0.5 },
      { conceptId: "em1.electrostatics.gauss-applications", weight: 0.3 },
      { conceptId: "em1.math.surface-integrals", weight: 0.2 },
    ],
    practice: "em1.electrostatics.gauss-applications/past-paper",
  },
  {
    id: "f2324-q2b",
    paper: F2324,
    question: "Q2(b)",
    marks: 12,
    text: "An electric field E(r) in a vacuum is given in spherical coordinates. (i) State Gauss's law. Compute the charge density ρ_v at (ii) r = 2 m and (iii) r = 5 m.",
    concepts: [
      { conceptId: "em1.electrostatics.gauss-law", weight: 0.4 },
      { conceptId: "em1.electrostatics.divergence", weight: 0.6 },
    ],
    practice: "em1.electrostatics.divergence/main",
  },
];
