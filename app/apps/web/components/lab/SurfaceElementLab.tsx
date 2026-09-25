"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { hasWebGL, useLabColors } from "./colors";

/**
 * One flat patch dS in a uniform D. Tilting it shows dΨ = |D| dS cos θ, with θ measured from the normal.
 * Config: { tilt: degrees, d: |D| in nC/m² } for a 1 m² patch.
 */
export default function SurfaceElementLab({ config }: { config: { tilt?: number; d?: number } }) {
  const colors = useLabColors();
  const [tilt, setTilt] = useState(config.tilt ?? 0);
  const [webgl, setWebgl] = useState(true);
  useEffect(() => setWebgl(hasWebGL()), []);
  const d = config.d ?? 3;
  const rad = (tilt * Math.PI) / 180;
  const flux = d * Math.cos(rad);

  const arrows = useMemo(() => {
    const g = new THREE.Group();
    const c = new THREE.Color(colors.field);
    for (let i = -2; i <= 2; i++)
      for (let k = -2; k <= 2; k++) g.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(i * 0.35, -1, k * 0.35), 2, c, 0.1, 0.06));
    return g;
  }, [colors.field]);

  const normal = useMemo(
    () => new THREE.ArrowHelper(new THREE.Vector3(0, Math.cos(rad), Math.sin(rad)), new THREE.Vector3(0, 0, 0), 0.9, new THREE.Color(colors.surface), 0.14, 0.09),
    [rad, colors.surface],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-line" style={{ background: colors.bg }}>
      <div className="relative h-[300px]">
        {webgl ? (
          <Canvas camera={{ position: [2.2, 1.2, 2.4], fov: 45 }} aria-label="A surface patch tilted in a uniform field">
            <ambientLight intensity={1} />
            <OrbitControls enablePan={false} />
            <primitive object={arrows} />
            <mesh rotation={[rad - Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial color={colors.surface} transparent opacity={0.45} side={THREE.DoubleSide} />
            </mesh>
            <primitive object={normal} />
          </Canvas>
        ) : (
          <p className="p-6 text-sm text-soft">3D view unavailable. The numbers below still update as you tilt.</p>
        )}
        <div className="absolute left-3 top-3 rounded-lg bg-raised/90 px-3 py-2 text-sm shadow-sm" aria-live="polite">
          θ = {tilt}° · <span className="sem-flux">dΨ</span> = |D| dS cos θ = <strong>{flux.toFixed(2)} nC</strong>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-line bg-raised px-3 py-2 text-sm">
        <label htmlFor="tilt" className="text-soft">
          Tilt of the normal from D
        </label>
        <input id="tilt" type="range" min={0} max={90} value={tilt} onChange={(e) => setTilt(Number(e.target.value))} className="flex-1" />
        <span className="w-10 text-right">{tilt}°</span>
      </div>
    </div>
  );
}
