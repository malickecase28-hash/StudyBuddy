import { PlateDef } from "@forma/plate";

const point = (q: number, pos: [number, number, number], draggable = false) => ({ id: `q${q}${pos.join("")}`, kind: "point" as const, q, pos, draggable });
const base = (items: unknown[], surface: Record<string, unknown>) => [
  { id: "q", component: "charges", params: { items }, visible: true },
  { id: "field", component: "field-arrows", params: { grid: 5 }, links: { charges: "q" }, visible: true },
  { id: "surface", component: "gaussian-surface", params: { shading: true, ...surface }, links: { charges: "q" }, visible: true },
];

export const whyArea = PlateDef.parse({
  id: "why-area-plate",
  title: "Why a bigger surface doesn't catch more flux",
  instances: base([point(4, [0, 0, 0])], { shape: "sphere", size: 1 }),
  steps: [
    { id: "small", title: "r = 1 m", focus: ["surface"], note: "At r = 1 m, D is 4/(4π) µC/m² over 4π m² of surface: 4 µC in total.", claims: [{ instance: "surface", readout: "flux", value: 4, unit: "µC" }] },
    { id: "big", title: "r = 2.5 m", patch: { surface: { size: 2.5 } }, focus: ["surface"], note: "The patches pale as D weakens, but there are more of them. Still exactly 4 µC.", claims: [{ instance: "surface", readout: "flux", value: 4, unit: "µC" }] },
  ],
});

export const outsideCharge = PlateDef.parse({
  id: "outside-charge-plate",
  title: "Charges outside the surface",
  instances: base([point(1, [0, 0, 0]), point(4, [0.3, 0, 0.3], true)], { shape: "cube", size: 2 }),
  steps: [
    { id: "inside", title: "Both inside", focus: ["q"], note: "Both charges are inside: Ψ = 5 µC.", claims: [{ instance: "surface", readout: "flux", value: 5, unit: "µC" }] },
    {
      id: "drag",
      title: "Drag one out",
      focus: ["surface"],
      note: "Drag the +4 µC charge out of the cube. Ochre patches (inflow) and blue patches (outflow) balance exactly.",
      interaction: { id: "drag-out-detour", type: "manipulate-goal", goal: "Move the +4 µC charge outside the cube.", check: "outside-zero", dimension: "conceptual" },
    },
  ],
});

export const normalDirection = PlateDef.parse({
  id: "normal-direction-plate",
  title: "Which way dS points",
  instances: base([point(-3, [0, 0, 0])], { shape: "sphere", size: 1, showNormals: true }),
  steps: [
    {
      id: "negative",
      title: "A negative charge",
      focus: ["surface"],
      note: "D points inward everywhere, but every normal still points outward. Each patch is inflow, so Ψ = −3 µC.",
      claims: [{ instance: "surface", readout: "flux", value: -3, unit: "µC" }],
    },
    {
      id: "check",
      title: "Check",
      focus: ["surface"],
      note: "On a patch where D points into the closed surface, what sign does D·dS have?",
      interaction: {
        id: "sign",
        type: "choose",
        prompt: "D·dS on an inflow patch is…",
        options: [
          { id: "neg", label: "Negative", correct: true, feedback: "Right: D is against the outward normal." },
          { id: "pos", label: "Positive, because dS follows D", correct: false, feedback: "dS never follows D; it is always outward.", tag: "SURFACE_NORMAL_DIRECTION" },
        ],
        dimension: "recognition",
      },
    },
  ],
});

export const dVsE = PlateDef.parse({
  id: "d-vs-e-plate",
  title: "D versus E in a material",
  instances: [
    { id: "q", component: "charges", params: { items: [point(2, [0, 0, 0])] }, visible: true },
    { id: "field", component: "field-arrows", params: { grid: 5, probe: 1, epsR: 1 }, links: { charges: "q" }, visible: true },
  ],
  steps: [
    {
      id: "vacuum",
      title: "Free space",
      focus: ["field"],
      note: "At 1 m from a 2 µC charge in free space, D = 0.159 µC/m².",
      claims: [{ instance: "field", readout: "probeD", value: 0.159155, unit: "µC/m^2" }],
    },
    {
      id: "oil",
      title: "In oil (ε_r = 4)",
      patch: { field: { epsR: 4 } },
      focus: ["field"],
      note: "Put the charge in a material with ε_r = 4. D stays 0.159 µC/m², set by free charge alone. E drops to a quarter.",
      claims: [
        { instance: "field", readout: "probeD", value: 0.159155, unit: "µC/m^2" },
        { instance: "field", readout: "probeE", value: 4493.8, unit: "V/m" },
      ],
    },
  ],
});

export const symmetry = PlateDef.parse({
  id: "symmetry-plate",
  title: "When Gauss's law finds D",
  instances: base([point(2, [0.4, 0.2, 0], true)], { shape: "blob", size: 1 }),
  steps: [
    {
      id: "lumpy",
      title: "Lumpy surface",
      focus: ["surface"],
      note: "Off-centre charge, lumpy surface: every patch differs, yet the total is exactly 2 µC. The law holds, but there's no single D to pull out of the integral.",
      claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
    },
    {
      id: "symmetric",
      title: "Symmetric surface",
      patch: { surface: { shape: "sphere", size: 1 }, q: { items: [point(2, [0, 0, 0])] } },
      focus: ["surface"],
      note: "A sphere centred on the charge: |D| is the same on every patch and normal to it. Now D × area = Q gives D in one line.",
      claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
    },
  ],
});
