import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
type V3 = [number, number, number];
const SEG = { items: [{ id: "s", kind: "segment" as const, I: 10, from: [0, 0, -1] as V3, to: [0, 0, 1] as V3 }], probe: [1, 0, 0] as V3, mur: 1, drawScale: 1 };
const LOOP = { items: [{ id: "l", kind: "loop" as const, I: 10, N: 1, radius: 1, z: 0 }], probe: [0, 0, 1] as V3 };
const SQUARE = {
  items: [
    { id: "s1", kind: "segment" as const, I: 10, from: [1, -1, 0] as V3, to: [1, 1, 0] as V3 },
    { id: "s2", kind: "segment" as const, I: 10, from: [1, 1, 0] as V3, to: [-1, 1, 0] as V3 },
    { id: "s3", kind: "segment" as const, I: 10, from: [-1, 1, 0] as V3, to: [-1, -1, 0] as V3 },
    { id: "s4", kind: "segment" as const, I: 10, from: [-1, -1, 0] as V3, to: [1, -1, 0] as V3 },
  ],
  probe: [0, 0, 0] as V3,
};
const HW03 = { items: [{ id: "c", kind: "loop" as const, I: -2.82, N: 200, radius: 0.3, z: 0 }], probe: [0, 0, -0.5] as V3, mur: 1, drawScale: 2 };

