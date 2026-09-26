import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const point = (id: string, q: number, pos: [number, number, number], draggable = false) => ({ id, kind: "point" as const, q, pos, draggable });

export const ideaClosed = defineIdeaPlate({
  id: "idea-closed",
  title: "Closed surfaces and the outward normal",
  requires: { objectives: [2], items: [], misconceptions: ["SURFACE_NORMAL_DIRECTION", "OUTSIDE_CHARGE_CONTRIBUTES"] },
  instances: [
    { id: "q", component: "charges", params: { items: [point("q1", 2, [0, 0, 0])] } },
    { id: "field", component: "field-arrows", params: { grid: 5, probe: 1 }, links: { charges: "q" } },
    { id: "surface", component: "gaussian-surface", params: { shape: "sphere", size: 1 }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\Psi`, speech: "psi", shortSpeech: "flux" } },
  ],
  ideas: [
    {
      id: "closed",
      title: "Closed surfaces and the outward normal",
      objectives: [2],
      explain: [
        {
          id: "closed", title: "A closed surface", show: ["q", "field", "surface"], focus: ["surface"],
          note: "A closed surface has no edge: it seals off a volume, like a balloon. The sphere here, radius 1 m, closes around a +2 µC charge. 'Inside' and 'outside' now mean something definite, and that is what makes closed surfaces special: they let us ask how much flux leaves a region, not just how much crosses a patch.",
          claims: [{ instance: "surface", readout: "area", value: 12.566, unit: "m^2" }],
        },
        {
          id: "outward", title: "Outward, always", patch: { surface: { showNormals: true } }, focus: ["surface"],
          note: "On a closed surface the normal is not a choice. dS always points outward, away from the enclosed volume: to the right on the right, up at the top, down at the bottom. Fixing the direction once, everywhere, is what lets us add flux over the whole surface without arguing about signs.",
        },
        {
          id: "signs", title: "Leaving counts +, entering counts −", patch: { surface: { shading: true } }, focus: ["surface"],
          note: "With dS outward, D · dS is positive wherever the field leaves the volume and negative wherever it enters. Here every patch is shaded blue: the +2 µC charge sends field out through all of them.",
        },
        {
          id: "net", title: "The net flux ∮", show: ["eq"], patch: { eq: { latex: R`\Psi=\oint_S\mathbf D\cdot d\mathbf S`, speech: "psi equals the closed surface integral of D dot d S", shortSpeech: "net outward flux" } }, focus: ["eq", "surface"],
          note: "Add every patch, leaving minus entering, and you have the net outward flux, written with a circle on the integral sign: Ψ = ∮ D · dS. For this sphere the readout gives 2 µC, the same as the charge inside. That is not a coincidence; it is the next idea.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "negative", title: "A negative charge", patch: { q: { items: [point("q1", -3, [0, 0, 0])] } }, focus: ["surface"],
          note: "Swap in a −3 µC charge. Now D points inward everywhere, against every outward normal, so every patch counts negative and the net flux is −3 µC. The normals did not flip; the field did.",
          claims: [{ instance: "surface", readout: "flux", value: -3, unit: "µC" }],
        },
        {
          id: "outside", title: "A charge outside", patch: { q: { items: [point("q1", 2, [1.6, 0, 0])] } }, focus: ["surface"],
          note: "Now put a +2 µC charge outside, 1.6 m from the centre. Field enters on the near side (ochre, negative) and leaves on the far side (blue, positive). Every line that enters also leaves, so the net flux is exactly zero, even though plenty of field crosses the surface.",
          claims: [{ instance: "surface", readout: "flux", value: 0, unit: "µC" }],
        },
      ],
      examples: [
        {
          id: "faces", level: "basic", title: "Six faces of a cube",
          setup: { surface: { shape: "cube", size: 2, showNormals: false, shading: true }, q: { items: [point("q1", 4, [0, 0, 0])] } },
          problem: "A +4 µC charge sits at the centre of a closed cube of side 2 m. Find the net outward flux, and the flux through one face.",
          lines: [
            { text: "The cube is closed and holds the whole charge, so the net outward flux is the total: Ψ = 4 µC.", focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 4, unit: "µC" }] },
            { text: "The charge is at the centre, so all six faces are identical by symmetry: each carries 4/6 ≈ 0.667 µC.", focus: ["surface"], givens: [{ value: 4 / 6, unit: "µC" }] },
          ],
          trap: "Splitting by six only works because the charge is at the centre. Off-centre, the faces carry different shares; only the total stays fixed.",
        },
        {
          id: "negative-off", level: "tutorial", title: "A negative charge, off-centre",
          setup: { surface: { shape: "cube", size: 2 }, q: { items: [point("q1", -3, [0.4, 0, 0.3])] } },
          problem: "A −3 µC charge sits 0.4 m right of centre, inside a closed cube of side 2 m. Find the net outward flux, and say which way the field crosses the faces.",
          lines: [
            { text: "The charge is inside the closed cube, so all of it counts, sign included: Ψ = −3 µC.", focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: -3, unit: "µC" }] },
            { text: "Negative net flux means the field crosses inward: D points toward the charge, against every outward normal. Moving the charge off-centre changes which faces carry more, not the total.", focus: ["surface", "field"] },
          ],
          trap: "Flipping the normals to 'follow' the inward field, which makes the flux positive. The normals stay outward; the sign belongs to the charge.",
        },
        {
          id: "mixed", level: "exam", title: "Inside and outside together",
          setup: { surface: { shape: "sphere", size: 1 }, q: { items: [point("q1", 2, [0, 0, 0]), point("q2", -5, [1.5, 0, 0])] } },
          problem: "A +2 µC charge sits at the centre of a sphere of radius 1 m, and a −5 µC charge sits 1.5 m from the centre. Find the net outward flux through the sphere.",
          lines: [
            { text: "Only the +2 µC charge is inside: the other sits 1.5 m out, beyond the radius of 1 m.", focus: ["q", "surface"] },
            { text: "The outside charge's field enters and leaves the sphere, contributing zero net flux.", focus: ["surface"] },
            { text: "So Ψ = 2 µC.", focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }] },
          ],
          trap: "Adding in the outside charge. It changes the flux through every patch, but never the total.",
        },
      ],
      asks: [
        { id: "what-closed", q: "What counts as a closed surface?", a: "Any surface that fully seals a volume: a sphere, a cube, a cylinder with its end caps, a lumpy blob. A hemisphere or a flat disc is open: it has an edge you could walk off." },
        { id: "why-outward", q: "Why must the normal point outward?", tags: ["SURFACE_NORMAL_DIRECTION"], a: "So that 'net flux' has one meaning: out minus in. If each patch picked its own side, you could make the total anything you liked. Outward is the convention Gauss's law is written in." },
        { id: "zero-field", q: "If the net flux is zero, is the field zero?", show: ["q", "field", "surface"], patch: { q: { items: [point("q1", 2, [1.6, 0, 0])] }, surface: { shape: "sphere", size: 1, shading: true } }, focus: ["surface"], a: "No. With a charge outside, field crosses the surface nearly everywhere; it just leaves as much as it enters. Zero net flux means zero net charge inside, not zero field." },
        { id: "outside-matters", q: "Does a charge outside change anything at all?", tags: ["OUTSIDE_CHARGE_CONTRIBUTES"], a: "It changes the flux through each patch, a lot, but not the total. Every bit of its field that enters the closed surface leaves again somewhere else." },
        { id: "negative-meaning", q: "What does a negative net flux mean?", a: "More field enters than leaves, so the enclosed charge is negative. The sign of the net flux is the sign of the charge inside." },
        { id: "edges", q: "Do the edges and corners of a cube matter?", a: "No. Edges and corners have zero area, so they add nothing. Each flat face is its own patch with its own outward normal." },
        { id: "bottom", q: "On the bottom face of a cube, which way does dS point?", tags: ["SURFACE_NORMAL_DIRECTION"], a: "Down: outward from the cube, which on the bottom face means −z. A common slip is to point it up, into the cube. Outward means away from the enclosed volume, face by face." },
      ],
      checks: [
        {
          id: "bottom-face", title: "Check: the bottom face", show: ["surface"], patch: { surface: { shape: "cube", size: 2, showNormals: true, shading: false }, q: { items: [point("q1", 2, [0, 0, 0])] } },
          note: "Four checks on closed surfaces. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "bottom-face", type: "choose", prompt: "On the bottom face of a closed cube, dS points…", dimension: "recognition",
            options: [
              choice("down", "Down, out of the cube", true, "Right: outward from the enclosed volume."),
              choice("up", "Up, into the cube", false, "Into the cube is inward. dS always points outward.", "SURFACE_NORMAL_DIRECTION"),
              choice("along", "Whichever way D points there", false, "dS never follows D. It is fixed outward.", "SURFACE_NORMAL_DIRECTION"),
            ] },
        },
        {
          id: "drag-out", title: "Check: move it outside", patch: { surface: { shape: "sphere", size: 1, showNormals: false, shading: true }, q: { items: [point("q1", 2, [0.3, 0, 0.2], true)] } },
          note: "Drag the +2 µC charge out of the sphere and watch the net flux.",
          interaction: { id: "drag-out", type: "manipulate-goal", goal: "Drag the +2 µC charge out of the sphere (or focus it and use the arrow keys). Watch the net flux drop to zero.", check: "outside-zero", dimension: "conceptual" },
        },
        {
          id: "predict-neg", title: "Check: predict the sign", patch: { q: { items: [point("q1", 2, [0, 0, 0])] } },
          note: "Predict first, then the plate shows the truth.",
          interaction: { id: "predict-neg", type: "predict-drag", prompt: "The +2 µC charge is replaced by −3 µC at the centre. Drag the net outward flux to your prediction.", target: { instance: "surface", readout: "flux" }, range: [-5, 5], unit: "µC", relTol: 0.05, reveal: { q: { items: [point("q1", -3, [0, 0, 0])] } }, dimension: "conceptual",
            feedback: { close: "Right: −3 µC, the charge inside, sign included.", far: "Ψ = Q_enc = −3 µC. The normals stay outward; the field now points in." } },
        },
        {
          id: "outside-total", title: "Check: an outside charge",
          note: "Last one.",
          interaction: { id: "outside-total", type: "choose", prompt: "A closed sphere has +2 µC inside and a +7 µC charge just outside. The net outward flux is…", dimension: "conceptual",
            options: [
              choice("two", "2 µC", true, "Yes: only the enclosed charge counts."),
              choice("nine", "9 µC", false, "The +7 µC charge is outside: its field enters and leaves, adding zero net.", "OUTSIDE_CHARGE_CONTRIBUTES"),
              choice("zero", "0", false, "Zero would need no net charge inside, but +2 µC is inside."),
            ] },
        },
      ],
      recap: {
        points: [
          "A closed surface seals a volume; its normal dS always points outward.",
          "Net outward flux Ψ = ∮ D · dS counts leaving as positive and entering as negative.",
          "A charge outside sends in exactly as much as it takes out: zero net.",
          "The sign of the net flux is the sign of the enclosed charge.",
        ],
        traps: ["Letting dS follow D instead of pointing outward.", "Counting charges that sit outside the surface."],
      },
    },
  ],
});
