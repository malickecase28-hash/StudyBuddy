import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const el = instantiate(templates.find((t) => t.id === "e-line")!, 1);
const LINE = { items: [{ id: "l", kind: "line" as const, rhoL: 2000, x: 0, y: 0 }] };

export const ideaEContinuous = defineIdeaPlate({
  id: "idea-e-continuous",
  title: "Fields of line and sheet charges",
  requires: { objectives: [2], items: ["mst-2324-q3b"], misconceptions: ["LINE_FIELD_FORM", "SHEET_FIELD_DISTANCE"] },
  instances: [
    { id: "q", component: "charges", params: LINE },
    { id: "ep", component: "e-probe", params: { point: [1, 0, 0] }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\mathbf E=\dfrac{\rho_L}{2\pi\varepsilon_0\rho}\,\mathbf a_\rho`, speech: "E equals rho L over two pi epsilon nought rho, along a rho", shortSpeech: "line charge field" } },
  ],
  ideas: [
    {
      id: "e-continuous",
      title: "Fields of line and sheet charges",
      objectives: [2],
      explain: [
        {
          id: "line", title: "An infinite line charge", show: ["q", "ep", "eq"], focus: ["q", "ep"],
          note: "Spread charge along an infinite straight line at ρL coulombs per metre. Summing (integrating) the point-charge fields of every piece, the components along the line cancel by symmetry, and what's left points straight out: E = ρL/(2πε₀ρ) aρ, where ρ is the distance from the line. On the plate, ρL = 2000 nC/m, and 1 m away E = 35950 V/m.",
          claims: [{ instance: "ep", readout: "Emag", value: 35950.2, unit: "V/m" }],
        },
        {
          id: "line-falloff", title: "It falls as 1/ρ, not 1/ρ²", patch: { ep: { point: [0.5, 0, 0] } }, focus: ["ep"],
          note: "Halve the distance to 0.5 m and the field doubles, to 71900 V/m. That is 1/ρ, a gentler fall-off than a point charge's 1/R², because the line stretches forever: moving away, you leave only a thin slice of it behind. Gauss's law with a cylinder gave D = ρL/(2πρ); divide by ε₀ and you have this field.",
          claims: [{ instance: "ep", readout: "Emag", value: 71900.4, unit: "V/m" }],
        },
        {
          id: "sheet", title: "An infinite sheet", patch: { q: { items: [{ id: "s", kind: "sheet", rhoS: 3, z0: 0 }] }, ep: { point: [0.4, 0, 1] }, eq: { latex: R`\mathbf E=\dfrac{\rho_S}{2\varepsilon_0}\,\mathbf a_n`, speech: "E equals rho S over two epsilon nought along the normal", shortSpeech: "sheet field" } }, focus: ["q", "ep", "eq"],
          note: "For an infinite flat sheet of charge ρS coulombs per square metre, every sideways component cancels, and the field points straight away from the sheet on both sides: E = ρS/(2ε₀) aₙ. There is no distance in the formula. On the plate, ρS = 3 µC/m² gives 169411 V/m at 1 m above the sheet, and the same at any height.",
          claims: [{ instance: "ep", readout: "Emag", value: 169411, unit: "V/m" }],
        },
        {
          id: "sheet-constant", title: "Distance doesn't matter", patch: { ep: { point: [0.4, 0, 1.8] } }, focus: ["ep"],
          note: "Move the probe higher, to 1.8 m above the sheet. The field doesn't change: still 169411 V/m. Field lines from an infinite sheet stay parallel and never spread out, so nothing weakens them. Below the sheet the field has the same size but points down, away from the sheet. Real sheets are finite, so this holds near the middle and well inside the edges.",
          claims: [{ instance: "ep", readout: "Emag", value: 169411, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "line", level: "basic", title: "A line charge at 1 m and 0.5 m",
          setup: { q: LINE, ep: { point: [1, 0, 0] } },
          givens: [{ value: 0.5, unit: "m" }],
          problem: "An infinite line along z carries ρL = 2000 nC/m. Find |E| at 1 m and at 0.5 m from it.",
          lines: [
            { text: "E = ρL/(2πε₀ρ) = 2 × 10⁻⁶ / (2π × 8.854 × 10⁻¹² × 1) = 35950 V/m, pointing away from the line.", focus: ["ep"], claims: [{ instance: "ep", readout: "Emag", value: 35950.2, unit: "V/m" }] },
            { text: "At half the distance, twice the field: 71900 V/m.", patch: { ep: { point: [0.5, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "Emag", value: 71900.4, unit: "V/m" }] },
          ],
          trap: "Using 4πε₀ρ² as for a point charge. A line's field is ρL/(2πε₀ρ): 2π, and ρ to the first power.",
        },
        {
          id: "sheet-num", level: "tutorial", title: "A sheet at two heights",
          setup: { q: { items: [{ id: "s", kind: "sheet", rhoS: 3, z0: 0 }] }, ep: { point: [0.4, 0, 1] } },
          givens: [{ value: 1.8, unit: "m" }],
          problem: "An infinite sheet at z = 0 carries ρS = 3 µC/m². Find E at 1 m above it and at 1.8 m above it.",
          lines: [
            { text: "E = ρS/(2ε₀) = 3 × 10⁻⁶ / (2 × 8.854 × 10⁻¹²) = 169411 V/m, along +z.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ez", value: 169411, unit: "V/m" }] },
            { text: "At 1.8 m, the same: 169411 V/m. The sheet's field doesn't depend on distance.", patch: { ep: { point: [0.4, 0, 1.8] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "Ez", value: 169411, unit: "V/m" }] },
          ],
          trap: "Dividing by the distance. There is no distance in a sheet's field.",
        },
        {
          id: "mst", level: "exam", title: "MST 2023-24 Q3(b): a sheet at z = 5 m",
          setup: { q: { items: [{ id: "s", kind: "sheet", rhoS: 120, z0: 5 }], drawScale: 0.2 }, ep: { point: [4, 5, 6], drawScale: 0.2 } },
          problem: "An infinite plane at z = 5.00 m in free space carries ρS = 120 µC/m². (i) State the formula relating E, D and ε₀. (ii) Calculate E at P(4, 5, 6) m. (iii) Hence compute D there.",
          lines: [
            { text: "(i) In free space, D = ε₀E.", focus: ["eq"] },
            { text: "(ii) P is above the plane (z = 6 > 5), so the field points along +z: E = ρS/(2ε₀) âz = 120 × 10⁻⁶ / (2 × 8.854 × 10⁻¹²) = 6.776 × 10⁶ âz V/m.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ez", value: 6.77645e6, unit: "V/m" }] },
            { text: "(iii) D = ε₀E = ρS/2 âz = 60 µC/m² âz.", focus: ["ep"], givens: [{ value: 60, unit: "µC/m^2" }] },
          ],
          covers: ["mst-2324-q3b"],
          trap: "Putting the distance from P to the plane into the formula. It doesn't appear; only which side P is on matters, and that sets the sign.",
        },
      ],
      asks: [
        { id: "why-2pi", q: "Why 2π for a line and 4π for a point?", tags: ["LINE_FIELD_FORM"], a: "A point's flux spreads over a sphere, of area 4πR². A line's flux spreads over a cylinder around it, whose side area per metre of length is 2πρ. Gauss's law turns those areas straight into the formulas." },
        { id: "infinite", q: "Real wires aren't infinite. When does this apply?", a: "When you're much closer to the wire than to either end. Then the far parts contribute almost nothing, and the infinite-line formula is an excellent approximation." },
        { id: "sheet-dist", q: "How can a sheet's field not weaken with distance?", tags: ["SHEET_FIELD_DISTANCE"], a: "Move away and each piece of the sheet is farther off, but you 'see' a larger area of the sheet at a useful angle. For an infinite sheet the two effects cancel exactly." },
        { id: "sides", q: "What happens on the other side of a sheet?", a: "The same size, pointing the other way, away from a positive sheet on both sides. Crossing the sheet, E jumps by ρS/ε₀, the first boundary condition you'll meet in dielectrics." },
        { id: "two-sheets", q: "What about two parallel sheets?", a: "With +ρS and −ρS, the fields add between the sheets, giving ρS/ε₀, and cancel outside. That is the ideal parallel-plate capacitor, coming up later in the course." },
        { id: "d-link", q: "How does D relate here?", a: "In free space D = ε₀E. For the sheet, D = ρS/2 on each side, which Gauss's law with a pillbox gave directly, with no ε₀ needed." },
      ],
      checks: [
        {
          id: "form", title: "Check: the line formula", show: ["q", "ep", "eq"], patch: { q: LINE, ep: { point: [1, 0, 0], drawScale: 1 }, eq: { latex: R`\mathbf E=\dfrac{\rho_L}{2\pi\varepsilon_0\rho}\,\mathbf a_\rho`, speech: "line charge field", shortSpeech: "line field" } },
          note: "Four checks on lines and sheets. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "form", type: "choose", prompt: "The field of an infinite line charge ρL at distance ρ is…", dimension: "recognition",
            options: [
              choice("right", "ρL / (2πε₀ρ) aρ", true, "Right: 2π, and 1/ρ."),
              choice("point", "ρL / (4πε₀ρ²) aρ", false, "That's the point-charge form. A line's field falls as 1/ρ.", "LINE_FIELD_FORM"),
              choice("sheet", "ρL / (2ε₀) aρ", false, "That's the sheet form, which has no distance in it."),
            ] },
        },
        {
          id: "line-num", title: "Check: a line charge, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "line-num", type: "numeric", prompt: el.prompt, answer: el.spec.answer, distractors: el.spec.distractors, relTol: el.spec.relTol, hints: el.hints, template: "e-line", dimension: "computational" },
        },
        {
          id: "predict-sheet", title: "Check: move away from the sheet", patch: { q: { items: [{ id: "s", kind: "sheet", rhoS: 3, z0: 0 }] }, ep: { point: [0.4, 0, 0.5] } },
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-sheet", type: "predict-drag", prompt: "The probe rises from 0.5 m to 1.5 m above the sheet. Drag |E| to your prediction.", target: { instance: "ep", readout: "Emag" }, range: [0, 400000], unit: "V/m", relTol: 0.05, reveal: { ep: { point: [0.4, 0, 1.5] } }, dimension: "conceptual", tag: "SHEET_FIELD_DISTANCE",
            feedback: { close: "Right: unchanged, 169411 V/m.", far: "An infinite sheet's field doesn't depend on distance: still 169411 V/m." } },
        },
        {
          id: "mst-e", title: "Check: MST Q3(b)(ii)",
          note: "Last one.",
          interaction: { id: "mst-e", type: "numeric", prompt: "An infinite plane at z = 5 m carries ρS = 120 µC/m². Find E_z at P(4, 5, 6) m, in V/m.", answer: { value: 6.776e6, unit: "V/m" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 1.355e7, unit: "V/m", errorClass: "conceptual", feedback: "That's ρS/ε₀. A single sheet gives ρS/(2ε₀)." }],
            hints: ["E = ρS/(2ε₀) on either side.", "P is above the plane, so +âz.", "120 × 10⁻⁶ / (2 × 8.854 × 10⁻¹²)."] },
          covers: ["mst-2324-q3b"],
        },
      ],
      recap: {
        points: [
          "Infinite line: E = ρL/(2πε₀ρ) aρ, falling as 1/ρ.",
          "Infinite sheet: E = ρS/(2ε₀) aₙ, pointing away on both sides with no distance dependence.",
          "Both come from symmetry, the same way Gauss's law gave D.",
          "In free space D = ε₀E: for a sheet, D = ρS/2.",
        ],
        traps: ["Using the point-charge form for a line.", "4π instead of 2π for a line.", "Putting a distance into the sheet formula."],
      },
    },
  ],
});
