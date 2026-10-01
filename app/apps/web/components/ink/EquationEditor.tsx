"use client";

import { newId, type EditRequest, type EquationItem, type InkEngine } from "@forma/ink";
import { createElement, useEffect, useRef, useState } from "react";
import { EQ_STYLE, mathml, measureHtml } from "@/lib/ink-bitmaps";

type MathField = HTMLElement & { value: string };

/** Adds an equation at a point, or edits one: a MathLive field over the canvas. Enter keeps it; Escape discards. */
export function EquationEditor({ engine, request, onDone }: { engine: InkEngine; request: EditRequest; onDone: () => void }) {
  const item = request.item?.kind === "equation" ? request.item : undefined;
  const [ready, setReady] = useState(false);
  const field = useRef<MathField | null>(null);
  const done = useRef(false);

  useEffect(() => {
    let live = true;
    void import("mathlive").then(({ MathfieldElement }) => {
      // The app already loads KaTeX's fonts, which MathLive uses; don't fetch a second copy.
      MathfieldElement.fontsDirectory = null;
      MathfieldElement.soundsDirectory = null;
      if (live) setReady(true);
    });
    return () => { live = false; };
  }, []);

  const origin = item ? { x: item.transform[4], y: item.transform[5] } : request.at;
  const s = engine.camera.toScreen(origin.x, origin.y);

  const finish = (keep: boolean) => {
    if (done.current) return;
    done.current = true;
    const latex = (field.current?.value ?? "").trim();
    if (keep) {
      const { w, h } = latex ? measureHtml(`<div style="${EQ_STYLE}">${mathml(latex, true)}</div>`) : { w: 0, h: 0 };
      if (item && !latex) engine.do({ type: "remove", items: [item] });
      else if (item && latex !== item.latex) engine.do({ type: "update", before: [item], after: [{ ...item, latex, w, h }] });
      else if (!item && latex) {
        const eq: EquationItem = { id: newId(), kind: "equation", latex, w, h, z: engine.nextZ(), transform: [1, 0, 0, 1, origin.x, origin.y], style: { ...engine.style, size: 1 } };
        engine.do({ type: "add", items: [eq] });
      }
    }
    onDone();
  };

  if (!ready) return null;
  return (
    <div className="absolute z-10 min-w-[240px] rounded border border-dashed border-[var(--field)] bg-[var(--paper)] text-[22px]" style={{ left: s.x, top: s.y }}>
      {createElement("math-field", {
        ref: (el: MathField | null) => {
          if (!el || field.current === el) return;
          field.current = el;
          el.value = item?.latex ?? "";
          el.focus();
        },
        "aria-label": "Equation",
        onBlur: () => finish(true),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Escape") { e.preventDefault(); finish(false); }
          else if (e.key === "Enter") { e.preventDefault(); finish(true); }
        },
        style: { display: "block", padding: "4px 8px", background: "transparent", border: "none" },
      })}
    </div>
  );
}
