import { functions1d } from "@forma/physics";

type More = { probe?: number; tangent?: boolean; area?: [number, number]; rects?: number };

/** A complete graph-1d param set: every step sets all of them, so no step inherits a stale probe or area. */
export const graphParams = (fn: string, x: [number, number], y: [number, number], m: More = {}) => ({
  fn, x, y, probe: m.probe ?? null, tangent: m.tangent ?? false, area: m.area ?? null, rects: m.rects ?? 0, label: functions1d[fn]!.label,
});
/** A step patch for the plate's one graph, instance "g". */
export const graph = (fn: string, x: [number, number], y: [number, number], m: More = {}) => ({ g: graphParams(fn, x, y, m) });
export const graphInstance = (fn: string, x: [number, number], y: [number, number], m: More = {}) => ({ id: "g", component: "graph-1d", params: graphParams(fn, x, y, m) });

export const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
export const slope = (value: number) => ({ instance: "g", readout: "gslope", value, unit: "" });
export const area = (value: number) => ({ instance: "g", readout: "garea", value, unit: "" });
export const valueAt = (value: number) => ({ instance: "g", readout: "gfx", value, unit: "" });
export const stripSum = (value: number) => ({ instance: "g", readout: "gsum", value, unit: "" });