"use client";

import { cartOf, nativeOf, scalarFields, vectorFields, type Vec3 } from "@forma/physics";
import { pathAt, toSvg, toSvg3, PX } from "@forma/plate";
import type { KeyboardEvent, PointerEvent } from "react";
import { usePlateStage } from "./stage-context";
import type { ViewProps } from "./views2d";

const COLS = 9, ROWS = 7, X0 = -2.4, X1 = 2.4, Y0 = -1.8, Y1 = 1.8;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Plane point (a = x, b = vertical) → 3D point for the chosen plane. */
const at = (plane: "xz" | "xy", a: number, b: number, offset: number): Vec3 => (plane === "xz" ? [a, offset, b] : [a, b, offset]);
/** Vertical plane coordinate of a 3D point. */
const vert = (plane: "xz" | "xy", p: readonly number[]) => (plane === "xz" ? p[2]! : p[1]!);
const cells = () => {
  const out: [number, number][] = [];
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) out.push([X0 + ((i + 0.5) * (X1 - X0)) / COLS, Y0 + ((j + 0.5) * (Y1 - Y0)) / ROWS]);
  return out;
};

function PlaneArrow({ a, b, da, db, tone }: { a: number; b: number; da: number; db: number; tone: string }) {
  const L = Math.hypot(da, db);
  if (!Number.isFinite(L) || L < 1e-9) return null;
  const len = 0.32;
  const [x1, y1] = toSvg([a - (len / 2) * (da / L), 0, b - (len / 2) * (db / L)]);
  const [x2, y2] = toSvg([a + (len / 2) * (da / L), 0, b + (len / 2) * (db / L)]);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: `var(--${tone})` }} strokeWidth={1.3} markerEnd={`url(#arrow-${tone})`} />;
}

function useProbe(id: string, probe: [number, number, number], plane: "xz" | "xy", draggable: boolean) {
  const stage = usePlateStage();
  const can = draggable && stage.editable(id);
  const set = (a: number, b: number) => stage.edit(id, { probe: plane === "xz" ? [r2(a), probe[1], r2(b)] : [r2(a), r2(b), probe[2]] });
  const handlers = can
    ? {
        tabIndex: 0,
        role: "button",
        onPointerDown: (e: PointerEvent<SVGGElement>) => e.currentTarget.setPointerCapture(e.pointerId),
        onPointerMove: (e: PointerEvent<SVGGElement>) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const [mx, , mz] = stage.toMetres(e.clientX, e.clientY);
          set(mx, mz);
        },
        onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
          const d: Record<string, [number, number]> = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] };
          const k = d[e.key];
          if (!k) return;
          e.preventDefault();
          set(probe[0] + k[0], vert(plane, probe) + k[1]);
        },
      }
    : { role: "img" };
  return { can, handlers };
}

function Probe({ id, probe, plane, draggable, label }: { id: string; probe: [number, number, number]; plane: "xz" | "xy"; draggable: boolean; label: string }) {
  const { can, handlers } = useProbe(id, probe, plane, draggable);
  const [x, y] = toSvg([probe[0], 0, vert(plane, probe)]);
  return (
    <g transform={`translate(${x} ${y})`} className={can ? "handle" : undefined} aria-label={can ? `${label}. Drag, or use the arrow keys, to move it.` : label} {...handlers}>
      <circle r={4} className="fill-charge" />
      <line x1={-9} x2={9} y1={0} y2={0} className="ink" />
      <line x1={0} x2={0} y1={-9} y2={9} className="ink" />
      {can && <circle r={14} className="handle-ring" />}
    </g>
  );
}

function PlaneAxes({ plane }: { plane: "xz" | "xy" }) {
  return (
    <g>
      <text x={X1 * PX - 12} y={-6} className="plate-label">x</text>
      <text x={6} y={-Y1 * PX + 12} className="plate-label">{plane === "xz" ? "z" : "y"}</text>
    </g>
  );
}

