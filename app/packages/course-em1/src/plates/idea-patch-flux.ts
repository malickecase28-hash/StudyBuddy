import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const fp = instantiate(templates.find((t) => t.id === "flux-patch")!, 1);
const q06 = instantiate(templates.find((t) => t.id === "q06-octant")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaPatchFlux = defineIdeaPlate({
  id: "idea-patch-flux",
  title: "Flux through part of a surface",
  requires: { objectives: [1], items: ["mst-2324-q3a", "tutorial:q06"], misconceptions: ["FLUX_PATCH_AREA", "FLUX_SCALES_WITH_AREA", "GAUSS_WITHOUT_SYMMETRY"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.6 } },
    { id: "region", component: "coord-region", params: { system: "sph", ranges: [[0, 1], [0, 90], [0, 360]], face: 0, centralCharge: 12 } },
    { id: "eq", component: "equation", params: eqp(R`\Psi_{\text{patch}}=Q\cdot\dfrac{\text{patch area}}{4\pi r^2}`, "the patch flux is Q times the patch's share of the sphere") },
  ],
  ideas: [
    {
      id: "patch-flux",
      title: "Flux through part of a surface",
      objectives: [1],
      explain: [
        {
          id: "share", title: "A share of the whole", show: ["axes", "region", "eq"], focus: ["region", "eq"],
          note: "A point charge at the centre of a sphere sends its flux out evenly in every direction. So any patch of the sphere carries the same fraction of the flux as its fraction of the area. Gauss's law gives the whole: Q. On the plate, a 12 µC charge sits at the centre and the patch is the upper hemisphere: half the area, so half the flux, 6 µC.",
          claims: [{ instance: "region", readout: "patchFlux", value: 6, unit: "µC" }],
        },
        {
          id: "radius", title: "The radius doesn't matter", patch: { region: { ranges: [[0, 1.8], [0, 90], [0, 360]] } }, focus: ["region"],
          note: "Grow the sphere to 1.8 m. The hemisphere's area grows, but so does the whole sphere's, by the same factor, so the share, and the flux, stay at 6 µC. That is why the radius in a question about a patch is a distraction: only the angles matter. The share is (1 − cos θ₂)Δφ/(4π) for a patch 0 < θ < θ₂ with a φ-range of Δφ.",
          claims: [{ instance: "region", readout: "patchFlux", value: 6, unit: "µC" }],
        },
        {
          id: "octant", title: "The octant", patch: { region: { ranges: [[0, 1.4], [0, 90], [0, 90]] } }, focus: ["region"],
          note: "0 < θ < π/2 is the top half, and 0 < φ < π/2 is a quarter of the way round. Together they make an eighth of the sphere, so an eighth of the flux: 12/8 = 1.5 µC. The tutorial's version is exactly this reasoning with its own Q.",
          claims: [{ instance: "region", readout: "patchFlux", value: 1.5, unit: "µC" }],
        },
        {
          id: "cube", title: "Flat faces: the cube", patch: { region: { system: "cart", ranges: [[-1, 1], [-1, 1], [-1, 1]], face: 2 }, eq: eqp(R`\Psi_{\text{face}}=\dfrac{Q}{6}`, "each face of a centred cube carries Q over six") }, focus: ["region", "eq"],
          note: "The share idea works for any closed surface with enough symmetry. A charge at the centre of a cube sends equal flux through all six identical faces, so each gets Q/6: 2 µC here. On a flat face D is not uniform and not normal, so a direct integral would be hard. Symmetry makes it one line.",
          claims: [{ instance: "region", readout: "patchFlux", value: 2, unit: "µC" }],
        },
      ],
      examples: [
        {
          id: "q06", level: "basic", title: "The octant",
          setup: { region: { system: "sph", ranges: [[0, 1.4], [0, 90], [0, 90]], face: 0, centralCharge: 40 } },
          problem: "A 40 µC point charge sits at the origin. Find the flux through the part of the sphere r = 26 cm with 0 < θ < π/2 and 0 < φ < π/2.",
          lines: [
            { text: "The range is half in θ and a quarter in φ: one eighth of the sphere.", focus: ["region"] },
            { text: "Ψ = 40/8 = 5 µC. The radius, 26 cm, doesn't enter.", focus: ["region"], claims: [{ instance: "region", readout: "patchFlux", value: 5, unit: "µC" }] },
          ],
          covers: ["tutorial:q06"],
          trap: "Computing the patch area and multiplying by Q. Flux is Q times the area's share of 4πr², not Q times the area.",
        },
        {
          id: "mst3a", level: "tutorial", title: "A narrower patch",
          setup: { region: { system: "sph", ranges: [[0, 0.25], [0, 60], [30, 45]], face: 0, centralCharge: 100, drawScale: 4 } },
          problem: "A 100 µC point charge is at the origin. Calculate the flux through the part of the sphere r = 25.0 cm bounded by 0 < θ < π/3 and π/6 < φ < π/4.",
          lines: [
            { text: "Share = (1 − cos 60°)(π/4 − π/6)/(4π) = (0.5)(π/12)/(4π) = 1/96.", focus: ["region"] },
            { text: "Ψ = 100 µC / 96 = 1.042 µC.", focus: ["region"], claims: [{ instance: "region", readout: "patchFlux", value: 1.04167, unit: "µC" }] },
          ],
          covers: ["mst-2324-q3a"],
          trap: "Using θ₂ = 60° as if the θ-share were 60/180. The θ-share is (1 − cos θ₂)/2, because patches near the poles are smaller.",
        },
        {
          id: "cube", level: "exam", title: "Faces of a cube",
          setup: { region: { system: "cart", ranges: [[-1, 1], [-1, 1], [-1, 1]], face: 2, centralCharge: 12, drawScale: 0.5 } },
          problem: "A 12 µC charge sits at the centre of a cube. Find the flux through its top face, and the flux through the remaining five faces together.",
          lines: [
            { text: "All six faces are identical by symmetry, so each carries 12/6 = 2 µC.", focus: ["region"], claims: [{ instance: "region", readout: "patchFlux", value: 2, unit: "µC" }] },
            { text: "The other five together: 12 − 2 = 10 µC. Their total must make the closed-surface flux Q.", focus: ["region"], givens: [{ value: 10, unit: "µC" }] },
          ],
          trap: "Moving the charge off-centre and still dividing by six. Symmetry is what allowed the split.",
        },
      ],
      asks: [
        { id: "why-share", q: "Why is flux shared by area?", tags: ["FLUX_PATCH_AREA"], a: "Only for a charge at the centre of a sphere, where D is the same size everywhere on the surface and normal to it. Then flux is D times area, and D is the same everywhere, so the flux divides exactly as the area does." },
        { id: "theta-share", q: "Why (1 − cos θ₂) and not θ₂/π?", a: "Bands of the sphere near the poles are smaller than those near the equator. Integrating r² sin θ dθ gives r²(1 − cos θ₂), which accounts for the shrinking bands." },
        { id: "off-centre", q: "What if the charge isn't at the centre?", tags: ["GAUSS_WITHOUT_SYMMETRY"], a: "Then D varies over the surface, and the simple share no longer works for a patch. Only the total through the whole closed surface is still Q." },
        { id: "radius", q: "Why doesn't a bigger sphere get more flux?", tags: ["FLUX_SCALES_WITH_AREA"], a: "The field gets weaker as r² while the area grows as r², so their product and the total flux stay Q." },
        { id: "open", q: "Does Gauss's law apply to a patch?", a: "Not directly: Gauss's law is about closed surfaces. Symmetry lets you split the closed-surface total into equal or proportional pieces." },
        { id: "solid", q: "What is a solid angle?", a: "The 3D version of an angle: patch area divided by r², measured in steradians. A whole sphere is 4π steradians, and the flux share is the solid angle divided by 4π." },
        { id: "units", q: "What units does the flux come out in?", a: "The same as the charge. Ψ has units of coulombs, so a charge in microcoulombs gives flux in microcoulombs." },
      ],
      checks: [
        {
          id: "rule", title: "Check: the share rule", show: ["axes", "region", "eq"], patch: { region: { system: "sph", ranges: [[0, 1], [0, 90], [0, 360]], face: 0, centralCharge: 12, drawScale: 1 } },
          note: "Four checks on patch flux. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "rule", type: "choose", prompt: "A central charge Q. The flux through a patch of the sphere equals…", dimension: "conceptual",
            options: [
              choice("share", "Q × (patch area ÷ 4πr²)", true, "Right: the patch's share of the whole."),
              choice("area", "Q × (patch area)", false, "That has the wrong units. Divide by the whole area.", "FLUX_PATCH_AREA"),
              choice("bigger", "A bigger sphere always gets more total flux", false, "For a point charge, the area grows while D falls, so the total stays Q.", "FLUX_SCALES_WITH_AREA"),
              choice("zero", "zero, since the patch isn't closed", false, "Flux through an open patch is fine; Gauss's law just doesn't give it directly."),
            ] },
        },
        {
          id: "predict-r", title: "Check: a bigger sphere",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-r", type: "predict-drag", prompt: "The sphere's radius doubles, from 1 m to 2 m. Drag the hemisphere's flux to your prediction.", target: { instance: "region", readout: "patchFlux" }, range: [0, 12], unit: "µC", relTol: 0.05, reveal: { region: { ranges: [[0, 2], [0, 90], [0, 360]], drawScale: 0.8 } }, dimension: "conceptual", tag: "FLUX_PATCH_AREA",
            feedback: { close: "Right: unchanged, 6 µC.", far: "The share is the same at any radius: 6 µC." } },
        },
        {
          id: "symmetry", title: "Check: when can D come out?",
          note: "Use the symmetry before simplifying the integral.",
          interaction: { id: "symmetry", type: "choose", prompt: "When can D be taken outside ∮D·dS as D × area?", dimension: "conceptual",
            options: [
              choice("right", "When symmetry makes its magnitude constant and direction normal", true, "Right: symmetry justifies pulling D out of the integral."),
              choice("closed", "For every closed Gaussian surface", false, "A closed surface alone does not make D constant or normal.", "GAUSS_WITHOUT_SYMMETRY"),
              choice("point", "Whenever there is a point charge, even off-centre", false, "An off-centre charge does not give the same D over the surface."),
            ] },
        },
        {
          id: "patch-num", title: "Check: a patch, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "patch-num", type: "numeric", prompt: fp.prompt, answer: fp.spec.answer, distractors: fp.spec.distractors, relTol: fp.spec.relTol, hints: fp.hints, template: "flux-patch", dimension: "application" },
          covers: ["mst-2324-q3a"],
        },
        {
          id: "q06-num", title: "Check: flux through the octant",
          note: "Last one.",
          interaction: { id: "q06-num", type: "numeric", prompt: q06.prompt, answer: q06.spec.answer, distractors: q06.spec.distractors, relTol: q06.spec.relTol, hints: q06.hints, template: "q06-octant", dimension: "application" },
          covers: ["tutorial:q06"],
        },
      ],
      recap: {
        points: [
          "With a central charge, the flux through a patch is Q × (the patch's share of the sphere).",
          "Share = (1 − cos θ₂)Δφ/(4π) for 0 < θ < θ₂ and a φ-range of Δφ; the radius cancels.",
          "Symmetry splits closed surfaces: each face of a centred cube carries Q/6.",
        ],
        traps: ["Multiplying Q by the area.", "Using θ₂/π for the θ-share.", "Dividing by six when the charge is off-centre."],
      },
    },
  ],
});
