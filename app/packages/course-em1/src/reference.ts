import { SLIDES, WENT } from "./sources";

const L2C = "Course notes, Unit 2c";
const L3A = "Course notes, Unit 3a";
const L3B = "Course notes, Unit 3b";
const WENT3 = "Wentworth, Fundamentals of Electromagnetics with Engineering Applications, Ch. 3";
const WENT4 = "Wentworth, Fundamentals of Electromagnetics with Engineering Applications, Ch. 4";
const WENT5 = "Wentworth, Fundamentals of Electromagnetics with Engineering Applications, Ch. 5";
const MAXH = "Course notes: Maxwell's equations explained";

const U2 = "Unit 2 · Electrostatics";
const U3 = "Unit 3 · Magnetostatics";
const U4 = "Unit 4 · Dynamic fields";
const U5 = "Unit 5 · Plane waves";

/** Formula-sheet entries shown in the Formulas tool, grouped by unit. */
export const formulaSheet = [
  { id: "coulomb", group: U2, title: "Coulomb's law", latex: String.raw`\mathbf F_{12}=\dfrac{Q_1Q_2}{4\pi\varepsilon_0R^2}\,\mathbf a_{R}`, source: `${SLIDES}, p. 11` },
  { id: "e-point", group: U2, title: "E of a point charge", latex: String.raw`\mathbf E=\dfrac{Q}{4\pi\varepsilon_0 r^2}\,\mathbf a_r`, source: `${SLIDES}, p. 17` },
  { id: "e-line", group: U2, title: "E of an infinite line", latex: String.raw`\mathbf E=\dfrac{\rho_L}{2\pi\varepsilon_0\rho}\,\mathbf a_\rho`, source: `${SLIDES}, p. 27` },
  { id: "e-sheet", group: U2, title: "E of an infinite sheet", latex: String.raw`\mathbf E=\dfrac{\rho_S}{2\varepsilon_0}\,\mathbf a_n`, source: `${SLIDES}, pp. 16-28` },
  { id: "d", group: U2, title: "Flux density", latex: String.raw`\mathbf D=\varepsilon\mathbf E,\quad \varepsilon=\varepsilon_r\varepsilon_0`, source: `${WENT}, §2.6` },
  { id: "psi", group: U2, title: "Flux through a surface", latex: String.raw`\Psi=\int_S \mathbf D\cdot d\mathbf S`, source: `${SLIDES}, p. 36` },
  { id: "gauss", group: U2, title: "Gauss's law", latex: String.raw`\oint_S \mathbf D\cdot d\mathbf S=Q_{\mathrm{enc}}`, source: `${SLIDES}, p. 38` },
  { id: "ds-sphere", group: U2, title: "Sphere surface element", latex: String.raw`d\mathbf S=r^2\sin\theta\,d\theta\,d\phi\,\mathbf a_r`, source: `${WENT}, §2.3` },
  { id: "div", group: U2, title: "Point form", latex: String.raw`\nabla\cdot\mathbf D=\rho_v`, source: `${SLIDES}, p. 39` },
  { id: "v-ab", group: U2, title: "Potential difference", latex: String.raw`V_{AB}=V_A-V_B=-\int_B^A\mathbf E\cdot d\mathbf L`, source: `${L2C}, Potential` },
  { id: "v-point", group: U2, title: "Potential of a point charge", latex: String.raw`V=\dfrac{Q}{4\pi\varepsilon_0 r}`, source: `${L2C}, Potential` },
  { id: "e-grad", group: U2, title: "Field from potential", latex: String.raw`\mathbf E=-\nabla V`, source: `${L2C}, Potential` },
  { id: "ohm", group: U2, title: "Current density and Ohm's law", latex: String.raw`\mathbf J=\sigma\mathbf E,\quad I=\int_S\mathbf J\cdot d\mathbf S`, source: `${L2C}, Current and Ohm's law` },
  { id: "continuity", group: U2, title: "Continuity", latex: String.raw`\nabla\cdot\mathbf J=-\dfrac{\partial\rho_v}{\partial t}`, source: `${L2C}, Current and Ohm's law` },
  { id: "bc-e", group: U2, title: "Dielectric boundary", latex: String.raw`E_{1t}=E_{2t},\quad D_{1n}-D_{2n}=\rho_S`, source: `${L2C}, Dielectrics and boundary conditions` },
  { id: "cap", group: U2, title: "Capacitance", latex: String.raw`C=\dfrac{Q}{V},\quad C_{\text{plates}}=\dfrac{\varepsilon S}{d},\quad W_E=\tfrac12CV^2`, source: `${L2C}, Capacitance` },
  { id: "eps0", group: U2, title: "Permittivity of free space", latex: String.raw`\varepsilon_0=8.854\times10^{-12}\ \mathrm{F/m}`, source: `${SLIDES}, p. 12` },
  { id: "biot-savart", group: U3, title: "Biot–Savart law", latex: String.raw`d\mathbf H=\dfrac{I\,d\mathbf L\times\mathbf a_R}{4\pi R^2}`, source: `${WENT3}, §3.1–3.6` },
  { id: "h-filament", group: U3, title: "H of an infinite filament", latex: String.raw`\mathbf H=\dfrac{I}{2\pi\rho}\,\mathbf a_\phi`, source: `${L3A}, Biot–Savart and Ampère` },
  { id: "ampere", group: U3, title: "Ampère's circuital law", latex: String.raw`\oint_L\mathbf H\cdot d\mathbf L=I_{\text{enc}},\quad \nabla\times\mathbf H=\mathbf J`, source: `${WENT3}, §3.1–3.6` },
  { id: "b-h", group: U3, title: "Flux density and flux", latex: String.raw`\mathbf B=\mu\mathbf H,\ \mu=\mu_r\mu_0,\quad \Phi=\int_S\mathbf B\cdot d\mathbf S`, source: `${WENT3}, §3.1–3.6` },
  { id: "force", group: U3, title: "Magnetic force", latex: String.raw`\mathbf F=q\mathbf u\times\mathbf B,\quad d\mathbf F=I\,d\mathbf L\times\mathbf B`, source: `${L3A}, Biot–Savart and Ampère` },
  { id: "m", group: U3, title: "Magnetization", latex: String.raw`\mathbf B=\mu_0(\mathbf H+\mathbf M),\quad \mathbf M=\chi_m\mathbf H,\quad \mu_r=1+\chi_m`, source: `${WENT3}, §3.7–3.8` },
  { id: "bc-h", group: U3, title: "Magnetic boundary", latex: String.raw`B_{1n}=B_{2n},\quad (\mathbf H_1-\mathbf H_2)\times\mathbf a_{N12}=\mathbf K`, source: `${WENT3}, §3.7–3.8` },
  { id: "inductance", group: U3, title: "Inductance and energy", latex: String.raw`L=\dfrac{N\Phi}{I},\quad W_m=\tfrac12LI^2,\quad w_m=\tfrac12\mathbf B\cdot\mathbf H`, source: `${L3B}, Inductance` },
  { id: "l-coax", group: U3, title: "Coax inductance per length", latex: String.raw`L'=\dfrac{\mu}{2\pi}\ln\dfrac{b}{a}`, source: `${WENT3}, §3.9–3.10` },
  { id: "mu0", group: U3, title: "Permeability of free space", latex: String.raw`\mu_0=4\pi\times10^{-7}\ \mathrm{H/m}`, source: `${WENT3}, §3.1–3.6` },
  { id: "faraday", group: U4, title: "Faraday's law", latex: String.raw`V_{\text{emf}}=-N\dfrac{d\Phi}{dt}=\oint\mathbf E\cdot d\mathbf L`, source: `${WENT4}, §4.3–4.6` },
  { id: "maxwell", group: U4, title: "Maxwell's equations (point form)", latex: String.raw`\nabla\cdot\mathbf D=\rho_v,\quad \nabla\cdot\mathbf B=0,\quad \nabla\times\mathbf E=-\dfrac{\partial\mathbf B}{\partial t},\quad \nabla\times\mathbf H=\mathbf J+\dfrac{\partial\mathbf D}{\partial t}`, source: `${MAXH}, the four equations` },
  { id: "displacement", group: U4, title: "Displacement current density", latex: String.raw`\mathbf J_d=\dfrac{\partial\mathbf D}{\partial t}`, source: `${WENT4}, §4.3–4.6` },
  { id: "wave", group: U5, title: "Plane wave", latex: String.raw`\mathbf E(z,t)=E_0e^{-\alpha z}\cos(\omega t-\beta z+\phi)\,\mathbf a_x`, source: `${WENT5}, §5.1–5.5` },
  { id: "lossless", group: U5, title: "Lossless medium", latex: String.raw`\beta=\omega\sqrt{\mu\varepsilon},\quad u=\dfrac{1}{\sqrt{\mu\varepsilon}}=\dfrac{\omega}{\beta},\quad \lambda=\dfrac{2\pi}{\beta},\quad \eta=\sqrt{\dfrac{\mu}{\varepsilon}}`, source: `${WENT5}, §5.1–5.5` },
  { id: "good-conductor", group: U5, title: "Good conductor", latex: String.raw`\alpha=\beta=\sqrt{\pi f\mu\sigma},\quad \delta=\dfrac{1}{\alpha}`, source: `${WENT5}, §5.1–5.5` },
  { id: "poynting", group: U5, title: "Poynting vector and average power", latex: String.raw`\mathbf P=\mathbf E\times\mathbf H,\quad \mathbf P_{\text{ave}}=\dfrac{E_0^2}{2|\eta|}e^{-2\alpha z}\cos\theta_\eta\,\mathbf a_z`, source: `${WENT5}, §5.1–5.5` },
  { id: "eta0", group: U5, title: "Free-space wave constants", latex: String.raw`\eta_0=\sqrt{\dfrac{\mu_0}{\varepsilon_0}}\approx120\pi\approx377\ \Omega,\quad c=\dfrac{1}{\sqrt{\mu_0\varepsilon_0}}\approx3\times10^8\ \mathrm{m/s}`, source: `${WENT5}, §5.1–5.5` },
];
