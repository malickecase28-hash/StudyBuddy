"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { labReadout, type GaussLabConfig, type LabCharge, type LabState, type LabSurface } from "@studybuddy/course-em1";
import { blobRadius, dot, fluxDensity, norm, type Vec3 } from "@studybuddy/physics";
import * as slider from "@zag-js/slider";
import { normalizeProps, useMachine } from "@zag-js/react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useStudy } from "@/lib/store";
import { hasWebGL, useLabColors, type LabColors } from "./colors";
import { GaussLab2D } from "./GaussLab2D";

type Show = GaussLabConfig["show"];

const toCharges = (cs: LabCharge[]) => cs.map((c) => ({ kind: "point" as const, q: c.q * 1e-6, pos: c.pos as Vec3 }));
const sizeOf = (s: LabSurface) => (s.kind === "cube" ? s.side : s.radius);
const withSize = (s: LabSurface, v: number): LabSurface => (s.kind === "cube" ? { ...s, side: v } : { ...s, radius: v });
const fmtQ = (x: number) => `${Math.abs(x) < 0.005 ? "0.00" : x.toFixed(2)} µC`;

/**
 * Interactive Gauss's-law lab. Physics comes from @studybuddy/physics, so what the learner
 * sees is governed by the same maths the course's answers are verified against.
 */
