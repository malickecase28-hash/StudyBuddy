const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

export const clamp01 = (x: number) => (Number.isNaN(x) ? 0 : Math.min(1, Math.max(0, x)));
export const clone = <T>(x: T): T => structuredClone(x);
export const deepEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** True when a and b have the same shape and differ only in numeric leaves (equal non-numeric leaves are fine). */
export function isLerpable(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => isLerpable(x, b[i]));
  if (isObj(a) && isObj(b)) {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    return ka.join("\u0000") === kb.join("\u0000") && ka.every((k) => isLerpable(a[k], b[k]));
  }
  return deepEqual(a, b);
}

/** Interpolate numeric leaves; anything else switches from a to b at t = 0.5. */
export function lerpValue(a: unknown, b: unknown, t: number): unknown {
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * t;
  if (isLerpable(a, b)) {
    if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => lerpValue(x, b[i], t));
    if (isObj(a) && isObj(b)) return Object.fromEntries(Object.keys(a).map((k) => [k, lerpValue(a[k], b[k], t)]));
  }
  return t < 0.5 ? a : b;
}
