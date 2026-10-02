"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tex } from "@/components/Tex";
import { calculate, CONSTANTS, COORDS, differentiate, integrate, readLines, suggestJacobian, texNumber, type Coords, type Line } from "@/lib/graphcalc";

type Tab = "graph" | "calc" | "integrate";
const TABS: [Tab, string][] = [["graph", "Graph"], ["calc", "Calculate"], ["integrate", "Integrate"]];
const LS = "forma:calc";

/** Saved per browser so the graph list and history survive closing the panel. */
function useSaved<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => { try { const s = localStorage.getItem(`${LS}:${key}`); if (s) setV(JSON.parse(s) as T); } catch { /* fresh */ } }, [key]);
  return [v, (n: T) => { setV(n); try { localStorage.setItem(`${LS}:${key}`, JSON.stringify(n)); } catch { /* session only */ } }];
}

/**
 * A graphing calculator in the spirit of a TI-Nspire: a list of expressions drawn on one graph (curves, polar,
 * parametric, and z = f(x, y) as a contour map or a 3D surface, with sliders for constants), a calculation history
 * with units and constants, and an integrator for single, double and triple integrals in any coordinate system.
 */
export function GraphingCalculator({ tall = false }: { tall?: boolean }) {
  const [tab, setTab] = useSaved<Tab>("tab", "graph");
  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Calculator" className="segmented w-full">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} aria-checked={tab === id} className="flex-1" onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "graph" && <GraphTab tall={tall} />}
      {tab === "calc" && <CalcTab />}
      {tab === "integrate" && <IntegrateTab />}
    </div>
  );
}

const TOKENS = ["flux", "charge", "field", "surface", "graphite"] as const;
const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || "gray";
const range = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e9 ? v : null);

