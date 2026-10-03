import { all, create, type EvalFunction, type MathNode } from "mathjs";

/** One mathjs instance with the course's constants. Input is plain typed maths ("2*pi*eps0", "x^2 + y^2"). */
export const math = create(all!, { number: "number", precision: 64 });

/** Constants by the names students type. μ0 is the course's 4π × 10⁻⁷ H/m. */
export const CONSTANTS: Record<string, { value: number; note: string }> = {
  eps0: { value: 8.8541878128e-12, note: "ε₀, F/m" },
  mu0: { value: 4 * Math.PI * 1e-7, note: "μ₀, H/m" },
  k: { value: 8.9875517923e9, note: "1/(4πε₀), N·m²/C²" },
  c0: { value: 299792458, note: "speed of light, m/s" },
  qe: { value: 1.602176634e-19, note: "elementary charge, C" },
  eta0: { value: 376.730313, note: "η₀ = √(μ₀/ε₀), Ω" },
};

/** Typed symbols to mathjs: Greek letters, ×, ·, −, superscripts, √. */
export function normalize(src: string): string {
  return src
    .replace(/ε₀|ε0|epsilon0/g, "eps0").replace(/μ₀|µ₀|μ0|µ0/g, "mu0").replace(/η₀|η0/g, "eta0")
    .replace(/ρ/g, "rho").replace(/[φϕ]/g, "phi").replace(/θ/g, "theta").replace(/π/g, "pi").replace(/ε/g, "epsilon").replace(/[μµ]/g, "mu")
    .replace(/[×·]/g, "*").replace(/[−–]/g, "-").replace(/÷/g, "/").replace(/√/g, "sqrt")
    .replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁻¹/g, "^(-1)");
}

/** Radians or degrees for trig on plain numbers. Angles with units ("30 deg", "1 rad") are exact either way. */
export type AngleMode = "rad" | "deg";
const D = Math.PI / 180;
const DEG_TRIG: Record<string, (x: unknown) => unknown> = {
  ...Object.fromEntries(["sin", "cos", "tan", "sec", "csc", "cot"].map((f) => [f, (x: unknown) => (typeof x === "number" ? (math as unknown as Record<string, (n: number) => number>)[f]!(x * D) : (math as unknown as Record<string, (u: unknown) => unknown>)[f]!(x))])),
  ...Object.fromEntries(["asin", "acos", "atan", "asec", "acsc", "acot"].map((f) => [f, (x: unknown) => { const r = (math as unknown as Record<string, (u: unknown) => unknown>)[f]!(x); return typeof r === "number" ? r / D : r; }])),
  atan2: (y: unknown, x?: unknown) => Math.atan2(Number(y), Number(x)) / D,
} as Record<string, (x: unknown) => unknown>;

/** Constants, plus degree trig in degree mode (mathjs looks functions up in the scope first). */
const scopeBase = (angle: AngleMode = "rad") => ({ ...Object.fromEntries(Object.entries(CONSTANTS).map(([k, v]) => [k, v.value])), ...(angle === "deg" ? DEG_TRIG : {}) }) as Record<string, number>;

export type Line =
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "variable"; name: string; value: number; tex: string }
  | { kind: "curve"; f: EvalFunction; tex: string }
  | { kind: "surface"; f: EvalFunction; tex: string }
  | { kind: "polar"; f: EvalFunction; tex: string }
  | { kind: "parametric"; fx: EvalFunction; fy: EvalFunction; tex: string }
  | { kind: "value"; text: string; tex: string };

const free = (node: MathNode, known: Set<string>) => {
  const out = new Set<string>();
  node.traverse((n, path, parent) => {
    if (n.type === "SymbolNode" && !(parent?.type === "FunctionNode" && path === "fn")) {
      const name = (n as unknown as { name: string }).name;
      if (!known.has(name) && !(name in math) ) out.add(name);
    }
  });
  return out;
};
/** Names students type, typeset the way they're written on paper. */
const TEX_NAMES: Record<string, string> = { eps0: "\\varepsilon_0", mu0: "\\mu_0", eta0: "\\eta_0", c0: "c_0", qe: "q_e", rho: "\\rho", phi: "\\phi", theta: "\\theta", epsilon: "\\varepsilon", mu: "\\mu", ans: "\\mathrm{ans}" };
const tex = (node: MathNode) => {
  try {
    return node.toTex({
      parenthesis: "auto", implicit: "hide",
      handler: (n: MathNode) => (n.type === "SymbolNode" && TEX_NAMES[(n as unknown as { name: string }).name]) || undefined,
    });
  } catch { return ""; }
};

