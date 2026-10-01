"use client";

import { fromSvg3, PX, toSvg3, unitVectorsAt } from "@forma/plate";
import { cross, dot, norm, normalize, type Current, type Vec3 } from "@forma/physics";
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

export function BoundaryView({ ev }: ViewProps) {
  const p = ev.params as { er1?: number; er2?: number; mur1?: number; mur2?: number; conductor?: boolean; anchor: [number, number, number] };
  const d = ev.model.draw as { n: Vec3; D1: Vec3; D2: Vec3; D1n: Vec3; D1t: Vec3; split: boolean; sym?: string; mat?: string };
  const sym = d.sym ?? "D", mat = d.mat ?? "εr";
  const m1 = p.er1 ?? p.mur1 ?? 1, m2 = p.er2 ?? p.mur2 ?? 1;
  const c = p.anchor;
  const at = (...terms: [number, Vec3][]): number[] => terms.reduce((s, [k, v]) => [s[0]! + k * v[0], s[1]! + k * v[1], s[2]! + k * v[2]], [...c] as number[]);
  const t1 = normalize(cross(d.n, Math.abs(d.n[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]));
  const t2 = cross(d.n, t1);
  const quad = [at([1.2, t1], [1.2, t2]), at([1.2, t1], [-1.2, t2]), at([-1.2, t1], [-1.2, t2]), at([-1.2, t1], [1.2, t2])].map((q) => toSvg3(q).join(",")).join(" ");
  const k = 1.2 / Math.max(norm(d.D1), norm(d.D2), 1e-30);
  const into2 = dot(d.D1, d.n) < 0;
  const fmt = (x: number) => String(Number(x.toPrecision(4)));
  const label = (pt: number[], text: string) => { const [x, y] = toSvg3(pt); return <text x={x} y={y} className="plate-label">{text}</text>; };
  const [n0, n1] = [toSvg3(at([-1.3, d.n])), toSvg3(at([1.3, d.n]))];
  return (
    <g className="v-boundary" role="img" aria-label={`Boundary between region 1 (${mat} ${fmt(m1)}) and region 2 (${p.conductor ? "a conductor" : `${mat} ${fmt(m2)}`})`}>
      <polygon points={quad} fill={p.conductor ? "var(--graphite)" : "url(#hatch-graphite)"} fillOpacity={p.conductor ? 0.35 : 1} stroke="var(--surface)" />
      <line x1={n0[0]} y1={n0[1]} x2={n1[0]} y2={n1[1]} className="ink" strokeDasharray="3 3" />
      {label(at([1.4, d.n]), "n̂")}
      {label(at([0.9, d.n], [1, t1]), `Region 1 · ${mat} = ${fmt(m1)}`)}
      {label(at([-0.9, d.n], [1, t1]), p.conductor ? "Region 2 · conductor" : `Region 2 · ${mat} = ${fmt(m2)}`)}
      {into2 ? <Arrow from={at([-k, d.D1])} to={[...c]} tone="flux" label={`${sym}₁`} /> : <Arrow from={[...c]} to={at([k, d.D1])} tone="flux" label={`${sym}₁`} />}
      {!p.conductor && norm(d.D2) > 0 && (into2 ? <Arrow from={[...c]} to={at([k, d.D2])} tone="flux" label={`${sym}₂`} /> : <Arrow from={at([-k, d.D2])} to={[...c]} tone="flux" label={`${sym}₂`} />)}
      {d.split && <g opacity={0.7}><Arrow from={[...c]} to={at([k, d.D1n])} tone="surface" label={`${sym}₁ₙ`} /><Arrow from={[...c]} to={at([k, d.D1t])} tone="surface" label={`${sym}₁ₜ`} /></g>}
    </g>
  );
}

export function CurrentsView({ ev }: ViewProps) {
  const p = ev.params as { items: Current[]; probe: Vec3; drawScale: number };
  const m = ev.model as { Hx: number; Hy: number; Hz: number; Hmag: number };
  const k = p.drawScale;
  const scaled = (v: Vec3): Vec3 => [v[0] * k, v[1] * k, v[2] * k];
  const circle = (r: number, z: number, reverse = false) => Array.from({ length: 49 }, (_, i) => {
    const a = ((reverse ? -1 : 1) * i * 2 * Math.PI) / 48;
    return toSvg3([r * Math.cos(a) * k, r * Math.sin(a) * k, z * k]).join(",");
  }).join(" ");
  const H: Vec3 = [m.Hx, m.Hy, m.Hz];
  const hp = scaled(p.probe);
  const hn = m.Hmag > 0 ? normalize(H) : [0, 0, 0];
  const end: Vec3 = [hp[0] + hn[0] * 0.8, hp[1] + hn[1] * 0.8, hp[2] + hn[2] * 0.8];
  const [px, py] = toSvg3(hp);
  const [ex, ey] = toSvg3(end);
  return (
    <g role="img" aria-label={`Currents and the field H at the probe, |H| = ${m.Hmag.toPrecision(4)} A/m`}>
      {p.items.map((c, i) => {
        const key = `${c.kind}-${i}`;
        if (c.kind === "line") {
          const u = normalize(c.dir), a: Vec3 = [c.point[0] - 2.5 * u[0], c.point[1] - 2.5 * u[1], c.point[2] - 2.5 * u[2]], b: Vec3 = [c.point[0] + 2.5 * u[0], c.point[1] + 2.5 * u[1], c.point[2] + 2.5 * u[2]];
          return <Arrow key={key} from={scaled(a)} to={scaled(b)} tone="charge" label={`${c.I} A`} />;
        }
        if (c.kind === "segment") return <Arrow key={key} from={scaled(c.from)} to={scaled(c.to)} tone="charge" label={`${c.I} A`} />;
        if (c.kind === "loop") return <g key={key}>
          <polyline points={circle(c.radius, c.z, c.I < 0)} fill="none" stroke="var(--charge)" strokeWidth={2} markerEnd="url(#arrow-charge)" />
          {c.N > 1 && <text x={toSvg3([c.radius * k, 0, c.z * k])[0] + 5} y={toSvg3([c.radius * k, 0, c.z * k])[1] - 5} className="plate-label">{c.N} turns</text>}
        </g>;
        if (c.kind === "sheet") return <polyline key={key} points={circle(c.radius, 0)} fill="none" stroke="var(--charge)" strokeDasharray="4 3" />;
        return <g key={key}>
          <polygon points={circle(c.b, 0)} fill="url(#hatch-graphite)" stroke="var(--graphite)" strokeWidth={2} />
          {c.a > 0 && <polygon points={circle(c.a, 0)} fill="var(--surface)" stroke="var(--ink)" />}
        </g>;
      })}
      <circle cx={px} cy={py} r={3} fill="var(--field)" />
      {m.Hmag > 0 && <Arrow from={hp} to={end} tone="field" label="H" />}
    </g>
  );
}

export function PlaneWaveView({ ev }: ViewProps) {
  const p = ev.params as { f: number; phi: number; z: number; t: number; drawScale: number };
  const m = ev.model as { alpha: number; beta: number; lambda: number; Eamp: number };
  const points = (axis: "E" | "H" | "envelope", sign = 1) => Array.from({ length: 96 }, (_, i) => {
    const s = (2 * m.lambda * i) / 95;
    const y = (s / m.lambda) * p.drawScale;
    const decay = Math.exp(-m.alpha * s);
    const phase = 2 * Math.PI * p.f * p.t - m.beta * s + (p.phi * Math.PI) / 180;
    const value = axis === "E" ? 0.8 * decay / Math.exp(-m.alpha * p.z) * Math.cos(phase) : axis === "H" ? 0.8 * decay * Math.cos(phase - ((ev.model.thetaEta as number) * Math.PI) / 180) : sign * 0.8 * decay;
    const xyz: Vec3 = axis === "H" ? [value, y, 0] : [0, y, value];
    return toSvg3(xyz).join(",");
  }).join(" ");
  const probe = (p.z / m.lambda) * p.drawScale;
  const [x1, y1] = toSvg3([0, probe, -0.95]);
  const [x2, y2] = toSvg3([0, probe, 0.95]);
  const decay = m.alpha > 0;
  return (
    <g role="img" aria-label={`Plane wave, f = ${p.f.toPrecision(3)} Hz, wavelength ${m.lambda.toPrecision(3)} m${decay ? ", decaying" : ""}`}>
      {decay && <>
        <polyline points={points("envelope", 1)} fill="none" stroke="var(--graphite)" strokeDasharray="4 3" />
        <polyline points={points("envelope", -1)} fill="none" stroke="var(--graphite)" strokeDasharray="4 3" />
      </>}
      <polyline points={points("E")} fill="none" stroke="var(--field)" strokeWidth={2} />
      <polyline points={points("H")} fill="none" stroke="var(--flux)" strokeWidth={2} />
      <text x={toSvg3([0, 0, 0.95])[0] + 5} y={toSvg3([0, 0, 0.95])[1]} className="plate-label">E</text>
      <text x={toSvg3([0.95, 0, 0])[0] + 5} y={toSvg3([0.95, 0, 0])[1]} className="plate-label">H</text>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="ink" strokeWidth={0.7} />
      <Arrow from={[0, 0, 0]} to={[0, 2 * p.drawScale + 0.6, 0]} tone="graphite" label="travel" />
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
