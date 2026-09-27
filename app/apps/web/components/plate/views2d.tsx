"use client";

import { PX, pathD, toSvg, toSvg3, type Evaluated } from "@forma/plate";
import type { ComponentType, KeyboardEvent, PointerEvent } from "react";
import { Tex } from "../Tex";
import { usePlateStage } from "./stage-context";
import { Axes3View, BoundaryView, CoordFrameView, Vector3View } from "./views3d";
import { CapacitorView, ConductorView, CoordRegionView, LineWorkView, ScalarSliceView, SpectrumView, UnitConvertView, VectorSliceView } from "./viewsMath";

export type ViewProps = { id: string; ev: Evaluated; appear: number; focused: boolean; highlighted: boolean };

type V3 = [number, number, number];
type Item =
  | { id: string; kind: "point"; q: number; pos: V3; label?: string; draggable: boolean }
  | { id: string; kind: "ball"; rhoV: number; radius: number; center: V3 }
  | { id: string; kind: "line"; rhoL: number; x: number; y: number }
  | { id: string; kind: "sheet"; rhoS: number; z0: number };

const r2 = (v: number) => Math.round(v * 100) / 100;
const STEP = 0.1; // metres per arrow-key press
const KEYS: Record<string, [number, number]> = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, STEP], ArrowDown: [0, -STEP] };
export const place = (p: readonly number[], k: number, oblique: boolean) => (oblique ? toSvg3(p.map((v) => v * k)) : toSvg(p.map((v) => v * k)));

function ChargesView({ id, ev }: ViewProps) {
  const stage = usePlateStage();
  const items = ev.params.items as Item[];
  const k = ev.params.drawScale as number;
  const oblique = ev.params.oblique as boolean;
  const move = (itemId: string, pos: V3) => stage.edit(id, { items: items.map((it) => (it.id === itemId && it.kind === "point" ? { ...it, pos } : it)) });
  return (
    <g className="v-charges">
      {items.map((it) => {
        if (it.kind === "line") {
          const [x] = place([it.x, 0, 0], k, oblique);
          return (
            <g key={it.id} role="img" aria-label={`Line charge ${it.rhoL} nC per metre`}>
              <line x1={x} x2={x} y1={-180} y2={180} className="ink-charge" strokeDasharray="6 4" />
              <text x={x + 6} y={-166} className="plate-label">{`ρL ${it.rhoL} nC/m`}</text>
            </g>
          );
        }
        if (it.kind === "sheet") {
          const [, y] = place([0, 0, it.z0], k, oblique);
          return (
            <g key={it.id} role="img" aria-label={`Sheet charge ${it.rhoS} µC per square metre`}>
              <rect x={-260} y={y - 3} width={520} height={6} fill="url(#hatch-charge)" />
              <text x={-252} y={y - 8} className="plate-label">{`ρS ${it.rhoS} µC/m²`}</text>
            </g>
          );
        }
        if (it.kind === "ball") {
          const [x, y] = place(it.center, k, oblique);
          const r = it.radius * k * 100;
          return (
            <g key={it.id} role="img" aria-label="Uniform ball of charge">
              <circle cx={x} cy={y} r={r} fill="url(#hatch-charge)" stroke="var(--charge)" />
              <text x={x + r + 6} y={y - r - 4} className="plate-label">{`ρv ${it.rhoV} µC/m³`}</text>
            </g>
          );
        }
        const [x, y] = place(it.pos, k, oblique);
        const can = it.draggable && stage.editable(id) && !oblique;
        const label = it.label ?? `${it.q > 0 ? "+" : ""}${it.q} µC`;
        const onPointerDown = (e: PointerEvent<SVGGElement>) => can && e.currentTarget.setPointerCapture(e.pointerId);
        const onPointerMove = (e: PointerEvent<SVGGElement>) => {
          if (!can || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const [mx, , mz] = stage.toMetres(e.clientX, e.clientY);
          move(it.id, [r2(mx / k), it.pos[1], r2(mz / k)]);
        };
        const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
          const d = KEYS[e.key];
          if (!can || !d) return;
          e.preventDefault();
          move(it.id, [r2(it.pos[0] + d[0] / k), it.pos[1], r2(it.pos[2] + d[1] / k)]);
        };
        const a11y = can
          ? { tabIndex: 0, role: "button", "aria-label": `${label} charge at x ${it.pos[0].toFixed(2)} m, z ${it.pos[2].toFixed(2)} m. Drag, or use the arrow keys, to move it.`, onPointerDown, onPointerMove, onKeyDown }
          : { role: "img", "aria-label": `${label} charge` };
        return (
          <g key={it.id} transform={`translate(${x} ${y})`} className={can ? "handle" : undefined} {...a11y}>
            <circle r={9} className={it.q >= 0 ? "fill-charge" : "ring-charge"} />
            <text y={4} textAnchor="middle" className="charge-sign">{it.q >= 0 ? "+" : "−"}</text>
            <text x={13} y={-11} className="plate-label">{label}</text>
            {can && <circle r={16} className="handle-ring" />}
          </g>
        );
      })}
    </g>
  );
}