/** A number for display in LaTeX: 7 significant figures, × 10ⁿ for large and small, and quadrature noise (|v| < 1e-12 of the scale) shown as 0. */
export function texNumber(v: number, scale = 1): string {
  if (!Number.isFinite(v)) return String(v);
  if (Math.abs(v) < 1e-12 * Math.max(1, Math.abs(scale))) return "0";
  const s = Number(v.toPrecision(7));
  if (s !== 0 && (Math.abs(s) >= 1e6 || Math.abs(s) < 1e-3)) { const [m, e] = s.toExponential(5).split("e"); return `${Number(m)}\\times10^{${Number(e)}}`; }
  return String(s);
}

/**
 * Reads the graph list top to bottom. "a = 3" makes a slider variable; "y = …" or anything in x is a curve;
 * "z = …" or anything in x and y is a surface (contour or 3D); "r = …(theta)" is polar; "(f(t), g(t))" is parametric.
 */
export function readLines(lines: string[], angle: AngleMode = "rad"): { lines: Line[]; scope: Record<string, number> } {
  const scope = scopeBase(angle);
  const known = new Set(Object.keys(scope));
  const out = lines.map((raw): Line => {
    const src = normalize(raw.trim());
    if (!src || src.startsWith("#")) return { kind: "empty" };
    try {
      const param = /^\((.+),(.+)\)$/.exec(src);
      if (param) {
        const nx = math.parse(param[1]!), ny = math.parse(param[2]!);
        return { kind: "parametric", fx: nx.compile(), fy: ny.compile(), tex: `\\left(${tex(nx)},\\ ${tex(ny)}\\right)` };
      }
      const m = /^([A-Za-z_]\w*)\s*(?:\(\s*([a-z,\s]*)\))?\s*=(?!=)\s*(.+)$/.exec(src);
      const lhs = m?.[1], args = m?.[2], body = m ? m[3]! : src;
      const node = math.parse(body);
      const vars = free(node, known);
      if (lhs === "r" || (args === "theta")) return { kind: "polar", f: node.compile(), tex: `r=${tex(node)}` };
      if (lhs === "z" || (args && /x\s*,\s*y/.test(args)) || (vars.has("x") && vars.has("y"))) return { kind: "surface", f: node.compile(), tex: `${lhs && lhs !== "z" ? `${lhs}(x,y)` : "z"}=${tex(node)}` };
      if (lhs === "y" || args === "x" || vars.has("x")) {
        const others = [...vars].filter((v) => v !== "x");
        if (others.length) return { kind: "error", message: `Unknown name${others.length > 1 ? "s" : ""}: ${others.join(", ")}. Define ${others.length > 1 ? "them" : "it"} on a line above, like "${others[0]} = 1".` };
        return { kind: "curve", f: node.compile(), tex: `${lhs && lhs !== "y" ? `${lhs}(x)` : "y"}=${tex(node)}` };
      }
      if (vars.size) return { kind: "error", message: `Unknown name${vars.size > 1 ? "s" : ""}: ${[...vars].join(", ")}.` };
      const value = node.compile().evaluate({ ...scope });
      if (lhs && typeof value === "number") { scope[lhs] = value; known.add(lhs); return { kind: "variable", name: lhs, value, tex: `${lhs}=${tex(node)}` }; }
      return { kind: "value", text: formatResult(value), tex: tex(node) };
    } catch (e) {
      return { kind: "error", message: e instanceof Error ? e.message : String(e) };
    }
  });
  return { lines: out, scope };
}

export function formatResult(v: unknown): string {
  if (typeof v === "number") return Number.isFinite(v) ? fmt(v) : String(v);
  try { return math.format(v as never, { precision: 6 }); } catch { return String(v); }
}
const fmt = (v: number) => (v !== 0 && (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-3) ? v.toExponential(5).replace(/\.?0+e/, "e") : String(Number(v.toPrecision(7))));

/** Calculate tab: one expression, numbers and units ("2 mA * 3 kohm to V"), with constants and earlier answers. */
export function calculate(src: string, vars: Record<string, unknown>, angle: AngleMode = "rad"): { text: string; tex: string; value: unknown } {
  const s = normalize(src.trim());
  const node = math.parse(s);
  let value = node.compile().evaluate({ ...scopeBase(angle), ...vars });
  // "a = 2; a^2" evaluates to a result set: show the last value.
  if (value && typeof value === "object" && "entries" in value && Array.isArray((value as { entries: unknown[] }).entries)) value = (value as { entries: unknown[] }).entries.at(-1);
  return { text: formatResult(value), tex: tex(node), value };
}

/** d/dvar of an expression, simplified, as text and LaTeX. */
export function differentiate(src: string, v: string): { text: string; tex: string } {
  const d = math.simplify(math.derivative(normalize(src), normalize(v)));
  return { text: d.toString(), tex: tex(d) };
}

