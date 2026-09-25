import { meta, orig, SLIDES, src, WENT } from "../sources";

const R = String.raw;
const ID = "em1.electrostatics.gauss-law";
const lab = (config: Record<string, unknown>) => config;

const back = (id: string) => ({
  ...meta("reflect", orig()),
  id,
  type: "prose",
  text: "That's the fix. Head back to where you were; the next question will feel different.",
});

export const gaussLaw = {
  id: ID,
  title: "Gauss's Law",
  unit: 2,
  objectives: [
    "State Gauss's law in words and as $\\oint_S \\mathbf D\\cdot d\\mathbf S = Q_{enc}$.",
    "Explain why total flux depends only on enclosed charge, not on the surface's size, shape or outside charges.",
    "Use the sign convention for outward normals to find the sign of flux.",
    "Recognise when symmetry makes Gauss's law a shortcut for finding D.",
  ],
  prerequisites: [
    { conceptId: "em1.electrostatics.flux-density", minMastery: 0.3 },
    { conceptId: "em1.math.surface-integrals", minMastery: 0.3 },
  ],
  misconceptions: [
    { tag: "FLUX_SCALES_WITH_AREA", description: "Thinks a bigger surface catches more flux.", remediation: `${ID}/why-area` },
    { tag: "OUTSIDE_CHARGE_CONTRIBUTES", description: "Counts charges outside the surface.", remediation: `${ID}/outside-charge` },
    { tag: "SURFACE_NORMAL_DIRECTION", description: "Lets dS follow D instead of pointing outward.", remediation: `${ID}/normal-direction` },
    { tag: "D_VS_E_PERMITTIVITY", description: "Thinks D (and flux) change with the medium.", remediation: `${ID}/d-vs-e` },
    { tag: "GAUSS_WITHOUT_SYMMETRY", description: "Tries to pull D out of the integral without symmetry.", remediation: `${ID}/symmetry` },
  ],
  examLinks: [
    { paper: "Finals 2024-25 Sem 1", question: "Q2(a)", marks: 8, weight: 0.5 },
    { paper: "Finals 2023-24 Sem 1", question: "Q2(b)", marks: 12, weight: 0.4 },
  ],
  sources: [src(SLIDES, "pp. 29-38"), src(WENT, "§2.7 Gauss's Law and Applications, p. 47")],
  status: "verified",
  rules: [
    ...(["FLUX_SCALES_WITH_AREA", "OUTSIDE_CHARGE_CONTRIBUTES", "SURFACE_NORMAL_DIRECTION", "D_VS_E_PERMITTIVITY", "GAUSS_WITHOUT_SYMMETRY"] as const).map(
      (tag, i) => ({
        id: `remedy-${i}`,
        when: { type: "tagCount", tag, gte: 2 },
        then: [
          {
            type: "offerRemediation",
            tag,
            lessonRef: `${ID}/${["why-area", "outside-charge", "normal-direction", "d-vs-e", "symmetry"][i]}`,
          },
        ],
        once: true,
      }),
    ),
    { id: "stuck-numeric", when: { type: "attemptsFailed", blockType: "numeric", gte: 3 }, then: [{ type: "revealWorkedStep" }], once: false },
  ],
  lessons: [
    {
      id: "main",
      title: "Electric flux → Gauss's Law",
      minutes: 30,
      blocks: [
        // ── Hook: Faraday's spheres ─────────────────────────────────────────
        {
          ...meta("vivid", src(SLIDES, "pp. 29-30")),
          id: "hook",
          type: "sim-2d",
          scene: "faraday-apparatus",
          config: {},
          caption: "Faraday repeated this setup with different materials between the charged ball and the outer metal sphere. What should the meter show?",
        },
        {
          ...meta("quiet", src(SLIDES, "p. 30")),
          id: "predict-faraday",
          type: "predict",
          prompt: "Faraday swaps the air between the spheres for glass. The charge that appears on the outer sphere is…",
          options: [
            { id: "same", label: "Still exactly +Q", correct: true, feedback: "Yes. Whatever the material, the outer sphere shows +Q." },
            {
              id: "less",
              label: "Less than +Q: glass soaks some of it up",
              correct: false,
              feedback: "A natural guess, but the measured charge was always exactly +Q. The material changes E, not the flux.",
              tag: "D_VS_E_PERMITTIVITY",
            },
            { id: "more", label: "More than +Q: glass amplifies it", correct: false, feedback: "Nothing gets created in between: the outer sphere always showed exactly +Q." },
          ],
          reveal: "Always $+Q$. Something reaches from the inner charge to the outer sphere, and its amount ignores the material. Faraday called it displacement; we call it {{flux|electric flux Ψ}}, and in SI units $\\Psi = Q$, measured in coulombs.",
          dimension: "conceptual",
        },
        // ── Observe the field ───────────────────────────────────────────────
        {
          ...meta("vivid", orig()),
          id: "lab-field",
          type: "sim-3d",
          scene: "gauss-lab",
          config: lab({ charges: [{ id: "q1", q: 2, pos: [0, 0, 0], draggable: false }], surface: null }),
          caption: "A +2 µC charge. Arrows show D: its direction, and its strength (shorter = weaker). Drag to orbit.",
        },
        {
          ...meta("quiet", src(WENT, "§2.6 Electric Flux Density, p. 44")),
          id: "d-field",
          type: "prose",
          text: "{{flux|D}} points away from a positive charge and weakens with distance: $\\mathbf D = \\dfrac{Q}{4\\pi r^2}\\,\\mathbf a_r$ in C/m². It is flux per square metre, so it doesn't depend on the medium around the charge.",
        },
        // ── Wrap it in a surface ────────────────────────────────────────────
        {
          ...meta("quiet", src(SLIDES, "p. 36")),
          id: "surface-intro",
          type: "prose",
          text: "Now wrap the charge in a closed {{surface|surface S}}. Chop it into tiny patches. Each patch has an area $dS$ and an **outward** unit normal $\\mathbf a_n$, so $d\\mathbf S = \\mathbf a_n\\,dS$. A patch lets through $\\mathbf D\\cdot d\\mathbf S$ of flux: only the part of D that pierces it counts.",
        },
        {
          ...meta("vivid", orig()),
          id: "lab-surface",
          type: "sim-3d",
          scene: "gauss-lab",
          config: lab({
            charges: [{ id: "q1", q: 2, pos: [0, 0, 0], draggable: false }],
            surface: { kind: "sphere", radius: 1 },
            show: { field: true, normals: true, contributions: true, readout: true },
            toggles: ["field", "normals", "contributions"],
          }),
          caption: "Normals (amber) point outward. Each patch is shaded by the flux leaving it. The readout adds them up.",
        },
        {
          ...meta("assessment", orig()),
          id: "mcq-normal-dir",
          type: "mcq",
          prompt: "On a closed surface, which way does $d\\mathbf S$ point?",
          options: [
            { id: "out", label: "Always outward, away from the enclosed region", correct: true, feedback: "Right. That fixed convention is what makes the sign of Ψ meaningful." },
            {
              id: "along-d",
              label: "Along D, whichever way D points",
              correct: false,
              feedback: "If dS followed D, flux could never be negative, and a negative charge would give positive flux. The normal is fixed outward; D can point in or out.",
              tag: "SURFACE_NORMAL_DIRECTION",
            },
            {
              id: "in",
              label: "Inward, toward the charge",
              correct: false,
              feedback: "The convention is outward. With inward normals every sign in Gauss's law would flip.",
              tag: "SURFACE_NORMAL_DIRECTION",
            },
          ],
          dimension: "recognition",
        },
        // ── Predict, then experiment ────────────────────────────────────────
        {
          ...meta("vivid", orig()),
          id: "predict-radius",
          type: "predict",
          prompt: "You double the sphere's radius, with the same charge inside. The total flux out of it…",
          options: [
            {
              id: "x4",
              label: "Quadruples: the area is 4× bigger",
              correct: false,
              feedback: "The area is 4× bigger, but D on it is 4× weaker ($1/r^2$). They cancel.",
              tag: "FLUX_SCALES_WITH_AREA",
            },
            {
              id: "quarter",
              label: "Drops to a quarter: D is 4× weaker out there",
              correct: false,
              feedback: "D is 4× weaker, but the area is 4× bigger. They cancel.",
              tag: "FLUX_SCALES_WITH_AREA",
            },
            { id: "same", label: "Stays exactly the same", correct: true, feedback: "Yes. Area grows as $r^2$, D shrinks as $1/r^2$, and they cancel exactly." },
          ],
          reveal: "Unchanged. At radius $r$: $D = \\dfrac{Q}{4\\pi r^2}$ and area $= 4\\pi r^2$, so $\\Psi = D\\times 4\\pi r^2 = Q$ for every $r$. Now check it with your own hands.",
          dimension: "conceptual",
        },
        {
          ...meta("vivid", orig()),
          id: "manip-resize",
          type: "manipulate",
          scene: "gauss-lab",
          config: lab({
            charges: [{ id: "q1", q: 2, pos: [0, 0, 0], draggable: false }],
            surface: { kind: "sphere", radius: 1 },
            resizable: true,
            show: { field: true, normals: false, contributions: true, readout: true },
          }),
          goal: "Resize the sphere by at least 40% (bigger or smaller) and watch Ψ.",
          check: "resize-constant",
          dimension: "conceptual",
        },
        // ── Build the law ───────────────────────────────────────────────────
        {
          ...meta("quiet", src(SLIDES, "pp. 36-38")),
          id: "eq-gauss",
          type: "equation-build",
          steps: [
            { latex: R`\htmlClass{t-flux}{\Psi}`, caption: "What we're measuring: the total flux out of the surface.", highlights: ["t-flux"] },
            {
              latex: R`\Psi = \oint_{\htmlClass{t-surface}{S}}`,
              caption: "Add up over every patch of the surface. The circle on ∮ means the surface is closed.",
              highlights: ["t-surface"],
            },
            {
              latex: R`\Psi = \oint_{S} \htmlClass{t-flux}{\mathbf D}\cdot \htmlClass{t-surface}{d\mathbf S}`,
              caption: "Each patch contributes D·dS: only the part of D that pierces the patch.",
              highlights: ["t-flux", "t-surface"],
            },
            {
              latex: R`\Psi = \oint_{S} \mathbf D\cdot d\mathbf S = \htmlClass{t-charge}{Q_{\mathrm{enc}}}`,
              caption: "Faraday's result: the total equals the charge enclosed. That is Gauss's law.",
              highlights: ["t-charge"],
            },
          ],
          bindings: { "t-flux": "flux", "t-surface": "surface", "t-charge": "charge" },
        },
        {
          ...meta("quiet", src(SLIDES, "pp. 35, 37")),
          id: "gauss-statement",
          type: "prose",
          text: "**Gauss's law:** the electric flux passing through any closed surface equals the total charge enclosed by that surface. $Q_{enc}$ can be point charges $\\sum Q_i$, a line $\\int \\rho_L\\,dl$, a sheet $\\int \\rho_S\\,dS$ or a volume $\\int \\rho_v\\,dv$. Whichever form it takes, only what is **inside** counts.",
        },
        // ── Explore branches ────────────────────────────────────────────────
        {
          ...meta("quiet", orig()),
          id: "explore",
          type: "branch",
          prompt: "What would you like to explore before practising? Open any, or continue.",
          options: [
            {
              id: "why-closed",
              label: "Why must the surface be closed?",
              blocks: [
                {
                  ...meta("quiet", orig()),
                  id: "why-closed-text",
                  type: "prose",
                  text: "Every flux line that leaves the charge has to cross a **closed** surface on its way out. That's why the total counts the charge exactly. An open patch catches only the lines aimed at it: move or tilt it and the count changes. Open surfaces have a flux too; it just isn't fixed by $Q_{enc}$.",
                },
              ],
            },
            {
              id: "why-enclosed",
              label: "Why does only the enclosed charge matter?",
              blocks: [
                {
                  ...meta("quiet", orig()),
                  id: "why-enclosed-text",
                  type: "prose",
                  text: "A flux line from a charge **outside** enters the surface somewhere (negative $\\mathbf D\\cdot d\\mathbf S$) and leaves somewhere else (positive). Net contribution: zero. Try it: drag the outside charge around.",
                },
                {
                  ...meta("vivid", orig()),
                  id: "why-enclosed-lab",
                  type: "manipulate",
                  scene: "gauss-lab",
                  config: lab({
                    charges: [
                      { id: "in", q: 3, pos: [0, 0, 0], draggable: false },
                      { id: "out", q: 2, pos: [0.5, 0, 0], draggable: true },
                    ],
                    surface: { kind: "sphere", radius: 1 },
                    show: { field: true, normals: false, contributions: true, readout: true },
                  }),
                  goal: "Drag the +2 µC charge outside the sphere. Watch Ψ settle on 3 µC, whatever you do outside.",
                  check: "outside-zero",
                  dimension: "conceptual",
                },
              ],
            },
            {
              id: "where-eps",
              label: "Where did ε₀ go?",
              blocks: [
                {
                  ...meta("quiet", src(SLIDES, "p. 34")),
                  id: "where-eps-text",
                  type: "prose",
                  text: "In free space $\\mathbf D = \\varepsilon_0\\mathbf E$. So Gauss's law written with E reads $\\oint \\mathbf E\\cdot d\\mathbf S = Q_{enc}/\\varepsilon_0$. D counts charge directly, so the constant disappears. That's the reason for introducing D.",
                },
              ],
            },
            {
              id: "advanced",
              label: "Advanced: what assumptions are hiding here?",
              blocks: [
                {
                  ...meta("quiet", src(WENT, "§2.7 p. 47; §2.11 Dielectrics")),
                  id: "advanced-text",
                  type: "prose",
                  text: "Three things worth knowing. **(1)** Gauss's law is not just an electrostatics trick. $\nabla\cdot\mathbf D = \rho_v$ is the first of Maxwell's equations and holds for moving charges too. **(2)** $\mathbf D = \varepsilon_0\mathbf E$ only in free space. In a dielectric, the D-form counts only **free** charge, while $\oint \varepsilon_0\mathbf E\cdot d\mathbf S$ counts free **plus bound** (polarisation) charge. That's the real reason D exists. **(3)** A point charge sitting exactly *on* the surface makes the flux ill-defined; physically, a smooth surface catches half of it. Exam questions avoid this, and so should your Gaussian surfaces.",
                },
              ],
            },
            {
              id: "shape",
              label: "Does the surface's shape matter?",
              blocks: [
                {
                  ...meta("vivid", orig()),
                  id: "shape-lab",
                  type: "manipulate",
                  scene: "gauss-lab",
                  config: lab({
                    charges: [{ id: "q1", q: 2, pos: [0.2, 0.1, 0], draggable: false }],
                    surface: { kind: "sphere", radius: 1 },
                    shapes: ["sphere", "cube", "blob"],
                    show: { field: true, normals: false, contributions: true, readout: true },
                  }),
                  goal: "Switch the surface to a cube or a lumpy blob. Ψ stays 2 µC; only how it's spread over the surface changes.",
                  check: "shape-swap",
                  dimension: "conceptual",
                },
              ],
            },
          ],
        },
        // ── Apply ───────────────────────────────────────────────────────────
        {
          ...meta("assessment", orig()),
          id: "mcq-outside",
          type: "mcq",
          prompt: "A +2 µC charge is inside a closed cube; a +5 µC charge sits just outside it. The flux out of the cube is…",
          options: [
            { id: "two", label: "2 µC", correct: true, feedback: "Right: only enclosed charge counts." },
            {
              id: "seven",
              label: "7 µC",
              correct: false,
              feedback: "The +5 µC charge is outside. Its flux lines enter the cube and leave again, so they add nothing net.",
              tag: "OUTSIDE_CHARGE_CONTRIBUTES",
            },
            { id: "zero", label: "0: the two fields cancel", correct: false, feedback: "The fields partly cancel in places, but Gauss counts charge, not field: Q_enc = 2 µC." },
          ],
          selfExplain: {
            prompt: "I chose it because…",
            options: [
              { id: "lines", label: "The outside charge's flux lines enter and leave, adding nothing net", correct: true, feedback: "Exactly the mechanism." },
              { id: "distance", label: "The inside charge is closer to the surface", correct: false, feedback: "Distance doesn't enter Gauss's law at all. Only enclosed charge does." },
              {
                id: "blocked",
                label: "The cube blocks the outside charge's field",
                correct: false,
                feedback: "Nothing is blocked: the outside field passes straight through the surface. It just enters and leaves.",
                tag: "OUTSIDE_CHARGE_CONTRIBUTES",
              },
            ],
          },
          dimension: "conceptual",
        },
        {
          ...meta("assessment", orig()),
          id: "num-cube",
          type: "numeric",
          prompt: "A 4 µC point charge sits inside a closed cube of side 2 m, 0.3 m from its centre. What is the total flux leaving the cube?",
          answer: { value: 4, unit: "µC" },
          distractors: [
            {
              value: 0.667,
              unit: "µC",
              errorClass: "conceptual",
              tag: "GAUSS_WITHOUT_SYMMETRY",
              feedback: "Splitting it into six equal faces only works with the charge at the centre. And you don't need the faces: Gauss gives the total directly.",
            },
          ],
          hints: ["Which charge does the cube enclose?", "Where the charge sits inside the cube doesn't matter.", "Ψ = Q_enc."],
          dimension: "computational",
        },
        {
          ...meta("assessment", orig()),
          id: "mcq-negative",
          type: "mcq",
          prompt: "A closed surface surrounds a single −3 µC charge, so D points inward everywhere on it. The flux Ψ is…",
          options: [
            { id: "neg", label: "−3 µC", correct: true, feedback: "Right. D·dS < 0 on every patch because dS is outward, so Ψ = Q_enc = −3 µC." },
            {
              id: "pos",
              label: "+3 µC",
              correct: false,
              feedback: "That's what you'd get by letting dS follow D inward. dS is always outward, so inward D gives negative flux.",
              tag: "SURFACE_NORMAL_DIRECTION",
            },
            { id: "zero", label: "0", correct: false, feedback: "There is charge inside, so the net flux can't be zero." },
          ],
          dimension: "recognition",
        },
        {
          ...meta("assessment", src(SLIDES, "p. 5 (outcome 6)")),
          id: "mcq-symmetry",
          type: "mcq",
          prompt: "Gauss's law is always true. When does it let you find D in one line?",
          options: [
            {
              id: "sym",
              label: "When symmetry makes |D| constant and D normal (or tangent) over each piece of the Gaussian surface",
              correct: true,
              feedback: "Yes. Then $\\oint \\mathbf D\\cdot d\\mathbf S$ becomes $D\\times$area and you solve for D.",
            },
            {
              id: "any",
              label: "Always: pick any closed surface around the charge",
              correct: false,
              feedback: "Any surface gives the right total flux, but you can only pull D out of the integral if it's constant and normal on the surface.",
              tag: "GAUSS_WITHOUT_SYMMETRY",
            },
            { id: "spheres", label: "Only for spheres", correct: false, feedback: "Cylinders (line charges) and pillboxes (sheets) work too. What matters is symmetry." },
          ],
          dimension: "application",
        },
        {
          ...meta("assessment", orig()),
          id: "mcq-medium",
          type: "mcq",
          prompt: "A point charge is moved from air into oil (ε_r = 3). At the same distance, D is…",
          options: [
            { id: "same", label: "Unchanged", correct: true, feedback: "Yes. D depends only on free charge; the oil changes E = D/ε." },
            {
              id: "third",
              label: "3× smaller",
              correct: false,
              feedback: "E becomes 3× smaller. D doesn't: Faraday's outer sphere still showed +Q.",
              tag: "D_VS_E_PERMITTIVITY",
            },
            { id: "triple", label: "3× larger", correct: false, feedback: "Nothing multiplies D here: it's set by the free charge alone.", tag: "D_VS_E_PERMITTIVITY" },
          ],
          dimension: "conceptual",
        },
        {
          ...meta("assessment", orig()),
          id: "checkpoint",
          type: "checkpoint",
          title: "Checkpoint: Gauss's law",
          passRatio: 0.67,
          items: [
            {
              ...meta("assessment", orig()),
              id: "cp-radius",
              type: "mcq",
              prompt: "A sphere around a charge has its radius tripled. The flux through it…",
              options: [
                { id: "same", label: "Is unchanged", correct: true, feedback: "Right: Ψ = Q_enc." },
                { id: "nine", label: "Grows 9×", correct: false, feedback: "Area ×9, D ÷9: unchanged.", tag: "FLUX_SCALES_WITH_AREA" },
              ],
              dimension: "conceptual",
            },
            {
              ...meta("assessment", orig()),
              id: "cp-mixed",
              type: "numeric",
              prompt: "Inside a closed surface: +3 µC and −1 µC. Outside it: +10 µC. Total flux out?",
              answer: { value: 2, unit: "µC" },
              distractors: [
                { value: 12, unit: "µC", errorClass: "conceptual", tag: "OUTSIDE_CHARGE_CONTRIBUTES", feedback: "The +10 µC is outside, so it contributes nothing net." },
                { value: 4, unit: "µC", errorClass: "sign", feedback: "The −1 µC counts with its sign: 3 − 1 = 2." },
              ],
              dimension: "computational",
            },
            {
              ...meta("assessment", orig()),
              id: "cp-sign",
              type: "mcq",
              prompt: "Net flux out of a closed surface is −5 nC. What's inside?",
              options: [
                { id: "neg", label: "A net charge of −5 nC", correct: true, feedback: "Right: Ψ = Q_enc, sign included." },
                { id: "pos", label: "A net charge of +5 nC", correct: false, feedback: "Outward normals make the sign of Ψ the sign of Q_enc.", tag: "SURFACE_NORMAL_DIRECTION" },
              ],
              dimension: "recognition",
            },
          ],
        },
        {
          ...meta("reflect", orig()),
          id: "reflect",
          type: "prose",
          text: "**In one sentence:** the flux out of any closed surface counts the charge inside, regardless of the surface's size or shape and of anything outside. Next, *Applying Gauss's law* uses symmetry to turn this into D for spheres, lines and sheets.",
        },
      ],
    },
    // ── Remediation lessons ───────────────────────────────────────────────────
    {
      id: "why-area",
      title: "Detour: why a bigger surface doesn't catch more flux",
      minutes: 3,
      blocks: [
        {
          ...meta("quiet", orig()),
          id: "wa-text",
          type: "prose",
          text: "Put numbers on it for $Q = 4$ µC. At $r = 1$ m: $D = \\frac{4}{4\\pi}$ µC/m² over an area of $4\\pi$ m², giving **4 µC**. At $r = 2$ m: $D = \\frac{4}{16\\pi}$ µC/m² over $16\\pi$ m², giving **4 µC**. The surface gets bigger exactly as fast as D gets weaker.",
        },
        {
          ...meta("vivid", orig()),
          id: "wa-lab",
          type: "manipulate",
          scene: "gauss-lab",
          config: lab({
            charges: [{ id: "q1", q: 4, pos: [0, 0, 0], draggable: false }],
            surface: { kind: "sphere", radius: 0.8 },
            resizable: true,
            show: { field: true, normals: false, contributions: true, readout: true },
          }),
          goal: "Grow or shrink the sphere by 40% or more. Patches get paler as they get further away, but there are more of them.",
          check: "resize-constant",
          dimension: "conceptual",
        },
        {
          ...meta("assessment", orig()),
          id: "wa-check",
          type: "mcq",
          prompt: "Flux through a 1 m sphere around a charge is 6 nC. Through a 5 m sphere around the same charge?",
          options: [
            { id: "six", label: "6 nC", correct: true, feedback: "Right." },
            { id: "150", label: "150 nC", correct: false, feedback: "Area ×25, but D ÷25.", tag: "FLUX_SCALES_WITH_AREA" },
          ],
          dimension: "conceptual",
        },
        back("wa-back"),
      ],
    },
    {
      id: "outside-charge",
      title: "Detour: charges outside the surface",
      minutes: 3,
      blocks: [
        {
          ...meta("quiet", orig()),
          id: "oc-text",
          type: "prose",
          text: "Follow one flux line from a charge **outside** the surface. It crosses the surface going in, where D points against the outward normal, so it contributes negatively. It crosses again going out, contributing positively. Every line that enters also leaves, so the outside charge adds exactly zero.",
        },
        {
          ...meta("vivid", orig()),
          id: "oc-lab",
          type: "manipulate",
          scene: "gauss-lab",
          config: lab({
            charges: [
              { id: "in", q: 1, pos: [0, 0, 0], draggable: false },
              { id: "out", q: 4, pos: [0.3, 0.3, 0], draggable: true },
            ],
            surface: { kind: "cube", side: 2 },
            show: { field: true, normals: false, contributions: true, readout: true },
          }),
          goal: "Drag the +4 µC charge out of the cube. Watch the amber (inflow) and violet (outflow) patches balance.",
          check: "outside-zero",
          dimension: "conceptual",
        },
        {
          ...meta("assessment", orig()),
          id: "oc-check",
          type: "mcq",
          prompt: "Only a −8 µC charge is nearby, just outside a closed surface. The flux out of the surface is…",
          options: [
            { id: "zero", label: "0", correct: true, feedback: "Right: nothing enclosed." },
            { id: "neg", label: "−8 µC", correct: false, feedback: "It's outside, so what enters also leaves.", tag: "OUTSIDE_CHARGE_CONTRIBUTES" },
          ],
          dimension: "conceptual",
        },
        back("oc-back"),
      ],
    },
    {
      id: "normal-direction",
      title: "Detour: which way dS points",
      minutes: 3,
      blocks: [
        {
          ...meta("quiet", src(WENT, "§2.6, p. 44")),
          id: "nd-text",
          type: "prose",
          text: "For a closed surface, $d\\mathbf S$ always points **outward**, whatever D does. Then $\\mathbf D\\cdot d\\mathbf S > 0$ where flux leaves and $< 0$ where it enters, and the total carries the sign of the enclosed charge.",
        },
        {
          ...meta("vivid", orig()),
          id: "nd-lab",
          type: "sim-3d",
          scene: "gauss-lab",
          config: lab({
            charges: [{ id: "neg", q: -3, pos: [0, 0, 0], draggable: false }],
            surface: { kind: "sphere", radius: 1 },
            show: { field: true, normals: true, contributions: true, readout: true },
            toggles: ["normals", "contributions"],
          }),
          caption: "A −3 µC charge. D points inward (teal), normals point outward (amber), so every patch is inflow and Ψ = −3 µC.",
        },
        {
          ...meta("assessment", orig()),
          id: "nd-check",
          type: "mcq",
          prompt: "On a patch where D points into the closed surface, D·dS is…",
          options: [
            { id: "neg", label: "Negative", correct: true, feedback: "Right: D against the outward normal." },
            { id: "pos", label: "Positive, because dS follows D", correct: false, feedback: "dS doesn't follow D; it's always outward.", tag: "SURFACE_NORMAL_DIRECTION" },
          ],
          dimension: "recognition",
        },
        back("nd-back"),
      ],
    },
    {
      id: "d-vs-e",
      title: "Detour: D versus E in a material",
      minutes: 4,
      blocks: [
        {
          ...meta("quiet", src(SLIDES, "pp. 30-34")),
          id: "de-text",
          type: "prose",
          text: "Faraday's outer sphere showed $+Q$ in every material, so flux, and D, are set by free charge alone. The material changes **E**: $\\mathbf E = \\mathbf D/\\varepsilon$ with $\\varepsilon = \\varepsilon_r\\varepsilon_0$. So in oil ($\\varepsilon_r = 3$) D is unchanged and E is a third as strong.",
        },
        {
          ...meta("assessment", orig()),
          id: "de-num",
          type: "numeric",
          prompt: "A 2 nC point charge sits in a large block of dielectric with ε_r = 4. What is |D| at 1 m from it?",
          answer: { value: 159.2, unit: "pC/m^2" },
          distractors: [
            { value: 39.79, unit: "pC/m^2", errorClass: "conceptual", tag: "D_VS_E_PERMITTIVITY", feedback: "You divided by ε_r. That's what happens to E, not D." },
          ],
          hints: ["D depends only on the free charge.", "D = Q / (4πr²).", "2 nC / (4π × 1²) m²."],
          dimension: "computational",
        },
        back("de-back"),
      ],
    },
    {
      id: "symmetry",
      title: "Detour: when Gauss's law finds D",
      minutes: 4,
      blocks: [
        {
          ...meta("quiet", src(WENT, "§2.7, p. 47")),
          id: "sy-text",
          type: "prose",
          text: "$\\oint \\mathbf D\\cdot d\\mathbf S = Q_{enc}$ holds for **every** closed surface. But to pull D out of the integral you need a surface where $|\\mathbf D|$ is constant and D is parallel to $d\\mathbf S$: a sphere around a point charge, a coaxial cylinder around a line charge, a pillbox across a sheet. Off-centre charge or a lumpy surface: the law still holds, but D varies over the surface, so you can't solve for it.",
        },
        {
          ...meta("vivid", orig()),
          id: "sy-lab",
          type: "sim-3d",
          scene: "gauss-lab",
          config: lab({
            charges: [{ id: "q1", q: 2, pos: [0.45, 0.2, 0], draggable: true }],
            surface: { kind: "blob", radius: 1 },
            show: { field: true, normals: false, contributions: true, readout: true },
          }),
          caption: "Off-centre charge, lumpy surface. The patches differ wildly, the total is still exactly 2 µC, and there's no single D to pull out.",
        },
        {
          ...meta("assessment", orig()),
          id: "sy-check",
          type: "mcq",
          prompt: "To find D from a point charge with Gauss's law, the best Gaussian surface is…",
          options: [
            { id: "sphere", label: "A sphere centred on the charge", correct: true, feedback: "Right: |D| constant and D normal everywhere on it." },
            { id: "cube", label: "A cube around the charge", correct: false, feedback: "Total flux is right, but D isn't constant or normal over a cube's faces.", tag: "GAUSS_WITHOUT_SYMMETRY" },
          ],
          dimension: "application",
        },
        back("sy-back"),
      ],
    },
  ],
};