export default function GaussLab({
  config,
  initialState,
  onChange,
  footer,
  onFreeze,
}: {
  config: GaussLabConfig;
  initialState?: LabState;
  onChange?: (s: LabState) => void;
  footer?: ReactNode;
  onFreeze?: (s: LabState) => void;
}) {
  const settings = useStudy((s) => s.learner.settings);
  const labFocus = useStudy((s) => s.labFocus);
  const colors = useLabColors();
  const [charges, setCharges] = useState<LabCharge[]>(initialState?.charges ?? config.charges);
  const [surface, setSurface] = useState<LabSurface | null>(initialState?.surface ?? config.surface);
  const [show, setShow] = useState<Show>(config.show);
  const [dragging, setDragging] = useState<string | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [flat, setFlat] = useState(false);
  useEffect(() => setWebgl(hasWebGL()), []);

  const state = useMemo<LabState>(() => ({ charges, surface }), [charges, surface]);
  useEffect(() => onChange?.(state), [state, onChange]);
  const readout = useMemo(() => labReadout(state, settings.simQuality === "high" ? 32 : 20), [state, settings.simQuality]);

  const use2D = !webgl || flat || (settings.simQuality === "low" && settings.motion === "reduced");
  const baseSize = config.surface ? sizeOf(config.surface) : 1;

  return (
    <div className="overflow-hidden rounded-xl border border-line" style={{ background: colors.bg }}>
      <div className="relative h-[380px]">
        {use2D ? (
          <GaussLab2D charges={charges} surface={surface} colors={colors} onMove={(id, pos) => setCharges((cs) => cs.map((c) => (c.id === id ? { ...c, pos } : c)))} />
        ) : (
          <Canvas camera={{ position: [2.4, 2.1, 3.1], fov: 42 }} dpr={settings.simQuality === "low" ? 1 : [1, 2]} aria-label="3D Gauss's law lab">
            <ambientLight intensity={0.9} />
            <directionalLight position={[3, 5, 4]} intensity={0.8} />
            <OrbitControls enabled={!dragging} enablePan={false} minDistance={2} maxDistance={8} />
            <gridHelper args={[4, 8, colors.ink, colors.ink]} position={[0, -1.6, 0]} material-opacity={0.08} material-transparent />
            {show.field && <FieldArrows charges={charges} colors={colors} quality={settings.simQuality} focus={labFocus.includes("t-flux")} />}
            {surface && (
              <SurfaceMesh
                surface={surface}
                charges={charges}
                colors={colors}
                contributions={show.contributions}
                normals={show.normals}
                focus={labFocus.includes("t-surface")}
              />
            )}
            {charges.map((c) => (
              <ChargeMesh
                key={c.id}
                charge={c}
                colors={colors}
                focus={labFocus.includes("t-charge")}
                onGrab={() => c.draggable && setDragging(c.id)}
              />
            ))}
            {dragging && (
              <DragPlane
                y={charges.find((c) => c.id === dragging)?.pos[1] ?? 0}
                onMove={(p) => setCharges((cs) => cs.map((c) => (c.id === dragging ? { ...c, pos: p } : c)))}
                onRelease={() => setDragging(null)}
              />
            )}
          </Canvas>
        )}
        {readout && show.readout && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-raised/90 px-3 py-2 text-sm shadow-sm" aria-live="polite">
            <div>
              <span className="sem-flux">Ψ</span> = ∮ D·dS = <strong>{fmtQ(readout.psi)}</strong>
            </div>
            <div>
              <span className="sem-charge">Q</span>
              <sub>enc</sub> = <strong>{fmtQ(readout.qenc)}</strong>
            </div>
          </div>
        )}
        {charges.length > 0 && (
          <ul className="pointer-events-none absolute right-3 top-3 space-y-0.5 rounded-lg bg-raised/90 px-3 py-2 text-xs shadow-sm" aria-label="Charges">
            {charges.map((c) => {
              const inside = surface ? Math.abs(labReadout({ charges: [c], surface }, 8)!.qenc) > 0 : null;
              return (
                <li key={c.id}>
                  <span className="sem-charge">
                    {c.q > 0 ? "+" : "−"}
                    {+Math.abs(c.q).toPrecision(3)} µC
                  </span>
                  {c.q < 0 && <span className="text-faint"> (hollow)</span>}
                  {inside !== null && <span className="text-soft"> · {inside ? "inside" : "outside"}</span>}
                </li>
              );
            })}
          </ul>
        )}
        {!use2D && charges.some((c) => c.draggable) && (
          <p className="pointer-events-none absolute bottom-2 left-3 text-xs text-faint">Drag a charge to move it · drag empty space to orbit</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-raised px-3 py-2 text-sm">
        {config.shapes.length > 0 &&
          surface &&
          config.shapes.map((k) => (
            <button
              key={k}
              className="btn py-1 text-xs data-[on=true]:border-ink data-[on=true]:bg-sunken"
              data-on={surface.kind === k}
              onClick={() => {
                const c = surface.center;
                const s = sizeOf(surface);
                setSurface(k === "cube" ? { kind: "cube", center: c, side: s * 1.7 } : k === "sphere" ? { kind: "sphere", center: c, radius: surface.kind === "cube" ? s / 1.7 : s } : { kind: "blob", center: c, radius: surface.kind === "cube" ? s / 1.7 : s, amplitude: 0.22, lobes: 3 });
              }}
            >
              {k === "blob" ? "Lumpy blob" : k[0]!.toUpperCase() + k.slice(1)}
            </button>
          ))}
        {config.resizable && surface && (
          <SizeSlider value={sizeOf(surface)} min={baseSize * 0.4} max={baseSize * 2} label={surface.kind === "cube" ? "Side" : "Radius"} onChange={(v) => setSurface(withSize(surface, v))} />
        )}
        {config.toggles.map((t) => (
          <label key={t} className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={show[t]} onChange={(e) => setShow((s) => ({ ...s, [t]: e.target.checked }))} />
            {t === "field" ? "D arrows" : t === "normals" ? "Normals dS" : "Patch flux"}
          </label>
        ))}
        {config.addCharge && (
          <button
            className="btn py-1 text-xs"
            onClick={() => setCharges((cs) => [...cs, { id: `c${cs.length + 1}`, q: cs.length % 2 ? -1 : 1, pos: [0.4 * cs.length - 0.8, 0, 0.6], draggable: true }])}
          >
            + Charge
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {webgl && (
            <button className="btn py-1 text-xs" onClick={() => setFlat((f) => !f)}>
              {flat ? "3D view" : "2D slice"}
            </button>
          )}
          {onFreeze && (
            <button className="btn py-1 text-xs" onClick={() => onFreeze(state)} title="Save this exact setup to your notebook">
              Save state to notebook
            </button>
          )}
        </div>
      </div>
      {surface && show.contributions && (
        <p className="border-t border-line bg-raised px-3 pb-2 text-xs text-soft">
          Patch shading: <span className="sem-flux">violet</span> = flux leaving, <span className="sem-surface">amber</span> = flux entering. Deeper = more.
        </p>
      )}
      {footer}
    </div>
  );
}

function SizeSlider({ value, min, max, label, onChange }: { value: number; min: number; max: number; label: string; onChange: (v: number) => void }) {
  const service = useMachine(slider.machine, {
    id: useId(),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    step: 0.01,
    defaultValue: [value],
    onValueChange: (d) => onChange(d.value[0]!),
  });
  const api = slider.connect(service, normalizeProps);
  return (
    <div {...api.getRootProps()} className="flex w-56 items-center gap-2">
      <label {...api.getLabelProps()} className="text-xs text-soft">
        {label} {api.value[0]?.toFixed(2)} m
      </label>
      <div {...api.getControlProps()} className="relative flex h-5 flex-1 items-center">
        <div {...api.getTrackProps()} className="h-1 w-full rounded bg-line">
          <div {...api.getRangeProps()} className="h-1 rounded" style={{ background: "var(--sem-surface)" }} />
        </div>
        {api.value.map((_, i) => (
          <div key={i} {...api.getThumbProps({ index: i })} className="h-4 w-4 rounded-full border-2 bg-raised" style={{ borderColor: "var(--sem-surface)" }}>
            <input {...api.getHiddenInputProps({ index: i })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChargeMesh({ charge, colors, focus, onGrab }: { charge: LabCharge; colors: LabColors; focus: boolean; onGrab: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const r = 0.05 + 0.03 * Math.cbrt(Math.abs(charge.q));
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(focus ? 1 + 0.25 * Math.sin(clock.elapsedTime * 6) ** 2 : 1);
  });
  return (
    <mesh
      ref={ref}
      position={charge.pos as unknown as [number, number, number]}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onGrab();
      }}
    >
      <sphereGeometry args={[r, 24, 16]} />
      <meshStandardMaterial color={colors.charge} emissive={colors.charge} emissiveIntensity={charge.q < 0 ? 0.05 : 0.35} wireframe={charge.q < 0} />
    </mesh>
  );
}

function DragPlane({ y, onMove, onRelease }: { y: number; onMove: (p: [number, number, number]) => void; onRelease: () => void }) {
  useEffect(() => {
    window.addEventListener("pointerup", onRelease);
    return () => window.removeEventListener("pointerup", onRelease);
  }, [onRelease]);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, y, 0]}
      onPointerMove={(e) => {
        const clamp = (v: number) => Math.max(-2.2, Math.min(2.2, v));
        onMove([Number(clamp(e.point.x).toFixed(3)), y, Number(clamp(e.point.z).toFixed(3))]);
      }}
    >
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** D-field arrows on a grid; length ∝ log|D| so the 1/r² fall-off stays readable. */
function FieldArrows({ charges, colors, quality, focus }: { charges: LabCharge[]; colors: LabColors; quality: string; focus: boolean }) {
  const group = useMemo(() => {
    const g = new THREE.Group();
    const cs = toCharges(charges);
    if (cs.length === 0) return g;
    const n = quality === "high" ? 7 : quality === "balanced" ? 5 : 4;
    const pts: Vec3[] = [];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        for (let k = 0; k < n; k++) {
          const t = (x: number) => -1.6 + (3.2 * x) / (n - 1);
          const p: Vec3 = [t(i), t(j), t(k)];
          if (cs.every((c) => norm([p[0] - c.pos[0], p[1] - c.pos[1], p[2] - c.pos[2]]) > 0.25)) pts.push(p);
        }
    const vals = pts.map((p) => fluxDensity(cs, p));
    const mags = vals.map(norm).filter((m) => m > 0);
    const lo = Math.log10(Math.min(...mags));
    const hi = Math.log10(Math.max(...mags));
    const color = new THREE.Color(colors.field);
    pts.forEach((p, i) => {
      const d = vals[i]!;
      const m = norm(d);
      if (m === 0) return;
      const t = hi > lo ? (Math.log10(m) - lo) / (hi - lo) : 1;
      const len = 0.08 + 0.26 * t;
      const arrow = new THREE.ArrowHelper(new THREE.Vector3(d[0] / m, d[1] / m, d[2] / m), new THREE.Vector3(...p), len, color, 0.06, 0.04);
      (arrow.line.material as THREE.LineBasicMaterial).transparent = true;
      (arrow.line.material as THREE.LineBasicMaterial).opacity = 0.35 + 0.6 * t;
      g.add(arrow);
    });
    return g;
  }, [charges, colors.field, quality]);
  useEffect(
    () => () =>
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose?.();
      }),
    [group],
  );
  useFrame(({ clock }) => {
    group.scale.setScalar(focus ? 1 + 0.04 * Math.sin(clock.elapsedTime * 6) : 1);
  });
  return <primitive object={group} />;
}

function buildGeometry(s: LabSurface): THREE.BufferGeometry {
  if (s.kind === "cube") return new THREE.BoxGeometry(s.side, s.side, s.side, 10, 10, 10);
  const g = new THREE.SphereGeometry(1, 64, 44);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // Physics uses z as the polar axis; map each unit-sphere vertex through the same radius function.
    const theta = Math.acos(Math.max(-1, Math.min(1, z)));
    const phi = Math.atan2(y, x);
    const r = s.kind === "sphere" ? s.radius : blobRadius({ kind: "blob", center: [0, 0, 0], radius: s.radius, amplitude: s.amplitude, lobes: s.lobes }, theta, phi);
    pos.setXYZ(i, x * r, y * r, z * r);
  }
  g.computeVertexNormals();
  return g;
}

function SurfaceMesh({
  surface,
  charges,
  colors,
  contributions,
  normals,
  focus,
}: {
  surface: LabSurface;
  charges: LabCharge[];
  colors: LabColors;
  contributions: boolean;
  normals: boolean;
  focus: boolean;
}) {
  const geometry = useMemo(() => buildGeometry(surface), [surface]);
  const center = surface.center as unknown as [number, number, number];

  // Vertex colours: violet where flux leaves (D·n > 0), amber where it enters; intensity ∝ |D·n|.
  useMemo(() => {
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const nor = geometry.attributes.normal as THREE.BufferAttribute;
    const cs = toCharges(charges);
    const vals: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const p: Vec3 = [pos.getX(i) + center[0], pos.getY(i) + center[1], pos.getZ(i) + center[2]];
      vals.push(cs.length ? dot(fluxDensity(cs, p), [nor.getX(i), nor.getY(i), nor.getZ(i)]) : 0);
    }
    const max = Math.max(...vals.map(Math.abs), 1e-30);
    const out = new THREE.Color(colors.flux);
    const inn = new THREE.Color(colors.surface);
    const base = new THREE.Color(colors.bg);
    const arr = new Float32Array(pos.count * 3);
    vals.forEach((v, i) => {
      const c = base.clone().lerp(v >= 0 ? out : inn, contributions ? 0.15 + 0.85 * Math.sqrt(Math.abs(v) / max) : 0.35);
      arr.set([c.r, c.g, c.b], i * 3);
    });
    geometry.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  }, [geometry, charges, colors, contributions, center]);

  const normalArrows = useMemo(() => {
    const g = new THREE.Group();
    if (!normals) return g;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const nor = geometry.attributes.normal as THREE.BufferAttribute;
    const color = new THREE.Color(colors.surface);
    const step = Math.max(1, Math.floor(pos.count / 60));
    for (let i = 0; i < pos.count; i += step) {
      g.add(
        new THREE.ArrowHelper(
          new THREE.Vector3(nor.getX(i), nor.getY(i), nor.getZ(i)),
          new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)),
          0.22,
          color,
          0.06,
          0.04,
        ),
      );
    }
    return g;
  }, [geometry, normals, colors.surface]);

  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = focus ? 0.55 + 0.25 * Math.sin(clock.elapsedTime * 6) ** 2 : 0.55;
  });

  return (
    <group position={center}>
      <mesh geometry={geometry}>
        <meshStandardMaterial ref={mat} vertexColors transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} roughness={0.9} />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={colors.surface} wireframe transparent opacity={focus ? 0.5 : 0.12} />
      </mesh>
      <primitive object={normalArrows} />
    </group>
  );
}
