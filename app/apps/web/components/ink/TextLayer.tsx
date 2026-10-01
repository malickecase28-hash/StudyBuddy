"use client";

import { newId, type EditRequest, type InkEngine, type TextItem } from "@forma/ink";
import { useEffect, useRef, useState } from "react";
import { measureHtml, TEXT_STYLE, textHtml } from "@/lib/ink-bitmaps";

/** Edits one text item in place: a textarea over the canvas. Blur or Ctrl+Enter keeps it; Escape discards. */
export function TextLayer({ engine, request, onDone }: { engine: InkEngine; request: EditRequest; onDone: () => void }) {
  const item = request.item?.kind === "text" ? request.item : undefined;
  const [value, setValue] = useState(item?.text ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);
  const done = useRef(false);
  useEffect(() => { ref.current?.focus(); }, []);

  const origin = item ? { x: item.transform[4], y: item.transform[5] } : request.at;
  const s = engine.camera.toScreen(origin.x, origin.y), z = engine.camera.zoom;

  const finish = (keep: boolean) => {
    if (done.current) return;
    done.current = true;
    const text = value.replace(/\s+$/, "");
    if (keep) {
      const width = Math.max(40, measureHtml(`<div style="${TEXT_STYLE}">${textHtml(text)}</div>`).w + 4);
      if (item && !text) engine.do({ type: "remove", items: [item] });
      else if (item && text !== item.text) engine.do({ type: "update", before: [item], after: [{ ...item, text, width }] });
      else if (!item && text) {
        const t: TextItem = { id: newId(), kind: "text", text, width, z: engine.nextZ(), transform: [1, 0, 0, 1, origin.x, origin.y], style: { ...engine.style, size: 1 } };
        engine.do({ type: "add", items: [t] });
      }
    }
    onDone();
  };

  return (
    <textarea
      ref={ref}
      aria-label="Text"
      value={value}
      rows={Math.max(1, value.split("\n").length)}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === "Escape") { e.preventDefault(); finish(false); }
        else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); finish(true); }
      }}
      placeholder="Type. $x^2$ for maths, **bold**"
      className="absolute z-10 resize-none border border-dashed border-[var(--field)] bg-[var(--paper)] p-0 outline-none"
      style={{ left: s.x, top: s.y, minWidth: 220, fontSize: 16 * z, lineHeight: `${24 * z}px`, paddingTop: 4 * z, color: `var(--${engine.style.color})` }}
    />
  );
}
