const cache = new Map<number, { nodes: number[]; weights: number[] }>();

/** n-point Gauss–Legendre nodes and weights on [-1, 1] (Newton iteration on P_n). */
export function gaussLegendre(n: number): { nodes: number[]; weights: number[] } {
  const hit = cache.get(n);
  if (hit) return hit;
  const nodes = new Array<number>(n).fill(0);
  const weights = new Array<number>(n).fill(0);
  const m = Math.floor((n + 1) / 2);
  for (let i = 0; i < m; i++) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5));
    let pp = 0;
    for (let iter = 0; iter < 100; iter++) {
      let p1 = 1;
      let p2 = 0;
      for (let j = 1; j <= n; j++) {
        const p3 = p2;
        p2 = p1;
        p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j;
      }
      pp = (n * (z * p1 - p2)) / (z * z - 1);
      const z1 = z;
      z = z1 - p1 / pp;
      if (Math.abs(z - z1) < 1e-15) break;
    }
    nodes[i] = -z;
    nodes[n - 1 - i] = z;
    const w = 2 / ((1 - z * z) * pp * pp);
    weights[i] = w;
    weights[n - 1 - i] = w;
  }
  const out = { nodes, weights };
  cache.set(n, out);
  return out;
}
