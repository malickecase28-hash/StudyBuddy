import { PlateDef } from "@forma/plate";

export type Control = { instance: string; param: string; label: string } & (
  | { kind: "slider"; min: number; max: number; step: number; unit: string }
  | { kind: "segmented"; options: [string, string][] }
);
export type Experiment = { id: string; title: string; goal: string; check: string };
export type Lab = { plate: PlateDef; controls: Control[]; experiments: Experiment[] };

const gaussLab: Lab = {
  plate: PlateDef.parse({
    id: "gauss-lab",
    title: "Gauss lab",
    instances: [
      {
        id: "q",
        component: "charges",
        params: { items: [{ id: "q1", kind: "point", q: 2, pos: [0, 0, 0] }, { id: "q2", kind: "point", q: -1, pos: [0.6, 0, 0.4], draggable: true }] },
        visible: true,
      },
      { id: "field", component: "field-arrows", params: { grid: 7 }, links: { charges: "q" }, visible: true },
      { id: "surface", component: "gaussian-surface", params: { shape: "sphere", size: 1.2, shading: true }, links: { charges: "q" }, visible: true },
      { id: "axes", component: "axes", params: {}, visible: true },
    ],
    steps: [{ id: "free", title: "Free exploration", focus: ["surface"], note: "Change anything you like. Ψ always equals the charge inside the surface." }],
  }),
  controls: [
    { instance: "surface", param: "size", label: "Surface size", kind: "slider", min: 0.3, max: 2.2, step: 0.05, unit: "m" },
    { instance: "surface", param: "shape", label: "Shape", kind: "segmented", options: [["sphere", "Sphere"], ["cube", "Cube"], ["blob", "Lumpy"], ["cylinder", "Cylinder"]] },
  ],
  experiments: [
    { id: "resize", title: "Resize it", goal: "Change the surface size by at least 40% and watch Ψ.", check: "resize-constant" },
    { id: "reshape", title: "Reshape it", goal: "Swap to another shape with the charge still inside.", check: "shape-swap" },
    { id: "outside", title: "Move one out", goal: "Drag the −1 µC charge outside the surface.", check: "outside-zero" },
  ],
};

export const labs: Record<string, Lab> = { "em1.electrostatics.gauss-law": gaussLab };