function fieldArrow(at: V3, vector: V3, k: number, oblique: boolean) {
  const mag = Math.hypot(...vector);
  if (!mag) return null;
  const direction: V3 = [vector[0] / mag, vector[1] / mag, vector[2] / mag];
  const from = place(at, k, oblique);
  const to = place([at[0] + direction[0] * 0.01 / k, at[1] + direction[1] * 0.01 / k, at[2] + direction[2] * 0.01 / k], k, oblique);
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const screenMag = Math.hypot(dx, dy);
  if (!screenMag) return null;
  return { x: from[0], y: from[1], dx: (dx / screenMag) * 70, dy: (dy / screenMag) * 70 };
}

function CoulombForceView({ ev }: ViewProps) {
  const at = ev.model.at as V3 | undefined;
  if (!at) return null;
  const arrow = fieldArrow(at, [ev.model.Fx as number, ev.model.Fy as number, ev.model.Fz as number], ev.params.drawScale as number, ev.params.oblique as boolean);
  if (!arrow) return null;
  return <g className="v-coulomb-force" role="img" aria-label={`Force F on ${String(ev.params.on)}`}><line x1={arrow.x} y1={arrow.y} x2={arrow.x + arrow.dx} y2={arrow.y + arrow.dy} className="ink-charge" markerEnd="url(#arrow-charge)" /><text x={arrow.x + arrow.dx + 5} y={arrow.y + arrow.dy - 4} className="plate-label">F</text></g>;
}

function EProbeView({ id, ev }: ViewProps) {
  const stage = usePlateStage();
  const point = ev.params.point as V3;
  const k = ev.params.drawScale as number;
  const oblique = ev.params.oblique as boolean;
  const [x, y] = place(point, k, oblique);
  const vector = [ev.model.Ex, ev.model.Ey, ev.model.Ez].map((v) => typeof v === "number" ? v : 0) as V3;
  const arrow = fieldArrow(point, vector, k, oblique);
  const can = ev.params.draggable === true && stage.editable(id) && !oblique;
  const move = (pos: V3) => stage.edit(id, { point: pos });
  const onPointerDown = (e: PointerEvent<SVGGElement>) => can && e.currentTarget.setPointerCapture(e.pointerId);
  const onPointerMove = (e: PointerEvent<SVGGElement>) => {
    if (!can || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const [mx, , mz] = stage.toMetres(e.clientX, e.clientY);
    move([r2(mx / k), point[1], r2(mz / k)]);
  };
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    const d = KEYS[e.key];
    if (!can || !d) return;
    e.preventDefault();
    move([r2(point[0] + d[0] / k), point[1], r2(point[2] + d[1] / k)]);
  };
  return <g className={can ? "v-e-probe handle" : "v-e-probe"} transform={`translate(${x} ${y})`} {...(can ? { tabIndex: 0, role: "button", onPointerDown, onPointerMove, onKeyDown } : { role: "img" })} aria-label={`Field probe at x ${point[0]} m, y ${point[1]} m, z ${point[2]} m`}><path d="M-5 0H5M0 -5V5" className="ink-graphite" />{arrow && <><line x1={arrow.x - x} y1={arrow.y - y} x2={arrow.x - x + arrow.dx} y2={arrow.y - y + arrow.dy} className="ink-flux" markerEnd="url(#arrow-flux)" /><text x={arrow.x - x + arrow.dx + 5} y={arrow.y - y + arrow.dy - 4} className="plate-label">E</text></>}{can && <circle r={14} className="handle-ring" />}</g>;
}

