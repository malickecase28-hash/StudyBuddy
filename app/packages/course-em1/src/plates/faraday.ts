import { PlateDef } from "@forma/plate";

export const faraday = PlateDef.parse({
  id: "faraday",
  title: "Faraday's spheres",
  instances: [{ id: "spheres", component: "faraday-spheres", params: { innerQ: 2, material: "Air", revealed: false } }],
  steps: [
    {
      id: "setup",
      title: "One charge, four materials",
      show: ["spheres"],
      focus: ["spheres"],
      note: "1837: Faraday hung a charged ball, +Q, inside a hollow metal sphere and measured the charge that appeared on the outside. Then he packed glass, sulphur and shellac between the two.",
      interaction: {
        id: "faraday-predict",
        type: "choose",
        prompt: "With glass packed between the spheres, the outer sphere shows…",
        options: [
          { id: "same", label: "Exactly +Q", correct: true, feedback: "Yes: the same in every material." },
          { id: "less", label: "Less than +Q: glass soaks some up", correct: false, feedback: "The material changes E, not the flux.", tag: "D_VS_E_PERMITTIVITY" },
          { id: "more", label: "More than +Q", correct: false, feedback: "Nothing is created in between." },
        ],
        dimension: "conceptual",
      },
    },
    {
      id: "reveal",
      title: "Always +Q",
      patch: { spheres: { material: "Glass", revealed: true } },
      focus: ["spheres"],
      note: "Always +Q. Something passes from the inner charge to the outer sphere and ignores the material in between. We call it electric flux, and in SI units Ψ = Q.",
      claims: [{ instance: "spheres", readout: "outerQ", value: 2, unit: "µC" }],
      why: "The measured outer charge never depended on the dielectric. Only the field strength inside the material does, through E = D/ε.",
    },
  ],
});