function GraphTab({ tall }: { tall: boolean }) {
  const [src, setSrc] = useSaved<string[]>("graph", ["a = 1", "y = a*sin(x)", "z = x^2 - y^2"]);
  const [view, setView] = useSaved<{ x0: number; x1: number; y0: number; y1: number; mode3d: boolean }>("view", { x0: -5, x1: 5, y0: -5, y1: 5, mode3d: false });
  const [sliders, setSliders] = useState<Record<number, number>>({});
  const plot = useRef<HTMLDivElement>(null);

  // A slider overrides its line's value until the line is edited.
  const effective = src.map((s, i) => (sliders[i] !== undefined ? s.replace(/=.*$/, `= ${sliders[i]}`) : s));
  const { lines, scope } = useMemo(() => readLines(effective), [effective.join("\n")]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasSurface = lines.some((l) => l.kind === "surface");

  useEffect(() => {
    const el = plot.current;
    if (!el) return;
    let live = true;
    void import("plotly.js-dist-min").then(({ default: Plotly }) => {
      if (!live) return;
      const ink = css("ink"), grid = css("grid"), paper = css("paper-2");
      const data: object[] = [];
      let c = 0;
      const color = () => css(TOKENS[c++ % TOKENS.length]!);
      const xs = range(view.x0, view.x1, 600);
      const flat = !(view.mode3d && hasSurface);
      for (const l of lines) {
        if (flat && l.kind === "curve") data.push({ type: "scatter", mode: "lines", x: xs, y: xs.map((x) => { try { return num(l.f.evaluate({ ...scope, x })); } catch { return null; } }), name: "", line: { color: color(), width: 2.5 }, hovertemplate: "x=%{x:.4g}<br>y=%{y:.4g}<extra></extra>" });
        if (flat && (l.kind === "polar" || l.kind === "parametric")) {
          const ts = range(0, 2 * Math.PI, 720);
          const pts = ts.map((t) => { try {
            if (l.kind === "polar") { const r = Number(l.f.evaluate({ ...scope, theta: t })); return [r * Math.cos(t), r * Math.sin(t)]; }
            return [Number(l.fx.evaluate({ ...scope, t })), Number(l.fy.evaluate({ ...scope, t }))];
          } catch { return [NaN, NaN]; } });
          data.push({ type: "scatter", mode: "lines", x: pts.map((p) => num(p[0])), y: pts.map((p) => num(p[1])), line: { color: color(), width: 2.5 }, hovertemplate: "(%{x:.4g}, %{y:.4g})<extra></extra>" });
        }
        if (l.kind === "surface") {
          const gx = range(view.x0, view.x1, 70), gy = range(view.y0, view.y1, 70);
          const z = gy.map((y) => gx.map((x) => { try { return num(l.f.evaluate({ ...scope, x, y })); } catch { return null; } }));
          data.push(view.mode3d
            ? { type: "surface", x: gx, y: gy, z, colorscale: "Viridis", showscale: false, contours: { z: { show: true, usecolormap: true, project: { z: true } } } }
            : { type: "contour", x: gx, y: gy, z, colorscale: "Viridis", showscale: true, contours: { showlabels: true, labelfont: { color: "white", size: 10 } }, colorbar: { thickness: 10, tickfont: { color: ink } }, hovertemplate: "x=%{x:.3g}, y=%{y:.3g}<br>z=%{z:.4g}<extra></extra>" });
        }
      }
      const axis = (r: [number, number]) => ({ range: r, gridcolor: grid, zerolinecolor: ink, color: ink, zerolinewidth: 1.5 });
      const layout = view.mode3d && hasSurface
        ? { paper_bgcolor: paper, font: { color: ink, family: "IBM Plex Sans, sans-serif" }, margin: { l: 0, r: 0, t: 0, b: 0 }, showlegend: false, scene: { xaxis: { title: { text: "x" }, color: ink }, yaxis: { title: { text: "y" }, color: ink }, zaxis: { title: { text: "z" }, color: ink } } }
        : { paper_bgcolor: paper, plot_bgcolor: paper, font: { color: ink, family: "IBM Plex Sans, sans-serif" }, margin: { l: 40, r: 10, t: 10, b: 30 }, showlegend: false, xaxis: axis([view.x0, view.x1]), yaxis: { ...axis([view.y0, view.y1]) } };
      void Plotly.react(el, data, layout, { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["select2d", "lasso2d", "toImage"] });
    });
    return () => { live = false; };
  }, [lines, scope, view, hasSurface]);
  useEffect(() => () => { void import("plotly.js-dist-min").then(({ default: P }) => plot.current && P.purge(plot.current)); }, []);

  const set = (i: number, v: string) => { const next = [...src]; next[i] = v; setSrc(next); setSliders(({ [i]: _, ...rest }) => rest); };
  const numberField = (label: string, value: number, on: (n: number) => void) => (
    <label className="flex items-center gap-1 text-xs">{label}
      <input type="number" className="input w-20 py-0.5 text-xs" value={value} step="any" onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) on(n); }} />
    </label>
  );

  return (
    <div className="space-y-2">
      <ol className="space-y-1.5">
        {src.map((s, i) => {
          const l = lines[i]!;
          return (
            <li key={i} className="rounded border border-[var(--grid)] bg-[var(--paper)] p-1.5">
              <div className="flex items-center gap-1.5">
                <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: dotColor(lines, i) }} />
                <input className="input min-w-0 flex-1 py-1 font-mono text-sm" value={s} aria-label={`Expression ${i + 1}`} spellCheck={false} onChange={(e) => set(i, e.target.value)} placeholder="y = x^2, z = x*y, r = 1 + cos(θ), a = 2" />
                <button className="btn px-2 py-0.5 text-xs" aria-label={`Remove expression ${i + 1}`} onClick={() => setSrc(src.filter((_, k) => k !== i))}>✕</button>
              </div>
              <LineInfo line={l} />
              {l.kind === "variable" && (
                <input type="range" className="mt-1 w-full" aria-label={`Slider for ${l.name}`} min={Math.min(-10, -2 * Math.abs(l.value))} max={Math.max(10, 2 * Math.abs(l.value))} step="any" value={sliders[i] ?? l.value}
                  onChange={(e) => setSliders({ ...sliders, [i]: Number(Number(e.target.value).toPrecision(4)) })} />
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn text-sm" onClick={() => setSrc([...src, ""])}>Add expression</button>
        {hasSurface && (
          <div role="radiogroup" aria-label="Surface view" className="segmented">
            <button type="button" role="radio" aria-checked={!view.mode3d} onClick={() => setView({ ...view, mode3d: false })}>Contour</button>
            <button type="button" role="radio" aria-checked={view.mode3d} onClick={() => setView({ ...view, mode3d: true })}>3D surface</button>
          </div>
        )}
        {hasSurface && view.mode3d && lines.some((l) => l.kind === "curve" || l.kind === "polar" || l.kind === "parametric") && <span className="text-xs text-soft">Curves show in the contour view.</span>}
      </div>
      <div ref={plot} className="w-full overflow-hidden rounded border border-[var(--grid)]" style={{ height: tall ? 520 : 340 }} role="img" aria-label="Graph of the expressions above" />
      <div className="flex flex-wrap items-center gap-2">
        {numberField("x from", view.x0, (n) => setView({ ...view, x0: n }))}
        {numberField("to", view.x1, (n) => setView({ ...view, x1: n }))}
        {numberField("y from", view.y0, (n) => setView({ ...view, y0: n }))}
        {numberField("to", view.y1, (n) => setView({ ...view, y1: n }))}
        <button className="btn px-2 py-0.5 text-xs" onClick={() => setView({ x0: -5, x1: 5, y0: -5, y1: 5, mode3d: view.mode3d })}>Reset view</button>
      </div>
      <p className="text-xs text-soft">Type maths as you would on a calculator: x^2, sqrt(x), sin(x), e^(-x), pi. A line like a = 2 makes a slider. Drag on the graph to zoom; double-click to reset.</p>
    </div>
  );
}

function dotColor(lines: Line[], i: number) {
  if (typeof window === "undefined") return "transparent";
  const drawn = lines.slice(0, i + 1).filter((l) => l.kind === "curve" || l.kind === "polar" || l.kind === "parametric").length;
  const l = lines[i]!;
  return l.kind === "curve" || l.kind === "polar" || l.kind === "parametric" ? `var(--${TOKENS[(drawn - 1) % TOKENS.length]})` : "transparent";
}

function LineInfo({ line }: { line: Line }) {
  if (line.kind === "empty") return null;
  if (line.kind === "error") return <p className="mt-1 text-xs text-[var(--charge-text)]" role="status">{line.message}</p>;
  return (
    <div className="mt-1 flex flex-wrap items-baseline gap-2 overflow-x-auto pl-5 text-sm">
      {line.tex && <Tex latex={line.tex} />}
      {line.kind === "value" && <span className="font-mono">= {line.text}</span>}
      {line.kind === "surface" && <span className="label">surface: contour or 3D</span>}
    </div>
  );
}

type Entry = { src: string; tex: string; text: string; error?: boolean };

function CalcTab() {
  const [history, setHistory] = useSaved<Entry[]>("history", []);
  const [input, setInput] = useState("");
  const [dSrc, setDSrc] = useState("x^2*sin(x)");
  const [dVar, setDVar] = useState("x");
  const vars = useMemo(() => {
    const last = [...history].reverse().find((h) => !h.error);
    const n = last ? Number(last.text) : NaN;
    return Number.isFinite(n) ? { ans: n } : {};
  }, [history]);
  const run = () => {
    if (!input.trim()) return;
    let e: Entry;
    try { const r = calculate(input, vars); e = { src: input, tex: r.tex, text: r.text }; }
    catch (err) { e = { src: input, tex: "", text: err instanceof Error ? err.message : String(err), error: true }; }
    setHistory([...history, e].slice(-40));
    setInput("");
  };
  const d = useMemo(() => { try { return differentiate(dSrc, dVar); } catch (e) { return { text: e instanceof Error ? e.message : String(e), tex: "" }; } }, [dSrc, dVar]);
  return (
    <div className="space-y-3">
      <ol className="max-h-72 space-y-1 overflow-y-auto" aria-label="Calculation history">
        {history.map((h, i) => (
          <li key={i} className="rounded border border-[var(--grid)] bg-[var(--paper)] px-2 py-1 text-sm">
            <button className="w-full text-left" title="Use again" onClick={() => setInput(h.src)}>
              <span className="block overflow-x-auto">{h.tex ? <Tex latex={h.tex} display /> : <code>{h.src}</code>}</span>
              <span className={`block text-right font-mono ${h.error ? "text-[var(--charge-text)]" : ""}`}>{h.error ? h.text : `= ${h.text}`}</span>
            </button>
          </li>
        ))}
        {!history.length && <li className="text-sm text-soft">Try: 2e-6 / (4*pi*eps0*0.5^2), then sqrt(ans), or 5 mA * 2 kohm to V.</li>}
      </ol>
      <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); run(); }}>
        <input className="input min-w-0 flex-1 font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} aria-label="Calculate" placeholder="Expression, Enter to calculate" spellCheck={false} />
        <button className="btn btn-primary">=</button>
      </form>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-soft">Constants: {Object.entries(CONSTANTS).map(([k, v]) => `${k} (${v.note})`).join(", ")}. Units convert with "to".</p>
        {history.length > 0 && <button className="btn px-2 py-0.5 text-xs" onClick={() => setHistory([])}>Clear</button>}
      </div>
      <fieldset className="space-y-1.5 rounded border border-[var(--grid)] p-2">
        <legend className="label px-1">Differentiate</legend>
        <div className="flex gap-1.5">
          <input className="input min-w-0 flex-1 font-mono text-sm" value={dSrc} onChange={(e) => setDSrc(e.target.value)} aria-label="Function to differentiate" spellCheck={false} />
          <label className="flex items-center gap-1 text-sm">d/d<input className="input w-14 font-mono text-sm" value={dVar} onChange={(e) => setDVar(e.target.value)} aria-label="Differentiate with respect to" /></label>
        </div>
        <div className="overflow-x-auto">{d.tex ? <Tex latex={d.tex} display /> : <p className="text-xs text-[var(--charge-text)]">{d.text}</p>}</div>
      </fieldset>
    </div>
  );
}

