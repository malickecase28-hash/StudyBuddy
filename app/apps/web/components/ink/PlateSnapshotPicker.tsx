"use client";

import { plates } from "@forma/course-em1";
import { newId, type InkEngine, type PlateItem } from "@forma/ink";
import { VIEWBOX } from "@forma/plate";
import { useEffect, useMemo, useRef, useState } from "react";
import { course, getConcept, lessonHref } from "@/lib/course";
import { PlateThumb } from "../plate/PlateThumb";

const STYLE_PROPS = ["fill", "fill-opacity", "stroke", "stroke-width", "stroke-dasharray", "stroke-opacity", "stroke-linecap", "opacity", "color", "font-family", "font-size", "font-weight", "font-style", "text-anchor", "dominant-baseline", "visibility"];

/** A plate's <svg> as a standalone string: computed colours and fonts inlined, so it draws the same off the page. */
export function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const a = [svg, ...svg.querySelectorAll("*")], b = [clone, ...clone.querySelectorAll("*")];
  a.forEach((el, i) => {
    const cs = getComputedStyle(el), out = b[i] as SVGElement;
    out.removeAttribute("class");
    out.setAttribute("style", STYLE_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(";"));
  });
  clone.removeAttribute("width");
  clone.removeAttribute("height");
  clone.removeAttribute("role");
  clone.removeAttribute("aria-label");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

/** A plate snapshot item from a live plate <svg>, centred on the view. */
export function plateItem(engine: InkEngine, svg: SVGSVGElement, href: string, caption: string): PlateItem {
  const w = VIEWBOX.w, h = VIEWBOX.h, v = engine.camera.visibleRect(engine.renderer.w, engine.renderer.h);
  return { id: newId(), kind: "plate", svg: serializeSvg(svg), w, h, href, caption, z: engine.nextZ(), transform: [1, 0, 0, 1, v.x + v.w / 2 - w / 2, v.y + v.h / 2 - h / 2], style: { ...engine.style } };
}

/** Pick concept → plate → step, preview it, and insert the snapshot. */
export function PlateSnapshotPicker({ engine, open, onClose, conceptId: initial }: { engine: InkEngine; open: boolean; onClose: () => void; conceptId?: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [conceptId, setConceptId] = useState(initial ?? "em1.electrostatics.gauss-law");
  const options = useMemo(() => (getConcept(conceptId)?.lessons ?? []).flatMap((l) => l.blocks.flatMap((b) => (b.type === "plate" && plates[b.plateId] ? [{ lessonId: l.id, blockId: b.id, plateId: b.plateId }] : []))), [conceptId]);
  const [pick, setPick] = useState(0);
  const [step, setStep] = useState(0);
  const opt = options[pick];
  const plate = opt ? plates[opt.plateId] : undefined;
  useEffect(() => { const d = dlg.current; if (open && d && !d.open) d.showModal(); else if (!open && d?.open) d.close(); }, [open]);
  useEffect(() => { setPick(0); setStep(0); }, [conceptId]);

  const insert = () => {
    const svg = preview.current?.querySelector<SVGSVGElement>("svg.plate-svg");
    if (!svg || !opt || !plate) return;
    const href = lessonHref(conceptId, opt.lessonId, `block=${encodeURIComponent(opt.blockId)}&step=${step}`);
    const it = plateItem(engine, svg, href, `${plate.title} · ${plate.steps[step]?.title ?? ""}`);
    engine.do({ type: "add", items: [it] });
    engine.select([it.id]);
    onClose();
  };

  return (
    <dialog ref={dlg} onClose={onClose} className="card m-auto w-[min(640px,95vw)] space-y-3 p-5" aria-label="Insert a plate snapshot">
      <h2 className="text-lg font-semibold">Plate snapshot</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">Concept
          <select className="input" value={conceptId} onChange={(e) => setConceptId(e.target.value)}>
            {course.concepts.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">Plate
          <select className="input" value={pick} onChange={(e) => { setPick(Number(e.target.value)); setStep(0); }} disabled={!options.length}>
            {options.map((o, i) => <option key={o.blockId + i} value={i}>{plates[o.plateId]!.title}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">Step
          <select className="input" value={step} onChange={(e) => setStep(Number(e.target.value))} disabled={!plate}>
            {plate?.steps.map((s, i) => <option key={s.id} value={i}>{i + 1}. {s.title}</option>)}
          </select>
        </label>
      </div>
      {plate ? <div ref={preview} className="rounded border border-[var(--grid)]"><PlateThumb key={`${plate.id}-${step}`} plateId={plate.id} step={step} label={`${plate.title}, step ${step + 1}`} /></div>
        : <p className="text-soft">This concept has no plates yet.</p>}
      <div className="flex justify-end gap-2">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={insert} disabled={!plate}>Insert</button>
      </div>
    </dialog>
  );
}