export function ScalarSliceView({ id, ev }: ViewProps) {
  const p = ev.params as { field: string; plane: "xz" | "xy"; offset: number; probe: [number, number, number]; draggable: boolean; arrows: boolean };
  const s = scalarFields[p.field]!;
  const pts = cells().map(([a, b]) => {
    const q = at(p.plane, a, b, p.offset);
    const n = nativeOf(q, s.system);
    const g = cartOf(s.grad(n), q, s.system);
    return { a, b, f: s.f(n), g };
  });
  const fs = pts.map((x) => x.f).filter(Number.isFinite);
  const lo = Math.min(...fs), hi = Math.max(...fs);
  const cw = ((X1 - X0) / COLS) * PX, ch = ((Y1 - Y0) / ROWS) * PX;
  return (
    <g className="v-scalar-slice" role="group" aria-label={`Scalar field ${s.text}, with gradient arrows`}>
      {pts.map(({ a, b, f }, i) => {
        if (!Number.isFinite(f)) return null;
        const [x, y] = toSvg([a, 0, b]);
        const t = hi > lo ? (f - lo) / (hi - lo) : 0.5;
        return <rect key={`c${i}`} x={x - cw / 2} y={y - ch / 2} width={cw} height={ch} style={{ fill: "var(--flux)" }} opacity={0.06 + 0.34 * t} />;
      })}
      {p.arrows && pts.map(({ a, b, g }, i) => <PlaneArrow key={`a${i}`} a={a} b={b} da={g[0]} db={p.plane === "xz" ? g[2] : g[1]} tone="field" />)}
      <PlaneAxes plane={p.plane} />
      <text x={X0 * PX + 8} y={-Y1 * PX + 16} className="plate-label">{s.text}</text>
      <Probe id={id} probe={p.probe} plane={p.plane} draggable={p.draggable} label={`Probe at x ${p.probe[0].toFixed(2)}, y ${p.probe[1].toFixed(2)}, z ${p.probe[2].toFixed(2)}`} />
    </g>
  );
}

export function VectorSliceView({ id, ev }: ViewProps) {
  const p = ev.params as { field: string; plane: "xz" | "xy"; offset: number; probe: [number, number, number]; draggable: boolean; box: number; loop: number };
  const f = vectorFields[p.field]!;
  const [px, py] = toSvg([p.probe[0], 0, vert(p.plane, p.probe)]);
  return (
    <g className="v-vector-slice" role="group" aria-label={`Vector field ${f.text}`}>
      {cells().map(([a, b], i) => {
        const q = at(p.plane, a, b, p.offset);
        const v = cartOf(f.F(nativeOf(q, f.system)), q, f.system);
        return <PlaneArrow key={i} a={a} b={b} da={v[0]} db={p.plane === "xz" ? v[2] : v[1]} tone="flux" />;
      })}
      {p.box > 0 && (
        <g role="img" aria-label={`Flux box, side ${p.box} m`}>
          <rect x={px - (p.box * PX) / 2} y={py - (p.box * PX) / 2} width={p.box * PX} height={p.box * PX} fill="url(#hatch-surface)" className="ink" />
        </g>
      )}
      {p.loop > 0 && (
        <g aria-label={`Circulation loop, side ${p.loop} m, counter-clockwise`}>
          <rect x={px - (p.loop * PX) / 2} y={py - (p.loop * PX) / 2} width={p.loop * PX} height={p.loop * PX} fill="none" style={{ stroke: "var(--surface)" }} strokeWidth={1.6} />
          <path d={`M${px + (p.loop * PX) / 2} ${py + 6} L${px + (p.loop * PX) / 2} ${py - 6}`} style={{ stroke: "var(--surface)" }} markerEnd="url(#arrow-surface)" />
        </g>
      )}
      <PlaneAxes plane={p.plane} />
      <text x={X0 * PX + 8} y={-Y1 * PX + 16} className="plate-label">{f.text}</text>
      <Probe id={id} probe={p.probe} plane={p.plane} draggable={p.draggable} label={`Probe at x ${p.probe[0].toFixed(2)}, y ${p.probe[1].toFixed(2)}, z ${p.probe[2].toFixed(2)}`} />
    </g>
  );
}

