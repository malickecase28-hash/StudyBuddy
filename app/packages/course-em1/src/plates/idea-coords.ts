import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const K = 0.15;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const phi = instantiate(templates.find((t) => t.id === "coord-phi")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const S3 = Math.sqrt(3);

export const ideaCoords = defineIdeaPlate({
  id: "idea-coords",
  title: "Cylindrical and spherical coordinates",
  requires: { objectives: [3], items: ["tutorial:tut-2.1"], misconceptions: ["PHI_QUADRANT"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 2 } },
    { id: "cf", component: "coord-frame", params: { point: [1, 3, 5], system: "cart", drawScale: K } },
    { id: "eq", component: "equation", params: eqp(R`\rho=\sqrt{x^2+y^2},\quad \phi=\tan^{-1}\dfrac yx,\quad z=z`, "rho, phi, z from x, y, z") },
  ],
  ideas: [
    {
      id: "coords",
      title: "Cylindrical and spherical coordinates",
      objectives: [3],
      explain: [
        {
          id: "cyl", title: "Cylindrical: ρ, φ, z", show: ["axes", "cf", "eq"], patch: { cf: { system: "cyl" } }, focus: ["cf"],
          note: "Cylindrical coordinates describe a point by its distance from the z-axis, ρ; the angle φ, measured from the +x axis toward +y; and the same height z. For P(1, 3, 5): ρ = √(x² + y²) = √10 = 3.162, φ = tan⁻¹(y/x) = 71.57°, and z = 5. They suit anything built around an axis: wires, coaxial cables, cylinders. The dashed lines on the plate drop P onto the floor, where ρ and φ live.",
          claims: [{ instance: "cf", readout: "pRho", value: 3.16228, unit: "m" }, { instance: "cf", readout: "pPhi", value: 71.5651, unit: "°" }, { instance: "cf", readout: "pz", value: 5, unit: "m" }],
        },
        {
          id: "sph", title: "Spherical: r, θ, φ", patch: { cf: { system: "sph" }, eq: eqp(R`r=\sqrt{x^2+y^2+z^2},\quad \theta=\cos^{-1}\dfrac zr,\quad \phi=\tan^{-1}\dfrac yx`, "r, theta, phi from x, y, z") }, focus: ["cf", "eq"],
          note: "Spherical coordinates use the distance from the origin, r; the angle θ down from the +z axis; and the same φ. For P(1, 3, 5): r = √(x² + y² + z²) = √35 = 5.916, θ = cos⁻¹(z/r) = 32.31°, and φ = 71.57°. They suit anything centred on a point: point charges, spheres, antennas. θ runs from 0° (straight up) to 180° (straight down); φ runs all the way round, from 0° to 360°.",
          claims: [{ instance: "cf", readout: "pR", value: 5.91608, unit: "m" }, { instance: "cf", readout: "pTheta", value: 32.3115, unit: "°" }],
        },
        {
          id: "quadrant", title: "The quadrant trap", patch: { cf: { point: [-3, -4, -10], system: "cyl" } }, focus: ["cf"],
          note: "tan⁻¹(y/x) can't tell (3, 4) from (−3, −4). Both give y/x = 1.333, and a calculator returns 53.13° for each. S(−3, −4, −10) sits in the third quadrant, so φ = 180° + 53.13° = 233.13°. Always check the signs of x and y first. In the second and third quadrants, add 180° to the calculator's angle; in the fourth, add 360°. The plate's readout always shows the true angle.",
          claims: [{ instance: "cf", readout: "pPhi", value: 233.13, unit: "°" }, { instance: "cf", readout: "pRho", value: 5, unit: "m" }],
        },
        {
          id: "unit-vectors", title: "Unit vectors that move", patch: { cf: { point: [1, 3, 5], system: "cyl", unitVectors: true } }, focus: ["cf"],
          note: "Cartesian unit vectors point the same way everywhere. Cylindrical and spherical ones don't: âρ points away from the z-axis toward the point, âφ points around the axis, and both turn as the point moves. That is why a vector's components change when you change systems, even though the arrow itself doesn't. To convert, project onto the new unit vectors with dot products: Qρ = Q·âρ and Qφ = Q·âφ.",
        },
      ],
      examples: [
        {
          id: "points", level: "basic", title: "Convert T and S",
          setup: { cf: { point: [0, -4, 3], system: "cyl" } },
          problem: "Convert P(1, 3, 5), T(0, −4, 3) and S(−3, −4, −10) from cartesian to cylindrical and spherical coordinates. (The explanations converted P; this example does T and S.)",
          lines: [
            { text: "T(0, −4, 3): ρ = √(0 + 16) = 4. The point lies on the −y axis, so φ = 270°; z = 3.", focus: ["cf"], claims: [{ instance: "cf", readout: "pRho", value: 4, unit: "m" }, { instance: "cf", readout: "pPhi", value: 270, unit: "°" }] },
            { text: "In spherical coordinates: r = √(16 + 9) = 5 and θ = cos⁻¹(3/5) = 53.13°, with the same φ = 270°.", patch: { cf: { system: "sph" } }, focus: ["cf"], claims: [{ instance: "cf", readout: "pR", value: 5, unit: "m" }, { instance: "cf", readout: "pTheta", value: 53.1301, unit: "°" }] },
            { text: "S(−3, −4, −10): ρ = 5, φ = 233.13°, z = −10; then r = √125 = 11.18 and θ = cos⁻¹(−10/11.18) = 153.43°.", patch: { cf: { point: [-3, -4, -10] } }, focus: ["cf"], claims: [{ instance: "cf", readout: "pR", value: 11.1803, unit: "m" }, { instance: "cf", readout: "pTheta", value: 153.435, unit: "°" }] },
          ],
          covers: ["tutorial:tut-2.1"],
          trap: "tan⁻¹(−4/0) is undefined on a calculator. Don't panic: a point on the −y axis is at φ = 270° by definition.",
        },
        {
          id: "back", level: "tutorial", title: "Back to cartesian",
          setup: { cf: { point: [-1, S3, -1], system: "cyl" } },
          problem: "Convert the cylindrical point (2, 120°, −1) and the spherical point (4, 60°, 30°) to cartesian coordinates.",
          lines: [
            { text: "x = ρ cos φ = 2 cos 120° = −1 and y = ρ sin φ = 2 sin 120° = 1.732; z stays −1.", latex: R`x=\rho\cos\phi,\quad y=\rho\sin\phi`, focus: ["cf"], claims: [{ instance: "cf", readout: "pRho", value: 2, unit: "m" }, { instance: "cf", readout: "pPhi", value: 120, unit: "°" }] },
            { text: "Spherical: x = r sin θ cos φ = 4 sin 60° cos 30° = 3, y = r sin θ sin φ = 1.732, and z = r cos θ = 2.", latex: R`x=r\sin\theta\cos\phi,\ y=r\sin\theta\sin\phi,\ z=r\cos\theta`, patch: { cf: { point: [3, S3, 2], system: "sph" } }, focus: ["cf"], claims: [{ instance: "cf", readout: "pR", value: 4, unit: "m" }, { instance: "cf", readout: "pTheta", value: 60, unit: "°" }, { instance: "cf", readout: "pPhi", value: 30, unit: "°" }] },
          ],
          trap: "Swapping θ and φ in the spherical formulas. θ is measured from the z-axis, so it pairs with cos θ in z; φ goes around, so it appears as cos φ and sin φ in x and y.",
        },
        {
          id: "vector", level: "exam", title: "One vector, three systems",
          setup: { cf: { point: [0, -4, 3], system: "cyl" } },
          problem: "Q = √(x² + y²)/√(x² + y² + z²) âₓ − yz/√(x² + y² + z²) âz. Evaluate Q at T(0, −4, 3) in cartesian, cylindrical and spherical components.",
          lines: [
            { text: "Cartesian first. At T, √(x² + y²) = 4 and √(x² + y² + z²) = 5, so Q = 0.8âₓ − (−4)(3)/5 âz = 0.8âₓ + 2.4âz.", focus: ["cf"] },
            { text: "At T, φ = 270°, so âρ = −âᵧ and âφ = âₓ. Then Qρ = Q·âρ = 0, Qφ = Q·âφ = 0.8 and Qz = 2.4: Q = 0.8âφ + 2.4âz.", focus: ["cf"], claims: [{ instance: "cf", readout: "pPhi", value: 270, unit: "°" }] },
            { text: "In spherical coordinates, θ = 53.13°, so sin θ = 0.8 and cos θ = 0.6. Then Qr = 2.4 × 0.6 = 1.44, Qθ = −2.4 × 0.8 = −1.92, and Qφ = 0.8: Q = 1.44âr − 1.92âθ + 0.8âφ.", patch: { cf: { system: "sph" } }, focus: ["cf"], claims: [{ instance: "cf", readout: "pTheta", value: 53.1301, unit: "°" }] },
            { text: "Check: all three forms have length √6.4 = 2.530. Changing coordinates changes the components, never the vector.", focus: ["cf"] },
          ],
          covers: ["tutorial:tut-2.1"],
          trap: "Converting T's coordinates but leaving the components in âₓ and âz. A cylindrical answer must use âρ, âφ and âz.",
        },
      ],
      asks: [
        { id: "which-system", q: "How do I choose a coordinate system?", a: "Match the symmetry. Straight lines and boxes: cartesian. Anything around an axis (wires, coax, cylinders): cylindrical. Anything around a point (charges, spheres): spherical. The right choice turns hard integrals into easy ones." },
        { id: "rho-vs-r", q: "What's the difference between ρ and r?", a: "ρ is the distance from the z-axis, measured flat. r is the distance from the origin, measured straight. At P(1, 3, 5), ρ = 3.162 and r = 5.916. They agree only on the x–y plane, where z = 0." },
        { id: "phi-same", q: "Is φ the same in cylindrical and spherical coordinates?", a: "Yes. Both measure the angle around the z-axis, from +x toward +y. Only the other two coordinates differ." },
        { id: "theta-range", q: "Why does θ stop at 180°?", a: "θ is measured from +z down to −z. Every direction is reached with 0° ≤ θ ≤ 180° plus a full turn of φ. Going past 180° would count the same directions twice." },
        { id: "calculator", q: "My calculator gave φ = −53.13°. What went wrong?", tags: ["PHI_QUADRANT"], a: "Nothing yet: the calculator only knows y/x. Place the point in its quadrant from the signs of x and y, then correct the angle. Add 180° in the second and third quadrants and 360° in the fourth." },
        { id: "components-change", q: "If the vector doesn't change, why do its components?", a: "Because the unit vectors changed. A component is how much of the vector lies along one unit vector. Rotate the unit vectors, and the same arrow needs different amounts of each." },
        { id: "units", q: "What are the units of ρ, r, φ and θ?", a: "ρ, r and z are lengths, in metres. φ and θ are angles, in degrees or radians. In formulas such as ρ dφ, the angle must be in radians." },
      ],
      checks: [
        {
          id: "phi-135", title: "Check: which quadrant?", show: ["axes", "cf"], hide: ["eq"], patch: { cf: { point: [1, 3, 5], system: "cyl" } },
          note: "Five checks on coordinates. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "phi-135", type: "choose", prompt: "For the point (−2, 2, 1), φ is…", dimension: "computational",
            options: [
              choice("right", "135°", true, "Right: second quadrant, so 180° − 45°."),
              choice("calc", "−45°", false, "That is the calculator's tan⁻¹(2/−2). The point is in the second quadrant.", "PHI_QUADRANT"),
              choice("45", "45°", false, "45° is in the first quadrant; here x is negative."),
            ] },
        },
        {
          id: "drag-q2", title: "Check: move into quadrant II", patch: { cf: { point: [-1, -2, 1], system: "cyl", draggable: true } },
          note: "Drag the point, and watch φ.",
          interaction: { id: "drag-q2", type: "manipulate-goal", goal: "Drag the point into the second quadrant, where 90° < φ < 180°. You can also focus it and use the arrow keys.", check: "phi-second-quadrant", dimension: "application" },
        },
        {
          id: "phi-num", title: "Check: φ, your numbers",
          note: "A point of your own.",
          interaction: { id: "phi-num", type: "numeric", prompt: phi.prompt, answer: phi.spec.answer, distractors: phi.spec.distractors, relTol: phi.spec.relTol, hints: phi.hints, template: "coord-phi", dimension: "computational" },
          covers: ["tutorial:tut-2.1"],
        },
        {
          id: "predict-r", title: "Check: double every coordinate", patch: { cf: { point: [1, 3, 5], system: "sph", draggable: false } },
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-r", type: "predict-drag", prompt: "The point moves from (1, 3, 5) to (2, 6, 10): every coordinate doubles. Drag r to your prediction.", target: { instance: "cf", readout: "pR" }, range: [0, 20], unit: "m", relTol: 0.05, reveal: { cf: { point: [2, 6, 10] } }, dimension: "conceptual",
            feedback: { close: "Right: r doubles too, to 11.83; θ and φ don't change.", far: "r = √(x² + y² + z²): doubling every coordinate doubles r, to 11.83. θ and φ stay the same." } },
        },
        {
          id: "symmetry", title: "Check: the right system",
          note: "Last one.",
          interaction: { id: "symmetry", type: "choose", prompt: "Which coordinate system suits the field around a long, straight wire?", dimension: "application",
            options: [
              choice("cyl", "Cylindrical", true, "Right: the wire is an axis, and ρ is the distance from it."),
              choice("sph", "Spherical", false, "Spherical suits a point, not a line."),
              choice("cart", "Cartesian", false, "Cartesian works, but every quantity would depend on both x and y."),
            ] },
        },
      ],
      recap: {
        points: [
          "Cylindrical: ρ = √(x² + y²), φ = tan⁻¹(y/x) placed in the right quadrant, z = z.",
          "Spherical: r = √(x² + y² + z²), θ = cos⁻¹(z/r) from +z, and the same φ.",
          "Back: x = ρ cos φ = r sin θ cos φ; y = ρ sin φ = r sin θ sin φ; z = r cos θ.",
          "Unit vectors âρ, âφ, âr and âθ turn with the point; convert components with dot products.",
          "Pick the system that matches the symmetry.",
        ],
        traps: ["Taking φ straight from the calculator.", "Swapping θ and φ.", "New coordinates with old unit vectors."],
      },
    },
  ],
});
