"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

const clamp = (r: number) => Math.min(0.85, Math.max(0.2, r));

/** Two panes with a draggable, keyboard-operable divider. ratio ≥ 0.999 renders the first pane alone. */
export function Split({ ratio, onRatio, label, children }: { ratio: number; onRatio: (r: number) => void; label: string; children: [ReactNode, ReactNode] }) {
  const box = useRef<HTMLDivElement>(null);
  if (ratio >= 0.999) return <div className="split-full">{children[0]}</div>;
  const drag = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId) || !box.current) return;
    const r = box.current.getBoundingClientRect();
    onRatio(clamp((e.clientX - r.left) / r.width));
  };
  return (
    <div ref={box} className="split" style={{ gridTemplateColumns: `minmax(0, ${ratio}fr) 12px minmax(0, ${1 - ratio}fr)` }}>
      <div className="split-pane">{children[0]}</div>
      <div
        role="separator" aria-orientation="vertical" aria-label={label} tabIndex={0}
        aria-valuemin={20} aria-valuemax={85} aria-valuenow={Math.round(ratio * 100)} className="split-handle"
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={drag}
        onKeyDown={(e) => {
          const d = e.key === "ArrowLeft" ? -0.05 : e.key === "ArrowRight" ? 0.05 : 0;
          if (!d) return;
          e.preventDefault();
          onRatio(clamp(ratio + d));
        }}
      />
      <div className="split-pane">{children[1]}</div>
    </div>
  );
}
