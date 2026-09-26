import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });

export const ideaFaraday = defineIdeaPlate({
  id: "idea-faraday",
  title: "Faraday's spheres: why flux exists",
  requires: { objectives: [1], items: [], misconceptions: ["D_VS_E_PERMITTIVITY"] },
  instances: [
    { id: "spheres", component: "faraday-spheres", params: { innerQ: 2, material: "Air", revealed: false } },
    { id: "eq", component: "equation", params: { latex: R`\Psi`, speech: "psi, the electric flux", shortSpeech: "flux" } },
  ],
  ideas: [
    {
      id: "faraday",
      title: "Faraday's spheres: why flux exists",
      objectives: [1],
      explain: [
        {
          id: "setup", title: "One charge, four materials", show: ["spheres"], focus: ["spheres"],
          note: "In 1837 Michael Faraday hung a small metal ball, charged to +2 µC, inside a hollow metal sphere without letting them touch. Then he measured the charge that appeared on the outside of the outer sphere. He repeated the experiment with the gap filled with air, then glass, then sulphur, then shellac. The question he was asking: does the stuff in between change what reaches the outer sphere?",
        },
        {
          id: "always", title: "Always +Q", patch: { spheres: { revealed: true } }, focus: ["spheres"],
          note: "The outer sphere always showed the same charge as the inner ball: 2 µC, in every material. Something passes from the inner charge to the outer sphere and is not reduced by what lies between. That something is what we now call the electric displacement, D, and its total through a surface is the electric flux.",
          claims: [{ instance: "spheres", readout: "outerQ", value: 2, unit: "µC" }],
        },
        {
          id: "glass", title: "What glass does change", patch: { spheres: { material: "Glass" } }, focus: ["spheres"],
          note: "Fill the gap with glass. Halfway out, 0.5 m from the centre, D is 0.6366 µC/m², exactly what it was in air, because D depends only on the charge and the distance. The electric field E is different: it drops to about 14380 V/m, five times weaker than in air, because glass has ε_r = 5 and E = D/(ε₀ε_r). The material changes E, never D.",
          claims: [{ instance: "spheres", readout: "dMid", value: 0.63662, unit: "µC/m^2" }, { instance: "spheres", readout: "eMid", value: 14380.1, unit: "V/m" }],
        },
        {
          id: "flux", title: "Flux: counting D", patch: { spheres: { material: "Sulphur" }, eq: { latex: R`\Psi=Q`, speech: "psi equals Q", shortSpeech: "flux equals charge" } }, show: ["eq"], focus: ["eq", "spheres"],
          note: "In sulphur E changes again, to about 17975 V/m, while D stays at 0.6366 µC/m² and the outer sphere still shows 2 µC. So we give the thing that passes through a name of its own: the electric flux Ψ. Its defining property is Faraday's result: the flux leaving a charge equals the charge, Ψ = Q, measured in coulombs. The next ideas turn this into a tool.",
          claims: [{ instance: "spheres", readout: "eMid", value: 17975.1, unit: "V/m" }, { instance: "spheres", readout: "outerQ", value: 2, unit: "µC" }],
        },
      ],
      examples: [
        {
          id: "sulphur", level: "basic", title: "A +5 µC ball in sulphur",
          setup: { spheres: { innerQ: 5, material: "Sulphur", revealed: true } },
          problem: "A ball charged to +5 µC hangs inside a hollow metal sphere with sulphur packed between them. What charge appears on the outer sphere, and what is the flux from the ball?",
          lines: [
            { text: "Faraday's result: the outer sphere shows the inner charge, whatever fills the gap. Q_outer = 5 µC.", focus: ["spheres"], claims: [{ instance: "spheres", readout: "outerQ", value: 5, unit: "µC" }] },
            { text: "The flux from the ball equals its charge: Ψ = Q = 5 µC. The sulphur changes E, not the flux.", latex: R`\Psi=Q=5\ \mu\mathrm C`, focus: ["spheres"] },
          ],
          trap: "Scaling the outer charge by ε_r. The material never changes the charge that appears outside.",
        },
        {
          id: "shellac", level: "tutorial", title: "D and E halfway, in shellac",
          setup: { spheres: { innerQ: 2, material: "Shellac", revealed: true } },
          problem: "The inner ball carries +2 µC and shellac (ε_r = 3.5) fills the gap. Find D and E halfway, 0.5 m from the centre.",
          lines: [
            { text: "D does not care about the material: D = Q/(4πr²) = 2/(4π × 0.25) = 0.6366 µC/m².", latex: R`D=\frac{Q}{4\pi r^2}=\frac{2}{4\pi(0.5)^2}=0.6366\ \mu\mathrm C/\mathrm m^2`, focus: ["spheres"], claims: [{ instance: "spheres", readout: "dMid", value: 0.63662, unit: "µC/m^2" }] },
            { text: "E does: E = D/(ε₀ε_r) = 0.6366×10⁻⁶ / (8.854×10⁻¹² × 3.5) ≈ 20543 V/m.", latex: R`E=\frac{D}{\varepsilon_0\varepsilon_r}=\frac{0.6366\times10^{-6}}{8.854\times10^{-12}\times3.5}`, focus: ["spheres"], claims: [{ instance: "spheres", readout: "eMid", value: 20543, unit: "V/m" }] },
          ],
          trap: "Dividing D by ε_r as well. That number means nothing; only E carries the ε_r.",
        },
        {
          id: "absorb", level: "exam", title: "Does glass absorb flux?",
          setup: { spheres: { innerQ: 4, material: "Glass", revealed: true } },
          problem: "A student claims 'glass absorbs part of the electric flux'. Using Faraday's experiment with a +4 µC ball, show why that is wrong, quoting D and E halfway.",
          lines: [
            { text: "With glass in the gap the outer sphere still shows 4 µC, exactly as in air, so no flux is lost on the way.", focus: ["spheres"], claims: [{ instance: "spheres", readout: "outerQ", value: 4, unit: "µC" }] },
            { text: "D halfway is 4/(4π × 0.25) = 1.273 µC/m² in every material.", focus: ["spheres"], claims: [{ instance: "spheres", readout: "dMid", value: 1.27324, unit: "µC/m^2" }] },
            { text: "E halfway in glass is only 28760 V/m: the material weakens E, not D and not the flux. The student has confused E with D.", focus: ["spheres"], claims: [{ instance: "spheres", readout: "eMid", value: 28760.2, unit: "V/m" }] },
          ],
          trap: "Arguing from E alone. A weaker E in glass is real, but flux is counted with D.",
        },
      ],
      asks: [
        { id: "metal", q: "Why was the outer sphere made of metal?", a: "Charge moves freely in a metal, so whatever the inner ball 'sends out' shows up as charge on the outer sphere, where Faraday could measure it. The metal shell is the detector." },
        { id: "touch", q: "Did the ball touch the outer sphere?", a: "No. It hung inside, insulated. The outer charge appeared by induction: the ball's field pulled opposite charge to the inner wall of the shell and pushed the same amount of like charge to the outside." },
        { id: "epsr", q: "What is ε_r?", show: ["spheres"], patch: { spheres: { material: "Glass", revealed: true } }, focus: ["spheres"], a: "The relative permittivity: how much a material weakens E compared with vacuum. Glass here has ε_r = 5, so E in glass is five times smaller than in vacuum. It never changes D or the flux." },
        { id: "d-material", q: "Does D depend on the material?", tags: ["D_VS_E_PERMITTIVITY"], show: ["spheres"], patch: { spheres: { material: "Glass", revealed: true } }, focus: ["spheres"], a: "No. D is set by the free charge alone: D = Q/(4πr²) here, in any material. E = D/ε is what changes. That is exactly why Faraday saw the same outer charge every time." },
        { id: "off-centre", q: "What if the ball were off-centre?", a: "The outer charge would still equal the inner charge. Moving the ball changes where the field is strong, not the total that passes through the shell. That idea, that the total depends only on the charge inside, is Gauss's law." },
        { id: "name", q: "Why is it called 'flux'?", a: "From the Latin fluxus, 'flow'. Nothing actually flows; picturing a stream crossing a surface is a way to count the field. The count is in coulombs because it always equals the charge that produces it." },
      ],
      checks: [
        {
          id: "outer", title: "Check: the outer charge", show: ["spheres"], patch: { spheres: { innerQ: 2, material: "Glass", revealed: false } },
          note: "Four checks on Faraday's result. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "outer", type: "choose", prompt: "With glass packed between the spheres, the outer sphere shows…", dimension: "conceptual",
            options: [
              choice("same", "Exactly +Q", true, "Yes: the same in every material."),
              choice("less", "Less than +Q: glass soaks some up", false, "The material changes E, not the flux, so the outer sphere still shows +Q.", "D_VS_E_PERMITTIVITY"),
              choice("more", "More than +Q", false, "Nothing is created in between; the outer sphere shows exactly +Q."),
            ] },
        },
        {
          id: "what-changes", title: "Check: what the material changes", patch: { spheres: { revealed: true } },
          note: "Which quantity does the material actually change?",
          interaction: { id: "what-changes", type: "choose", prompt: "Replacing air with glass between the spheres changes…", dimension: "conceptual",
            options: [
              choice("e", "E between the spheres", true, "Right: E = D/(ε₀ε_r) drops by the factor ε_r."),
              choice("d", "D between the spheres", false, "D depends only on the free charge and the distance, not the material.", "D_VS_E_PERMITTIVITY"),
              choice("q", "The charge on the outer sphere", false, "That is Faraday's point: the outer charge never changes.", "D_VS_E_PERMITTIVITY"),
            ] },
        },
        {
          id: "predict-e", title: "Check: predict E in glass", patch: { spheres: { material: "Air", innerQ: 2, revealed: true } },
          note: "Predict first, then the plate shows the truth.",
          interaction: { id: "predict-e", type: "predict-drag", prompt: "The gap switches from air to glass (ε_r = 5). Drag E halfway to your prediction.", target: { instance: "spheres", readout: "eMid" }, range: [0, 80000], unit: "V/m", relTol: 0.05, reveal: { spheres: { material: "Glass" } }, dimension: "conceptual",
            feedback: { close: "Right: about a fifth, 14380 V/m.", far: "E = D/(ε₀ε_r): five times smaller than in air, about 14380 V/m." } },
        },
        {
          id: "d-glass", title: "Check: D in glass",
          note: "A number to finish.",
          interaction: { id: "d-glass", type: "numeric", prompt: "A +4 µC ball hangs inside the outer sphere with glass in the gap. Find |D| halfway, 0.5 m from the centre.", answer: { value: 1.2732, unit: "µC/m^2" }, relTol: 0.02, dimension: "computational",
            distractors: [{ value: 0.25465, unit: "µC/m^2", errorClass: "conceptual", tag: "D_VS_E_PERMITTIVITY", feedback: "That divides by ε_r = 5. D doesn't depend on the material; E does." }],
            hints: ["D depends only on the charge and the distance.", "D = Q/(4πr²).", "4/(4π × 0.25)."] },
        },
      ],
      recap: {
        points: [
          "Faraday (1837): the outer sphere always shows the inner charge, whatever fills the gap.",
          "Something passes from charge to shell and ignores the material: D, and its total, the flux Ψ = Q.",
          "Materials change E = D/(ε₀ε_r), never D or the flux.",
        ],
        traps: ["Thinking a material absorbs flux.", "Mixing up D and E."],
      },
    },
  ],
});
