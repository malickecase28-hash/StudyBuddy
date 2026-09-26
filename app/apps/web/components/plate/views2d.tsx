"use client";

import { PX, pathD, toSvg, type Evaluated } from "@forma/plate";
import type { ComponentType, KeyboardEvent, PointerEvent } from "react";
import { Tex } from "../Tex";
import { usePlateStage } from "./stage-context";

export type ViewProps = { id: string; ev: Evaluated; appear: number; focused: boolean; highlighted: boolean };

type V3 = [number, number, number];
type Item =
  | { id: string; kind: "point"; q: number; pos: V3; draggable: boolean }
  | { id: string; kind: "line"; rhoL: number; x: number; y: number }
  | { id: string; kind: "sheet"; rhoS: number; z0: number };

const r2 = (v: number) => Math.round(v * 100) / 100;
const STEP = 0.1; // metres per arrow-key press
const KEYS: Record<string, [number, number]> = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, STEP], ArrowDown: [0, -STEP] };

function ChargesView({ id, ev }: ViewProps) {
  const stage = usePlateStage();
  const items = ev.params.items as Item[];
  const move = (itemId: string, pos: V3) => stage.edit(id, { items: items.map((it) => (it.id === itemId && it.kind === "point" ? { ...it, pos } : it)) });
  return (
    <g className="v-charges">
      {items.map((it) => {
        if (it.kind === "line") {
          const [x] = toSvg([it.x, 0, 0]);
          return (
            <g key={it.id} role="img" aria-label={`Line charge ${it.rhoL} nC per metre`}>
              <line x1={x} x2={x} y1={-180} y2={180} className="ink-charge" strokeDasharray="6 4" />
              <text x={x + 6} y={-166} className="plate-label">{`ρL ${it.rhoL} nC/m`}</text>
            </g>
          );
        }
        if (it.kind === "sheet") {
          const [, y] = toSvg([0, 0, it.z0]);
          return (
            <g key={it.id} role="img" aria-label={`Sheet charge ${it.rhoS} µC per square metre`}>
              <rect x={-260} y={y - 3} width={520} height={6} fill="url(#hatch-charge)" />
              <text x={-252} y={y - 8} className="plate-label">{`ρS ${it.rhoS} µC/m²`}</text>
            </g>
          );
        }
        const [x, y] = toSvg(it.pos);
        const can = it.draggable && stage.editable(id);
        const label = `${it.q > 0 ? "+" : ""}${it.q} µC`;
        const onPointerDown = (e: PointerEvent<SVGGElement>) => can && e.currentTarget.setPointerCapture(e.pointerId);
        const onPointerMove = (e: PointerEvent<SVGGElement>) => {
          if (!can || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const [mx, , mz] = stage.toMetres(e.clientX, e.clientY);
          move(it.id, [r2(mx), it.pos[1], r2(mz)]);
        };
        const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
          const d = KEYS[e.key];
          if (!can || !d) return;
          e.preventDefault();
          move(it.id, [r2(it.pos[0] + d[0]), it.pos[1], r2(it.pos[2] + d[1])]);
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
  "field-arrows": FieldArrowsView,
  "field-profile": FieldProfileView,
  "gaussian-surface": GaussianSurfaceView,
  "faraday-spheres": FaradaySpheresView,
  axes: AxesView,
  "dimension-callout": DimensionCalloutView,
};

export const overlayViews = { equation: EquationView };
