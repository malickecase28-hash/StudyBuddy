"use client";

import { fromSvg3, PX, toSvg3, unitVectorsAt } from "@forma/plate";
import type { KeyboardEvent, PointerEvent } from "react";
import { usePlateStage } from "./stage-context";
import type { ViewProps } from "./views2d";

const r2 = (v: number) => Math.round(v * 100) / 100;
const STEP = 0.1;

function Arrow({ from, to, tone, label }: { from: readonly number[]; to: readonly number[]; tone: string; label?: string }) {
  const [x1, y1] = toSvg3(from);
  const [x2, y2] = toSvg3(to);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: `var(--${tone})` }} strokeWidth={1.6} markerEnd={`url(#arrow-${tone === "ink" ? "graphite" : tone})`} />
      {label && <text x={x2 + 6} y={y2 - 6} className="plate-label">{label}</text>}
    </g>
  );
}

export function Axes3View({ ev }: ViewProps) {
  const L = (ev.params as { length: number }).length;
  return (
    <g className="v-axes3" role="img" aria-label="x, y and z axes">
      <Arrow from={[0, 0, 0]} to={[L, 0, 0]} tone="graphite" label="x" />
      <Arrow from={[0, 0, 0]} to={[0, L, 0]} tone="graphite" label="y" />
      <Arrow from={[0, 0, 0]} to={[0, 0, L]} tone="graphite" label="z" />
    </g>
  );
}

export function Vector3View({ ev }: ViewProps) {
  const raw = ev.params as { from: number[]; to: number[]; label: string; tone: string; components: boolean; drawScale: number };
  const p = { ...raw, from: raw.from.map((v) => v * raw.drawScale), to: raw.to.map((v) => v * raw.drawScale) };
  const m = { vmag: (ev.model.vmag ?? ev.model.vmagm) as number };
  const [fx, fy, fz] = p.from as [number, number, number];
  const [tx, ty, tz] = p.to as [number, number, number];
  const dashed = (a: number[], b: number[]) => {
    const [x1, y1] = toSvg3(a);
    const [x2, y2] = toSvg3(b);
    return <line x1={x1} y1={y1} x2={x2} y2={y2} className="ink" strokeDasharray="3 3" />;
  };
  return (
    <g className="v-vector3" role="img" aria-label={`Vector ${p.label}, magnitude ${m.vmag.toFixed(3)}`}>
      {p.components && (
        <g opacity={0.7}>
          {dashed([fx, fy, fz], [tx, fy, fz])}
          {dashed([tx, fy, fz], [tx, ty, fz])}
          {dashed([tx, ty, fz], [tx, ty, tz])}
        </g>
      )}
      <Arrow from={p.from} to={p.to} tone={p.tone} label={p.label} />
    </g>
  );
}

const SYS_LABELS = { cart: ["aₓ", "a_y", "a_z"], cyl: ["a_ρ", "a_φ", "a_z"], sph: ["a_r", "a_θ", "a_φ"] } as const;

export function CoordFrameView({ id, ev }: ViewProps) {
  const stage = usePlateStage();
  const raw = ev.params as { point: [number, number, number]; system: "cart" | "cyl" | "sph"; unitVectors: boolean; draggable: boolean; drawScale: number };
  const k = raw.drawScale;
  // Draw at k × the true point; edits divide back out so the model always holds the true coordinates.
  const p = { ...raw, point: raw.point.map((v) => v * k) as [number, number, number] };
  const [x, y, z] = p.point;
  const can = p.draggable && stage.editable(id);
  const move = (pt: [number, number, number]) => stage.edit(id, { point: pt.map((v) => r2(v / k)) });
  const [sx, sy] = toSvg3(p.point);
  const foot = toSvg3([x, y, 0]);
  const origin = toSvg3([0, 0, 0]);
  const onPointerDown = (e: PointerEvent<SVGGElement>) => can && e.currentTarget.setPointerCapture(e.pointerId);
  const onPointerMove = (e: PointerEvent<SVGGElement>) => {
    if (!can || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const [mx, , mz] = stage.toMetres(e.clientX, e.clientY);
    move(fromSvg3(mx * PX, -mz * PX, x) as [number, number, number]);
  };
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (!can) return;
    const d: Record<string, [number, number, number]> = e.shiftKey
      ? { ArrowUp: [-STEP, 0, 0], ArrowDown: [STEP, 0, 0] }
      : { ArrowLeft: [0, -STEP, 0], ArrowRight: [0, STEP, 0], ArrowUp: [0, 0, STEP], ArrowDown: [0, 0, -STEP] };
    const k = d[e.key];
    if (!k) return;
    e.preventDefault();
    move([x + k[0], y + k[1], z + k[2]]);
  };
  const label = `Point at x ${x.toFixed(2)} m, y ${y.toFixed(2)} m, z ${z.toFixed(2)} m`;
  const a11y = can
    ? { tabIndex: 0, role: "button", "aria-label": `${label}. Drag, or use the arrow keys (y and z) and Shift with Up or Down (x), to move it.`, onPointerDown, onPointerMove, onKeyDown }
    : { role: "img", "aria-label": label };
  const units = p.unitVectors ? unitVectorsAt(p.point, p.system) : [];
  return (
    <g className="v-coord-frame">
      <line x1={origin[0]} y1={origin[1]} x2={foot[0]} y2={foot[1]} className="ink" strokeDasharray="4 3" />
      <line x1={foot[0]} y1={foot[1]} x2={sx} y2={sy} className="ink" strokeDasharray="4 3" />
      {units.map((u, i) => (
        <Arrow key={i} from={p.point} to={[x + 0.6 * u[0], y + 0.6 * u[1], z + 0.6 * u[2]]} tone={["field", "flux", "surface"][i]!} label={SYS_LABELS[p.system][i]} />
      ))}
      <g transform={`translate(${sx} ${sy})`} className={can ? "handle" : undefined} {...a11y}>
        <circle r={5} className="fill-charge" />
        {can && <circle r={14} className="handle-ring" />}
      </g>
    </g>
  );
}
