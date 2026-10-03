"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { listNotebooksEnsuringScratch, SCRATCH_ID } from "@/lib/ink-store";
import { captureRect, holdSnip, offerSnip } from "@/lib/snip";
import { useUi } from "@/lib/ui";
import { useToolState } from "./ToolPanel";

type Rect = { x: number; y: number; w: number; h: number };
const box = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) });

/**
 * Snip: drag round any part of the page (a question, a plate, a worked step) to make a picture of it, then copy it,
 * send it to Ink, save it or share it. Works the same with a mouse, a finger or a pen, so phones get a snipping tool too.
 */
export function Snip() {
  const router = useRouter();
  const conceptId = useUi((s) => s.activeConceptId);
  const { open } = useToolState();
  const [phase, setPhase] = useState<"off" | "pick" | "busy">("off");
  const [from, setFrom] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);
  const [note, setNote] = useState("");
  const dlg = useRef<HTMLDialogElement>(null);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => { if (phase === "pick") overlay.current?.focus(); }, [phase]);
  useEffect(() => { if (shot) dlg.current?.showModal(); }, [shot]);
  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url); }, [shot]);

  const finish = async (r: Rect) => {
    setPhase("busy");
    try {
      const blob = await captureRect(r);
      setNote("");
      setShot({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setNote("");
      window.alert("That part of the page could not be snipped. Try a smaller area.");
    }
    setPhase("off");
    setRect(null);
  };

  const copy = async () => {
    if (!shot) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": shot.blob })]);
      setNote("Copied. Paste it anywhere: Ink, a document or a chat.");
    } catch {
      setNote("This browser can't copy pictures. Use Save picture instead.");
    }
  };
  const toInk = async () => {
    if (!shot) return;
    const blob = shot.blob;
    dlg.current?.close();
    if (offerSnip(blob)) return;
    holdSnip(blob);
    if (conceptId) open("paper");
    else {
      const nb = (await listNotebooksEnsuringScratch()).find((n) => n.id === SCRATCH_ID)!;
      router.push(`/ink/${nb.id}/${nb.pageIds[nb.pageIds.length - 1]}`);
    }
  };
  const save = () => {
    if (!shot) return;
    const a = document.createElement("a");
    a.href = shot.url;
    a.download = `forma-snip-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}.png`;
    a.click();
  };
  const file = shot ? new File([shot.blob], "forma-snip.png", { type: "image/png" }) : null;
  const canShare = typeof navigator !== "undefined" && !!file && !!navigator.canShare?.({ files: [file] });

  return (
    <>
      <button className="btn" onClick={() => setPhase("pick")} disabled={phase !== "off"} aria-label="Snip: take a picture of part of the page" title="Snip part of the page">
        <span className="topbar-wide">{phase === "busy" ? "Snipping…" : "Snip"}</span><span className="topbar-narrow" aria-hidden>✂</span>
      </button>
      {phase === "pick" && (
        <div ref={overlay} data-snip-ui="" className="snip-overlay" tabIndex={-1} role="application" aria-label="Drag round the part of the page to snip. Escape cancels."
          onKeyDown={(e) => { if (e.key === "Escape") { setPhase("off"); setRect(null); } }}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setFrom({ x: e.clientX, y: e.clientY }); setRect(null); }}
          onPointerMove={(e) => { if (from) setRect(box(from, { x: e.clientX, y: e.clientY })); }}
          onPointerUp={(e) => {
            const r = from ? box(from, { x: e.clientX, y: e.clientY }) : null;
            setFrom(null);
            if (r && r.w >= 8 && r.h >= 8) void finish(r);
            else setRect(null);
          }}
          onPointerCancel={() => { setFrom(null); setRect(null); }}>
          <p className="snip-hint">Drag round what you want to snip. <button className="btn" onPointerDown={(e) => e.stopPropagation()} onClick={() => { setPhase("off"); setRect(null); }}>Cancel</button></p>
          {rect && <div className="snip-rect" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />}
        </div>
      )}
      <dialog ref={dlg} data-snip-ui="" className="card m-auto w-[min(640px,95vw)] space-y-3 p-5" aria-label="Your snip" onClose={() => { setShot(null); setNote(""); }}>
        <h2 className="text-lg font-semibold">Your snip</h2>
        {shot && <img src={shot.url} alt="The part of the page you snipped" className="max-h-[50vh] w-full rounded border border-line object-contain" />}
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => void toInk()}>Send to Ink</button>
          <button className="btn" onClick={() => void copy()}>Copy picture</button>
          <button className="btn" onClick={save}>Save picture</button>
          {canShare && <button className="btn" onClick={() => void navigator.share({ files: [file!] }).catch(() => {})}>Share…</button>}
          <button className="btn" onClick={() => { dlg.current?.close(); setPhase("pick"); }}>Snip again</button>
          <button className="btn ml-auto" onClick={() => dlg.current?.close()}>Close</button>
        </div>
        <p className="min-h-5 text-sm text-soft" role="status">{note}</p>
      </dialog>
    </>
  );
}
