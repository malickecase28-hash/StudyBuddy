import { EPS0 } from "./constants";

/** C = εS/d. */
export const capParallel = (area: number, d: number, er = 1) => (er * EPS0 * area) / d;
/** C = 2πεL/ln(b/a). */
export const capCoax = (a: number, b: number, length: number, er = 1) => (2 * Math.PI * er * EPS0 * length) / Math.log(b / a);
/** C = 4πε/(1/a − 1/b); b = Infinity gives an isolated sphere, 4πεa. */
export const capSphere = (a: number, b: number, er = 1) => (4 * Math.PI * er * EPS0) / (1 / a - 1 / b);
