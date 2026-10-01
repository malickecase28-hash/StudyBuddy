import { toCyl, toSph, unitVectors, type CoordSystem } from "./coords";
import type { Vec3 } from "./vec";

export type Native = [number, number, number];
export type ScalarField = { id: string; text: string; latex: string; system: CoordSystem; f: (n: Native) => number; grad: (n: Native) => Native };
export type VectorField = { id: string; text: string; latex: string; system: CoordSystem; F: (n: Native) => Native; div: (n: Native) => number; curl: (n: Native) => Native };

/** Native coordinates of a cartesian point: (x, y, z), (ρ, φ, z) or (r, θ, φ); angles in radians. */
export function nativeOf(p: Vec3, system: CoordSystem): Native {
  if (system === "cart") return [p[0], p[1], p[2]];
  if (system === "cyl") {
    const c = toCyl(p);
    return [c.rho, c.phi, c.z];
  }
  const s = toSph(p);
  return [s.r, s.theta, s.phi];
}

/** Native components at p → cartesian components. */
export function cartOf(v: Native, p: Vec3, system: CoordSystem): Vec3 {
  const [a, b, c] = unitVectors(p, system);
  return [v[0] * a[0] + v[1] * b[0] + v[2] * c[0], v[0] * a[1] + v[1] * b[1] + v[2] * c[1], v[0] * a[2] + v[1] * b[2] + v[2] * c[2]];
}

const { sin, cos, sqrt } = Math;
const S = (x: ScalarField) => x;
const V = (x: VectorField) => x;

export const scalarFields: Record<string, ScalarField> = {
  hill: S({ id: "hill", text: "f = 4 − x² − z²", latex: String.raw`f=4-x^2-z^2`, system: "cart",
    f: ([x, , z]) => 4 - x * x - z * z, grad: ([x, , z]) => [-2 * x, 0, -2 * z] }),
  "tut-3.4": S({ id: "tut-3.4", text: "Φ = xy + yz + xz", latex: String.raw`\Phi=xy+yz+xz`, system: "cart",
    f: ([x, y, z]) => x * y + y * z + x * z, grad: ([x, y, z]) => [y + z, x + z, x + y] }),
  "hw-2.1a": S({ id: "hw-2.1a", text: "V = 10xyz − 2x²z", latex: String.raw`V=10xyz-2x^2z`, system: "cart",
    f: ([x, y, z]) => 10 * x * y * z - 2 * x * x * z, grad: ([x, y, z]) => [10 * y * z - 4 * x * z, 10 * x * z, 10 * x * y - 2 * x * x] }),
  "hw-2.1b": S({ id: "hw-2.1b", text: "U = 2ρ sin φ + ρz", latex: String.raw`U=2\rho\sin\phi+\rho z`, system: "cyl",
    f: ([r, p, z]) => 2 * r * sin(p) + r * z, grad: ([r, p, z]) => [2 * sin(p) + z, 2 * cos(p), r] }),
  "hw-2.1c": S({ id: "hw-2.1c", text: "W = (4/r) sin θ cos φ", latex: String.raw`W=\tfrac{4}{r}\sin\theta\cos\phi`, system: "sph",
    f: ([r, t, p]) => (4 / r) * sin(t) * cos(p), grad: ([r, t, p]) => [(-4 * sin(t) * cos(p)) / (r * r), (4 * cos(t) * cos(p)) / (r * r), (-4 * sin(p)) / (r * r)] }),
  "mst-5a": S({ id: "mst-5a", text: "V = ρ²z³ + 5z cos φ", latex: String.raw`V=\rho^2z^3+5z\cos\phi`, system: "cyl",
    f: ([r, p, z]) => r * r * z ** 3 + 5 * z * cos(p), grad: ([r, p, z]) => [2 * r * z ** 3, (-5 * z * sin(p)) / r, 3 * r * r * z * z + 5 * cos(p)] }),
  "f2425-1c": S({ id: "f2425-1c", text: "V = x³ sin y + 10z²", latex: String.raw`V=x^3\sin y+10z^2`, system: "cart",
    f: ([x, y, z]) => x ** 3 * sin(y) + 10 * z * z, grad: ([x, y, z]) => [3 * x * x * sin(y), x ** 3 * cos(y), 20 * z] }),
  "ex4-V": S({ id: "ex4-V", text: "V = −(xy + 2z)", latex: String.raw`V=-(xy+2z)`, system: "cart",
    f: ([x, y, z]) => -(x * y + 2 * z), grad: ([x, y]) => [-y, -x, -2] }),
  "f2324-1b": S({ id: "f2324-1b", text: "V = r³ sin θ cos φ", latex: String.raw`V=r^3\sin\theta\cos\phi`, system: "sph",
    f: ([r, t, p]) => r ** 3 * sin(t) * cos(p), grad: ([r, t, p]) => [3 * r * r * sin(t) * cos(p), r * r * cos(t) * cos(p), -r * r * sin(p)] }),
};