const NAMES: Record<string, string> = { x: "x", y: "y", z: "z", rho: "ρ", phi: "φ", theta: "θ", r: "r" };
const HINTS: Record<Coords, string> = {
  cartesian: "Boxes and regions with flat sides. dv = dx dy dz, no extra factor.",
  cylindrical: "Anything with an axis: wires, coax, cylinders. dv = ρ dρ dφ dz; on a flat disc dS = ρ dρ dφ. That extra ρ often removes the need for integration by parts.",
  spherical: "Spheres and point charges. dv = r² sin θ dr dθ dφ; on a sphere of radius r, dS = r² sin θ dθ dφ.",
};

function IntegrateTab() {
  const [coords, setCoords] = useSaved<Coords>("coords", "cylindrical");
  const [f, setF] = useSaved<string>("integrand", "rho^2 * sin(phi)");
  const [dims, setDims] = useSaved<number>("dims", 3);
  const [bounds, setBounds] = useSaved<Record<string, [string, string]>>("bounds", {});
  const [jac, setJac] = useState<string | null>(null);
  const [result, setResult] = useState<{ value?: number; scale?: number; tex?: string; error?: string } | null>(null);
  const order = COORDS[coords].vars;
  const used = order.slice(0, dims);
  const b = (v: string, k: 0 | 1) => bounds[`${coords}:${v}`]?.[k] ?? COORDS[coords].defaults[order.indexOf(v)]![k];
  const jacobian = jac ?? suggestJacobian(coords, used);
  const go = () => {
    try {
      const r = integrate(f, jacobian, [...order], Object.fromEntries(order.map((v) => [v, [b(v, 0), b(v, 1)]])), dims);
      setResult({ value: r.value, scale: r.scale, tex: r.tex });
    } catch (e) { setResult({ error: e instanceof Error ? e.message : String(e) }); }
  };
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-1 text-sm">Coordinates
          <select className="input py-1 text-sm" value={coords} onChange={(e) => { setCoords(e.target.value as Coords); setJac(null); setResult(null); }}>
            <option value="cartesian">Cartesian (x, y, z)</option><option value="cylindrical">Cylindrical (ρ, φ, z)</option><option value="spherical">Spherical (r, θ, φ)</option>
          </select>
        </label>
        <label className="flex items-center gap-1 text-sm">Integrals
          <select className="input py-1 text-sm" value={dims} onChange={(e) => { setDims(Number(e.target.value)); setJac(null); }}>
            <option value={1}>Single</option><option value={2}>Double</option><option value={3}>Triple</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-soft">{HINTS[coords]}</p>
      <label className="block text-sm">Integrand
        <input className="input mt-0.5 w-full font-mono text-sm" value={f} onChange={(e) => setF(e.target.value)} spellCheck={false} aria-label="Integrand" />
      </label>
      <div className="space-y-1">
        <p className="label">Limits, innermost first (limits may use outer variables)</p>
        {used.map((v) => (
          <div key={v} className="flex items-center gap-1.5 text-sm">
            <span className="w-6 font-mono">d{NAMES[v]}</span>
            <input className="input w-24 font-mono text-sm" value={b(v, 0)} aria-label={`${NAMES[v]} from`} onChange={(e) => setBounds({ ...bounds, [`${coords}:${v}`]: [e.target.value, b(v, 1)] })} />
            <span>to</span>
            <input className="input w-28 font-mono text-sm" value={b(v, 1)} aria-label={`${NAMES[v]} to`} onChange={(e) => setBounds({ ...bounds, [`${coords}:${v}`]: [b(v, 0), e.target.value] })} />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-1.5 text-sm">Jacobian (the extra factor in dv or dS)
        <input className="input w-36 font-mono text-sm" value={jacobian} onChange={(e) => setJac(e.target.value)} aria-label="Jacobian" spellCheck={false} />
        {jac !== null && <button className="btn px-2 py-0.5 text-xs" onClick={() => setJac(null)}>Suggested</button>}
      </label>
      <button className="btn btn-primary" onClick={go}>Integrate</button>
      {result && (result.error
        ? <p className="text-sm text-[var(--charge-text)]" role="status">{result.error}</p>
        : <div className="overflow-x-auto rounded border border-[var(--grid)] bg-[var(--paper)] p-2" role="status">
            <Tex latex={`${result.tex} = ${texNumber(result.value!, result.scale)}`} display />
          </div>)}
    </div>
  );
}