function FieldArrowsView({ ev }: ViewProps) {
  const samples = (ev.model.samples as { p: number[]; dir: number[]; mag: number }[]).filter((s) => Math.abs(s.p[1]!) < 1e-9);
  const max = Math.max(1e-30, ...samples.map((s) => s.mag));
  const [px, py] = toSvg([ev.params.probe as number, 0, 0]);
  return (
    <g className="v-field" aria-hidden>
      {samples.map((s, i) => {
        const L = (0.08 + 0.16 * Math.sqrt(s.mag / max)) * PX;
        const [x, y] = toSvg(s.p);
        const dx = s.dir[0]! * L;
        const dy = -s.dir[2]! * L;
        return <line key={i} x1={x - dx / 2} y1={y - dy / 2} x2={x + dx / 2} y2={y + dy / 2} className="ink-flux" markerEnd="url(#arrow-flux)" />;
      })}
      <g transform={`translate(${px} ${py})`}>
        <path d="M-5 0H5M0 -5V5" className="ink-graphite" />
        <text x={7} y={14} className="plate-label">probe</text>
      </g>
    </g>
  );
}

function FieldProfileView({ ev }: ViewProps) {
  const pts = ev.model.points as { r: number; v: number }[];
  if (pts.length < 2) return null;
  const W = 150, H = 90, X0 = 96, Y0 = -178;
  const rMax = pts.at(-1)!.r;
  const vMax = Math.max(1e-30, ...pts.map((p) => p.v));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${(X0 + (p.r / rMax) * W).toFixed(1)} ${(Y0 + H - (p.v / vMax) * H).toFixed(1)}`).join(" ");
  return (
    <g className="v-profile" role="img" aria-label={`Plot of |${String(ev.params.quantity)}| against distance r, falling as 1 over r squared`}>
      <rect x={X0} y={Y0} width={W} height={H} className="inset" />
      <path d={d} className="ink-flux" fill="none" />
      <text x={X0 + 4} y={Y0 + 12} className="plate-label">{`|${String(ev.params.quantity)}| vs r`}</text>
      <text x={X0 + W - 4} y={Y0 + H - 4} textAnchor="end" className="plate-label">{`r → ${rMax} m`}</text>
    </g>
  );
}

function GaussianSurfaceView({ ev, appear }: ViewProps) {
  const o = ev.model.outline as { p: number[]; n: number[]; dn: number | null }[];
  const max = Math.max(1e-30, ...o.map((s) => Math.abs(s.dn ?? 0)));
  const drawing = appear < 1;
  return (
    <g className="v-surface" role="img" aria-label={`Closed ${String(ev.params.shape)} Gaussian surface`}>
      {ev.params.shading === true &&
        o.map((s, i) => {
          const b = o[(i + 1) % o.length]!;
          const [x1, y1] = toSvg(s.p);
          const [x2, y2] = toSvg(b.p);
          const c = s.dn ?? 0;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={c >= 0 ? "shade-out" : "shade-in"} strokeOpacity={0.15 + (0.85 * Math.abs(c)) / max} />;
        })}
      <path d={pathD(o.map((s) => s.p))} className="ink-surface" fill="none" pathLength={1} strokeDasharray={drawing ? 1 : undefined} strokeDashoffset={drawing ? 1 - appear : undefined} />
      {ev.params.showNormals === true &&
        o
          .filter((_, i) => i % 8 === 0)
          .map((s, i) => {
            const [x, y] = toSvg(s.p);
            return <line key={i} x1={x} y1={y} x2={x + s.n[0]! * 0.14 * PX} y2={y - s.n[2]! * 0.14 * PX} className="ink-surface" markerEnd="url(#arrow-surface)" />;
          })}
    </g>
  );
}

function FaradaySpheresView({ ev }: ViewProps) {
  const p = ev.params as { innerQ: number; material: string; revealed: boolean };
  return (
    <g className="v-faraday" role="img" aria-label={`Charged ball of +${p.innerQ} µC inside a metal sphere, with ${p.material} between them`}>
      <circle r={0.8 * PX} fill="url(#hatch-surface)" className="ink" />
      <circle r={0.72 * PX} className="fill-paper ink" />
      {p.material !== "Air" && <circle r={0.72 * PX} fill="url(#hatch-graphite)" />}
      <circle r={0.25 * PX} className="fill-charge-soft ink-charge" />
      <text y={5} textAnchor="middle" className="plate-label">{`+${p.innerQ} µC`}</text>
      <text y={-0.48 * PX} textAnchor="middle" className="plate-label">{p.material}</text>
      <text x={0.86 * PX} y={-0.6 * PX} className="plate-label">{p.revealed ? `outer: +${String(ev.model.outerQ)} µC` : "outer: ?"}</text>
    </g>
  );
}

function AxesView({ ev }: ViewProps) {
  const L = (ev.params.length as number) * PX;
  return (
    <g className="v-axes" aria-hidden>
      <line x1={-L} y1={0} x2={L} y2={0} className="ink-graphite" markerEnd="url(#arrow-graphite)" />
      <line x1={0} y1={L * 0.7} x2={0} y2={-L * 0.7} className="ink-graphite" markerEnd="url(#arrow-graphite)" />
      <text x={L + 4} y={4} className="plate-label">x</text>
      <text x={4} y={-L * 0.7 - 4} className="plate-label">z</text>
    </g>
  );
}

function DimensionCalloutView({ ev }: ViewProps) {
  const [x1, y1] = toSvg(ev.params.from as number[]);
  const [x2, y2] = toSvg(ev.params.to as number[]);
  return (
    <g className="v-dimension" role="img" aria-label={String(ev.params.label)}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="ink-graphite" strokeDasharray="4 3" markerStart="url(#tick)" markerEnd="url(#tick)" />
      <text x={(x1 + x2) / 2 + 4} y={(y1 + y2) / 2 - 6} className="plate-label">{String(ev.params.label)}</text>
    </g>
  );
}

function UniformFieldView({ ev }: ViewProps) {
  const d = ev.model.D as number[];
  const m = ev.model.magnitude as number;
  if (!m) return null;
  const ux = d[0]! / m, uz = d[2]! / m;
  const s = ev.params.spacing as number;
  const L = 0.22;
  const arrows: [number, number][] = [];
  for (let x = -2.4; x <= 2.4 + 1e-9; x += s) for (let z = -1.7; z <= 1.7 + 1e-9; z += s) arrows.push([x, z]);
  return (
    <g className="v-uniform" role="img" aria-label={`Uniform field D of ${m.toFixed(2)} µC per square metre`}>
      {arrows.map(([x, z], i) => {
        const [x1, y1] = toSvg([x - (ux * L) / 2, 0, z - (uz * L) / 2]);
        const [x2, y2] = toSvg([x + (ux * L) / 2, 0, z + (uz * L) / 2]);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="ink-flux" markerEnd="url(#arrow-flux)" opacity={0.55} />;
      })}
    </g>
  );
}

function FlatPatchView({ id, ev }: ViewProps) {
  const stage = usePlateStage();
  const p = ev.params as { center: number[]; size: number; normalAngle: number; showNormal: boolean; showShadow: boolean };
  const n = ev.model.n as number[];
  const t = [-n[2]!, 0, n[0]!];
  const c = p.center;
  const half = p.size / 2;
  const [x1, y1] = toSvg([c[0]! - t[0]! * half, 0, c[2]! - t[2]! * half]);
  const [x2, y2] = toSvg([c[0]! + t[0]! * half, 0, c[2]! + t[2]! * half]);
  const [cx, cy] = toSvg(c);
  const [nx, ny] = toSvg([c[0]! + n[0]! * 0.55, 0, c[2]! + n[2]! * 0.55]);
  const can = stage.editable(id);
  const turn = (deg: number) => stage.edit(id, { normalAngle: Math.round(deg * 2) / 2 });
  const a11y = can
    ? {
        tabIndex: 0, role: "slider", "aria-label": "Patch tilt: angle of the normal from the +x axis. Arrow keys turn it by half a degree.",
        "aria-valuenow": p.normalAngle, "aria-valuemin": -180, "aria-valuemax": 180, "aria-valuetext": `${p.normalAngle}°`,
        onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
          const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 0.5 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -0.5 : 0;
          if (!d) return;
          e.preventDefault();
          turn(p.normalAngle + d);
        },
        onPointerDown: (e: PointerEvent<SVGGElement>) => e.currentTarget.setPointerCapture(e.pointerId),
        onPointerMove: (e: PointerEvent<SVGGElement>) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const [mx, , mz] = stage.toMetres(e.clientX, e.clientY);
          turn((Math.atan2(mz - c[2]!, mx - c[0]!) * 180) / Math.PI);
        },
      }
    : { role: "img", "aria-label": `Flat patch, normal at ${p.normalAngle}° from the +x axis` };
  return (
    <g className={`v-patch${can ? " handle" : ""}`} {...a11y}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="patch-edge" />
      {p.showNormal && (
        <>
          <line x1={cx} y1={cy} x2={nx} y2={ny} className="ink-surface" markerEnd="url(#arrow-surface)" />
          <text x={nx + 6} y={ny} className="plate-label">n̂</text>
        </>
      )}
      {p.showShadow && (() => {
        // The patch's shadow on a wall facing the field: its edge projected across D (half-length size·|cos θ|/2).
        const d = (p.size * Math.abs(Math.cos((((ev.model.theta as number | null) ?? 0) * Math.PI) / 180))) / 2;
        const [sx1, sy1] = toSvg([c[0]! - 0.9, 0, c[2]! - d]);
        const [sx2, sy2] = toSvg([c[0]! - 0.9, 0, c[2]! + d]);
        return (
          <g>
            <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} className="ink-graphite" strokeDasharray="4 3" strokeWidth={3} />
            <text x={sx1 - 8} y={(sy1 + sy2) / 2} textAnchor="end" className="plate-label">A cos θ</text>
          </g>
        );
      })()}
      {can && <circle cx={cx} cy={cy} r={14} className="handle-ring" />}
    </g>
  );
}

const TONE_CLASS: Record<string, string> = { charge: "ink-charge", field: "ink-field", flux: "ink-flux", surface: "ink-surface", ink: "ink" };

function VectorView({ ev }: ViewProps) {
  const p = ev.params as { from: number[]; to: number[]; label: string; tone: string; arcTo?: number[] };
  const [x1, y1] = toSvg(p.from);
  const [x2, y2] = toSvg(p.to);
  const arc = p.arcTo
    ? (() => {
        const a1 = Math.atan2(p.to[2]! - p.from[2]!, p.to[0]! - p.from[0]!);
        const a2 = Math.atan2(p.arcTo[2]! - p.from[2]!, p.arcTo[0]! - p.from[0]!);
        const r = 0.28;
        const [ax1, ay1] = toSvg([p.from[0]! + r * Math.cos(a1), 0, p.from[2]! + r * Math.sin(a1)]);
        const [ax2, ay2] = toSvg([p.from[0]! + r * Math.cos(a2), 0, p.from[2]! + r * Math.sin(a2)]);
        const mid = (a1 + a2) / 2;
        const [lx, ly] = toSvg([p.from[0]! + (r + 0.12) * Math.cos(mid), 0, p.from[2]! + (r + 0.12) * Math.sin(mid)]);
        return (
          <g>
            <path d={`M${ax1} ${ay1} A${r * PX} ${r * PX} 0 0 ${a1 > a2 ? 1 : 0} ${ax2} ${ay2}`} fill="none" className="ink" />
            <text x={lx} y={ly} className="plate-label">θ</text>
          </g>
        );
      })()
    : null;
  return (
    <g className="v-vector" role="img" aria-label={`Vector ${p.label}`}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className={TONE_CLASS[p.tone] ?? "ink"} strokeWidth={2} markerEnd={`url(#arrow-${p.tone === "ink" ? "graphite" : p.tone})`} />
      <text x={x2 + 6} y={y2 - 4} className="plate-label">{p.label}</text>
      {arc}
    </g>
  );
}

