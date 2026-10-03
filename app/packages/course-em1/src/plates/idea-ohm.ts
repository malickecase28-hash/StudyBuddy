import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const cd = instantiate(templates.find((t) => t.id === "current-density")!, 1);
const ow = instantiate(templates.find((t) => t.id === "ohm-wire")!, 1);
const CU = { radius: 1e-3, length: 1000, sigma: 5.8e7, current: 10 };
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaOhm = defineIdeaPlate({
  id: "idea-ohm",
  title: "Current density and Ohm's law in point form",
  requires: { objectives: [0], items: ["f2425-q4a", "f2324-q4a"], misconceptions: ["J_AREA"] },
  instances: [
    { id: "wire", component: "conductor", params: CU },
    { id: "eq", component: "equation", params: eqp(R`I=\int_S\mathbf J\cdot d\mathbf S,\qquad \mathbf J=\sigma\mathbf E`, "I equals the flux of J, and J equals sigma E") },
  ],
  ideas: [
    {
      id: "ohm",
      title: "Current density and Ohm's law in point form",
      objectives: [0],
      explain: [
        {
          id: "j", title: "Current density: amps per square metre", show: ["wire", "eq"], focus: ["wire", "eq"],
          note: "Current is charge per second through a surface. Current density J says how that current is spread over the surface: amps per square metre, with a direction. The total current is the flux of J, I = ∫J·dS. When J is uniform across a round wire, I = J × πa². On the plate, 10 A in a copper wire of 1 mm radius gives |J| = 3.183 × 10⁶ A/m².",
          claims: [{ instance: "wire", readout: "J", value: 3.1831e6, unit: "A/m^2" }],
        },
        {
          id: "point-ohm", title: "Ohm's law, point by point: J = σE", focus: ["wire", "eq"], patch: { eq: eqp(R`\mathbf J=\sigma\mathbf E\quad\Longleftrightarrow\quad\mathbf E=\mathbf J/\sigma`, "J equals sigma E") },
          note: "In a conductor the field drives the free electrons, and the current density is proportional to it: J = σE, where σ is the conductivity in siemens per metre. Copper's σ = 5.8 × 10⁷ S/m is huge, so a tiny field drives a large current. Here E = J/σ = 0.05488 V/m. This is Ohm's law in point form; the familiar V = IR follows from it.",
          claims: [{ instance: "wire", readout: "E", value: 0.054881, unit: "V/m" }],
        },
        {
          id: "resistance", title: "From point form to R = L/(σS)", focus: ["wire"], patch: { eq: eqp(R`V=EL=\dfrac{J}{\sigma}L=\dfrac{I}{\sigma S}L\ \Rightarrow\ R=\dfrac{L}{\sigma S}`, "R equals L over sigma S") },
          note: "Integrate over a uniform wire of length L and cross-section S. The voltage is V = EL, and E = J/σ = I/(σS), so V = I × L/(σS). The resistance is R = L/(σS). The plate's 1 km of 1 mm-radius copper has R = 5.488 Ω. Longer wires resist more; thicker and more conductive ones resist less.",
          claims: [{ instance: "wire", readout: "R", value: 5.4881, unit: "Ω" }],
        },
        {
          id: "joule", title: "Power: Joule heating", focus: ["wire"], patch: { eq: eqp(R`P=I^2R=\int\mathbf E\cdot\mathbf J\,dv,\qquad p=\sigma E^2`, "P equals I squared R") },
          note: "The field does work pushing charge through the resistance, and it appears as heat: P = I²R = 548.8 W in the plate's wire. Point by point, the power density is p = E·J = σE² watts per cubic metre, here 1.747 × 10⁵ W/m³. That is why thin wires carrying big currents get hot: J is large, and p grows as J²/σ.",
          claims: [{ instance: "wire", readout: "P", value: 548.81, unit: "W" }, { instance: "wire", readout: "pd", value: 174692, unit: "W/m^3" }],
        },
      ],
      examples: [
        {
          id: "f2425", level: "basic", title: "J in a conductor",
          setup: { wire: { radius: 0.008, length: 1, sigma: 5.8e7, current: 50 } },
          problem: "A long straight conductor of radius 8.00 mm carries I = 50.0 A, uniformly distributed, along z. Find J within the conductor.",
          lines: [
            { text: "Cross-section: S = π(0.008)² = 2.011 × 10⁻⁴ m².", focus: ["wire"] },
            { text: "J = I/S = 50/(2.011 × 10⁻⁴) = 2.487 × 10⁵ âz A/m².", focus: ["wire"], claims: [{ instance: "wire", readout: "J", value: 248680, unit: "A/m^2" }] },
          ],
          covers: ["f2425-q4a"],
          trap: "Dividing by the circumference 2πr gives 994.7: that's current per metre, not per square metre.",
        },
        {
          id: "copper", level: "tutorial", title: "A copper wire: J, E and R",
          setup: { wire: CU },
          problem: "10 A flows in 1 km of copper wire (σ = 5.8 × 10⁷ S/m) of radius 1 mm. Find J, E and R.",
          lines: [
            { text: "J = 10/(π × 10⁻⁶) = 3.183 × 10⁶ A/m².", focus: ["wire"], claims: [{ instance: "wire", readout: "J", value: 3.1831e6, unit: "A/m^2" }] },
            { text: "E = J/σ = 3.183 × 10⁶ / 5.8 × 10⁷ = 0.05488 V/m.", focus: ["wire"], claims: [{ instance: "wire", readout: "E", value: 0.054881, unit: "V/m" }] },
            { text: "R = L/(σS) = 1000/(5.8 × 10⁷ × π × 10⁻⁶) = 5.488 Ω. Check: V = IR = 54.88 V = E × L.", focus: ["wire"], claims: [{ instance: "wire", readout: "R", value: 5.4881, unit: "Ω" }] },
          ],
          trap: "Using the 2 mm diameter as the radius gives S four times too big, so J and R come out a quarter of the right values.",
        },
        {
          id: "f2324", level: "exam", title: "J in a wire, then heating",
          setup: { wire: { radius: 0.0005, length: 1, sigma: 5.8e7, current: 8 } },
          problem: "An 8.0 A d.c. current flows uniformly in a straight conductor of radius 0.50 mm. (i) Find J. Then, if the conductor is copper, find the power dissipated per metre.",
          lines: [
            { text: "S = π(5 × 10⁻⁴)² = 7.854 × 10⁻⁷ m², so J = 8/S = 1.019 × 10⁷ âz A/m².", focus: ["wire"], claims: [{ instance: "wire", readout: "J", value: 1.01859e7, unit: "A/m^2" }] },
            { text: "Per metre, R = 1/(σS) = 0.02195 Ω, so P = I²R = 64 × 0.02195 = 1.405 W.", focus: ["wire"], claims: [{ instance: "wire", readout: "R", value: 0.0219524, unit: "Ω" }, { instance: "wire", readout: "P", value: 1.40495, unit: "W" }] },
          ],
          covers: ["f2324-q4a"],
          trap: "Leaving the radius in mm: 0.50 mm is 5 × 10⁻⁴ m, and squaring it gives 2.5 × 10⁻⁷, not 0.25.",
        },
      ],
      asks: [
        { id: "area", q: "Which area do I divide by?", tags: ["J_AREA"], a: "The cross-section the current crosses: πa² for a round wire, with a the radius. Not the circumference, and not the surface area of the wire's side." },
        { id: "sigma", q: "What sets σ?", a: "How many free charges a material has and how easily they drift. Copper has about 10²⁹ free electrons per cubic metre, so it conducts superbly; glass has almost none." },
        { id: "conductor-e", q: "Isn't E zero inside a conductor?", a: "In electrostatics, yes: once charges stop moving. With a steady current flowing, a small E is needed to keep the charges drifting against collisions, and J = σE." },
        { id: "drift", q: "How fast do electrons actually move?", a: "Slowly: J = ρv·v, and with copper's enormous charge density a few amps need drift speeds of only millimetres per second. The signal travels near light speed; the electrons don't." },
        { id: "resistivity", q: "What's resistivity?", a: "1/σ, in ohm-metres. R = L/(σS) is often written R = ρcL/S, with ρc the resistivity; the lecture uses both forms." },
        { id: "heat", q: "Why do thin wires get hotter?", a: "For the same current, a thinner wire has a larger J, and power density σE² = J²/σ grows as J². Halve the radius and J quadruples, so the heating per volume rises sixteen-fold." },
      ],
      checks: [
        {
          id: "area-c", title: "Check: J", show: ["wire", "eq"], patch: { wire: CU },
          note: "Four checks on current and Ohm's law. Get each right to move on.",
          interaction: { id: "area-c", type: "choose", prompt: "Uniform current I in a round wire of radius a gives |J| =", dimension: "recognition",
            options: [
              choice("right", "I / (πa²)", true, "Right: current per unit cross-sectional area."),
              choice("circ", "I / (2πa)", false, "That's per unit circumference, which is the wrong unit.", "J_AREA"),
              choice("diam", "I / (π(2a)²)", false, "Use the radius, not the diameter.", "J_AREA"),
            ] },
        },
        {
          id: "j-num", title: "Check: J, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "j-num", type: "numeric", prompt: cd.prompt, answer: cd.spec.answer, distractors: cd.spec.distractors, relTol: cd.spec.relTol, hints: cd.hints, template: "current-density", dimension: "computational" },
          covers: ["f2425-q4a"],
        },
        {
          id: "r-num", title: "Check: a wire's resistance",
          note: "Another wire.",
          interaction: { id: "r-num", type: "numeric", prompt: ow.prompt, answer: ow.spec.answer, distractors: ow.spec.distractors, relTol: ow.spec.relTol, hints: ow.hints, template: "ohm-wire", dimension: "computational" },
        },
        {
          id: "f2324-j", title: "Check: |J| in a wire",
          note: "Last one.",
          interaction: { id: "f2324-j", type: "numeric", prompt: "8.0 A flows uniformly in a straight conductor of radius 0.50 mm. Find |J| in A/m².", answer: { value: 1.0186e7, unit: "A/m^2" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 2.5465e6, unit: "A/m^2", errorClass: "conceptual", tag: "J_AREA", feedback: "That uses 1 mm, the diameter, as the radius." }],
            hints: ["S = πa², a = 5 × 10⁻⁴ m.", "S = 7.854 × 10⁻⁷ m².", "J = 8 / S."] },
          covers: ["f2324-q4a"],
        },
      ],
      recap: {
        points: [
          "J is current per unit cross-sectional area (A/m²); I = ∫J·dS, or JπA for a uniform round wire.",
          "Ohm's law in point form: J = σE.",
          "R = L/(σS); P = I²R; power density p = σE² = J²/σ.",
        ],
        traps: ["Dividing by the circumference or the diameter.", "Leaving mm unconverted before squaring.", "Treating E = 0 in a current-carrying conductor."],
      },
    },
  ],
});
