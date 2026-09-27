import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
type V3 = [number, number, number];
const AIR = { D1: [0, 0, 5e-9] as V3, normal: [0, 0, 1] as V3, er1: 1, er2: 1, conductor: true, show: ["rhoS", "E", "D"] as ("rhoS" | "E" | "D")[] };

export const ideaConductorBc = defineIdeaPlate({
  id: "idea-conductor-bc",
  title: "Conductor boundaries",
  requires: { objectives: [4], items: [], misconceptions: ["COND_E_INSIDE"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "b", component: "boundary", params: AIR },
    { id: "eq", component: "equation", params: eqp(R`\mathbf E_{\text{inside}}=0,\quad E_t=0,\quad D_n=\rho_S`, "inside, E is zero; at the surface, E t is zero and D n equals rho S") },
  ],
  ideas: [
    {
      id: "conductor",
      title: "Conductor boundaries",
      objectives: [4],
      explain: [
        {
          id: "inside", title: "E = 0 inside a conductor", show: ["axes", "b", "eq"], focus: ["b", "eq"],
          note: "A conductor is full of free electrons. If any field existed inside, they would move until their new arrangement cancelled it. In electrostatics that happens almost instantly, so inside a conductor E = 0, D = 0 and ρv = 0, and any excess charge sits on the surface. The whole conductor is one equipotential. On the plate, region 2 is the conductor: its field readouts are exactly zero.",
          claims: [{ instance: "b", readout: "E2z", value: 0, unit: "V/m" }, { instance: "b", readout: "D2z", value: 0, unit: "C/m^2" }],
        },
        {
          id: "tangential", title: "No tangential E at the surface", focus: ["b", "eq"],
          note: "Apply the loop rule with region 2 a conductor. E₂ₜ = 0, so E₁ₜ = 0 just outside as well. The field leaves a conductor's surface at right angles, which is why field lines always meet metal perpendicularly. If a tangential field existed, the surface charges would slide along until it vanished.",
          claims: [{ instance: "b", readout: "E1x", value: 0, unit: "V/m" }],
        },
        {
          id: "normal", title: "Normal D equals the surface charge", focus: ["b"],
          note: "Apply the pillbox rule. D₂ = 0 inside, so D₁ₙ − 0 = ρs: just outside, D = ρs n̂, with n̂ pointing out of the conductor. On the plate, D₁ = 5âz nC/m² above a conductor surface at z = 0, so ρs = 5 nC/m², and in air E₁ = ρs/ε₀ = 564.7 V/m.",
          claims: [{ instance: "b", readout: "rhoS", value: 5e-9, unit: "C/m^2" }, { instance: "b", readout: "E1z", value: 564.705, unit: "V/m" }],
        },
        {
          id: "sign", title: "Field into the surface means negative charge", patch: { b: { D1: [0, 0, -5e-9] } }, focus: ["b"],
          note: "Reverse the field so it points into the metal, and ρs = D₁·n̂ = −5 nC/m²: field lines end on negative charge. The sign comes straight out of the dot product, as long as n̂ points out of the conductor into the other region.",
          claims: [{ instance: "b", readout: "rhoS", value: -5e-9, unit: "C/m^2" }],
        },
      ],
      examples: [
        {
          id: "air", level: "basic", title: "ρs and E above a conductor",
          setup: { b: { ...AIR } },
          problem: "Just above a conductor's flat surface at z = 0, in air, D = 5âz nC/m². Find ρs and |E| there.",
          lines: [
            { text: "n̂ = âz points out of the conductor, so ρs = D·n̂ = 5 nC/m².", focus: ["b"], claims: [{ instance: "b", readout: "rhoS", value: 5e-9, unit: "C/m^2" }] },
            { text: "E = D/ε₀ = 564.7 V/m, normal to the surface.", focus: ["b"], claims: [{ instance: "b", readout: "E1z", value: 564.705, unit: "V/m" }] },
          ],
          trap: "Using ρs/(2ε₀). That's a lone sheet with field on both sides; a conductor has no field inside, so all of the flux goes outward.",
        },
        {
          id: "slanted", level: "tutorial", title: "A slanted conductor surface",
          setup: { b: { D1: [-1.8e-9, 2.4e-9, 0], normal: [-6, 8, 0], er1: 2.5, er2: 1, conductor: true, show: ["rhoS", "mag"] } },
          problem: "A conductor's surface lies in the plane −6x + 8y = 16, with n̂ pointing out of the metal. The dielectric outside has εr1 = 2.5, and just outside D₁ = −1.8âₓ + 2.4âᵧ nC/m². Find ρs and |E₁|.",
          lines: [
            { text: "n̂ = (−0.6, 0.8, 0), and D₁ is along it, as it must be at a conductor.", focus: ["b"] },
            { text: "ρs = D₁·n̂ = 1.08 + 1.92 = 3 nC/m².", focus: ["b"], claims: [{ instance: "b", readout: "rhoS", value: 3e-9, unit: "C/m^2" }] },
            { text: "|E₁| = |D₁|/(2.5ε₀) = 3 × 10⁻⁹/(2.5ε₀) = 135.5 V/m.", focus: ["b"], claims: [{ instance: "b", readout: "E1mag", value: 135.529, unit: "V/m" }] },
          ],
          trap: "Forgetting the dielectric outside: E₁ = D₁/(εr ε₀), not D₁/ε₀.",
        },
        {
          id: "impossible", level: "exam", title: "Spotting an impossible field",
          setup: { b: { D1: [0, 0, -2.65626e-9], normal: [0, 0, 1], er1: 1, er2: 1, conductor: true, show: ["rhoS", "E"] } },
          problem: "A conductor fills z < 0. A student claims that just above its surface, in air, E = 200âₓ − 300âz V/m. What's wrong? Taking only the physically possible part, find ρs.",
          lines: [
            { text: "The 200âₓ part is tangential. Just outside a conductor in electrostatics Eₜ = 0, so that part can't be right; only the normal part survives.", focus: ["b"] },
            { text: "ρs = ε₀Eₙ = 8.854 × 10⁻¹² × (−300) = −2.656 nC/m².", focus: ["b"], claims: [{ instance: "b", readout: "rhoS", value: -2.65626e-9, unit: "C/m^2" }] },
            { text: "It's negative because the field points into the conductor.", focus: ["b"] },
          ],
          trap: "Using |E| = 360.6, tangential part included. At a conductor only Eₙ is physical.",
        },
      ],
      asks: [
        { id: "why-zero", q: "Why is E zero inside a conductor?", tags: ["COND_E_INSIDE"], a: "Any field inside would push the free electrons, and they'd keep moving until they had cancelled it. Static means they've stopped, so the field inside is zero." },
        { id: "where-charge", q: "Where does excess charge go on a conductor?", a: "To the surface. Gauss's law with E = 0 inside says there's no net charge within any surface drawn inside the metal." },
        { id: "perpendicular", q: "Why do field lines meet a conductor at right angles?", a: "Tangential E just outside equals tangential E just inside, which is zero. Only the normal part survives." },
        { id: "sheet-vs-cond", q: "Why ρs/ε₀ here but ρs/(2ε₀) for a sheet?", a: "A lone sheet sends half its flux each way. A conductor's surface charge sends all of it outward, because none goes into the metal. The same charge gives twice the field on the one side." },
        { id: "equipotential", q: "Why is a conductor an equipotential?", a: "With E = 0 inside, moving a charge anywhere in the conductor takes no work, so V is the same everywhere in it, surface included." },
        { id: "current", q: "But Ohm's law needs E in a wire?", tags: ["COND_E_INSIDE"], a: "Yes, while a steady current flows. 'E = 0 inside' is the electrostatic statement, once charges have stopped moving. The small field in a current-carrying wire is the non-static case." },
      ],
      checks: [
        {
          id: "inside-c", title: "Check: inside the metal", show: ["axes", "b", "eq"], patch: { b: { ...AIR } },
          note: "Four checks on conductors. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "inside-c", type: "choose", prompt: "In electrostatics, inside a conductor…", dimension: "recognition",
            options: [
              choice("zero", "E = 0 and ρv = 0", true, "Right: any charge sits on the surface."),
              choice("uniform", "E is uniform", false, "Any field would move the free charges until it vanished.", "COND_E_INSIDE"),
              choice("rhos", "E = ρs/ε₀", false, "That's just outside the surface."),
            ] },
        },
        {
          id: "rho-num", title: "Check: ρs from E",
          note: "A number.",
          interaction: { id: "rho-num", type: "numeric", prompt: "Just outside a conductor, in air, |E| = 1.2 kV/m, pointing away from the surface. Find ρs in nC/m².", answer: { value: 10.625, unit: "nC/m^2" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 5.3125, unit: "nC/m^2", errorClass: "conceptual", feedback: "That's the lone-sheet formula. A conductor's field is all on one side: ρs = ε₀E." }],
            hints: ["Dₙ = ρs, and D = ε₀E in air.", "ρs = 8.854 × 10⁻¹² × 1200.", "Convert C/m² to nC/m²."] },
        },
        {
          id: "predict-sign", title: "Check: the field reverses",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-sign", type: "predict-drag", prompt: "The field just outside flips to point into the conductor, at the same size. Drag ρs to your prediction.", target: { instance: "b", readout: "rhoS" }, range: [-1e-8, 1e-8], unit: "C/m^2", relTol: 0.05, reveal: { b: { D1: [0, 0, -5e-9] } }, dimension: "conceptual",
            feedback: { close: "Right: −5 × 10⁻⁹ C/m².", far: "ρs = D·n̂, now negative: −5 × 10⁻⁹ C/m²." } },
        },
        {
          id: "tangent-c", title: "Check: along the surface",
          note: "Last one.",
          interaction: { id: "tangent-c", type: "choose", prompt: "Just outside a charged conductor, the tangential part of E is…", dimension: "conceptual",
            options: [
              choice("zero", "zero", true, "Right: it matches the zero field inside."),
              choice("rhos", "ρs/ε₀", false, "That's the normal part."),
              choice("equal", "equal to the normal part", false, "Any tangential field would make the surface charges slide.", "COND_E_INSIDE"),
            ] },
        },
      ],
      recap: {
        points: [
          "Inside a conductor, E = 0, D = 0 and ρv = 0; excess charge sits on the surface.",
          "At the surface, Eₜ = 0: fields meet conductors at right angles.",
          "Dₙ = ρs, with n̂ out of the conductor; E = ρs/ε just outside.",
        ],
        traps: ["Using ρs/(2ε₀) for a conductor.", "Allowing a tangential field at a conductor.", "Losing ρs's sign."],
      },
    },
  ],
});