const DEG = Math.PI / 180;
function point(system: "cart" | "cyl" | "sph", u: [number, number, number]): Vec3 {
  if (system === "cart") return u;
  if (system === "cyl") return [u[0] * Math.cos(u[1] * DEG), u[0] * Math.sin(u[1] * DEG), u[2]];
  return [u[0] * Math.sin(u[1] * DEG) * Math.cos(u[2] * DEG), u[0] * Math.sin(u[1] * DEG) * Math.sin(u[2] * DEG), u[0] * Math.cos(u[1] * DEG)];
}

export function CoordRegionView({ ev }: ViewProps) {
  const p = ev.params as { system: "cart" | "cyl" | "sph"; ranges: [number, number][]; face: 0 | 1 | 2 | null; faceAt: "max" | "min"; drawScale: number };
  const k = p.drawScale;
  const proj = (u: [number, number, number]) => toSvg3(point(p.system, u).map((v) => v * k));
  const curves: string[] = [];
  const N = 24;
  for (let k = 0; k < 3; k++) {
    const [o1, o2] = [0, 1, 2].filter((i) => i !== k) as [number, number];
    for (const e1 of [0, 1]) for (const e2 of [0, 1]) {
      const pts: string[] = [];
      for (let s = 0; s <= N; s++) {
        const u: [number, number, number] = [0, 0, 0];
        u[k] = p.ranges[k]![0] + ((p.ranges[k]![1] - p.ranges[k]![0]) * s) / N;
        u[o1] = p.ranges[o1]![e1]!;
        u[o2] = p.ranges[o2]![e2]!;
        const [x, y] = proj(u);
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      curves.push(pts.join(" "));
    }
  }
  let face: string | null = null;
  if (p.face !== null) {
    const k = p.face;
    const [o1, o2] = [0, 1, 2].filter((i) => i !== k) as [number, number];
    const fixed = p.ranges[k]![p.faceAt === "max" ? 1 : 0]!;
    const ring: string[] = [];
    const walk = (a: number, b: number, c: number, d: number) => {
      for (let s = 0; s <= N; s++) {
        const u: [number, number, number] = [0, 0, 0];
        u[k] = fixed;
        u[o1] = a + ((b - a) * s) / N;
        u[o2] = c + ((d - c) * s) / N;
        const [x, y] = proj(u);
        ring.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
    };
    const [a1, b1] = p.ranges[o1]!;
    const [a2, b2] = p.ranges[o2]!;
    walk(a1, b1, a2, a2); walk(b1, b1, a2, b2); walk(b1, a1, b2, b2); walk(a1, a1, b2, a2);
    face = ring.join(" ");
  }
  return (
    <g className="v-coord-region" role="img" aria-label={`Region in ${p.system === "cart" ? "cartesian" : p.system === "cyl" ? "cylindrical" : "spherical"} coordinates`}>
      {face && <polygon points={face} fill="url(#hatch-surface)" style={{ stroke: "var(--surface)" }} />}
      {curves.map((c, i) => <polyline key={i} points={c} fill="none" className="ink" />)}
    </g>
  );
}

export function LineWorkView({ ev }: ViewProps) {
  const p = ev.params as { path: { kind: "segment" | "arc" }; drawScale: number };
  const at = (s: number) => pathAt(p.path as Parameters<typeof pathAt>[0], s)[0].map((v) => v * p.drawScale);
  const pts = Array.from({ length: 49 }, (_, i) => toSvg3(at(i / 48)).map((v) => v.toFixed(1)).join(",")).join(" ");
  const [sx, sy] = toSvg3(at(0));
  const [ex, ey] = toSvg3(at(1));
  return (
    <g role="img" aria-label={`Path for the work integral, ${p.path.kind}`}>
      <polyline points={pts} fill="none" style={{ stroke: "var(--charge)" }} strokeWidth={2} markerEnd="url(#arrow-charge)" />
      <circle cx={sx} cy={sy} r={4} fill="var(--charge)" />
      <text x={sx + 7} y={sy - 7} className="plate-label">start</text>
      <text x={ex + 7} y={ey - 7} className="plate-label">end</text>
    </g>
  );
}

export function ConductorView({ ev }: ViewProps) {
  const p = ev.params as { radius: number; length: number; sigma: number };
  const [x1, y1] = toSvg([-2, 0, -0.25]);
  const [x2, y2] = toSvg([2, 0, 0.25]);
  const label = `r = ${p.radius * 1000} mm · L = ${p.length} m · σ = ${p.sigma.toExponential(2)} S/m`;
  return (
    <g role="img" aria-label="Conductor, schematic">
      <text x={-200} y={-38} className="plate-label">{label}</text>
      <rect x={x1} y={y2} width={x2 - x1} height={y1 - y2} fill="url(#hatch-graphite)" className="ink" />
      {[-1, 0, 1].map((x) => {
        const [a, b] = toSvg([x - 0.35, 0, 0]);
        const [c, d] = toSvg([x + 0.35, 0, 0]);
        return <g key={x}><line x1={a} y1={b} x2={c} y2={d} style={{ stroke: "var(--flux)" }} markerEnd="url(#arrow-flux)" /><text x={c + 4} y={d - 5} className="plate-label">J</text></g>;
      })}
    </g>
  );
}

const lengthLabel = (x: number) => x < 1e-3 ? `${Number((x * 1e6).toPrecision(4))} µm` : x < 1 ? `${Number((x * 1e3).toPrecision(4))} mm` : `${Number(x.toPrecision(4))} m`;
export function CapacitorView({ ev }: ViewProps) {
  const p = ev.params as { kind: "parallel" | "coax" | "sphere"; er: number; area?: number; d?: number; a?: number; b?: number };
  const label = `${p.kind === "parallel" ? "Parallel-plate" : p.kind === "coax" ? "Coaxial" : "Spherical"} capacitor, schematic`;
  if (p.kind === "parallel") {
    const [x1, yTop] = toSvg([-1.5, 0, 0.6]);
    const [x2, yBottom] = toSvg([1.5, 0, -0.6]);
    const [gx1, gyTop] = toSvg([-1.5, 0, 0.5]);
    const [gx2, gyBottom] = toSvg([1.5, 0, -0.5]);
    const area = p.area!;
    return (
      <g role="img" aria-label={label}>
        <text x={-200} y={-90} className="plate-label">{`εr = ${p.er} · d = ${lengthLabel(p.d!)} · S = ${Number(area.toPrecision(4))} m²`}</text>
        {p.er > 1 && <rect x={gx1} y={gyTop} width={gx2 - gx1} height={gyBottom - gyTop} fill="url(#hatch-graphite)" />}
        <rect x={x1} y={yTop} width={x2 - x1} height={Math.abs(toSvg([0, 0, 0.5])[1]! - toSvg([0, 0, 0.6])[1]!)} fill="var(--charge)" />
        <rect x={x1} y={toSvg([0, 0, -0.5])[1]!} width={x2 - x1} height={Math.abs(toSvg([0, 0, -0.5])[1]! - yBottom)} fill="var(--field)" />
        <text x={x2 + 8} y={yTop + 5} className="plate-label">+Q</text>
        <text x={x2 + 8} y={yBottom + 5} className="plate-label">−Q</text>
      </g>
    );
  }
  const center = toSvg([0, 0, 0]);
  const radius = 1.2 * 100;
  const inner = 0.4 * 100;
  const a0 = Math.PI / 6;
  const [ax, ay] = [center[0] + inner * Math.cos(a0), center[1] - inner * Math.sin(a0)];
  const [bx, by] = [center[0] + radius * Math.cos(a0), center[1] - radius * Math.sin(a0)];
  return (
    <g role="img" aria-label={label}>
      <text x={-200} y={-90} className="plate-label">{p.kind === "coax" ? "cross-section" : "section through the centre"} · εr = {p.er}</text>
      {p.er > 1 && <circle cx={center[0]} cy={center[1]} r={radius} fill="url(#hatch-graphite)" />}
      <circle cx={center[0]} cy={center[1]} r={radius} fill="none" stroke="var(--ink)" strokeWidth={3} />
      <circle cx={center[0]} cy={center[1]} r={inner} fill="var(--charge)" />
      <line x1={center[0]} y1={center[1]} x2={ax} y2={ay} className="ink" />
      <line x1={center[0]} y1={center[1]} x2={bx} y2={by} className="ink" />
      <text x={ax + 3} y={ay - 4} className="plate-label">a</text>
      <text x={bx + 3} y={by - 4} className="plate-label">b</text>
    </g>
  );
}

const LOG0 = 3, LOG1 = 21; // 1 kHz … 1 ZHz
const BAND_EDGES: [number, string][] = [[3e8, "Radio"], [3e11, "Microwave"], [4e14, "IR"], [7.9e14, "Vis"], [3e16, "UV"], [3e19, "X-ray"], [1e21, "Gamma"]];
export function SpectrumView({ id, ev }: ViewProps) {
  const stage = usePlateStage();
  const p = ev.params as { f: number; draggable: boolean };
  const m = ev.model as { band: string; lambda: number };
  const W = 4.6 * PX, left = -2.3 * PX;
  const xOf = (f: number) => left + ((Math.log10(f) - LOG0) / (LOG1 - LOG0)) * W;
  const can = p.draggable && stage.editable(id);
  const nudge = (k: number) => stage.edit(id, { f: Math.min(1e21, Math.max(1e3, p.f * 10 ** k)) });
  let prev = 1e3;
  return (
    <g className="v-spectrum" role="group" aria-label={`Electromagnetic spectrum; ${m.band}, wavelength ${m.lambda.toExponential(3)} metres`}>
      {BAND_EDGES.map(([top, name], i) => {
        const x1 = xOf(prev), x2 = xOf(Math.min(top, 1e21));
        prev = top;
        return (
          <g key={name}>
            <rect x={x1} y={-20} width={x2 - x1} height={40} style={{ fill: "var(--flux)" }} opacity={0.08 + 0.06 * (i % 2)} className="ink" />
            <text x={(x1 + x2) / 2} y={36} textAnchor="middle" className="plate-label">{name}</text>
          </g>
        );
      })}
      <g
        transform={`translate(${xOf(p.f)} -20)`}
        className={can ? "handle" : undefined}
        {...(can
          ? { tabIndex: 0, role: "slider", "aria-valuemin": 1e3, "aria-valuemax": 1e21, "aria-valuenow": p.f, "aria-label": "Frequency. Left or Right changes it by a tenth of a decade.",
              onKeyDown: (e: KeyboardEvent<SVGGElement>) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); nudge(e.key === "ArrowRight" ? 0.1 : -0.1); } } }
          : {})}
      >
        <path d="M-7 -12 L7 -12 L0 0 Z" style={{ fill: "var(--charge)" }} />
        <line x1={0} x2={0} y1={0} y2={40} style={{ stroke: "var(--charge)" }} />
      </g>
      <text x={left} y={-34} className="plate-label">frequency (log scale) →</text>
    </g>
  );
}

export function UnitConvertView({ ev }: ViewProps) {
  const p = ev.params as { value: number; unit: string };
  const m = { ...(ev.model as { dim: string; ok: boolean }), si: Object.entries(ev.model).find(([k]) => k.startsWith("si"))?.[1] as number | undefined };
  return (
    <g className="v-unit-convert" role="img" aria-label={m.ok ? `${p.value} ${p.unit} equals ${m.si} ${m.dim}` : `${p.unit} is not a unit Forma reads`}>
      <text x={-200} y={-10} className="plate-label" style={{ fontSize: 22 }}>{`${p.value} ${p.unit}`}</text>
      <text x={-40} y={-10} className="plate-label" style={{ fontSize: 22 }}>=</text>
      <text x={0} y={-10} className="plate-label" style={{ fontSize: 22 }}>{m.ok ? `${Number(m.si!.toPrecision(6))} ${m.dim === "1" ? "" : m.dim}` : "?"}</text>
    </g>
  );
}