export type Coords = "cartesian" | "cylindrical" | "spherical";
export const COORDS: Record<Coords, { vars: [string, string, string]; defaults: [string, string][] }> = {
  cartesian: { vars: ["x", "y", "z"], defaults: [["0", "1"], ["0", "1"], ["0", "1"]] },
  cylindrical: { vars: ["rho", "phi", "z"], defaults: [["0", "1"], ["0", "2*pi"], ["0", "1"]] },
  spherical: { vars: ["r", "theta", "phi"], defaults: [["0", "1"], ["0", "pi"], ["0", "2*pi"]] },
};

// 8-point Gauss–Legendre on [−1, 1], applied on 6 panels per dimension.
const GL_X = [-0.9602898564975363, -0.7966664774136267, -0.5255324099163290, -0.1834346424956498, 0.1834346424956498, 0.5255324099163290, 0.7966664774136267, 0.9602898564975363];
const GL_W = [0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.3626837833783620, 0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
const PANELS = 6;

function quad(f: (t: number) => number, a: number, b: number): number {
  let sum = 0;
  const h = (b - a) / PANELS;
  for (let p = 0; p < PANELS; p++) {
    const lo = a + p * h, mid = lo + h / 2;
    for (let k = 0; k < 8; k++) sum += GL_W[k]! * f(mid + (h / 2) * GL_X[k]!);
  }
  return (sum * h) / 2;
}

/**
 * The suggested Jacobian for integrating over `vs` (inner to outer) in a coordinate system:
 * a volume (all three), the ρφ plane (ρ), a sphere's surface at fixed r (r² sin θ), and so on.
 */
export function suggestJacobian(coords: Coords, vs: string[]): string {
  const has = (v: string) => vs.includes(v);
  if (coords === "cylindrical") return has("rho") && has("phi") ? "rho" : has("phi") ? "rho" : "1";
  if (coords === "spherical") {
    if (has("r") && has("theta") && has("phi")) return "r^2*sin(theta)";
    if (has("theta") && has("phi")) return "r^2*sin(theta)";
    if (has("r") && has("theta")) return "r";
    if (has("phi")) return "r*sin(theta)";
    if (has("theta")) return "r";
  }
  return "1";
}

/**
 * ∫…∫ f · J over the bounds, innermost variable first in `order` (only the first `dims` are integrated).
 * Bounds may use outer variables, e.g. z from 0 to sqrt(1 - x^2). Composite 8-point Gauss–Legendre.
 */
export function integrate(src: string, jacobian: string, order: string[], bounds: Record<string, [string, string]>, dims: number, vars: Record<string, number> = {}): { value: number; scale: number; tex: string } {
  const f = math.parse(normalize(src)), J = math.parse(normalize(jacobian || "1"));
  const integrand = math.parse(`(${f.toString()}) * (${J.toString()})`).compile();
  const used = order.slice(0, dims);
  const lim = Object.fromEntries(used.map((v) => [v, bounds[v]!.map((b) => math.parse(normalize(b)).compile())])) as Record<string, EvalFunction[]>;
  const level = (i: number, scope: Record<string, number>): number => {
    if (i < 0) return Number(integrand.evaluate(scope));
    const v = used[i]!, [la, lb] = lim[v]!;
    const a = Number(la!.evaluate(scope)), b = Number(lb!.evaluate(scope));
    return quad((t) => level(i - 1, { ...scope, [v]: t }), a, b);
  };
  const value = level(dims - 1, { ...scopeBase(), ...vars });
  // The same integral of |f·J|, so a cancelling integral (∫ sin φ dφ over a period) reads 0, not 1e-17.
  const absF = math.parse(`abs((${f.toString()}) * (${J.toString()}))`).compile();
  const levelAbs = (i: number, scope: Record<string, number>): number => {
    if (i < 0) return Number(absF.evaluate(scope));
    const v = used[i]!, [la, lb] = lim[v]!;
    return quad((t) => levelAbs(i - 1, { ...scope, [v]: t }), Number(la!.evaluate(scope)), Number(lb!.evaluate(scope)));
  };
  const scale = Math.abs(levelAbs(dims - 1, { ...scopeBase(), ...vars }));
  const sym: Record<string, string> = { rho: "\\rho", phi: "\\phi", theta: "\\theta" };
  const ints = used.map((v) => { const [a, b] = bounds[v]!; return String.raw`\int_{${tex(math.parse(normalize(a)))}}^{${tex(math.parse(normalize(b)))}}`; }).reverse().join("");
  const ds = used.map((v) => String.raw`\,d${sym[v] ?? v}`).join("");
  return { value, scale, tex: String.raw`${ints}\left(${tex(f)}\right)` + (J.toString() === "1" ? "" : String.raw`\,` + tex(J)) + ds };
}