export const ideaBiotSavart = defineIdeaPlate({
  id: "idea-biot-savart",
  title: "The Biot–Savart law",
  requires: { objectives: [1], items: ["hw03-2425-3.1a", "ict2-2425-q1", "f1516-q2c", "lecture:lec3a-q01", "lecture:lec3a-q03"], misconceptions: ["BS_DIRECTION"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "c", component: "currents", params: SEG },
    { id: "eq", component: "equation", params: eqp(R`d\mathbf H=\dfrac{I\,d\mathbf L\times\mathbf a_R}{4\pi R^2}`, "d H equals I d L cross a R over four pi R squared") },
  ],
  ideas: [
    {
      id: "biot",
      title: "The Biot–Savart law",
      objectives: [1],
      explain: [
        {
          id: "law", title: "The Biot–Savart law", show: ["axes", "c", "eq"], focus: ["c", "eq"],
          note: "This is the magnetic counterpart of Coulomb's law. Each small current element I dL contributes dH = I dL × aR/(4πR²), where R runs from the element to the field point. The cross product sets the direction: perpendicular to both the current and R. Add the elements by integrating. The plate's segment runs from z = −1 to z = 1 and carries 10 A. At 1 m from its midpoint, H = (I/4πρ)(sin α₂ − sin α₁) = 1.125ay A/m.",
          claims: [{ instance: "c", readout: "Hy", value: 1.1254, unit: "A/m" }],
        },
        {
          id: "infinite", title: "An infinite filament", patch: { c: { items: [{ id: "s", kind: "line", I: 10 }] } }, focus: ["c"],
          note: "Let the segment run to infinity both ways: α₁ → −90° and α₂ → +90°, so sin α₂ − sin α₁ = 2 and H = I/(2πρ) aφ, the result Wentworth derives in Example 3.2. At 1 m from 10 A that is 1.592 A/m: larger than the finite segment's 1.125 A/m, because more current now contributes.",
          claims: [{ instance: "c", readout: "Hy", value: 1.59155, unit: "A/m" }],
        },
        {
          id: "loop", title: "A loop, on its axis", patch: { c: LOOP, eq: eqp(R`\mathbf H=\dfrac{NIa^2}{2(a^2+h^2)^{3/2}}\,\mathbf a_z`, "H equals N I a squared over two times a squared plus h squared to the three halves") }, focus: ["c", "eq"],
          note: "For a ring of radius a carrying I, the radial parts of dH cancel in pairs across the ring and only the axial parts add (Wentworth Example 3.3): H = Ia²/(2(a² + h²)^(3/2)) az at height h on the axis. At the centre, h = 0, it is I/(2a). With N turns, multiply by N. On the plate, 10 A in a ring of radius 1 gives 1.768 A/m at height 1 above its centre.",
          claims: [{ instance: "c", readout: "Hz", value: 1.76777, unit: "A/m" }],
        },
        {
          id: "square", title: "A square loop", patch: { c: SQUARE }, focus: ["c"],
          note: "A square loop is four segments. Each contributes (I/4πρ)(sin α₂ − sin α₁) with ρ = L/2 and α = ±45°, and at the centre all four point the same way. So H = 4 × √2 I/(2πL) = 2√2 I/(πL) az. For a square of side 2 carrying 10 A: 4.502 A/m. A circle of the same width gives I/(2a) = 5 A/m.",
          claims: [{ instance: "c", readout: "Hz", value: 4.50158, unit: "A/m" }],
        },
      ],
      examples: [
        {
          id: "q01", level: "basic", title: "Lec 3a Q.01: the centre of an N-turn coil",
          setup: { c: { items: [{ id: "c", kind: "loop", I: 2.82, N: 200, radius: 0.3, z: 0 }], probe: [0, 0, 0], drawScale: 2 } },
          problem: "Find H at the centre of a circular coil of radius a carrying I through N turns. Evaluate it for 200 turns of radius 0.3 m carrying 2.82 A in +aφ.",
          lines: [
            { text: "Every element is a distance a from the centre, and dL × aR points along az for each one.", focus: ["c"] },
            { text: "H = N ∮ I a dφ/(4πa²) az = NI/(2a) az.", focus: ["c", "eq"] },
            { text: "H = 200 × 2.82/(2 × 0.3) = 940.0az A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hz", value: 940, unit: "A/m" }] },
          ],
          covers: ["lecture:lec3a-q01", "f1516-q2c"],
          trap: "Using 2πa in the denominator: that's the filament formula. At a loop's centre it's NI/(2a).",
        },
        {
          id: "q03", level: "tutorial", title: "Lec 3a Q.03: a filament parallel to the y axis",
          setup: { c: { items: [{ id: "f", kind: "line", I: 5, point: [2, 0, 2], dir: [0, 1, 0] }], probe: [0, 0, 0], drawScale: 0.5 } },
          problem: "A 5.0 A filament in the ay direction runs parallel to the y axis through x = 2 m, z = 2 m. Find H at the origin.",
          lines: [
            { text: "The perpendicular from the filament to the origin is ρ = (−2, 0, −2), of length √8 = 2.828.", focus: ["c"] },
            { text: "|H| = I/(2πρ) = 5/(2π × 2.828) = 0.2813 A/m.", focus: ["c"] },
            { text: "Direction: ay × (−ax − az)/√2 = (−ax + az)/√2, so H = −0.1989ax + 0.1989az A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hx", value: -0.198944, unit: "A/m" }, { instance: "c", readout: "Hz", value: 0.198944, unit: "A/m" }] },
          ],
          covers: ["lecture:lec3a-q03"],
          trap: "Taking aR from the origin toward the filament. R runs from the source to the field point.",
        },
        {
          id: "hw03", level: "exam", title: "A 200-turn coil",
          setup: { c: HW03 },
          problem: "A 200-turn coil of radius 30.0 cm, parallel to the xy plane and centred at the origin, carries 2.82 A in the −aφ direction. Using Biot–Savart's law, calculate H at P(0, 0, −50) cm.",
          lines: [
            { text: "On the axis, H = NIa²/(2(a² + z²)^(3/2)); the sign of z doesn't change the size, only the current's sense sets the direction.", focus: ["c", "eq"] },
            { text: "|H| = 200 × 2.82 × 0.3²/(2(0.3² + 0.5²)^(3/2)) = 50.76/0.3965 = 128.0 A/m.", focus: ["c"] },
            { text: "The current flows in −aφ, so by the right-hand rule H points along −az: H_P = −128.0az A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hz", value: -128.019, unit: "A/m" }] },
          ],
          covers: ["hw03-2425-3.1a", "ict2-2425-q1"],
          trap: "Answering +128.0az. The −aφ current reverses the field.",
        },
      ],
      asks: [
        { id: "direction", q: "How do I get the direction from dL × aR?", tags: ["BS_DIRECTION"], a: "R points from the current element to the field point. Cross the current's direction into it. For current along +az and a point on the +x axis, az × ax = ay." },
        { id: "coulomb", q: "How is Biot–Savart like Coulomb's law?", a: "Both fall as 1/R² from a source element. But Coulomb's field points along R, while the Biot–Savart field points perpendicular to both the current and R." },
        { id: "finite", q: "Why is the finite segment weaker?", a: "Fewer elements contribute, and the far ones contribute little: sin α₂ − sin α₁ is less than 2 unless the segment is infinite." },
        { id: "radial", q: "Why do the radial parts cancel on a loop's axis?", a: "Elements on opposite sides of the ring give radial components that point opposite ways and are equally large. Only the axial parts survive." },
        { id: "turns", q: "What do N turns do?", a: "They multiply the current: N turns of I act like one loop carrying NI, so H scales by N." },
        { id: "when", q: "When do I use Biot–Savart instead of Ampère?", a: "When the current has no symmetry that lets you pull H out of the integral: loops, segments, squares. Ampère's law is the shortcut for long, symmetric currents." },
      ],
      checks: [
        {
          id: "inf-c", title: "Check: how H falls", show: ["axes", "c", "eq"], patch: { c: SEG },
          note: "Four checks on the Biot–Savart law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "inf-c", type: "choose", prompt: "An infinite straight filament's H falls with distance as…", dimension: "recognition",
            options: [
              choice("r", "1/ρ", true, "Right: H = I/(2πρ)."),
              choice("r2", "1/ρ²", false, "That's a single element, or a point charge's E. The whole infinite line gives 1/ρ."),
              choice("const", "not at all", false, "It falls off away from the wire."),
            ] },
        },
        {
          id: "predict-centre", title: "Check: from the axis to the centre",
          note: "Predict first; then the plate shows the result.",
          patch: { c: LOOP },
          interaction: { id: "predict-centre", type: "predict-drag", prompt: "Move the probe from height 1 down to the centre of the ring (radius 1, 10 A). Drag Hz to your prediction.", target: { instance: "c", readout: "Hz" }, range: [0, 10], unit: "A/m", relTol: 0.05, reveal: { c: { probe: [0, 0, 0] } }, dimension: "conceptual",
            feedback: { close: "Right: I/(2a) = 5 A/m.", far: "At the centre, H = I/(2a) = 10/2 = 5 A/m." } },
        },
        {
          id: "dir-c", title: "Check: the direction",
          note: "Right-hand rule.",
          interaction: { id: "dir-c", type: "choose", prompt: "Current flows along +az on the z axis. At a point on the +y axis, H points along…", dimension: "application",
            options: [
              choice("neg-x", "−ax", true, "Right: aφ at the +y axis is −ax."),
              choice("pos-x", "+ax", false, "Curl your fingers: at +y the circulation runs toward −x.", "BS_DIRECTION"),
              choice("z", "+az", false, "H circles the current; it has no z part here."),
            ] },
        },
        {
          id: "hw03-num", title: "Check: Hz on the coil's axis",
          note: "Last one.",
          patch: { c: HW03 },
          interaction: { id: "hw03-num", type: "numeric", prompt: "200 turns, radius 30.0 cm, 2.82 A in −aφ, centred at the origin in the xy plane. Find Hz at P(0, 0, −50) cm, in A/m.", answer: { value: -128.019, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 128.019, unit: "A/m", errorClass: "sign", tag: "BS_DIRECTION", feedback: "The current runs in −aφ, so H points along −az." }],
            hints: ["On the axis, H = NIa²/(2(a² + z²)^(3/2)).", "a = 0.3, z = −0.5 (in metres).", "Sign: −aφ current gives −az."] },
          covers: ["hw03-2425-3.1a"],
        },
      ],
      recap: {
        points: [
          "Biot–Savart: dH = I dL × aR/(4πR²), with R from the element to the point.",
          "Segment: H = (I/4πρ)(sin α₂ − sin α₁); infinite filament: I/(2πρ).",
          "Loop on its axis: NIa²/(2(a² + h²)^(3/2)); at the centre, NI/(2a).",
          "Square of side L, at the centre: 2√2 I/(πL).",
        ],
        traps: ["R from the point to the source.", "Forgetting N.", "The −aφ sign."],
      },
    },
  ],
});