const cot = (t: number) => cos(t) / sin(t);

export const vectorFields: Record<string, VectorField> = {
  source: V({ id: "source", text: "A = x ax + y ay + z az", latex: String.raw`\mathbf A=x\,\mathbf a_x+y\,\mathbf a_y+z\,\mathbf a_z`, system: "cart",
    F: ([x, y, z]) => [x, y, z], div: () => 3, curl: () => [0, 0, 0] }),
  swirl: V({ id: "swirl", text: "A = −y ax + x ay", latex: String.raw`\mathbf A=-y\,\mathbf a_x+x\,\mathbf a_y`, system: "cart",
    F: ([x, y]) => [-y, x, 0], div: () => 0, curl: () => [0, 0, 2] }),
  uniform: V({ id: "uniform", text: "A = ax", latex: String.raw`\mathbf A=\mathbf a_x`, system: "cart",
    F: () => [1, 0, 0], div: () => 0, curl: () => [0, 0, 0] }),
  "tut-3.6a": V({ id: "tut-3.6a", text: "A = yz ax + 4xy ay + y az", latex: String.raw`\mathbf A=yz\,\mathbf a_x+4xy\,\mathbf a_y+y\,\mathbf a_z`, system: "cart",
    F: ([x, y, z]) => [y * z, 4 * x * y, y], div: ([x]) => 4 * x, curl: ([, y, z]) => [1, y, 4 * y - z] }),
  "tut-3.6b": V({ id: "tut-3.6b", text: "B = ρz sin φ aρ + 3ρz² cos φ aφ", latex: String.raw`\mathbf B=\rho z\sin\phi\,\mathbf a_\rho+3\rho z^2\cos\phi\,\mathbf a_\phi`, system: "cyl",
    F: ([r, p, z]) => [r * z * sin(p), 3 * r * z * z * cos(p), 0],
    div: ([, p, z]) => (2 - 3 * z) * z * sin(p),
    curl: ([r, p, z]) => [-6 * r * z * cos(p), r * sin(p), (6 * z - 1) * z * cos(p)] }),
  "tut-3.6c": V({ id: "tut-3.6c", text: "C = 2r cos θ cos φ ar + √r aφ", latex: String.raw`\mathbf C=2r\cos\theta\cos\phi\,\mathbf a_r+r^{1/2}\,\mathbf a_\phi`, system: "sph",
    F: ([r, t, p]) => [2 * r * cos(t) * cos(p), 0, sqrt(r)],
    div: ([, t, p]) => 6 * cos(t) * cos(p),
    curl: ([r, t, p]) => [cot(t) / sqrt(r), -2 * cot(t) * sin(p) - 3 / (2 * sqrt(r)), 2 * sin(t) * cos(p)] }),
  "hw-2.2a": V({ id: "hw-2.2a", text: "A = xy ax + y² ay − xz az", latex: String.raw`\mathbf A=xy\,\mathbf a_x+y^2\,\mathbf a_y-xz\,\mathbf a_z`, system: "cart",
    F: ([x, y, z]) => [x * y, y * y, -x * z], div: ([x, y]) => 3 * y - x, curl: ([x, , z]) => [0, z, -x] }),
  "hw-2.2b": V({ id: "hw-2.2b", text: "B = ρz² aρ + ρ sin²φ aφ + 2ρz sin²φ az", latex: String.raw`\mathbf B=\rho z^2\,\mathbf a_\rho+\rho\sin^2\!\phi\,\mathbf a_\phi+2\rho z\sin^2\!\phi\,\mathbf a_z`, system: "cyl",
    F: ([r, p, z]) => [r * z * z, r * sin(p) ** 2, 2 * r * z * sin(p) ** 2],
    div: ([r, p, z]) => 2 * z * z + sin(2 * p) + 2 * r * sin(p) ** 2,
    curl: ([r, p, z]) => [2 * z * sin(2 * p), 2 * z * (r - sin(p) ** 2), 2 * sin(p) ** 2] }),
  "hw-2.2c": V({ id: "hw-2.2c", text: "C = r ar + r cos²θ aφ", latex: String.raw`\mathbf C=r\,\mathbf a_r+r\cos^2\!\theta\,\mathbf a_\phi`, system: "sph",
    F: ([r, t]) => [r, 0, r * cos(t) ** 2],
    div: () => 3,
    curl: ([, t]) => [cot(t) - 3 * sin(t) * cos(t), -2 * cos(t) ** 2, 0] }),
  "hw-2.6": V({ id: "hw-2.6", text: "D = 3xy ax + x² ay", latex: String.raw`\mathbf D=3xy\,\mathbf a_x+x^2\,\mathbf a_y`, system: "cart",
    F: ([x, y]) => [3 * x * y, x * x, 0], div: ([, y]) => 3 * y, curl: ([x]) => [0, 0, -x] }),
  "f2324-2b": V({ id: "f2324-2b", text: "E = πr² (r ≤ 3 m), 6π/r³ (r > 3 m), radial", latex: String.raw`\mathbf E=\begin{cases}\pi r^2\,\mathbf a_r & r\le3\\ \tfrac{6\pi}{r^3}\,\mathbf a_r & r>3\end{cases}`, system: "sph",
    F: ([r]) => [r <= 3 ? Math.PI * r * r : (6 * Math.PI) / r ** 3, 0, 0], div: ([r]) => (r <= 3 ? 4 * Math.PI * r : (-6 * Math.PI) / r ** 4), curl: () => [0, 0, 0] }),
  "ex4-E": V({ id: "ex4-E", text: "E = y ax + x ay + 2 az", latex: String.raw`\mathbf E=y\,\mathbf a_x+x\,\mathbf a_y+2\,\mathbf a_z`, system: "cart",
    F: ([x, y]) => [y, x, 2], div: () => 0, curl: () => [0, 0, 0] }),
  "cont-5x": V({ id: "cont-5x", text: "J = 5x ax", latex: String.raw`\mathbf J=5x\,\mathbf a_x`, system: "cart",
    F: ([x]) => [5 * x, 0, 0], div: () => 5, curl: () => [0, 0, 0] }),
  "d7.6": V({ id: "d7.6", text: "H = 6xy ax − 3y² ay", latex: String.raw`\mathbf H=6xy\,\mathbf a_x-3y^2\,\mathbf a_y`, system: "cart",
    F: ([x, y]) => [6 * x * y, -3 * y * y, 0], div: () => 0, curl: ([x]) => [0, 0, -6 * x] }),
  "d7.5a": V({ id: "d7.5a", text: "H = x²z ay − y²x az", latex: String.raw`\mathbf H=x^2z\,\mathbf a_y-y^2x\,\mathbf a_z`, system: "cart",
    F: ([x, y, z]) => [0, x * x * z, -y * y * x], div: () => 0, curl: ([x, y, z]) => [-2 * x * y - x * x, y * y, 2 * x * z] }),
  "f1718-3c": V({ id: "f1718-3c", text: "H = yz(x² + y²) ax − y²xz ay + 4x²y² az", latex: String.raw`\mathbf H=yz(x^2+y^2)\,\mathbf a_x-y^2xz\,\mathbf a_y+4x^2y^2\,\mathbf a_z`, system: "cart",
    F: ([x, y, z]) => [y * z * (x * x + y * y), -y * y * x * z, 4 * x * x * y * y], div: () => 0,
    curl: ([x, y, z]) => [x * y * (8 * x + y), y * (x * x - 8 * x * y + y * y), -z * (x * x + 4 * y * y)] }),
  filament: V({ id: "filament", text: "H = (−y ax + x ay)/(2π(x² + y²)), a 1 A filament on z", latex: String.raw`\mathbf H=\dfrac{-y\,\mathbf a_x+x\,\mathbf a_y}{2\pi(x^2+y^2)}`, system: "cart",
    F: ([x, y]) => [-y / (2 * Math.PI * (x * x + y * y)), x / (2 * Math.PI * (x * x + y * y)), 0], div: () => 0, curl: () => [0, 0, 0] }),
};
