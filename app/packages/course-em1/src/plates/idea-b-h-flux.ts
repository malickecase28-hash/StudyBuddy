import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
type V3 = [number, number, number];
const bs = instantiate(templates.find((t) => t.id === "bs-filament")!, 1);
const S20 = Math.sqrt(20);
const WIRE = { items: [{ id: "w", kind: "line" as const, I: 15 }], probe: [S20, 0, 4] as V3, mur: 1, drawScale: 0.25 };

export const ideaBHFlux = defineIdeaPlate({
  id: "idea-b-h-flux",
  title: "H, B, flux and force",
  requires: { objectives: [0], items: ["text:hayt-d7.2", "text:hayt-d8.2", "lecture:lec3a-q10"], misconceptions: ["H_B_UNITS"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "c", component: "currents", params: WIRE },
    { id: "eq", component: "equation", params: eqp(R`\mathbf H=\dfrac{I}{2\pi\rho}\,\mathbf a_\phi`, "H equals I over two pi rho, along a phi") },
  ],
  ideas: [
    {
      id: "bhflux",
      title: "H, B, flux and force",
      objectives: [0],
      explain: [
        {
          id: "h", title: "H: the field a current makes", show: ["axes", "c", "eq"], focus: ["c", "eq"],
          note: "Charges at rest make E. Charges in motion, currents, also make a magnetic field. Its intensity H, in amperes per metre, circles the current: grip the wire with your right thumb along the current and your fingers curl the way H points. On the plate, 15 A flows up the z axis. At P(√20, 0, 4), |H| = 15/(2π√20) = 0.5338 A/m, pointing along +ay.",
          claims: [{ instance: "c", readout: "Hy", value: 0.533822, unit: "A/m" }, { instance: "c", readout: "Hmag", value: 0.533822, unit: "A/m" }],
        },
        {
          id: "rect", title: "Rectangular components", patch: { c: { probe: [2, -4, 4] } }, focus: ["c"],
          note: "Most questions want H in rectangular components. At a point, aφ = (−y ax + x ay)/ρ. At P(2, −4, 4), ρ is still √20, so |H| is unchanged, but aφ = (4ax + 2ay)/√20. That gives H = 0.4775ax + 0.2387ay A/m, Hayt's Drill D7.2(b). The z coordinate never matters for an infinite wire.",
          claims: [{ instance: "c", readout: "Hx", value: 0.477465, unit: "A/m" }, { instance: "c", readout: "Hy", value: 0.238732, unit: "A/m" }],
        },
        {
          id: "b", title: "B = μH, in tesla", patch: { eq: eqp(R`\mathbf B=\mu\mathbf H=\mu_r\mu_0\mathbf H,\quad \mu_0=4\pi\times10^{-7}\ \text{H/m}`, "B equals mu H") }, focus: ["c", "eq"],
          note: "The magnetic flux density B is what pushes on moving charges and currents. In a medium of permeability μ, B = μH = μrμ₀H, with μ₀ = 4π × 10⁻⁷ H/m. Its unit is the tesla (T), one weber per square metre. H is set by the currents alone; B also depends on the material. Here, in free space, |B| = μ₀ × 0.5338 = 0.6708 µT.",
          claims: [{ instance: "c", readout: "Bmag", value: 6.7082e-7, unit: "T" }],
        },
        {
          id: "iron", title: "Iron multiplies B; B lines close", patch: { c: { mur: 1000 }, eq: eqp(R`\oint_S\mathbf B\cdot d\mathbf S=0\ \Leftrightarrow\ \nabla\cdot\mathbf B=0`, "the closed surface integral of B is zero") }, focus: ["c", "eq"],
          note: "Fill the space with iron of μr = 1000 and the same 15 A gives the same H, but B a thousand times larger: 0.6708 mT. That is why transformers and motors use iron cores. Whatever the material, B lines close on themselves: there are no magnetic charges, so ∮B·dS = 0 over any closed surface. That is Gauss's law for magnetism, ∇·B = 0. Flux through an open surface, Φ = ∫B·dS, is in webers.",
          claims: [{ instance: "c", readout: "Bmag", value: 6.7082e-4, unit: "T" }],
        },
      ],
      examples: [
        {
          id: "d7-2", level: "basic", title: "Hayt D7.2: H in rectangular components",
          setup: { c: { ...WIRE } },
          problem: "A filament carrying 15 A in the az direction lies along the entire z axis. Find H in rectangular coordinates at (a) P_A(√20, 0, 4) and (b) P_B(2, −4, 4).",
          lines: [
            { text: "ρ = √20 at both points, so |H| = 15/(2π√20) = 0.5338 A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hmag", value: 0.533822, unit: "A/m" }] },
            { text: "(a) At P_A, aφ = ay: H = 0.534ay A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hy", value: 0.533822, unit: "A/m" }] },
            { text: "(b) At P_B, aφ = (4ax + 2ay)/√20: H = 0.477ax + 0.239ay A/m.", patch: { c: { probe: [2, -4, 4] } }, focus: ["c"], claims: [{ instance: "c", readout: "Hx", value: 0.477465, unit: "A/m" }, { instance: "c", readout: "Hy", value: 0.238732, unit: "A/m" }] },
          ],
          covers: ["text:hayt-d7.2"],
          trap: "Putting μ₀ into H. H = I/(2πρ) has no μ; only B = μH does.",
        },
        {
          id: "force", level: "tutorial", title: "Hayt D8.2: the force on a wire",
          setup: { c: { ...WIRE } },
          problem: "B = −2ax + 3ay + 4az mT in free space. Find the force on a straight wire carrying 12 A from A(1, 1, 1) to (a) B(2, 1, 1) and (b) B(3, 5, 6).",
          lines: [
            { text: "For a straight wire in a uniform field, F = IL × B, with L the vector from A to B.", focus: ["eq"] },
            { text: "(a) L = ax: F = 12 ax × (−2ax + 3ay + 4az) mT = 12(−4ay + 3az) = −48ay + 36az mN.", focus: ["eq"] },
            { text: "(b) L = 2ax + 4ay + 5az: F = 12 L × B = 12ax − 216ay + 168az mN.", focus: ["eq"] },
          ],
          covers: ["text:hayt-d8.2"],
          trap: "Writing B × L flips the sign of every component. The order is IL × B.",
        },
        {
          id: "flux", level: "exam", title: "Lec 3a Q.10: flux through a curved surface", show: ["c", "eq"],
          setup: { c: { ...WIRE, mur: 1 }, eq: eqp(R`\Phi=\int_S\mathbf B\cdot d\mathbf S`, "flux equals the surface integral of B over the surface") },
          problem: "In free space, H = (2.39 × 10⁶/r) cos φ ar A/m (cylindrical). Find the magnetic flux crossing the surface r = 1 m, −π/4 ≤ φ ≤ π/4, 0 ≤ z ≤ 1 m.",
          lines: [
            { text: "B = μ₀H, and on the surface dS = r dφ dz ar, so B·dS = μ₀ × 2.39 × 10⁶ cos φ dφ dz: the r cancels.", focus: ["eq"] },
            { text: "Φ = μ₀ × 2.39 × 10⁶ × [sin φ] from −π/4 to π/4 × 1 = μ₀ × 2.39 × 10⁶ × √2.", focus: ["eq"] },
            { text: "Φ = 4π × 10⁻⁷ × 2.39 × 10⁶ × 1.414 = 4.247 Wb.", focus: ["eq"] },
          ],
          covers: ["lecture:lec3a-q10"],
          trap: "Integrating H instead of B. Flux is ∫B·dS, so multiply by μ₀.",
        },
      ],
      asks: [
        { id: "h-vs-b", q: "What's the difference between H and B?", tags: ["H_B_UNITS"], a: "H (A/m) is set by the currents alone, through the Biot–Savart or Ampère law. B = μH (tesla) includes the material's response, and it's B that exerts forces and whose flux induces emfs." },
        { id: "rhr", q: "Which way does H circle?", a: "Right-hand rule: thumb along the current, fingers curl with H. For current along +az, H is along +aφ." },
        { id: "tesla", q: "What is a tesla in other units?", a: "1 T = 1 Wb/m² = 1 N/(A·m). The Earth's field is about 50 µT; an MRI magnet is 1.5 to 3 T." },
        { id: "monopoles", q: "Why is ∮B·dS always zero?", a: "There are no magnetic charges. Every B line that enters a closed surface leaves it again, so the net flux is zero: ∇·B = 0." },
        { id: "force-dir", q: "Which way does the force on a wire act?", a: "Along IL × B: perpendicular to both the wire and the field. Fleming's left-hand rule, the motor rule, gives the same direction." },
        { id: "z", q: "Why doesn't z matter for an infinite wire?", a: "Every slice of an infinite straight wire looks the same, so H depends only on the distance ρ from it." },
      ],
      checks: [
        {
          id: "unit-c", title: "Check: the unit of H", show: ["axes", "c", "eq"], patch: { c: { ...WIRE } },
          note: "Four checks on H, B and flux. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "unit-c", type: "choose", prompt: "The SI unit of the magnetic field intensity H is…", dimension: "recognition",
            options: [
              choice("am", "A/m", true, "Right: amperes per metre."),
              choice("t", "T", false, "That's B's unit. H = B/μ.", "H_B_UNITS"),
              choice("wb", "Wb", false, "That's magnetic flux."),
            ] },
        },
        {
          id: "predict-dist", title: "Check: twice as far",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-dist", type: "predict-drag", prompt: "Move the probe to twice its distance from the wire. Drag |H| to your prediction.", target: { instance: "c", readout: "Hmag" }, range: [0, 1], unit: "A/m", relTol: 0.05, reveal: { c: { probe: [2 * S20, 0, 4] } }, dimension: "conceptual",
            feedback: { close: "Right: half, 0.2669 A/m. H ∝ 1/ρ.", far: "H = I/(2πρ): twice as far, half as much, 0.2669 A/m." } },
        },
        {
          id: "bs-num", title: "Check: a filament, your numbers",
          note: "Numbers of your own, in cm.",
          interaction: { id: "bs-num", type: "numeric", prompt: bs.prompt, answer: bs.spec.answer, distractors: bs.spec.distractors, relTol: bs.spec.relTol, hints: bs.hints, template: "bs-filament", dimension: "computational" },
        },
        {
          id: "force-c", title: "Check: the motor rule",
          note: "Last one.",
          interaction: { id: "force-c", type: "choose", prompt: "A wire carries current along +ax in a field B = B₀az (B₀ > 0). The force on it points along…", dimension: "application",
            options: [
              choice("neg-y", "−ay", true, "Right: ax × az = −ay."),
              choice("pos-y", "+ay", false, "ax × az = −ay: check the cyclic order x → y → z.", "BS_DIRECTION"),
              choice("z", "+az", false, "The force is perpendicular to B."),
            ] },
          covers: ["text:hayt-d8.2"],
        },
      ],
      recap: {
        points: [
          "A straight current makes H = I/(2πρ) aφ (A/m), circling by the right-hand rule.",
          "B = μH = μrμ₀H (tesla), with μ₀ = 4π × 10⁻⁷ H/m; flux Φ = ∫B·dS (webers).",
          "∮B·dS = 0: no magnetic charges, B lines close.",
          "Force on a wire: F = IL × B.",
        ],
        traps: ["μ in H.", "Integrating H instead of B for flux.", "B × L instead of L × B."],
      },
    },
  ],
});
