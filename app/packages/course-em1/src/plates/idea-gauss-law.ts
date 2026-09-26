import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const point = (id: string, q: number, pos: [number, number, number], draggable = false) => ({ id, kind: "point" as const, q, pos, draggable });
const q09a = instantiate(templates.find((t) => t.id === "q09a-cube")!, 1);
const LAW = R`\oint_S\mathbf D\cdot d\mathbf S=Q_{\mathrm{enc}}`;

export const ideaGaussLaw = defineIdeaPlate({
  id: "idea-gauss-law",
  title: "Gauss's law",
  requires: { objectives: [0, 1], items: ["tutorial:q09a", "past:f2324-q2b-i"], misconceptions: ["FLUX_SCALES_WITH_AREA", "OUTSIDE_CHARGE_CONTRIBUTES"] },
  instances: [
    { id: "q", component: "charges", params: { items: [point("q1", 2, [0, 0, 0])] } },
    { id: "field", component: "field-arrows", params: { grid: 5, probe: 1 }, links: { charges: "q" } },
    { id: "surface", component: "gaussian-surface", params: { shape: "sphere", size: 1, shading: true }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: LAW, speech: "the closed surface integral of D dot d S equals the charge enclosed", shortSpeech: "Gauss's law" } },
  ],
  ideas: [
    {
      id: "gauss",
      title: "Gauss's law",
      objectives: [0, 1],
      explain: [
        {
          id: "law", title: "The law", show: ["q", "field", "surface", "eq"], focus: ["eq", "surface"],
          note: "Gauss's law: the net outward flux of D through any closed surface equals the free charge enclosed, ∮ D · dS = Q_enc. Here a +2 µC charge sits inside a 1 m sphere, and the readout agrees: 2 µC. The rest of this idea is about how much that one line promises: any size, any shape, and charges outside count for nothing.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "bigger", title: "Bigger surface, same flux", patch: { surface: { size: 1.8 }, field: { probe: 1.8 } }, focus: ["surface"],
          note: "Grow the sphere to 1.8 m. Its area grows 3.24 times, to 40.72 m². But D on it falls as 1/r², also 3.24 times, to 0.0491 µC/m². Area up, D down, and the product is unchanged: the flux is still 2 µC. A bigger surface does not catch more flux, because every field line from the charge crosses any closed surface around it exactly once.",
          claims: [{ instance: "surface", readout: "area", value: 40.715, unit: "m^2" }, { instance: "field", readout: "probeD", value: 0.049122, unit: "µC/m^2" }, { instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "cube", title: "Any shape: a cube", patch: { surface: { shape: "cube", size: 2.4 }, field: { probe: 1 } }, focus: ["surface"],
          note: "Swap the sphere for a cube. The patches change completely: some near, some far, most tilted to the field. The flux through each one is different, and the total is not: still 2 µC.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "blob", title: "Any shape: a lumpy blob", patch: { surface: { shape: "blob", size: 1.1 } }, focus: ["surface"],
          note: "Even a lumpy blob gives 2 µC. Shape changes how the flux is shared out among the patches, never the total. That is why the law says 'any closed surface'.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "outside", title: "Outside charges cancel", patch: { surface: { shape: "sphere", size: 1 }, q: { items: [point("q1", 2, [0, 0, 0]), point("q2", 3, [1.4, 0, 0])] } }, focus: ["surface", "q"],
          note: "Add a +3 µC charge outside, 1.4 m from the centre. Its field pours in on the near side and out on the far side: ochre patches in, blue patches out. In the net flux they cancel exactly, and the readout stays at the 2 µC inside.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "several", title: "Several charges inside", patch: { q: { items: [point("q1", 2, [-0.3, 0, 0]), point("q3", -1, [0.4, 0, 0.2]), point("q2", 3, [1.4, 0, 0])] } }, focus: ["surface", "q"],
          note: "Put a −1 µC charge inside as well. Now Q_enc = 2 + (−1) and the flux is 1 µC, whatever the outside charge does. Gauss's law adds charges inside with their signs and ignores everything outside.",
          claims: [{ instance: "surface", readout: "flux", value: 1, unit: "µC" }],
        },
      ],
      examples: [
        {
          id: "two-in", level: "basic", title: "Two inside, one outside",
          setup: { surface: { shape: "cube", size: 2 }, q: { items: [point("a", 3, [0.5, 0, 0.3]), point("b", -1, [-0.4, 0, -0.5]), point("c", 5, [1.6, 0, 0])] } },
          problem: "A closed cube of side 2 m contains a +3 µC and a −1 µC charge; a +5 µC charge sits outside it. Find the net outward flux.",
          lines: [
            { text: "Inside: +3 µC and −1 µC. The +5 µC charge is outside the cube, so it contributes zero net flux.", focus: ["q", "surface"] },
            { text: "Q_enc = 3 − 1, so Ψ = 2 µC.", latex: R`\Psi=Q_{\mathrm{enc}}=3+(-1)`, focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }] },
          ],
          trap: "Adding all three charges. The one outside changes the flux through each face, never the total.",
        },
        {
          id: "shrink", level: "tutorial", title: "Shrink the sphere past the charge",
          setup: { surface: { shape: "sphere", size: 0.6 }, q: { items: [point("q1", 2, [0.3, 0, 0])] } },
          problem: "A +2 µC charge sits 0.3 m from the centre of a sphere of radius 0.6 m. Find the flux; then shrink the sphere to radius 0.25 m and find it again.",
          givens: [{ value: 0.25, unit: "m" }],
          lines: [
            { text: "Radius 0.6 m: the charge is inside, so Ψ = 2 µC.", focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }] },
            { text: "Radius 0.25 m: the charge now sits outside the sphere, so Ψ = 0.", patch: { surface: { size: 0.25 } }, focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 0, unit: "µC" }] },
          ],
          trap: "Scaling the flux with the radius. It jumps from the full charge to zero the moment the charge leaves; in between it never changes.",
        },
        {
          id: "state-verify", level: "exam", title: "State it, then verify it",
          setup: { surface: { shape: "sphere", size: 1 }, q: { items: [point("q1", 2, [0, 0, 0])] }, field: { probe: 1 } },
          problem: "(Finals 2023-24 Q2(b)(i) style.) State Gauss's law in words and as an equation, then verify it for a +2 µC charge at the centre of a 1 m sphere.",
          lines: [
            { text: "In words: the net outward flux of D through any closed surface equals the free charge enclosed.", focus: ["eq"] },
            { text: "As an equation: ∮ D · dS = Q_enc.", latex: LAW, focus: ["eq"] },
            { text: "Check: on the sphere |D| = 2/(4π × 1²) = 0.1592 µC/m², and the area is 12.57 m².", focus: ["field", "surface"], claims: [{ instance: "field", readout: "probeD", value: 0.159155, unit: "µC/m^2" }, { instance: "surface", readout: "area", value: 12.566, unit: "m^2" }] },
            { text: "D is the same everywhere on the sphere and along every normal, so ∮ D · dS = 0.1592 × 12.57 = 2.00 µC = Q_enc.", focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }] },
          ],
          covers: ["past:f2324-q2b-i"],
          trap: "Writing the law with E and forgetting ε₀. In D form it counts free charge directly.",
        },
      ],
      asks: [
        { id: "bigger", q: "Doesn't a bigger surface catch more flux?", tags: ["FLUX_SCALES_WITH_AREA"], show: ["q", "field", "surface"], patch: { surface: { shape: "sphere", size: 1.8 }, q: { items: [point("q1", 2, [0, 0, 0])] } }, focus: ["surface"], a: "No. Area grows as r², but D from the charge falls as 1/r², so their product stays fixed. Every field line from the charge crosses any closed surface around it exactly once." },
        { id: "outside", q: "Why don't charges outside count?", tags: ["OUTSIDE_CHARGE_CONTRIBUTES"], a: "Their field enters the closed surface somewhere and leaves somewhere else. In the net flux, entering is negative and leaving is positive, and for a charge outside they cancel exactly." },
        { id: "on-surface", q: "What if a charge sits exactly on the surface?", a: "Then it is neither inside nor outside, and the integral is not well defined there. Forma counts half of it (a smooth surface catches half its field), but in exams choose surfaces that avoid this." },
        { id: "shape", q: "Does the shape of the surface matter?", a: "Not for the total. Shape changes how the flux is shared between patches, and so decides whether you can work the integral out easily, but never ∮ D · dS itself." },
        { id: "dielectric", q: "Does a material inside change the answer?", tags: ["D_VS_E_PERMITTIVITY"], a: "No. Gauss's law in D counts free charge only, so a material inside changes E but not the flux of D. Written with E, you would need the material's bound charge too." },
        { id: "no-charge", q: "If no charge is inside, is the field zero on the surface?", a: "Not necessarily. A charge outside puts field on the surface; only the net flux is zero, not the field." },
        { id: "coulomb", q: "Is Gauss's law separate from Coulomb's law?", a: "For static charges they are equivalent: Coulomb's 1/r² field is exactly what makes the flux independent of the radius. Gauss's form is the one that carries over into Maxwell's equations." },
      ],
      checks: [
        {
          id: "predict-grow", title: "Check: grow the sphere", show: ["q", "field", "surface", "eq"], patch: { surface: { shape: "sphere", size: 1 }, q: { items: [point("q1", 2, [0, 0, 0])] }, field: { probe: 1 } },
          note: "Five checks on Gauss's law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "predict-grow", type: "predict-drag", prompt: "The sphere grows from 1 m to 1.8 m around the +2 µC charge. Drag Ψ to your prediction.", target: { instance: "surface", readout: "flux" }, range: [0, 10], unit: "µC", relTol: 0.05, reveal: { surface: { size: 1.8 } }, dimension: "conceptual", tag: "FLUX_SCALES_WITH_AREA",
            feedback: { close: "Right: still 2 µC.", far: "Still 2 µC: area ×3.24, D ÷3.24." } },
        },
        {
          id: "drag-out", title: "Check: an outside charge", patch: { q: { items: [point("q1", 2, [0, 0, 0]), point("q2", 3, [0.5, 0, 0.3], true)] } },
          note: "Drag the +3 µC charge out of the sphere and watch what is left.",
          interaction: { id: "drag-out", type: "manipulate-goal", goal: "Drag the +3 µC charge out of the sphere (or focus it and use the arrow keys). The net flux should fall to the 2 µC still inside.", check: "outside-zero", dimension: "conceptual" },
        },
        {
          id: "near-face", title: "Check: close to a face",
          note: "A charge near, but outside.",
          interaction: { id: "near-face", type: "choose", prompt: "A cube encloses +4 µC. A +10 µC charge sits just outside one face. The net outward flux is…", dimension: "conceptual",
            options: [
              choice("four", "4 µC", true, "Yes: only the enclosed charge counts, however close the outside charge is."),
              choice("fourteen", "14 µC", false, "The +10 µC charge is outside: its field enters and leaves.", "OUTSIDE_CHARGE_CONTRIBUTES"),
              choice("more", "A bit more than 4 µC, because it is so close", false, "Closeness changes the flux through the near face, and the far faces make up for it exactly.", "OUTSIDE_CHARGE_CONTRIBUTES"),
            ] },
        },
        {
          id: "q09a", title: "Check: tutorial Q.09(a)",
          note: "A tutorial problem with your own numbers.",
          interaction: { id: "q09a", type: "numeric", prompt: q09a.prompt, answer: q09a.spec.answer, distractors: q09a.spec.distractors, relTol: q09a.spec.relTol, hints: q09a.hints, template: "q09a-cube", dimension: "computational" },
          covers: ["tutorial:q09a"],
        },
        {
          id: "statement", title: "Check: the statement",
          note: "And the words themselves.",
          interaction: { id: "statement", type: "choose", prompt: "Which statement is Gauss's law?", dimension: "recognition",
            options: [
              choice("law", "The net outward flux of D through any closed surface equals the free charge enclosed", true, "Exactly."),
              choice("near", "The flux through any surface equals the charge near it", false, "Only closed surfaces, and only charge inside, not 'near'."),
              choice("const", "D is the same everywhere on a closed surface", false, "That is true only with symmetry, and it is not the law.", "GAUSS_WITHOUT_SYMMETRY"),
            ] },
          covers: ["past:f2324-q2b-i"],
        },
      ],
      recap: {
        points: [
          "∮S D · dS = Q_enc: the net outward flux equals the enclosed free charge.",
          "The size and shape of the closed surface don't matter; only what is inside.",
          "Charges outside contribute zero net flux.",
          "It is always true; it is easy to use only with symmetry (next idea).",
        ],
        traps: ["Thinking a bigger surface catches more flux.", "Counting charges outside.", "Assuming D is constant on any surface."],
      },
    },
  ],
});
