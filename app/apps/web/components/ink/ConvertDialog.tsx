"use client";

import { itemBounds, newId, unionRect, type EquationItem, type InkEngine, type StrokeItem } from "@forma/ink";
import { createElement, useEffect, useRef, useState } from "react";
import { EQ_STYLE, mathml, measureHtml } from "@/lib/ink-bitmaps";
import { loadModel, MODEL_MB, modelCached, recognize } from "@/lib/ink-recognize";

type MathField = HTMLElement & { value: string };
type State = { kind: "consent" } | { kind: "loading"; pct: number } | { kind: "reading" } | { kind: "result"; latex: string; ms: number } | { kind: "error"; message: string };

/**
 * Convert the selected strokes to an equation. The model downloads once (with consent) and runs on this device.
 * The result opens in an equation field for correction; Insert swaps the strokes for the equation in one undo step.
 */
export function ConvertDialog({ engine, open, onClose }: { engine: InkEngine; open: boolean; onClose: () => void }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const field = useRef<MathField | null>(null);
  const [state, setState] = useState<State>({ kind: "reading" });
  const [strokes, setStrokes] = useState<StrokeItem[]>([]);
  const [mathReady, setMathReady] = useState(false);

  const run = async (ss: StrokeItem[]) => {
    try {
      setState({ kind: "loading", pct: 0 });
      await loadModel((loaded, total) => setState({ kind: "loading", pct: Math.min(100, Math.round((loaded / total) * 100)) }));
      setState({ kind: "reading" });
      const r = await recognize(ss);
      setState({ kind: "result", latex: r.latex, ms: r.ms });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  useEffect(() => {
    const d = dlg.current;
    if (!open) { if (d?.open) d.close(); return; }
    if (d && !d.open) d.showModal();
    const ss = [...engine.selection].map((id) => engine.items.get(id)).filter((x): x is StrokeItem => x?.kind === "stroke");
    setStrokes(ss);
    if (!ss.length) { setState({ kind: "error", message: "Select some handwriting first, with the lasso." }); return; }
    void modelCached().then((cached) => (cached ? run(ss) : setState({ kind: "consent" })));
    void import("mathlive").then(({ MathfieldElement }) => { MathfieldElement.fontsDirectory = null; MathfieldElement.soundsDirectory = null; setMathReady(true); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const insert = () => {
    const latex = (field.current?.value ?? (state.kind === "result" ? state.latex : "")).trim();
    const b = unionRect(strokes.map(itemBounds));
    if (!latex || !b) return;
    const { w, h } = measureHtml(`<div style="${EQ_STYLE}">${mathml(latex, true)}</div>`);
    const eq: EquationItem = { id: newId(), kind: "equation", latex, w, h, source: strokes, z: engine.nextZ(), transform: [1, 0, 0, 1, b.x, b.y], style: { ...strokes[0]!.style, size: 1 } };
    engine.group(() => {
      engine.do({ type: "remove", items: strokes });
      engine.do({ type: "add", items: [eq] });
    });
    engine.select([eq.id]);
    onClose();
  };

  return (
    <dialog ref={dlg} onClose={onClose} className="card m-auto w-[min(560px,95vw)] space-y-4 p-5" aria-label="Convert handwriting to an equation">
      <h2 className="flex items-center gap-2 text-lg font-semibold">Convert to equation <span className="label rounded border border-[var(--surface)] px-1.5 text-[var(--surface)]">Beta</span></h2>
      {state.kind === "consent" && (
        <>
          <p>Download the handwriting model ({MODEL_MB} MB) to this device? It works offline afterwards.</p>
          <p className="text-sm text-soft">Your handwriting is read on this device and never sent anywhere.</p>
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={onClose}>Not now</button>
            <button className="btn btn-primary" onClick={() => void run(strokes)}>Download</button>
          </div>
        </>
      )}
      {state.kind === "loading" && (
        <div className="space-y-2">
          <p>Getting the handwriting model ready…</p>
          <progress className="w-full" max={100} value={state.pct} aria-label="Model download">{state.pct}%</progress>
        </div>
      )}
      {state.kind === "reading" && <p role="status">Reading your handwriting…</p>}
      {state.kind === "result" && (
        <>
          <p className="text-sm text-soft">Check it, and fix anything it misread. Greek letters are the usual slips.</p>
          {mathReady ? createElement("math-field", {
            ref: (el: MathField | null) => { if (el && field.current !== el) { field.current = el; el.value = state.latex; } },
            "aria-label": "Recognised equation",
            style: { display: "block", fontSize: "22px", padding: "6px 8px", border: "1px solid var(--grid)", borderRadius: "6px" },
          }) : <code className="block">{state.latex}</code>}
          <p className="label">Read in {(state.ms / 1000).toFixed(1)} s</p>
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={insert}>Insert</button>
          </div>
        </>
      )}
      {state.kind === "error" && (
        <>
          <p role="alert">{state.message}</p>
          <p className="text-sm text-soft">Your handwriting is unchanged.</p>
          <div className="flex justify-end"><button className="btn" onClick={onClose}>Close</button></div>
        </>
      )}
    </dialog>
  );
}
