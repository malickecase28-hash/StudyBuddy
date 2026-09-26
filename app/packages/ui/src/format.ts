const SUP: Record<string, string> = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };

/** Instrument-style number: `digits` significant figures, scientific (×10ⁿ) outside [1e-3, 1e5). */
export function formatValue(v: number | null, digits = 4): string {
  if (v === null || !Number.isFinite(v)) return "—";
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e-3 && a < 1e5) return String(Number(v.toPrecision(digits)));
  const [m, e] = v.toExponential(digits - 1).split("e") as [string, string];
  return `${m}×10${String(Number(e)).replace(/./g, (c) => SUP[c] ?? c)}`;
}
