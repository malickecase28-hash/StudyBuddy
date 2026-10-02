/**
 * Maths written as plain text in course prose, turned into proper typography:
 *   Q_enc, E_z, a_{x}      → subscripts
 *   m^2, e^(−αz), 10^{-9}  → superscripts
 *   ax, ay, aρ, aR (unit vectors, standing alone) → bold a with a subscript
 *   ρv, ρS, εr, εr1, μ0, χm, η0, θi → Greek with a subscript
 *   D1, E2, H1n, V0, qA, Q3 (not exam labels like "Q2(b)" or drills like "D7.2") → subscripts
 * Applied to the text between Markup's own tokens, so $…$ LaTeX is never touched.
 */
export type ProseToken =
  | { kind: "text"; s: string }
  | { kind: "sub" | "sup"; base: string; s: string }
  | { kind: "uv"; s: string };

const GREEK_SUB: Record<string, string> = { ρ: "vSLs", ε: "r0123R", μ: "r0123", χ: "me", η: "0", θ: "η12irt" };

const RULES: { re: RegExp; make: (m: RegExpExecArray) => ProseToken }[] = [
  // base^exponent: the exponent is (…), {…}, or a signed run of letters, digits and dots.
  { re: /([A-Za-z0-9)\]²³₀-₉ₐ-ₜ])\^(\([^)]*\)|\{[^}]*\}|[−-]?[A-Za-z0-9.]+)/y, make: (m) => ({ kind: "sup", base: m[1]!, s: strip(m[2]!) }) },
  // base_subscript.
  { re: /([A-Za-zΑ-Ωα-ω∂])_(\{[^}]*\}|[A-Za-z0-9]+)/y, make: (m) => ({ kind: "sub", base: m[1]!, s: strip(m[2]!) }) },
];

const strip = (s: string) => (s.startsWith("(") && s.endsWith(")")) || (s.startsWith("{") && s.endsWith("}")) ? s.slice(1, -1) : s;
const isWordChar = (c: string | undefined) => !!c && /[A-Za-z0-9]/.test(c);

export function proseMath(text: string): ProseToken[] {
  if (!/[_^]|a[xyzρφθrR]|[ρεμχηθ][A-Za-z0-9η]|[A-Z][0-9]|q[A-Z0-9]/.test(text)) return [{ kind: "text", s: text }];
  const out: ProseToken[] = [];
  let buf = "";
  const push = (t: ProseToken) => { if (buf) { out.push({ kind: "text", s: buf }); buf = ""; } out.push(t); };
  let i = 0;
  outer: while (i < text.length) {
    // The base character of ^ and _ rules is consumed by the match, so test at the position before the operator.
    for (const r of RULES) {
      r.re.lastIndex = i;
      const m = r.re.exec(text);
      if (m) {
        push(r.make(m));
        i += m[0].length;
        continue outer;
      }
    }
    const c = text[i]!, prev = text[i - 1], next = text[i + 1], after = text[i + 2];
    // Unit vector: "a" + axis, standing alone ("ax + 3ay", "aφ"), not inside a word.
    if (c === "a" && next && "xyzρφθrR".includes(next) && !/[A-Za-z]/.test(prev ?? "") && !/[A-Za-zα-ω]/.test(after ?? "") && (prev === undefined || /[\s(\[=+−\-·×/,\d]/.test(prev))) {
      if (next !== "r" || /[\s(=+−\-·×]|\d/.test(prev ?? " ")) { push({ kind: "uv", s: next }); i += 2; continue; }
    }
    // Greek with a subscript: ρv, εr1, μ0, χm, θi.
    if (GREEK_SUB[c] && next && GREEK_SUB[c]!.includes(next) && !/[A-Za-z]/.test(prev ?? "")) {
      let s = next, j = i + 2;
      if (c === "ε" && next === "r" && /\d/.test(text[j] ?? "")) s += text[j++];
      if (!isWordChar(text[j]) && text[j] !== "(") { push({ kind: "sub", base: c, s }); i = j; continue; }
    }
    // Capital + index: D1, E2, H1n, V0, Q3 — not "Q2(b)", "D7.2", "P4.9", "HW03".
    if (/[DEHBJMVFAKRQL]/.test(c) && !isWordChar(prev) && prev !== ".") {
      const m = /^(\d{1,2}[nt]?)/.exec(text.slice(i + 1));
      if (m) {
        const j = i + 1 + m[1]!.length, nx = text[j];
        if (!isWordChar(nx) && nx !== "(" && !(nx === "." && /\d/.test(text[j + 1] ?? ""))) { push({ kind: "sub", base: c, s: m[1]! }); i = j; continue; }
      }
    }
    // Lower-case q with a label: qA, q1.
    if (c === "q" && next && /[A-Z0-9]/.test(next) && !isWordChar(prev) && !isWordChar(after)) { push({ kind: "sub", base: "q", s: next }); i += 2; continue; }
    buf += c;
    i++;
  }
  if (buf) out.push({ kind: "text", s: buf });
  return out;
}
