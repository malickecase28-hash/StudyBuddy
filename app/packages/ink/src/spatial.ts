import type { Rect } from "./model";

/** Uniform-grid index over item bounds: cheap culling and hit-test candidates. */
export class GridIndex {
  private cells = new Map<string, Set<string>>();
  private owned = new Map<string, string[]>();
  constructor(private cell = 256) {}

  private keys(r: Rect): string[] {
    const c = this.cell, out: string[] = [];
    const x0 = Math.floor(r.x / c), x1 = Math.floor((r.x + r.w) / c), y0 = Math.floor(r.y / c), y1 = Math.floor((r.y + r.h) / c);
    // ponytail: a huge item spans many cells; clamp to 64×64 and fall back to a shared "wide" cell beyond that.
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 4096) return ["wide"];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push(`${x},${y}`);
    return out;
  }
  upsert(id: string, r: Rect): void {
    this.remove(id);
    const ks = this.keys(r);
    for (const k of ks) { let s = this.cells.get(k); if (!s) this.cells.set(k, (s = new Set())); s.add(id); }
    this.owned.set(id, ks);
  }
  remove(id: string): void {
    for (const k of this.owned.get(id) ?? []) this.cells.get(k)?.delete(id);
    this.owned.delete(id);
  }
  query(r: Rect): Set<string> {
    const out = new Set<string>(this.cells.get("wide") ?? []);
    for (const k of this.keys(r)) for (const id of this.cells.get(k) ?? []) out.add(id);
    return out;
  }
  clear(): void { this.cells.clear(); this.owned.clear(); }
}
