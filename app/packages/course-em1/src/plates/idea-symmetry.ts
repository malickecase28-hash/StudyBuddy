import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const point = (id: string, q: number, pos: [number, number, number]) => ({ id, kind: "point" as const, q, pos });
const tpl = (id: string) => instantiate(templates.find((t) => t.id === id)!, 1);
const q06 = tpl("q06-octant");
const q08 = tpl("q08-q");
const f2425 = tpl("f2425-qt");
const numeric = (id: string, v: ReturnType<typeof tpl>, template: string, covers: string, note: string) => ({
  id, title: `Check: ${note}`, note: `${note[0]!.toUpperCase()}${note.slice(1)}, with your own numbers.`, covers: [covers],
  interaction: { id, type: "numeric", prompt: v.prompt, answer: v.spec.answer, distractors: v.spec.distractors, relTol: v.spec.relTol, hints: v.hints, template, dimension: "computational" },
});

// The exam question: D = 5.0 r² nC/m² on a sphere of radius 10 m (too big to draw: stated as givens).
const R_F = 10;
const D_F = 5 * R_F * R_F; // nC/m²
const A_F = 4 * Math.PI * R_F * R_F; // m²
const Q_F = D_F * A_F; // nC

export const ideaSymmetry = defineIdeaPlate({
  id: "idea-symmetry",
  title: "Using Gauss's law: symmetry",
  requires: { objectives: [3], items: ["tutorial:q06", "tutorial:q08", "past:f2425-q2a"], misconceptions: ["GAUSS_WITHOUT_SYMMETRY"] },
  instances: [
    { id: "q", component: "charges", params: { items: [point("q1", 2, [0.4, 0, 0.2])] } },
    { id: "field", component: "field-arrows", params: { grid: 5, probe: 1 }, links: { charges: "q" } },
    { id: "surface", component: "gaussian-surface", params: { shape: "blob", size: 1.1, shading: true }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\oint_S\mathbf D\cdot d\mathbf S=Q_{\mathrm{enc}}`, speech: "the closed surface integral of D dot d S equals the charge enclosed", shortSpeech: "Gauss's law" } },
  ],
  ideas: [
    {
      id: "symmetry",
      title: "Using Gauss's law: symmetry",
      objectives: [3],
      explain: [
        {
          id: "hard", title: "True, but hard to use", show: ["q", "field", "surface", "eq"], focus: ["surface"],
          note: "Gauss's law is always true: this lumpy surface around an off-centre +2 µC charge still has 2 µC of net flux. But to find D from it you would need D on every patch, and here D changes in size and direction all over the surface. There is nothing you can pull out of the integral. To use the law to find D, you need symmetry.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "point", title: "A point charge: a sphere", patch: { q: { items: [point("q1", 2, [0, 0, 0])] }, surface: { shape: "sphere", size: 1 }, eq: { latex: R`D\cdot4\pi r^2=Q\ \Rightarrow\ D=\frac{Q}{4\pi r^2}`, speech: "D times four pi r squared equals Q, so D equals Q over four pi r squared", shortSpeech: "D from a point charge" } },
          focus: ["surface", "eq"],
          note: "Centre a sphere on the charge. Every patch is now the same distance away, so |D| is the same everywhere on it, and D points straight out along every normal. The integral collapses: ∮ D · dS = D × 4πr². Set it equal to Q: D = Q/(4πr²) = 2/(4π × 1²) = 0.1592 µC/m², exactly the probe's reading 1 m out.",
          claims: [{ instance: "field", readout: "probeD", value: 0.159155, unit: "µC/m^2" }],
        },
        {
          id: "line", title: "A line charge: a cylinder", patch: { q: { items: [{ id: "l", kind: "line", rhoL: 2000, x: 0, y: 0 }] }, surface: { shape: "cylinder", size: 1, height: 1.4 }, eq: { latex: R`D\cdot2\pi\rho h=\rho_L h\ \Rightarrow\ D=\frac{\rho_L}{2\pi\rho}`, speech: "D times two pi rho h equals rho L h, so D equals rho L over two pi rho", shortSpeech: "D from a line charge" } },
          focus: ["surface", "eq"],
          note: "For a long straight line charge the symmetry is cylindrical: D points straight out from the line and has one size at each distance ρ. Use a coaxial cylinder of radius ρ and length h. The flat end caps get no flux, because D runs along them; the curved side gets D × 2πρh. It encloses ρL h, so D = ρL/(2πρ). With ρL = 2000 nC/m, 1 m from the line: D = 0.3183 µC/m².",
          claims: [{ instance: "field", readout: "probeD", value: 0.31831, unit: "µC/m^2" }],
        },
        {
          id: "sheet", title: "A sheet: a pillbox", patch: { q: { items: [{ id: "s", kind: "sheet", rhoS: 3, z0: -0.3 }] }, surface: { shape: "cylinder", size: 0.5, height: 1, center: [0, 0, -0.3] }, eq: { latex: R`2DA=\rho_S A\ \Rightarrow\ D=\frac{\rho_S}{2}`, speech: "two D A equals rho S A, so D equals rho S over two", shortSpeech: "D from a sheet" } },
          focus: ["surface", "eq"],
          note: "For a large flat sheet, D points straight away from it on both sides and does not weaken with distance. Use a pillbox straddling the sheet: its curved side gets no flux, and each end cap of area A gets D · A. It encloses ρS A, so 2DA = ρS A and D = ρS/2. With ρS = 3 µC/m², D = 1.5 µC/m² at any height. The pillbox's net flux is 2.356 µC.",
          claims: [{ instance: "field", readout: "probeD", value: 1.5, unit: "µC/m^2" }, { instance: "surface", readout: "flux", value: 2.35619, unit: "µC" }],
        },
        {
          id: "recipe", title: "The recipe", patch: { eq: { latex: R`D\times(\text{area that counts})=Q_{\mathrm{enc}}`, speech: "D times the area that counts equals the charge enclosed", shortSpeech: "the Gauss recipe" } }, focus: ["eq"],
          note: "The recipe: (1) spot the symmetry: a point, a line or a plane; (2) choose a closed surface on which |D| is constant wherever D crosses it, with D · dS = 0 everywhere else; (3) write ∮ D · dS as D times the area that counts; (4) set it equal to Q_enc and solve for D. If no surface like that exists, the law is still true, but you cannot use it to find D.",
        },
      ],
      examples: [
        {
          id: "point", level: "basic", title: "D from Q: a point charge",
          setup: { q: { items: [point("q1", 5, [0, 0, 0])] }, surface: { shape: "sphere", size: 1.5, center: [0, 0, 0] }, field: { probe: 1.5 } },
          problem: "Use Gauss's law to find |D| 1.5 m from a +5 µC point charge.",
          lines: [
            { text: "Symmetry: spherical. Choose a sphere of radius 1.5 m centred on the charge.", focus: ["surface"] },
            { text: "On it |D| is constant and along every normal, so ∮ D · dS = D × 4π(1.5)² = D × 28.27 m².", focus: ["surface"], claims: [{ instance: "surface", readout: "area", value: 28.2743, unit: "m^2" }] },
            { text: "Set that equal to 5 µC: D = 5/28.27 = 0.1768 µC/m².", latex: R`D=\frac{5}{28.27}=0.1768\ \mu\mathrm C/\mathrm m^2`, focus: ["field"], claims: [{ instance: "field", readout: "probeD", value: 0.176839, unit: "µC/m^2" }] },
          ],
          trap: "Using the surface area of a sphere of radius 1 m. The Gaussian sphere goes through the point where you want D.",
        },
        {
          id: "line", level: "tutorial", title: "D from a line charge",
          setup: { q: { items: [{ id: "l", kind: "line", rhoL: 3000, x: 0, y: 0 }] }, surface: { shape: "cylinder", size: 0.5, height: 1.2, center: [0, 0, 0] }, field: { probe: 0.5 } },
          problem: "A long line charge carries ρL = 3000 nC/m. Find |D| at 0.5 m from it.",
          lines: [
            { text: "Symmetry: cylindrical. Choose a coaxial cylinder of radius 0.5 m and length h.", focus: ["surface"] },
            { text: "The end caps carry no flux; the curved side carries D × 2πρh. The cylinder encloses ρL h.", latex: R`D\cdot2\pi\rho h=\rho_L h`, focus: ["surface"] },
            { text: "So D = ρL/(2πρ) = 3000 nC/m ÷ (2π × 0.5) = 0.9549 µC/m².", latex: R`D=\frac{\rho_L}{2\pi\rho}=\frac{3\times10^{-6}}{2\pi(0.5)}`, focus: ["field"], claims: [{ instance: "field", readout: "probeD", value: 0.95493, unit: "µC/m^2" }] },
          ],
          trap: "Using 4πr² as for a point charge. A line has cylindrical symmetry: the area that counts is 2πρh.",
        },
        {
          id: "finals", level: "exam", title: "D given as a radial field",
          show: ["eq"], hide: ["q", "field", "surface"],
          setup: { eq: { latex: R`Q_T=\oint_S\mathbf D\cdot d\mathbf S=D(R)\,4\pi R^2`, speech: "Q T equals the closed surface integral of D dot d S, which equals D at R times four pi R squared", shortSpeech: "total charge from D" } },
          problem: "In free space D = 5.0r² a_r nC/m². A sphere of radius 10 m is centred at the origin. (i) Compute Q_T, the total charge inside. (ii) Deduce the total flux leaving the sphere. (The sphere is too big for the plate; its numbers are given.)",
          givens: [{ value: R_F, unit: "m" }],
          lines: [
            { text: "D is radial and depends only on r, so it is constant on the sphere and along every normal. On it, D = 5 × 10² = 500 nC/m².", focus: ["eq"], givens: [{ value: D_F, unit: "nC/m^2" }] },
            { text: "The sphere's area is 4π × 10² = 1256.6 m².", focus: ["eq"], givens: [{ value: A_F, unit: "m^2" }] },
            { text: "(i) Q_T = ∮ D · dS = 500 × 1256.6 = 628318 nC, about 628.3 µC.", focus: ["eq"], givens: [{ value: Q_F, unit: "nC" }, { value: Q_F / 1000, unit: "µC" }] },
            { text: "(ii) By Gauss's law, the total flux leaving the sphere equals the charge inside: Ψ = Q_T ≈ 628.3 µC.", focus: ["eq"], givens: [{ value: Q_F / 1000, unit: "µC" }] },
          ],
          covers: ["past:f2425-q2a"],
          trap: "Forgetting nC → µC at the end (÷1000), or using D somewhere other than on the sphere itself.",
        },
      ],
      asks: [
        { id: "why-symmetry", q: "Why do I need symmetry at all?", tags: ["GAUSS_WITHOUT_SYMMETRY"], a: "To take D out of the integral. ∮ D · dS becomes 'D times an area' only if |D| is the same on the part of the surface that counts and D is parallel to dS there. Without that, the law is true but the integral hides D." },
        { id: "caps", q: "Why do the cylinder's end caps get no flux?", show: ["q", "surface", "field"], hide: ["eq"], patch: { q: { items: [{ id: "l", kind: "line", rhoL: 2000, x: 0, y: 0 }] }, surface: { shape: "cylinder", size: 1, height: 1.4, center: [0, 0, 0] } }, focus: ["surface"], a: "Around a line charge D points straight out from the line, so on the flat caps it runs along the surface: D · dS = 0 there. All of the flux goes through the curved side." },
        { id: "sheet-distance", q: "Why doesn't a sheet's D fall off with distance?", a: "Field lines from an infinite sheet stay parallel: they have nowhere to spread out. The pillbox shows it: its answer, D = ρS/2, has no distance in it." },
        { id: "centred", q: "Does the cylinder have to be centred on the line?", a: "Yes. Off-centre, the distance to the line changes around the side, so |D| is not constant and D is no longer along dS. The law still holds; you just cannot solve it for D." },
        { id: "cube", q: "Can I use a cube around a point charge?", tags: ["GAUSS_WITHOUT_SYMMETRY"], a: "You can, and ∮ D · dS still equals Q. But on a cube's faces |D| and its angle to dS change from point to point, so you cannot pull D out. Always match the surface to the symmetry." },
        { id: "ball", q: "What if the charge is spread out, like a charged ball?", a: "Same recipe: spherical symmetry, a sphere of radius r. Only Q_enc changes: for r inside the ball, count only the charge within r." },
        { id: "pillbox", q: "Why isn't a pillbox's net flux zero when the sheet runs through it?", a: "Because the part of the sheet inside it is enclosed charge: ρS times the cap area. Field leaves through both caps, so both count positive." },
      ],
      checks: [
        {
          id: "choose-line", title: "Check: which surface?", show: ["q", "field", "surface"], patch: { q: { items: [{ id: "l", kind: "line", rhoL: 2000, x: 0, y: 0 }] }, surface: { shape: "cylinder", size: 1, height: 1.4, center: [0, 0, 0] } },
          note: "Five checks on using Gauss's law. Get each right to move on.",
          interaction: { id: "choose-line", type: "choose", prompt: "To find D around a long straight line charge, choose a Gaussian surface that is…", dimension: "application",
            options: [
              choice("cyl", "A cylinder coaxial with the line", true, "Right: cylindrical symmetry, with D constant on the curved side and zero flux through the caps."),
              choice("sphere", "A sphere centred on a point of the line", false, "On a sphere, the distance to the line varies, so |D| is not constant.", "GAUSS_WITHOUT_SYMMETRY"),
              choice("cube", "A cube around a length of the line", false, "On a cube's faces D changes size and angle; you can't pull it out of the integral.", "GAUSS_WITHOUT_SYMMETRY"),
            ] },
        },
        {
          id: "lumpy", title: "Check: without symmetry", patch: { q: { items: [point("q1", 2, [0.4, 0, 0.2])] }, surface: { shape: "blob", size: 1.1, center: [0, 0, 0] } },
          note: "What the law can and cannot do.",
          interaction: { id: "lumpy", type: "choose", prompt: "A lumpy surface encloses a +2 µC charge off-centre. Which is true?", dimension: "conceptual",
            options: [
              choice("true", "Ψ = 2 µC, but D can't be found from it", true, "Exactly: the law holds, but without symmetry the integral hides D."),
              choice("fails", "Gauss's law doesn't apply to this surface", false, "It applies to every closed surface; it just isn't useful here.", "GAUSS_WITHOUT_SYMMETRY"),
              choice("divide", "D = 2 µC divided by the surface area", false, "That needs |D| constant and along every normal, which a lumpy surface doesn't give.", "GAUSS_WITHOUT_SYMMETRY"),
            ] },
        },
        numeric("q06", q06, "q06-octant", "tutorial:q06", "a symmetric share"),
        numeric("q08", q08, "q08-q", "tutorial:q08", "charge from D"),
        numeric("f2425", f2425, "f2425-qt", "past:f2425-q2a", "D given as a radial field"),
      ],
      recap: {
        points: [
          "Gauss's law finds D only with symmetry: |D| constant and D along dS on the part of the surface that counts.",
          "Point charge: a sphere, D = Q/(4πr²).",
          "Line charge: a coaxial cylinder, D = ρL/(2πρ).",
          "Sheet: a pillbox, D = ρS/2 at any distance.",
        ],
        traps: ["Pulling D out of the integral without symmetry.", "Forgetting that a pillbox has two caps.", "Using a cube for a point charge to find D."],
      },
    },
  ],
});
