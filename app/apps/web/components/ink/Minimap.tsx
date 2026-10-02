"use client";

import { renderToCanvas, unionRect, itemBounds, type InkEngine } from "@forma/ink";
import { useEffect, useRef } from "react";

const W = 168, H = 108;

/** The whole page in miniature with the view outlined. Click or drag to move the view there. */
export function Minimap({ engine, version, contentVersion }: { engine: InkEngine; version: number; contentVersion: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const art = useRef<{ canvas: HTMLCanvasElement; rect: { x: number; y: number; w: number; h: number }; k: number } | null>(null);
  const itemsVersion = useRef(-1);

  // The page picture: redrawn at most every 500 ms while the page changes.
  useEffect(() => {
    const t = setTimeout(() => {
      const items = [...engine.items.values()];
      const content = unionRect(items.map(itemBounds));
      const view = engine.camera.visibleRect(engine.renderer.w, engine.renderer.h);
      const r0 = unionRect([view, ...(content ? [content] : [])])!;
      const pad = Math.max(r0.w, r0.h) * 0.05, r = { x: r0.x - pad, y: r0.y - pad, w: r0.w + 2 * pad, h: r0.h + 2 * pad };
      const k = Math.min(W / r.w, H / r.h);
      const fit = { x: r.x - (W / k - r.w) / 2, y: r.y - (H / k - r.h) / 2, w: W / k, h: H / k };
      art.current = { canvas: renderToCanvas(items, engine.renderer.colors(), W, H, { rect: fit, pad: 0 }), rect: fit, k };
      itemsVersion.current = contentVersion;
      paint();
    }, itemsVersion.current < 0 ? 0 : 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, contentVersion]);

  const paint = () => {
    const c = ref.current?.getContext("2d"), a = art.current;
    if (!c || !a) return;
    const col = engine.renderer.colors();
    c.clearRect(0, 0, W, H);
    c.drawImage(a.canvas, 0, 0);
    const v = engine.camera.visibleRect(engine.renderer.w, engine.renderer.h);
    c.strokeStyle = col.field;
    c.lineWidth = 1.5;
    c.strokeRect((v.x - a.rect.x) * a.k, (v.y - a.rect.y) * a.k, v.w * a.k, v.h * a.k);
  };
  useEffect(paint, [version]); // the view outline follows every pan and zoom

  const jump = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const a = art.current;
    if (!a || (e.type === "pointermove" && !e.currentTarget.hasPointerCapture(e.pointerId))) return;
    const b = e.currentTarget.getBoundingClientRect();
    const wx = a.rect.x + (e.clientX - b.left) / a.k, wy = a.rect.y + (e.clientY - b.top) / a.k;
    const v = engine.camera.visibleRect(engine.renderer.w, engine.renderer.h);
    engine.panBy((v.x + v.w / 2 - wx) * engine.camera.zoom, (v.y + v.h / 2 - wy) * engine.camera.zoom);
  };

  return (
    <canvas ref={ref} width={W} height={H} aria-hidden title="Page overview: click to move there"
      className="absolute bottom-2 right-2 z-[6] cursor-pointer rounded border border-[var(--grid)] bg-[var(--paper)] opacity-90 shadow-sm"
      onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); jump(e); }} onPointerMove={jump} />
  );
}
