export type Quantity = { value: number; dim: string };

/** Base units and the canonical dimension they map to. */
const BASE: Record<string, string> = {
  "": "1",
  Hz: "Hz",
  "°": "°",
  C: "C",
  m: "m",
  "m^2": "m^2",
  "m^3": "m^3",
  "C/m": "C/m",
  "C/m^2": "C/m^2",
  "C/m^3": "C/m^3",
  "V/m": "V/m",
  "N/C": "V/m",
  V: "V",
  N: "N",
  "F/m": "F/m",
  F: "F",
};

const PREFIX: Record<string, number> = { p: 1e-12, n: 1e-9, "µ": 1e-6, u: 1e-6, m: 1e-3, c: 1e-2, k: 1e3, M: 1e6, G: 1e9, T: 1e12 };

function normalizeUnit(u: string): string {
  return u.replace(/\s+/g, "").replace(/²/g, "^2").replace(/³/g, "^3").replace(/μ/g, "µ");
}

/** Resolve a unit string to [SI factor, canonical dimension], or null. */
function resolveUnit(raw: string): [number, string] | null {
  const u = normalizeUnit(raw);
  if (u === "in" || u === "inch") return [0.0254, "m"];
  const exact = BASE[u];
  if (exact !== undefined) return [1, exact];
  const prefix = PREFIX[u[0] ?? ""];
  const rest = u.slice(1);
  const dim = BASE[rest];
  if (prefix === undefined || dim === undefined || rest === "") return null;
  // A prefix binds to the first symbol and takes its exponent: cm^2 = (1e-2 m)^2.
  const exp = /^m\^(\d)/.exec(rest);
  return [exp ? prefix ** Number(exp[1]) : prefix, dim];
}

const NUMBER = /^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)\s*(?:[x×*]\s*10\s*\^\s*([-+]?\d+))?\s*(.*)$/i;

export function parseQuantity(input: string): Quantity | null {
  const m = NUMBER.exec(input.trim());
  if (!m) return null;
  const unit = resolveUnit(m[3] ?? "");
  if (!unit) return null;
  const mantissa = Number(m[1]);
  const power = m[2] ? 10 ** Number(m[2]) : 1;
  return { value: mantissa * power * unit[0], dim: unit[1] };
}

export function toSI(value: number, unit: string): Quantity {
  const r = resolveUnit(unit);
  if (!r) throw new Error(`Unknown unit: ${unit}`);
  return { value: value * r[0], dim: r[1] };
}