function PatchTilingView({ ev }: ViewProps) {
  const segs = ev.model.segments as { p: number[]; dn: number | null }[];
  const max = Math.max(1e-30, ...segs.map((s) => Math.abs(s.dn ?? 0)));
  const per = Math.max(1, Math.round(segs.length / (4 * Math.max(1, ev.params.n as number))));
  return (
    <g className="v-tiling" role="img" aria-label={`Surface split into ${String(ev.model.count)} patches`}>
      {segs.map((s, i) => {
        const b = segs[(i + 1) % segs.length]!;
        const [x1, y1] = toSvg(s.p);
        const [x2, y2] = toSvg(b.p);
        const c = s.dn ?? 0;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={c >= 0 ? "shade-out" : "shade-in"} strokeOpacity={0.15 + (0.85 * Math.abs(c)) / max} />;
      })}
      <path d={pathD(segs.map((s) => s.p))} className="ink-surface" fill="none" />
      {segs.filter((_, i) => i % per === 0).map((s, i) => {
        const [x, y] = toSvg(s.p);
        return <circle key={i} cx={x} cy={y} r={2} className="fill-paper ink" />;
      })}
    </g>
  );
}

/** HTML overlay: KaTeX with \htmlClass term keys. Clicking a term reports its key for focus links. */
export function EquationView({ ev, onTerm }: { ev: Evaluated; onTerm?: (key: string) => void }) {
  return (
    <div
      className="plate-equation"
      onClick={(e) => {
        const key = [...((e.target as HTMLElement).closest("[class*='t-']")?.classList ?? [])].find((c) => c.startsWith("t-"));
        if (key) onTerm?.(key);
      }}
    >
      <Tex latex={ev.params.latex as string} display />
    </div>
  );
}

export const views2d: Record<string, ComponentType<ViewProps>> = {
  charges: ChargesView,
  "coulomb-force": CoulombForceView,
  "e-probe": EProbeView,
  "field-arrows": FieldArrowsView,
  "field-profile": FieldProfileView,
  "gaussian-surface": GaussianSurfaceView,
  "faraday-spheres": FaradaySpheresView,
  axes: AxesView,
  "dimension-callout": DimensionCalloutView,
  "uniform-field": UniformFieldView,
  "flat-patch": FlatPatchView,
  vector: VectorView,
  "patch-tiling": PatchTilingView,
  axes3: Axes3View,
  vector3: Vector3View,
  "coord-frame": CoordFrameView,
  boundary: BoundaryView,
  capacitor: CapacitorView,
  "scalar-slice": ScalarSliceView,
  "vector-slice": VectorSliceView,
  "coord-region": CoordRegionView,
  "line-work": LineWorkView,
  conductor: ConductorView,
  spectrum: SpectrumView,
  "unit-convert": UnitConvertView,
};

export const overlayViews = { equation: EquationView };
