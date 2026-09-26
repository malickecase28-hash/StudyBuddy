import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const patch = instantiate(templates.find((t) => t.id === "sph-patch-area")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaElements = defineIdeaPlate({
  id: "idea-elements",
  title: "dl, dS and dv",
  requires: { objectives: [4], items: ["mst-2324-q3a", "hw-2324-2.5", "mst-2324-q4b"], misconceptions: ["ELEMENT_SCALE_FACTOR"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.6 } },
    { id: "region", component: "coord-region", params: { system: "cart", ranges: [[0, 1], [0, 1], [0, 1]], face: 2 } },
    { id: "eq", component: "equation", params: eqp(R`d\mathbf l=dx\,\mathbf a_x+dy\,\mathbf a_y+dz\,\mathbf a_z,\quad dv=dx\,dy\,dz`, "the cartesian elements") },
  ],
  ideas: [
    {
      id: "elements",
      title: "dl, dS and dv",
      objectives: [4],
      explain: [
        {
          id: "cart", title: "dl, dS and dv in cartesian", show: ["axes", "region", "eq"], focus: ["region"],
          note: "Integrals over lines, surfaces and volumes add up small pieces. In cartesian coordinates every piece is a tiny box: a length element dl = dx âₓ + dy âᵧ + dz âz, a surface element such as dS = dx dy âz on a face of constant z, and a volume element dv = dx dy dz. The plate's unit cube has a top face of 1 m² and a volume of 1 m³. Add up enough tiny boxes and you get exactly that.",
          claims: [{ instance: "region", readout: "area", value: 1, unit: "m^2" }, { instance: "region", readout: "volume", value: 1, unit: "m^3" }],
        },
        {
          id: "cyl", title: "Cylindrical: ρ dφ is a length", patch: { region: { system: "cyl", ranges: [[1, 2], [0, 90], [0, 1.5]], face: 0 }, eq: eqp(R`d\mathbf l=d\rho\,\mathbf a_\rho+\rho\,d\phi\,\mathbf a_\phi+dz\,\mathbf a_z,\quad dv=\rho\,d\rho\,d\phi\,dz`, "the cylindrical elements") }, focus: ["region", "eq"],
          note: "In cylindrical coordinates a step in φ is an angle, not a length. The length it sweeps is ρ dφ: a bigger radius makes a longer arc for the same angle. So dl = dρ âρ + ρ dφ âφ + dz âz; the side of a cylinder has dS = ρ dφ dz âρ; and dv = ρ dρ dφ dz. The plate's region (ρ from 1 to 2 m, a quarter turn, 1.5 m tall) has an outer side of 4.712 m² and a volume of 3.534 m³.",
          claims: [{ instance: "region", readout: "area", value: 4.71239, unit: "m^2" }, { instance: "region", readout: "volume", value: 3.53429, unit: "m^3" }],
        },
        {
          id: "sph", title: "Spherical: r² sin θ", patch: { region: { system: "sph", ranges: [[0, 1.5], [0, 60], [30, 75]], face: 0 }, eq: eqp(R`d\mathbf S=r^2\sin\theta\,d\theta\,d\phi\,\mathbf a_r,\quad dv=r^2\sin\theta\,dr\,d\theta\,d\phi`, "the spherical elements") }, focus: ["region", "eq"],
          note: "In spherical coordinates both angles need scale factors. A step dθ sweeps a length r dθ; a step dφ sweeps r sin θ dφ, because the circle of constant θ has radius r sin θ. Hence dS = r² sin θ dθ dφ âr on a sphere, and dv = r² sin θ dr dθ dφ. The plate's patch (r = 1.5 m, θ from 0° to 60°, φ from 30° to 75°) has area r²(cos 0° − cos 60°)(π/4) = 0.8836 m².",
          claims: [{ instance: "region", readout: "area", value: 0.883573, unit: "m^2" }],
        },
        {
          id: "why", title: "Why the scale factors matter", patch: { region: { system: "sph", ranges: [[2, 2.1], [30, 31], [0, 1]], face: null, drawScale: 0.6 } }, focus: ["region"],
          note: "The scale factors are exactly what gets forgotten in gradients, divergences and integrals. Take a tiny spherical element at r = 2 m and θ = 30°, with dr = 0.1 m and dθ = dφ = 1°. Its three edges are dr = 0.1 m, r dθ = 0.03491 m and r sin θ dφ = 0.01745 m. The same one-degree step gives edges that differ by a factor of two, because sin 30° = 0.5. Leave out r or sin θ and your answer is off by that factor.",
          claims: [{ instance: "region", readout: "len1", value: 0.1, unit: "m" }, { instance: "region", readout: "len2", value: 0.0349066, unit: "m" }, { instance: "region", readout: "len3", value: 0.0174533, unit: "m" }],
        },
      ],
      examples: [
        {
          id: "mst-patch", level: "basic", title: "MST Q3(a): the area of a spherical patch",
          setup: { region: { system: "sph", ranges: [[0, 0.25], [0, 60], [30, 45]], face: 0, drawScale: 4 } },
          problem: "Find the area of the part of the sphere r = 25.0 cm bounded by 0 < θ < π/3 and π/6 < φ < π/4.",
          lines: [
            { text: "On a sphere of radius r, dS = r² sin θ dθ dφ, with r = 0.25 m.", focus: ["region"] },
            { text: "Integrate: S = r² ∫ sin θ dθ ∫ dφ = r²(1 − cos 60°)(π/12).", latex: R`S=r^2\int_0^{\pi/3}\sin\theta\,d\theta\int_{\pi/6}^{\pi/4}d\phi=r^2(1-\cos60^\circ)\tfrac{\pi}{12}`, focus: ["region"] },
            { text: "S = 0.0625 × 0.5 × 0.2618 = 0.008181 m².", focus: ["region"], claims: [{ instance: "region", readout: "area", value: 0.00818123, unit: "m^2" }] },
            { text: "The whole sphere is 4πr² = 0.7854 m², so this patch is 1/96 of it. That fraction is what the flux question needs: Ψ = 100 µC ÷ 96 = 1.042 µC.", focus: ["region"], givens: [{ value: 4 * Math.PI * 0.0625, unit: "m^2" }, { value: 100, unit: "µC" }, { value: 100 / 96, unit: "µC" }] },
          ],
          covers: ["mst-2324-q3a"],
          trap: "Using dS = dθ dφ, with no r² sin θ, gives an area in radians squared. The scale factors turn angles into lengths.",
        },
        {
          id: "cyl-side", level: "tutorial", title: "HW02 2.5(b): the side of a cylinder",
          setup: { region: { system: "cyl", ranges: [[0, 4], [0, 360], [0, 7]], face: 0, drawScale: 0.25 } },
          problem: "Find the area of the cylindrical surface ρ = 4 m, 0 < z < 7 m. (HW02 then puts a charge density on it.)",
          lines: [
            { text: "On the side ρ = 4 m, dS = ρ dφ dz.", focus: ["region"] },
            { text: "S = ∫∫ 4 dφ dz over a full turn and 0 to 7 = 4 × 2π × 7 = 175.9 m².", latex: R`S=\int_0^{2\pi}\!\!\int_0^{7}4\,d\phi\,dz=56\pi`, focus: ["region"], claims: [{ instance: "region", readout: "area", value: 175.929, unit: "m^2" }] },
            { text: "With a charge density ρS on it, the same element gives Q = ∫ρS dS. HW02 2.5(b) and the Gauss applications lesson finish that.", focus: ["region"] },
          ],
          covers: ["hw-2324-2.5"],
          trap: "Writing dS = dφ dz forgets the ρ. The answer would be 44 instead of 175.9: four times too small.",
        },
        {
          id: "mst-vol", level: "exam", title: "MST Q4(b): the region's volume, then its charge",
          setup: { region: { system: "cyl", ranges: [[0, 0.2], [0, 180], [-4, -2]], face: null, drawScale: 0.45 } },
          problem: "MST Q4(b) integrates ρv = ρ² sin φ µC/m³ over 0 ≤ ρ ≤ 0.2 m, 0 ≤ φ ≤ π and −4 ≤ z ≤ −2 m. Set up dv, find the region's volume, then the charge.",
          lines: [
            { text: "In cylindrical coordinates dv = ρ dρ dφ dz: the extra ρ is the scale factor on dφ.", focus: ["region"] },
            { text: "Volume: ∫ρ dρ ∫dφ ∫dz = (0.02)(π)(2) = 0.1257 m³.", latex: R`V=\int_0^{0.2}\rho\,d\rho\int_0^{\pi}d\phi\int_{-4}^{-2}dz=(0.02)(\pi)(2)`, focus: ["region"], claims: [{ instance: "region", readout: "volume", value: 0.125664, unit: "m^3" }] },
            { text: "Charge: Q = ∫ρ² sin φ · ρ dρ dφ dz = [ρ⁴/4] [−cos φ] [z] = (0.0004)(2)(2) = 0.0016 µC = 1.6 nC.", latex: R`Q=\left[\tfrac{\rho^4}{4}\right]_0^{0.2}\left[-\cos\phi\right]_0^{\pi}\left[z\right]_{-4}^{-2}=0.0016\ \mu\text{C}`, focus: ["region"], givens: [{ value: 0.0016, unit: "µC" }, { value: 1.6, unit: "nC" }] },
          ],
          covers: ["mst-2324-q4b"],
          trap: "Forgetting the ρ in dv gives ∫ρ² dρ instead of ∫ρ³ dρ: 0.0027 instead of 0.0004, and a charge 6.7 times too big.",
        },
      ],
      asks: [
        { id: "why-rdtheta", q: "Why is it r dθ and not just dθ?", a: "An angle is not a length. An arc of angle dθ on a circle of radius r has length r dθ, with dθ in radians. The scale factor converts the angle step into metres." },
        { id: "sin-theta", q: "Where does the sin θ come from?", tags: ["ELEMENT_SCALE_FACTOR"], a: "Circles of constant θ shrink toward the poles: their radius is r sin θ. A step dφ around such a circle sweeps r sin θ dφ. At the equator sin θ = 1; at the pole it is 0." },
        { id: "direction", q: "Why does dS have a direction?", a: "Flux needs to know which way a surface faces. dS points along the surface normal: âr on a sphere, âρ on a cylinder's side, and ±âz on a flat top. Its size is the area of the patch." },
        { id: "radians", q: "Degrees or radians in the integral?", a: "Radians, always. ρ dφ is a length only when dφ is in radians. Convert the limits before integrating: 30° is π/6." },
        { id: "which", q: "How do I know which dS to use?", a: "Hold one coordinate constant: that defines the surface, and dS is the product of the other two edges. Sphere, r constant: (r dθ)(r sin θ dφ). Cylinder side, ρ constant: (ρ dφ)(dz). Flat top, z constant: (dρ)(ρ dφ)." },
        { id: "check", q: "How can I check a volume element?", a: "Integrate it over a shape you know. dv = r² sin θ dr dθ dφ over a whole ball gives 4πR³/3. If a known volume doesn't come out, a scale factor is missing." },
      ],
      checks: [
        {
          id: "ds", title: "Check: the sphere's element", show: ["axes", "region"], hide: ["eq"], patch: { region: { system: "sph", ranges: [[0, 1.5], [0, 60], [30, 75]], face: 0, drawScale: 0.5 } },
          note: "Four checks on elements. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "ds", type: "choose", prompt: "On a sphere of radius r, the surface element is…", dimension: "recognition",
            options: [
              choice("right", "r² sin θ dθ dφ", true, "Right: (r dθ)(r sin θ dφ)."),
              choice("bare", "dθ dφ", false, "Angles aren't lengths. Multiply by the scale factors r and r sin θ.", "ELEMENT_SCALE_FACTOR"),
              choice("half", "r dθ dφ", false, "That misses a factor of r sin θ from the φ edge.", "ELEMENT_SCALE_FACTOR"),
            ] },
        },
        {
          id: "predict-area", title: "Check: double the radius",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-area", type: "predict-drag", prompt: "The patch's radius doubles from 1.5 m to 3 m, with the same angles. Drag the area to your prediction.", target: { instance: "region", readout: "area" }, range: [0, 5], unit: "m^2", relTol: 0.05, reveal: { region: { ranges: [[0, 3], [0, 60], [30, 75]] } }, dimension: "conceptual",
            feedback: { close: "Right: four times as much, 3.534 m².", far: "Area goes as r²: double r and the area quadruples, to 3.534 m²." } },
        },
        {
          id: "patch-num", title: "Check: a patch, your numbers",
          note: "A patch of your own, like MST Q3(a).",
          interaction: { id: "patch-num", type: "numeric", prompt: patch.prompt, answer: patch.spec.answer, distractors: patch.spec.distractors, relTol: patch.spec.relTol, hints: patch.hints, template: "sph-patch-area", dimension: "computational" },
          covers: ["mst-2324-q3a"],
        },
        {
          id: "dv", title: "Check: the cylindrical volume element",
          note: "Last one.",
          interaction: { id: "dv", type: "choose", prompt: "In cylindrical coordinates, dv =", dimension: "recognition",
            options: [
              choice("right", "ρ dρ dφ dz", true, "Right: the edges are dρ, ρ dφ and dz."),
              choice("bare", "dρ dφ dz", false, "The φ edge is ρ dφ, not dφ.", "ELEMENT_SCALE_FACTOR"),
              choice("sq", "ρ² dρ dφ dz", false, "Only one edge carries ρ."),
            ] },
          covers: ["mst-2324-q4b"],
        },
      ],
      recap: {
        points: [
          "Cartesian: dl = dx âₓ + dy âᵧ + dz âz; dv = dx dy dz.",
          "Cylindrical: edges dρ, ρ dφ, dz; side dS = ρ dφ dz; dv = ρ dρ dφ dz.",
          "Spherical: edges dr, r dθ, r sin θ dφ; sphere dS = r² sin θ dθ dφ; dv = r² sin θ dr dθ dφ.",
          "Pick dS by holding one coordinate constant; always integrate angles in radians.",
        ],
        traps: ["Dropping ρ, r or sin θ.", "Integrating with degrees.", "Using a cube's element on a curved surface."],
      },
    },
  ],
});
