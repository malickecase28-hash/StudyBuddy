import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const fluxTemplate = templates.find((t) => t.id === "flux-flat-patch")!;
const seed1 = instantiate(fluxTemplate, 1);
const PLATE_ONLY = ["q", "tiles", "dvec", "svec", "eq"];
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });

export const fluxSurface = defineIdeaPlate({
  id: "flux-surface",
  title: "Flux through a surface",
  requires: { objectives: [2], items: [], misconceptions: ["SURFACE_NORMAL_DIRECTION"] },
  instances: [
    { id: "field", component: "uniform-field", params: { Dx: 3, Dz: 0 } },
    { id: "patch", component: "flat-patch", params: { center: [0.3, 0, 0], size: 1, normalAngle: 0, showNormal: true, showShadow: false }, links: { field: "field" } },
    { id: "dvec", component: "vector", params: { from: [-1.8, 0, -1.3], to: [-0.8, 0, -1.3], label: "D", tone: "flux" } },
    { id: "svec", component: "vector", params: { from: [0.3, 0, 0], to: [0.55, 0, 0.433], label: "dS", tone: "surface", arcTo: [0.8, 0, 0] } },
    { id: "q", component: "charges", params: { items: [{ id: "q1", kind: "point", q: 2, pos: [0.3, 0, 0.2] }] } },
    { id: "tiles", component: "patch-tiling", params: { shape: "sphere", size: 1, n: 2 }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`d\Psi`, speech: "d psi, the flux through the patch", shortSpeech: "flux" } },
  ],
  ideas: [
    {
      id: "flux-surface",
      title: "Flux through a surface",
      objectives: [2],
      explain: [
        {
          id: "stream", title: "A steady stream of D", show: ["field", "patch"], focus: ["patch"],
          note: "Picture D as a steady stream flowing to the right, the same everywhere: D = 3 µC/m² in the +x direction. Hold a flat patch of area 1 m² square-on to the stream, so its normal n̂ (the arrow sticking out of its face) points along D. Everything the stream carries crosses the patch. How much? D times the area: 3 µC/m² × 1 m² = 3 µC. That amount is the electric flux through the patch, written dΨ. Its unit is the coulomb, because flux counts the charge-worth of field passing through, not the field strength.",
          claims: [{ instance: "patch", readout: "dPsi", value: 3, unit: "µC" }, { instance: "patch", readout: "area", value: 1, unit: "m^2" }],
        },
        {
          id: "tilt", title: "Tilt the patch", patch: { patch: { normalAngle: 60, showShadow: true } }, focus: ["patch"],
          latex: R`d\Psi=|\mathbf D|\,dS\cos\theta`,
          note: "Now turn the patch so its normal makes an angle θ with D. The stream still flows right, but seen along the flow the patch looks narrower: its shadow on a wall facing the stream is only A cos θ. Only the stream that meets that shadow gets through. At θ = 60°, cos θ = 0.5, so the shadow is 0.5 m² and dΨ = 3 × 0.5 = 1.5 µC. Turn it further and the shadow shrinks; when the patch lies along the stream, nothing crosses. θ is always measured from the normal, not from the face of the patch.",
          claims: [{ instance: "patch", readout: "dPsi", value: 1.5, unit: "µC" }, { instance: "patch", readout: "shadow", value: 0.5, unit: "m^2" }],
        },
        {
          id: "negative", title: "Past 90°: negative flux", patch: { patch: { normalAngle: 150, showShadow: false } }, focus: ["patch"],
          note: "Keep turning until the normal points back against the stream, θ = 150°. Now cos θ is negative, and so is the flux: dΨ = 3 × cos 150° ≈ −2.6 µC. A negative flux does not mean less field. It means the field crosses the patch in the direction opposite to the normal you chose. For an open patch you choose which face n̂ points out of, and flipping that choice flips the sign. For a closed surface the choice is fixed (outward), which is why the sign will carry meaning in Gauss's law.",
          claims: [{ instance: "patch", readout: "dPsi", value: -2.598, unit: "µC" }],
        },
        {
          id: "dot", title: "Why a dot product", show: ["dvec", "svec", "eq"], patch: { patch: { normalAngle: 60 }, eq: { latex: R`d\Psi=\mathbf D\cdot d\mathbf S=|\mathbf D|\,|d\mathbf S|\cos\theta`, speech: "d psi equals D dot d S, which is the size of D times the size of d S times cos theta", shortSpeech: "D dot d S" } },
          focus: ["dvec", "svec"],
          note: "Give the patch a vector of its own: dS, pointing along the normal, with length equal to the patch's area. Then 'field strength × area × cos θ' is exactly the dot product of D and dS. One symbol now carries everything: how strong the field is, how big the patch is, and how it is tilted. It also handles the sign automatically. In components, D · dS = Dx dSx + Dz dSz, which is how you compute it when D is given as a vector such as 4x̂ + 3ẑ. Here: 3 × 1 × 0.5 = 1.5 µC.",
          claims: [{ instance: "patch", readout: "dPsi", value: 1.5, unit: "µC" }],
        },
        {
          id: "whole", title: "A whole flat surface", hide: ["dvec", "svec"], patch: { patch: { size: 1.5, normalAngle: 0 }, eq: { latex: R`\Psi=\mathbf D\cdot\mathbf S=|\mathbf D|\,A\cos\theta`, speech: "psi equals D dot S, which is the size of D times A times cos theta", shortSpeech: "flux through a flat surface" } },
          focus: ["patch"],
          note: "For a flat surface in a uniform field, every small piece has the same D and the same normal, so the pieces add up to one multiplication: Ψ = D · S = |D| A cos θ, where A is the whole area. Stretch the patch to 1.5 m on a side and turn it square-on: A = 2.25 m² and Ψ = 3 × 2.25 = 6.75 µC. This shortcut needs both conditions: a flat surface, and a field that is the same everywhere on it. Break either one and you must go patch by patch.",
          claims: [{ instance: "patch", readout: "area", value: 2.25, unit: "m^2" }, { instance: "patch", readout: "dPsi", value: 6.75, unit: "µC" }],
        },
        {
          id: "curved", title: "Curved surfaces: add up patches", hide: ["field", "patch", "eq"], show: ["q", "tiles"], focus: ["tiles"],
          note: "Most surfaces are curved, and most fields change from place to place. The fix is the same idea, repeated: cut the surface into patches small enough to be flat, with D nearly constant across each; work out D · dS on each; add them up. The plate has tiled a sphere around a 2 µC charge into a few patches, and the readout shows their sum. Shaded segments are where flux leaves (blue) or enters (ochre).",
        },
        {
          id: "limit", title: "Shrink the patches", patch: { tiles: { n: 12 } }, focus: ["tiles"],
          latex: R`\Psi=\int_S\mathbf D\cdot d\mathbf S`,
          note: "With many more, smaller patches the sum stops changing in the digits shown. That limit is what the integral sign means: not a new idea, just 'add up D · dS over pieces too small to matter'. Every flux problem is this sum. The tricks you will learn (flat surfaces, symmetry, Gauss's law) are ways to get the answer without adding thousands of pieces by hand.",
        },
      ],
      examples: [
        {
          id: "square", level: "basic", title: "A 2 m square at 60°",
          show: ["field", "patch"], hide: PLATE_ONLY, setup: { field: { Dx: 3, Dz: 0 }, patch: { size: 2, normalAngle: 60, showShadow: false, center: [0.3, 0, 0] } },
          problem: "A flat 2 m × 2 m square sits in a uniform field D = 3 µC/m², with its normal at 60° to D. Find the flux through it.",
          lines: [
            { text: "The field is the same everywhere on a flat surface, so one multiplication will do. First the area: A = 2 × 2 = 4 m².", focus: ["patch"], claims: [{ instance: "patch", readout: "area", value: 4, unit: "m^2" }] },
            { text: "Next, the part of D along the normal: D · n̂ = 3 × cos 60° = 1.5 µC/m².", latex: R`\mathbf D\cdot\hat{\mathbf n}=3\cos 60^\circ=1.5`, focus: ["patch"], claims: [{ instance: "patch", readout: "Dn", value: 1.5, unit: "µC/m^2" }] },
            { text: "Multiply: Ψ = 1.5 × 4 = 6 µC. The plate's readout agrees.", latex: R`\Psi=1.5\times4=6\ \mu\mathrm C`, focus: ["patch"], claims: [{ instance: "patch", readout: "dPsi", value: 6, unit: "µC" }] },
          ],
          trap: "Measuring 60° from the surface instead of the normal means using sin 60°, and the answer comes out about 1.7 times too big.",
        },
        {
          id: "vector", level: "tutorial", title: "D given as a vector",
          show: ["field", "patch"], hide: PLATE_ONLY, setup: { field: { Dx: 4, Dz: 3 }, patch: { size: 3, depth: 0.5, normalAngle: 90, center: [0, 0, 0] } },
          problem: "A flat 3 m × 0.5 m rectangle lies in the plane z = 0 of a uniform field D = 4x̂ + 3ẑ µC/m². Its normal is +ẑ. Find the flux through it.",
          lines: [
            { text: "The normal is n̂ = ẑ, so only the z-part of D pierces the rectangle: D · n̂ = 4 × 0 + 3 × 1 = 3 µC/m².", focus: ["patch"], claims: [{ instance: "patch", readout: "Dn", value: 3, unit: "µC/m^2" }] },
            { text: "Area: A = 3 × 0.5 = 1.5 m².", focus: ["patch"], claims: [{ instance: "patch", readout: "area", value: 1.5, unit: "m^2" }] },
            { text: "Ψ = 3 × 1.5 = 4.5 µC.", latex: R`\Psi=3\times1.5=4.5\ \mu\mathrm C`, focus: ["patch"], claims: [{ instance: "patch", readout: "dPsi", value: 4.5, unit: "µC" }] },
          ],
          trap: "The x-part of D, 4 µC/m², runs along the rectangle and adds nothing. Using the full |D| = 5 µC/m² instead overestimates the flux.",
        },
        {
          id: "tilted", level: "exam", title: "A tilted plate, both ways",
          show: ["field", "patch"], hide: PLATE_ONLY, setup: { field: { Dx: 2, Dz: 2 }, patch: { size: 2, depth: 2, normalAngle: 30, center: [0.3, 0, 0] } },
          problem: "In a uniform field D = 2x̂ + 2ẑ µC/m², a flat 2 m × 2 m plate has its normal at 30° above the +x axis. (a) Find the flux through the plate. (b) Find the angle between D and the normal, and confirm that Ψ = |D| A cos θ gives the same answer.",
          lines: [
            { text: "(a) Write the normal as a vector: n̂ = (cos 30°, sin 30°) = (0.866, 0.5).", latex: R`\hat{\mathbf n}=(\cos30^\circ,\ \sin30^\circ)=(0.866,\ 0.5)`, focus: ["patch"] },
            { text: "D · n̂ = 2 × 0.866 + 2 × 0.5 = 2.732 µC/m².", focus: ["patch"], claims: [{ instance: "patch", readout: "Dn", value: 2.732, unit: "µC/m^2" }] },
            { text: "The area is 4 m², so Ψ = 2.732 × 4 = 10.93 µC.", focus: ["patch"], claims: [{ instance: "patch", readout: "area", value: 4, unit: "m^2" }, { instance: "patch", readout: "dPsi", value: 10.928, unit: "µC" }] },
            { text: "(b) D points at 45° and the normal at 30°, so θ = 15°. Its size is |D| = √(2² + 2²) = 2.828 µC/m².", focus: ["field", "patch"], claims: [{ instance: "field", readout: "magnitude", value: 2.8284, unit: "µC/m^2" }, { instance: "patch", readout: "theta", value: 15, unit: "°" }] },
            { text: "Check: |D| A cos θ = 2.828 × 4 × cos 15° = 10.93 µC, the same as (a). Both routes are the same dot product.", focus: ["patch"], claims: [{ instance: "patch", readout: "dPsi", value: 10.928, unit: "µC" }] },
          ],
          trap: "Adding the angles (45° + 30°) instead of taking the difference gives the wrong θ. Always use the angle between the two directions.",
        },
      ],
      asks: [
        { id: "why-cos", q: "Why cos θ and not sin θ?", show: ["field", "patch"], patch: { field: { Dx: 3, Dz: 0 }, patch: { size: 1, depth: 1, normalAngle: 60, showShadow: true } }, focus: ["patch"],
          a: "Because θ is measured from the normal, not from the face of the patch. Square-on means θ = 0°, when everything passes, and cos 0° = 1. Measuring from the face instead needs sin, which gives the same number, but mixing the two conventions is the most common slip. Forma always measures from the normal." },
        { id: "curved", q: "What if the patch is curved?", show: ["q", "tiles"], patch: { tiles: { n: 12 } }, focus: ["tiles"],
          a: "Cut it into pieces small enough to be flat, work out D · dS on each, and add them. The integral ∫S D · dS is exactly that sum, with the pieces shrunk until the answer stops changing." },
        { id: "units", q: "Why is flux measured in coulombs?",
          a: "D is in coulombs per square metre and area is in square metres, so D · S is in coulombs. Flux counts the charge-worth of field passing through, which is why Gauss's law can set it equal to a charge." },
        { id: "negative", q: "Can flux be negative?", show: ["field", "patch"], patch: { field: { Dx: 3, Dz: 0 }, patch: { size: 1, depth: 1, normalAngle: 150 } }, focus: ["patch"],
          a: "Yes. When D crosses the patch against the normal (θ above 90°), cos θ is negative, so the flux is too. At 150° this patch reads about −2.6 µC. The size says how much crosses; the sign says which way, relative to the normal you chose." },
        { id: "size-angle", q: "Does the size of the patch matter, or only its angle?",
          a: "Both: Ψ = |D| A cos θ. Doubling the side of a square quadruples its area and its flux; tilting it scales the flux by cos θ. A big patch edge-on to the field catches nothing." },
        { id: "which-normal", q: "Which way does the normal point on an open surface?", tags: ["SURFACE_NORMAL_DIRECTION"], show: ["field", "patch"], patch: { patch: { size: 1, depth: 1, normalAngle: 180 } }, focus: ["patch"],
          a: "You choose, and the choice sets the sign of Ψ: a flat sheet has two faces and nothing picks one for you. A closed surface is different: there the normal always points outward, and that convention is what gives Gauss's law its meaning. Letting dS 'follow D' instead is a classic mistake." },
        { id: "flux-vs-field", q: "Is flux the same thing as field strength?",
          a: "No. D is a density: how much flux per square metre at a point. Flux is a total through a given surface. A strong field gives zero flux through a patch that is edge-on to it." },
        { id: "ninety", q: "What happens at exactly 90°?", show: ["field", "patch"], patch: { field: { Dx: 3, Dz: 0 }, patch: { size: 1, depth: 1, normalAngle: 90 } }, focus: ["patch"],
          a: "The field runs along the face of the patch, so none of it crosses: cos 90° = 0, and the readout shows dΨ = 0." },
      ],
      checks: [
        {
          id: "edge-on", title: "Check: edge-on", show: ["field", "patch"], hide: PLATE_ONLY, patch: { field: { Dx: 3, Dz: 0 }, patch: { size: 1, depth: 1, normalAngle: 0, showShadow: false, center: [0.3, 0, 0] } },
          note: "Five quick checks, on the plate and in the margin. Get each right to move on.",
          interaction: { id: "edge-on", type: "choose", prompt: "A patch is turned until its normal is perpendicular to D. The flux through it is…", dimension: "conceptual",
            options: [
              choice("zero", "Zero", true, "Right: the field skims along the face, and cos 90° = 0."),
              choice("max", "The largest it can be", false, "The largest is when the normal points along D (θ = 0°)."),
              choice("neg", "Negative", false, "Negative needs θ beyond 90°. At exactly 90°, nothing crosses."),
            ] },
        },
        {
          id: "predict-45", title: "Check: predict the tilt", patch: { patch: { size: 2, depth: 2, normalAngle: 0 } },
          note: "Predict before you look: commit a value, then the plate shows the truth.",
          interaction: { id: "predict-45", type: "predict-drag", prompt: "The 2 m square is turned so its normal is at 45° to D. Drag Ψ to your prediction.", target: { instance: "patch", readout: "dPsi" }, range: [0, 14], unit: "µC", relTol: 0.05, reveal: { patch: { normalAngle: 45 } }, dimension: "conceptual",
            feedback: { close: "Right: 3 × 4 × cos 45° ≈ 8.49 µC.", far: "Ψ = |D| A cos θ = 3 × 4 × cos 45° ≈ 8.49 µC. The tilt removes about 30%." } },
        },
        {
          id: "tilt-to-3", title: "Check: tilt to a target", patch: { patch: { size: 2, depth: 2, normalAngle: 60 } },
          note: "Now do it by hand: turn the square until the readout says 3 µC.",
          interaction: { id: "tilt-to-3", type: "manipulate-goal", goal: "Turn the 2 m square until exactly 3 µC passes through it (within 2%). Drag the patch, or focus it and use the arrow keys.", check: "patch-flux-3", dimension: "application" },
        },
        {
          id: "numbers", title: "Check: your own numbers",
          note: "A problem with your own numbers. Two misses show a worked example with new numbers, then you try again.",
          interaction: { id: "numbers", type: "numeric", prompt: seed1.prompt, answer: seed1.spec.answer, distractors: seed1.spec.distractors, relTol: seed1.spec.relTol, hints: seed1.hints, template: "flux-flat-patch", dimension: "computational" },
        },
        {
          id: "flip", title: "Check: flip the normal",
          note: "Last one: what the choice of normal does.",
          interaction: { id: "flip", type: "choose", prompt: "On an open patch you decide to point the normal out of the other face. The flux you calculate…", dimension: "conceptual",
            options: [
              choice("sign", "Flips sign, same size", true, "Yes: dS flips, so D · dS flips sign."),
              choice("same", "Is unchanged, because the field hasn't changed", false, "The field is the same, but dS now points the other way, so D · dS changes sign.", "SURFACE_NORMAL_DIRECTION"),
              choice("double", "Doubles", false, "Nothing doubles; only the direction of dS changed."),
            ] },
        },
      ],
      recap: {
        points: [
          "Flux through a flat patch: Ψ = D · S = |D| A cos θ, with θ measured from the normal.",
          "Units: coulombs (C/m² × m²). Flux counts the charge-worth of field crossing a surface.",
          "Sign: negative when D crosses against the chosen normal (θ above 90°).",
          "Curved surfaces or changing fields: add D · dS over small patches, which is the surface integral ∫S D · dS.",
        ],
        traps: ["Using sin θ (measuring θ from the face).", "Counting the part of D that runs along the surface.", "Adding angles instead of taking the angle between directions."],
      },
    },
  ],
});
