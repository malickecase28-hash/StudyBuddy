import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const bd = instantiate(templates.find((t) => t.id === "ball-d")!, 1);
const q08 = instantiate(templates.find((t) => t.id === "q08-q")!, 1);
const BALL = { items: [{ id: "b", kind: "ball" as const, rhoV: 3, radius: 1, center: [0, 0, 0] as [number, number, number] }] };
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaSpheres = defineIdeaPlate({
  id: "idea-spheres",
  title: "Spheres of charge: D and Q inside and outside",
  requires: { objectives: [2], items: ["tutorial:q08"], misconceptions: ["BALL_INSIDE_OUTSIDE", "OUTSIDE_CHARGE_CONTRIBUTES", "D_VS_E_PERMITTIVITY"] },
  instances: [
    { id: "q", component: "charges", params: BALL },
    { id: "surface", component: "gaussian-surface", params: { shape: "sphere", size: 0.5 }, links: { charges: "q" } },
    { id: "ep", component: "e-probe", params: { point: [0.5, 0, 0] }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: eqp(R`D\cdot4\pi r^2=Q_{\text{enc}}`, "D times four pi r squared equals the charge enclosed") },
  ],
  ideas: [
    {
      id: "spheres",
      title: "Spheres of charge: D and Q inside and outside",
      objectives: [2],
      explain: [
        {
          id: "inside", title: "Inside a charged ball", show: ["q", "surface", "ep", "eq"], focus: ["surface", "ep"],
          note: "A ball of radius 1 m carries a uniform ρv = 3 µC/m³. By symmetry, D is radial and the same size everywhere on any concentric sphere, so Gauss's law gives D × 4πr² = Q_enc. Inside, at r = 0.5 m, only the charge within r counts: Q_enc = ρv(4/3)πr³ = 1.571 µC. That gives D = ρv r/3 = 0.5 µC/m², growing in proportion to r.",
          claims: [{ instance: "surface", readout: "enclosed", value: 1.5708, unit: "µC" }, { instance: "ep", readout: "Dmag", value: 0.5, unit: "µC/m^2" }],
        },
        {
          id: "outside", title: "Outside: the whole ball", patch: { surface: { size: 1.5 }, ep: { point: [1.5, 0, 0] } }, focus: ["surface", "ep"],
          note: "Outside the ball, at r = 1.5 m, the Gaussian sphere encloses all the charge, Q = ρv(4/3)πa³ = 12.57 µC. Then D = Q/(4πr²) = 0.4444 µC/m²: exactly what a point charge of 12.57 µC at the centre would give. From outside, a uniform ball can't be told apart from a point charge.",
          claims: [{ instance: "surface", readout: "enclosed", value: 12.5664, unit: "µC" }, { instance: "ep", readout: "Dmag", value: 0.444444, unit: "µC/m^2" }],
        },
        {
          id: "profile", title: "Up, then down", patch: { surface: { size: 1 }, ep: { point: [1, 0, 0] } }, focus: ["surface", "ep"],
          note: "Put the two results together. D rises linearly from zero at the centre to its peak at the surface, D = ρv a/3 = 1 µC/m², then falls as 1/r² outside. The two formulas agree exactly at r = a, so D is continuous. Past papers test both sides, so always ask first: is r inside or outside?",
          claims: [{ instance: "ep", readout: "Dmag", value: 1, unit: "µC/m^2" }],
        },
        {
          id: "from-d", title: "Backwards: Q from D", patch: { eq: eqp(R`Q_{\text{enc}}=D(r)\cdot4\pi r^2`, "Q equals D at r times four pi r squared") }, focus: ["eq", "surface"],
          note: "The same equation runs backwards. If a question gives D as a radial function of r, the charge inside radius r is D(r) × 4πr². Tutorial Q.08 and Finals 2024-25 Q2(a) both work this way. The Gauss's law lesson works through the given radial field numerically.",
        },
      ],
      examples: [
        {
          id: "q08", level: "basic", title: "Tutorial Q.08: Q from a given D",
          setup: { surface: { size: 2 } },
          problem: "In free space D = 0.5r² a_r nC/m². Find the total charge within the sphere r = 2 m.",
          lines: [
            { text: "On r = 2 m, D = 0.5 × 4 = 2 nC/m², radial and the same everywhere.", focus: ["eq"], givens: [{ value: 2, unit: "nC/m^2" }] },
            { text: "Q = D × 4πr² = 2 × 16π = 100.5 nC.", focus: ["eq"], givens: [{ value: 32 * Math.PI, unit: "nC" }] },
          ],
          covers: ["tutorial:q08"],
          trap: "Stopping at D. That's D, not the charge. Multiply by the sphere's area.",
        },
        {
          id: "ball", level: "tutorial", title: "A charged ball, inside and out",
          setup: { q: BALL, surface: { size: 1.5 }, ep: { point: [1.5, 0, 0] } },
          problem: "A ball of radius 1 m has a uniform ρv = 3 µC/m³. Find |D| at r = 0.5 m and at r = 1.5 m.",
          givens: [{ value: 0.5, unit: "m" }],
          lines: [
            { text: "Inside: D = ρv r/3 = 3 × 0.5/3 = 0.5 µC/m².", patch: { surface: { size: 0.5 }, ep: { point: [0.5, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "Dmag", value: 0.5, unit: "µC/m^2" }] },
            { text: "Outside: Q = 3 × (4/3)π × 1³ = 12.57 µC, so D = 12.57/(4π × 1.5²) = 0.4444 µC/m².", patch: { surface: { size: 1.5 }, ep: { point: [1.5, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "Dmag", value: 0.444444, unit: "µC/m^2" }, { instance: "surface", readout: "enclosed", value: 12.5664, unit: "µC" }] },
          ],
          trap: "Using the whole ball's charge inside overestimates D. Inside, only the charge within r counts.",
        },
        {
          id: "exam", level: "exam", title: "A denser ball, both sides",
          setup: { q: { items: [{ id: "b", kind: "ball", rhoV: 4, radius: 2, center: [0, 0, 0] }], drawScale: 0.5 }, surface: { size: 1 }, ep: { point: [1, 0, 0], drawScale: 0.5 } },
          problem: "A sphere of radius 2 m holds a uniform ρv = 4 µC/m³. Find D at r = 1 m and at r = 3 m, and the total charge.",
          lines: [
            { text: "Inside, at 1 m: D = ρv r/3 = 4/3 = 1.333 µC/m² (radial).", focus: ["ep"], claims: [{ instance: "ep", readout: "Dmag", value: 1.33333, unit: "µC/m^2" }] },
            { text: "Total charge: Q = 4 × (4/3)π × 2³ = 134.0 µC.", focus: ["q"], givens: [{ value: (4 * 4 * Math.PI * 8) / 3, unit: "µC" }] },
            { text: "Outside, at 3 m: D = Q/(4πr²) = 134.0/(36π) = 1.185 µC/m².", patch: { ep: { point: [3, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "Dmag", value: 1.18519, unit: "µC/m^2" }] },
          ],
          trap: "Using ρv r/3 keeps the inside formula outside the ball.",
        },
      ],
      asks: [
        { id: "inside-rule", q: "Why does only the charge inside r count?", tags: ["BALL_INSIDE_OUTSIDE", "OUTSIDE_CHARGE_CONTRIBUTES"], a: "By Gauss's law, the flux through the sphere of radius r depends only on the charge it encloses. The charge in the outer shell surrounds the Gaussian sphere, and its field there cancels by symmetry." },
        { id: "centre", q: "Why is D zero at the centre?", a: "Every piece of charge is balanced by an equal piece opposite, so their pulls cancel. In the formula, D = ρv r/3 gives zero at r = 0." },
        { id: "point", q: "Why does the ball look like a point charge from outside?", a: "Outside, the Gaussian sphere encloses the whole charge, and Gauss's law then gives D = Q/(4πr²), the point-charge result. How the charge is arranged inside doesn't matter, as long as it's spherically symmetric." },
        { id: "shell", q: "What about a hollow shell of charge?", a: "Inside the shell the Gaussian sphere encloses nothing, so D = 0 there. Outside, D = Q/(4πr²) again. It is the same method with a different Q_enc." },
        { id: "nonuniform", q: "What if ρv varies with r?", a: "Then Q_enc = ∫ρv dv over the sphere of radius r, with dv = 4πr² dr for a spherical shell. The rest of the method is unchanged." },
        { id: "e-too", q: "How do I get E from D?", tags: ["D_VS_E_PERMITTIVITY"], a: "In free space, E = D/ε₀. Inside a material, E = D/(ε₀εr). D itself depends only on the free charge." },
      ],
      checks: [
        {
          id: "which", title: "Check: inside or outside?", show: ["q", "surface", "ep", "eq"], patch: { q: BALL, surface: { size: 0.5 }, ep: { point: [0.5, 0, 0], drawScale: 1 } },
          note: "Four checks on spheres of charge. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "which", type: "choose", prompt: "Inside a uniformly charged ball, at radius r < a, D equals…", dimension: "recognition",
            options: [
              choice("right", "ρv r / 3", true, "Right: only the charge within r counts."),
              choice("out", "ρv a³ / (3r²)", false, "That's the outside formula; it uses the whole ball.", "BALL_INSIDE_OUTSIDE"),
              choice("outside-shell", "Include the charge in the outer shell too", false, "The Gaussian sphere encloses only the charge within r.", "OUTSIDE_CHARGE_CONTRIBUTES"),
              choice("epsilon", "ρv r / (3ε₀)", false, "That would mix E into the displacement field D.", "D_VS_E_PERMITTIVITY"),
              choice("zero", "zero", false, "Only a hollow shell has zero field inside."),
            ] },
        },
        {
          id: "predict-2r", title: "Check: double r inside", patch: { ep: { point: [0.4, 0, 0] }, surface: { size: 0.4 } },
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-2r", type: "predict-drag", prompt: "The probe and the Gaussian sphere move from r = 0.4 m to r = 0.8 m, both inside the ball. Drag |D| to your prediction.", target: { instance: "ep", readout: "Dmag" }, range: [0, 2], unit: "µC/m^2", relTol: 0.05, reveal: { ep: { point: [0.8, 0, 0] }, surface: { size: 0.8 } }, dimension: "conceptual",
            feedback: { close: "Right: it doubles, to 0.8 µC/m².", far: "Inside, D = ρv r/3 grows in proportion to r: 0.8 µC/m²." } },
        },
        {
          id: "ball-num", title: "Check: a ball, your numbers",
          note: "Inside or outside? Decide first.",
          interaction: { id: "ball-num", type: "numeric", prompt: bd.prompt, answer: bd.spec.answer, distractors: bd.spec.distractors, relTol: bd.spec.relTol, hints: bd.hints, template: "ball-d", dimension: "application" },
        },
        {
          id: "q08-num", title: "Check: Tutorial Q.08",
          note: "Last one.",
          interaction: { id: "q08-num", type: "numeric", prompt: q08.prompt, answer: q08.spec.answer, distractors: q08.spec.distractors, relTol: q08.spec.relTol, hints: q08.hints, template: "q08-q", dimension: "computational" },
          covers: ["tutorial:q08"],
        },
      ],
      recap: {
        points: [
          "Spherical symmetry: D × 4πr² = Q_enc on a concentric sphere.",
          "Uniform ball: D = ρv r/3 inside, rising to ρv a/3 at the surface; D = Q/(4πr²) outside.",
          "From outside, any spherical charge looks like a point charge at the centre.",
          "Backwards: Q_enc = D(r) × 4πr².",
        ],
        traps: ["Using the whole charge inside the ball.", "Using ρv r/3 outside it.", "Stopping at D when Q is asked for."],
      },
    },
  ],
});
