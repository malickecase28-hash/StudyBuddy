"use client";

import type { LabCharge, LabSurface } from "@studybuddy/course-em1";
import { blobRadius, fluxDensity, norm, type Vec3 } from "@studybuddy/physics";
import { useRef, useState } from "react";
import type { LabColors } from "./colors";

const W = 520;
const H = 380;
const SCALE = 90; // px per metre
const toPx = (x: number, z: number) => [W / 2 + x * SCALE, H / 2 + z * SCALE] as const;

/**
 * 2D fallback: the horizontal (x–z) slice through the lab. Same physics, same readouts.
 * Used when WebGL is unavailable, on request, or in low-power + reduced-motion mode.
 */
export function GaussLab2D({
  charges,
  surface,
  colors,
  onMove,
}: {
  charges: LabCharge[];
  surface: LabSurface | null;
  colors: LabColors;
  onMove: (id: string, pos: [number, number, number]) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const cs = charges.map((c) => ({ kind: "point" as const, q: c.q * 1e-6, pos: c.pos as Vec3 }));

  const arrows: { x: number; z: number; dx: number; dz: number; t: number }[] = [];
  if (cs.length) {
    const pts: [number, number][] = [];
    for (let i = -6; i <= 6; i++) for (let j = -4; j <= 4; j++) pts.push([i * 0.36, j * 0.36]);
    const vals = pts.map(([x, z]) => fluxDensity(cs, [x, 0, z]));
    const mags = vals.map(norm);
    const lo = Math.log10(Math.min(...mags.filter((m) => m > 0)));
    const hi = Math.log10(Math.max(...mags));
    pts.forEach(([x, z], i) => {
      const d = vals[i]!;
      const m = mags[i]!;
      if (m === 0 || cs.some((c) => Math.hypot(c.pos[0] - x, c.pos[2] - z) < 0.2)) return;
      const inPlane = Math.hypot(d[0], d[2]);
      if (inPlane / m < 0.2) return;
      arrows.push({ x, z, dx: d[0] / inPlane, dz: d[2] / inPlane, t: hi > lo ? (Math.log10(m) - lo) / (hi - lo) : 1 });
    });
  }

  const outline = (() => {
    if (!surface) return null;
    const [cx, cz] = toPx(surface.center[0], surface.center[2]);
    if (surface.kind === "cube") {
      const s = surface.side * SCALE;
      return <rect x={cx - s / 2} y={cz - s / 2} width={s} height={s} fill="none" stroke={colors.surface} strokeWidth={2} strokeDasharray="6 4" />;
    }
    const pts = Array.from({ length: 121 }, (_, i) => {
      const phi = (i / 120) * 2 * Math.PI;
      // Slice y = 0 (physics y); in physics coordinates this plane is θ measured from z.
      const theta = Math.atan2(Math.abs(Math.cos(phi)), Math.sin(phi)); // point direction (cos φ, 0, sin φ)
      const r = surface.kind === "sphere" ? surface.radius : blobRadius({ kind: "blob", center: [0, 0, 0], radius: surface.radius, amplitude: surface.amplitude, lobes: surface.lobes }, theta, Math.cos(phi) >= 0 ? 0 : Math.PI);
      const [x, z] = toPx(surface.center[0] + r * Math.cos(phi), surface.center[2] + r * Math.sin(phi));
      return `${x},${z}`;
    }).join(" ");
    return <polygon points={pts} fill="none" stroke={colors.surface} strokeWidth={2} strokeDasharray="6 4" />;
  })();

  const pointer = (e: React.PointerEvent) => {
    if (!drag || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) * (W / r.width) - W / 2) / SCALE;
    const z = ((e.clientY - r.top) * (H / r.height) - H / 2) / SCALE;
    const ch = charges.find((c) => c.id === drag);
    if (ch) onMove(drag, [Number(x.toFixed(3)), ch.pos[1], Number(z.toFixed(3))]);
  };

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full touch-none select-none"
      role="img"
      aria-label="2D slice of the Gauss lab: field arrows, Gaussian surface outline and charges"
      onPointerMove={pointer}
      onPointerUp={() => setDrag(null)}
      onPointerLeave={() => setDrag(null)}
    >
      {arrows.map((a, i) => {
        const [x, y] = toPx(a.x, a.z);
        const len = 10 + 16 * a.t;
        return (
          <line
            key={i}
            x1={x - (a.dx * len) / 2}
            y1={y - (a.dz * len) / 2}
            x2={x + (a.dx * len) / 2}
            y2={y + (a.dz * len) / 2}
            stroke={colors.field}
            strokeOpacity={0.35 + 0.6 * a.t}
            strokeWidth={1.6}
            markerEnd="url(#arrowhead)"
          />
        );
      })}
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={colors.field} />
        </marker>
      </defs>
      {outline}
      {charges.map((c) => {
        const [x, y] = toPx(c.pos[0], c.pos[2]);
        return (
          <g
            key={c.id}
            transform={`translate(${x},${y})`}
            style={{ cursor: c.draggable ? "grab" : "default" }}
            onPointerDown={() => c.draggable && setDrag(c.id)}
            tabIndex={c.draggable ? 0 : -1}
            role={c.draggable ? "button" : undefined}
            aria-label={`${c.q > 0 ? "+" : "−"}${Math.abs(c.q)} microcoulomb charge${c.draggable ? ", use arrow keys to move" : ""}`}
            onKeyDown={(e) => {
              if (!c.draggable) return;
              const step = 0.1;
              const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
              const m = d[e.key];
              if (m) {
                e.preventDefault();
                onMove(c.id, [Number((c.pos[0] + m[0]).toFixed(3)), c.pos[1], Number((c.pos[2] + m[1]).toFixed(3))]);
              }
            }}
          >
            <circle r={9} fill={colors.charge} />
            <text y={4} textAnchor="middle" fontSize={12} fill="#fff" fontWeight={700}>
              {c.q > 0 ? "+" : "−"}
            </text>
            <text y={-14} textAnchor="middle" fontSize={11} fill={colors.charge} fontWeight={600}>
              {Math.abs(c.q)} µC
            </text>
          </g>
        );
      })}
    </svg>
  );
}
