import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const K = 0.3; // drawing scale for A, B and their sums
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const tpl = (id: string) => instantiate(templates.find((t) => t.id === id)!, 1);
const sum = tpl("vec-sum-mag");
const dist = tpl("vec-distance-mm");
const v3 = (to: number[], label: string, tone: string, drawScale = K) => ({ component: "vector3", params: { from: [0, 0, 0], to, label, tone, drawScale } });

export const ideaVecBasics = defineIdeaPlate({
  id: "idea-vec-basics",
  title: "Components, length, unit and displacement vectors",
  requires: { objectives: [0, 1], items: ["tutorial:tut-1.1", "tutorial:tut-1.2", "mst-2324-q1b"], misconceptions: ["DISPLACEMENT_ORDER", "UNIT_VECTOR_LENGTH"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 2 } },
    { id: "a", ...v3([1, 0, 3], "A", "field") },
    { id: "b", ...v3([5, 2, -6], "B", "flux") },
    { id: "s", ...v3([6, 2, -3], "A + B", "surface") },
    { id: "u", ...v3([6 / 7, 2 / 7, -3 / 7], "â (drawn ×1)", "ink", 1) },
    { id: "r", component: "vector3", params: { from: [0.002, 0.002, 0.013], to: [0.01, 0.002, 0.007], label: "R12 (drawn ×150)", tone: "field", unit: "m", drawScale: 150, components: true } },
    { id: "eq", component: "equation", params: { latex: R`|\mathbf A|=\sqrt{A_x^2+A_y^2+A_z^2}`, speech: "the magnitude of A is the square root of the sum of the squared components", shortSpeech: "magnitude" } },
  ],
  ideas: [
    {
      id: "vec-basics",
      title: "Components, length, unit and displacement vectors",
      objectives: [0, 1],
      explain: [
        {
          id: "components", title: "A vector is three numbers", show: ["axes", "a", "eq"], focus: ["a"],
          note: "A vector has a size and a direction. In cartesian form it is three components along the unit vectors âₓ, âᵧ and âz. A = âₓ + 3âz means one step along x, none along y and three up z. Its length (magnitude) comes from Pythagoras in three dimensions: |A| = √(1² + 0² + 3²) = √10 = 3.162. The plate draws A from the origin at 0.3 scale; the readouts give its true components and magnitude.",
          claims: [{ instance: "a", readout: "vmag", value: 3.16228, unit: "" }],
        },
        {
          id: "add", title: "Adding: component by component", show: ["b", "s"], focus: ["s"],
          note: "To add vectors, add matching components. With B = 5âₓ + 2âᵧ − 6âz, A + B = (1 + 5)âₓ + (0 + 2)âᵧ + (3 − 6)âz = 6âₓ + 2âᵧ − 3âz. Its magnitude is √(36 + 4 + 9) = 7. Notice that |A| + |B| = 3.162 + 8.062 = 11.22, not 7: lengths add only when the vectors point the same way. Subtraction works the same way, component by component.",
          claims: [{ instance: "s", readout: "vmag", value: 7, unit: "" }, { instance: "b", readout: "vmag", value: 8.06226, unit: "" }],
        },
        {
          id: "unit", title: "Unit vectors: direction only", show: ["u"], focus: ["u", "s"],
          note: "A unit vector keeps a vector's direction and throws away its size: divide by the magnitude. The unit vector of A + B is (6âₓ + 2âᵧ − 3âz)/7 = 0.8571âₓ + 0.2857âᵧ − 0.4286âz, and its length is exactly 1. Every force and field in this course is written as magnitude × unit vector, so this step appears in every Coulomb question.",
          claims: [{ instance: "u", readout: "vmag", value: 1, unit: "" }],
        },
        {
          id: "position", title: "Position and displacement vectors", hide: ["a", "b", "s", "u", "eq"], show: ["r"], focus: ["r"],
          note: "A position vector runs from the origin to a point: P(2, 2, 13) mm has position vector 2âₓ + 2âᵧ + 13âz mm. A displacement vector runs from one point to another: R12 = r2 − r1, always end minus start. From P1(2, 2, 13) mm to P2(10, 2, 7) mm, R12 = 8âₓ − 6âz mm, with length 10 mm, which is 0.010 m. The plate draws it enlarged 150 times; the readouts are in metres.",
          claims: [{ instance: "r", readout: "vmagm", value: 0.01, unit: "m" }],
        },
      ],
      examples: [
        {
          id: "sum", level: "basic", title: "Tutorial 1.1: |A + B|, 5A − B, and a unit vector",
          show: ["axes", "a", "b", "s"], hide: ["r", "u", "eq"], setup: { s: { to: [6, 2, -3], label: "A + B" } },
          problem: "Given A = âₓ + 3âz and B = 5âₓ + 2âᵧ − 6âz, find |A + B|, 5A − B, the component of A along âᵧ, and a unit vector parallel to 3A + B.",
          lines: [
            { text: "A + B = 6âₓ + 2âᵧ − 3âz, so |A + B| = √(36 + 4 + 9) = 7.", focus: ["s"], claims: [{ instance: "s", readout: "vmag", value: 7, unit: "" }] },
            { text: "5A − B = (5 − 5)âₓ + (0 − 2)âᵧ + (15 + 6)âz = −2âᵧ + 21âz.", focus: ["a", "b"] },
            { text: "The component of A along âᵧ is A·âᵧ = 0: A has no y part.", focus: ["a"] },
            { text: "3A + B = 8âₓ + 2âᵧ + 3âz, of length √77 = 8.775, so the unit vector is ±(0.9117, 0.2279, 0.3419).", patch: { s: { to: [8, 2, 3], label: "3A + B" } }, focus: ["s"], claims: [{ instance: "s", readout: "vmag", value: 8.77496, unit: "" }] },
          ],
          covers: ["tutorial:tut-1.1"],
          trap: "Adding magnitudes: |A| + |B| = 11.22 is not |A + B| = 7. Add components first, then take the length.",
        },
        {
          id: "distance", level: "tutorial", title: "Tutorial 1.2: position and distance vectors",
          show: ["axes", "s"], hide: ["a", "b", "r", "u", "eq"], setup: { s: { from: [2, 4, 6], to: [0, 3, 8], label: "r_QR", drawScale: 0.2 } },
          problem: "Given P(1, −3, 5), Q(2, 4, 6) and R(0, 3, 8), find the position vectors of P and R, the distance vector r_QR, and the distance between Q and R.",
          lines: [
            { text: "Position vectors come straight from the coordinates: r_P = âₓ − 3âᵧ + 5âz and r_R = 3âᵧ + 8âz.", focus: ["axes"] },
            { text: "Distance vector, end minus start: r_QR = r_R − r_Q = (0 − 2)âₓ + (3 − 4)âᵧ + (8 − 6)âz = −2âₓ − âᵧ + 2âz.", focus: ["s"], claims: [{ instance: "s", readout: "vx", value: -2, unit: "" }] },
            { text: "Distance: |r_QR| = √(4 + 1 + 4) = 3.", focus: ["s"], claims: [{ instance: "s", readout: "vmag", value: 3, unit: "" }] },
          ],
          covers: ["tutorial:tut-1.2"],
          trap: "Writing r_QR = r_Q − r_R points the vector the wrong way. The length is the same, but in Coulomb's law the direction is the whole answer.",
        },
        {
          id: "mst", level: "exam", title: "MST 2023-24 Q1(b)(i): R12 in metres",
          show: ["r"], hide: ["axes", "a", "b", "s", "u", "eq"], setup: {},
          problem: "q1 is at P1(2, 2, 13) mm and q2 is at P2(10, 2, 7) mm. Find the displacement vector R12 and its length in metres, and the unit vector a12.",
          lines: [
            { text: "R12 = P2 − P1 = (10 − 2)âₓ + (2 − 2)âᵧ + (7 − 13)âz = 8âₓ − 6âz mm.", focus: ["r"], claims: [{ instance: "r", readout: "vxm", value: 0.008, unit: "m" }] },
            { text: "In metres, R12 = 0.008âₓ − 0.006âz, with length √(0.008² + 0.006²) = 0.010 m.", focus: ["r"], claims: [{ instance: "r", readout: "vmagm", value: 0.01, unit: "m" }] },
            { text: "The unit vector a12 = R12/|R12| = 0.8âₓ − 0.6âz, with no units.", focus: ["r"] },
          ],
          covers: ["mst-2324-q1b"],
          trap: "Leaving R12 in millimetres while ε₀ is in F/m makes the force a million times too small. Convert before substituting.",
        },
      ],
      asks: [
        { id: "negative", q: "Can a magnitude be negative?", a: "No. A magnitude is a length, √(Aₓ² + Aᵧ² + A_z²), so it is never negative. A minus sign belongs to a component, as in −6âz, and means the other way along that axis." },
        { id: "order", q: "Does R12 point from 1 to 2, or from 2 to 1?", tags: ["DISPLACEMENT_ORDER"], a: "From 1 to 2: R12 = r2 − r1, end minus start. Swapping the order flips the direction but not the length. In Coulomb's law F12 is the force on charge 2 due to charge 1, so for repelling charges it points along R12." },
        { id: "why-unit", q: "Why divide by the magnitude to get a unit vector?", tags: ["UNIT_VECTOR_LENGTH"], a: "Dividing every component by the same number keeps the direction and scales the length; dividing by |A| scales it to exactly 1. Skip that step, or divide by the sum of the components, and your unit vector carries the wrong size into the answer." },
        { id: "3d", q: "Is 3D Pythagoras really just one more square?", a: "Yes. On the floor, x and y give √(x² + y²). That diagonal and z form another right angle, so the full length is √(x² + y² + z²)." },
        { id: "point-vs-vector", q: "What's the difference between a point and a position vector?", a: "A point is a location, written P(1, 3, 5). Its position vector is the arrow from the origin to it, âₓ + 3âᵧ + 5âz. The numbers are the same but the jobs differ: you can add and subtract vectors, not points." },
        { id: "scalar-times", q: "What does 5A mean?", a: "Multiply every component by 5. The direction stays the same and the length becomes five times longer. A negative multiplier flips the direction." },
        { id: "zero", q: "Why does A have no âᵧ in it?", a: "Its y-component is zero, so the arrow lies in the x–z plane. Writing A = âₓ + 0âᵧ + 3âz makes that explicit, which helps when subtracting." },
      ],
      checks: [
        {
          id: "unit-length", title: "Check: a unit vector", show: ["axes", "a", "b", "s"], hide: ["r", "u", "eq"], patch: { s: { from: [0, 0, 0], to: [6, 2, -3], label: "A + B", drawScale: K } },
          note: "Five checks on vectors. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "unit-length", type: "choose", prompt: "The unit vector of 3âₓ + 4âz is…", dimension: "computational",
            options: [
              choice("right", "0.6âₓ + 0.8âz", true, "Right: divide by √(9 + 16) = 5."),
              choice("sum", "(3âₓ + 4âz)/7", false, "7 is the sum of the components, not the length. Divide by √(9 + 16) = 5.", "UNIT_VECTOR_LENGTH"),
              choice("ones", "âₓ + âz", false, "That has length √2, not 1, and the wrong direction."),
            ] },
        },
        {
          id: "predict-mag", title: "Check: predict |A + B|",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-mag", type: "predict-drag", prompt: "B changes to 5âₓ + 2âᵧ + 6âz: its z part flips sign. Drag |A + B| to your prediction.", target: { instance: "s", readout: "vmag" }, range: [0, 15], unit: "", relTol: 0.05, reveal: { b: { to: [5, 2, 6] }, s: { to: [6, 2, 9] } }, dimension: "conceptual",
            feedback: { close: "Right: √(36 + 4 + 81) = 11.", far: "A + B = 6âₓ + 2âᵧ + 9âz, of length √121 = 11." } },
        },
        {
          id: "sum-num", title: "Check: |A + B|, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "sum-num", type: "numeric", prompt: sum.prompt, answer: sum.spec.answer, distractors: sum.spec.distractors, relTol: sum.spec.relTol, hints: sum.hints, template: "vec-sum-mag", dimension: "computational" },
        },
        {
          id: "dist-num", title: "Check: a displacement in metres",
          note: "Millimetres, like the mid-semester test.",
          interaction: { id: "dist-num", type: "numeric", prompt: dist.prompt, answer: dist.spec.answer, distractors: dist.spec.distractors, relTol: dist.spec.relTol, hints: dist.hints, template: "vec-distance-mm", dimension: "computational" },
          covers: ["mst-2324-q1b"],
        },
        {
          id: "order", title: "Check: end minus start",
          note: "Last one.",
          interaction: { id: "order", type: "choose", prompt: "The displacement vector from P1 to P2 is…", dimension: "recognition",
            options: [
              choice("right", "r2 − r1", true, "Right: end minus start."),
              choice("flip", "r1 − r2", false, "That points from P2 to P1.", "DISPLACEMENT_ORDER"),
              choice("add", "r1 + r2", false, "Adding position vectors doesn't give a displacement."),
            ] },
        },
      ],
      recap: {
        points: [
          "A = Aₓâₓ + Aᵧâᵧ + A_zâz; |A| = √(Aₓ² + Aᵧ² + A_z²).",
          "Add and subtract component by component; magnitudes don't add.",
          "Unit vector: â = A/|A|, with length 1.",
          "Displacement: R12 = r2 − r1 (end minus start); convert mm to m before substituting.",
        ],
        traps: ["Adding magnitudes.", "Writing r1 − r2.", "Forgetting to divide by |A|, or dividing by the sum of the components."],
      },
    },
  ],
});
