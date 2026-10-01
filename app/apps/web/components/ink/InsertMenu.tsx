"use client";

import { itemBounds, newId, type ImageItem, type InkEngine, type Item, type LinkItem } from "@forma/ink";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { conceptHref, course } from "@/lib/course";
import { BankPicker } from "./BankPicker";
import { PlateSnapshotPicker } from "./PlateSnapshotPicker";

const centre = (engine: InkEngine) => { const v = engine.camera.visibleRect(engine.renderer.w, engine.renderer.h); return { x: v.x + v.w / 2, y: v.y + v.h / 2 }; };

/** Adds an image file (downscaled to 1600 px) at the centre of the view. */
export async function insertImage(engine: InkEngine, file: Blob): Promise<void> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const src = file.type === "image/png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.88);
  const w = Math.min(600, c.width), h = (c.height / c.width) * w, at = centre(engine);
  const img: ImageItem = { id: newId(), kind: "image", src, w, h, z: engine.nextZ(), transform: [1, 0, 0, 1, at.x - w / 2, at.y - h / 2], style: { ...engine.style } };
  engine.do({ type: "add", items: [img] });
  engine.select([img.id]);
}

/** Insert: plate snapshot, question card, concept link, image. */
export function InsertMenu({ engine, conceptId }: { engine: InkEngine; conceptId?: string }) {
  const [dialog, setDialog] = useState<"plate" | "bank" | null>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const close = () => { if (menu.current) menu.current.open = false; };
  const link = (id: string) => {
    const c = course.concepts.find((x) => x.id === id);
    if (!c) return;
    const at = centre(engine);
    const it: LinkItem = { id: newId(), kind: "link", label: c.title, href: conceptHref(c.id, "learn"), z: engine.nextZ(), transform: [1, 0, 0, 1, at.x, at.y], style: { ...engine.style } };
    engine.do({ type: "add", items: [it] });
    close();
  };
  return (
    <>
      <details ref={menu} className="relative">
        <summary className="btn list-none">Insert</summary>
        <div className="absolute right-0 z-20 mt-1 flex w-60 flex-col gap-1 rounded border border-[var(--grid)] bg-[var(--paper)] p-2 shadow-sm" role="menu">
          <button role="menuitem" className="btn justify-start" onClick={() => { setDialog("plate"); close(); }}>Plate snapshot…</button>
          <button role="menuitem" className="btn justify-start" onClick={() => { setDialog("bank"); close(); }}>Question card…</button>
          <button role="menuitem" className="btn justify-start" onClick={() => { file.current?.click(); close(); }}>Image or photo…</button>
          <label className="flex flex-col gap-1 text-sm">Concept link
            <select className="input" value="" onChange={(e) => link(e.target.value)}>
              <option value="">Choose a concept</option>
              {course.concepts.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
        </div>
      </details>
      <input ref={file} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Image file"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void insertImage(engine, f); e.target.value = ""; }} />
      <PlateSnapshotPicker engine={engine} open={dialog === "plate"} onClose={() => setDialog(null)} {...(conceptId ? { conceptId } : {})} />
      <BankPicker engine={engine} open={dialog === "bank"} onClose={() => setDialog(null)} />
    </>
  );
}

const hrefOf = (it: Item) => (it.kind === "plate" || it.kind === "bank" || it.kind === "link" ? it.href : null);
const nameOf = (it: Item) => (it.kind === "plate" ? it.caption : it.kind === "bank" ? it.title : it.kind === "link" ? it.label : "");

/** An "Open" chip on every visible item that links somewhere. Ctrl or Cmd+click opens a new tab. */
export function LinkChips({ engine, version }: { engine: InkEngine; version: number }) {
  const router = useRouter();
  void version;
  const view = engine.camera.visibleRect(engine.renderer.w, engine.renderer.h);
  const items = [...engine.index.query(view)].map((id) => engine.items.get(id)).filter((it): it is Item => !!it && !!hrefOf(it)).slice(0, 60);
  return (
    <>
      {items.map((it) => {
        const b = itemBounds(it), p = engine.camera.toScreen(b.x + b.w, b.y);
        return (
          <a key={it.id} href={hrefOf(it)!} className="absolute z-[5] -translate-x-full whitespace-nowrap rounded-full border border-[var(--field)] bg-[var(--paper)] px-2 text-xs text-[var(--field)]"
            style={{ left: p.x, top: p.y - 22 }} aria-label={`Open ${nameOf(it)}`}
            onClick={(e) => { if (e.ctrlKey || e.metaKey || e.button !== 0) return; e.preventDefault(); router.push(hrefOf(it)!); }}>
            Open ↗
          </a>
        );
      })}
    </>
  );
}
