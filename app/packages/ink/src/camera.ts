import type { Rect, Vec } from "./model";

export const ZOOM_MIN = 0.1, ZOOM_MAX = 8;

/** World point (x, y) sits at the screen's top-left; zoom = screen px per world unit. */
export class Camera {
  x = 0; y = 0; zoom = 1;
  toWorld(sx: number, sy: number): Vec { return { x: this.x + sx / this.zoom, y: this.y + sy / this.zoom }; }
  toScreen(wx: number, wy: number): Vec { return { x: (wx - this.x) * this.zoom, y: (wy - this.y) * this.zoom }; }
  zoomAt(sx: number, sy: number, factor: number): void {
    const before = this.toWorld(sx, sy);
    this.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.zoom * factor));
    this.x = before.x - sx / this.zoom;
    this.y = before.y - sy / this.zoom;
  }
  pan(dxScreen: number, dyScreen: number): void { this.x -= dxScreen / this.zoom; this.y -= dyScreen / this.zoom; }
  visibleRect(w: number, h: number): Rect { return { x: this.x, y: this.y, w: w / this.zoom, h: h / this.zoom }; }
  fit(r: Rect, w: number, h: number, pad = 48): void {
    this.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.min((w - 2 * pad) / Math.max(r.w, 1), (h - 2 * pad) / Math.max(r.h, 1))));
    this.x = r.x + r.w / 2 - w / 2 / this.zoom;
    this.y = r.y + r.h / 2 - h / 2 / this.zoom;
  }
}
