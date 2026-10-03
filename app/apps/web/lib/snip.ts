"use client";

/** A snip on its way to Ink: an open Ink page takes it at once; otherwise the next Ink page to open takes it. */
export const SNIP_EVENT = "forma:snip";
let pending: Blob | null = null;

/** True when an open Ink page took the image (its listener cancels the event). */
export const offerSnip = (b: Blob) => !window.dispatchEvent(new CustomEvent(SNIP_EVENT, { detail: b, cancelable: true }));
export const holdSnip = (b: Blob) => { pending = b; };
export const takeSnip = () => { const b = pending; pending = null; return b; };

/** The viewport rectangle `r` (CSS px) of the page as a PNG, at up to 2× for sharp text. Elements marked data-snip-ui are left out. */
export async function captureRect(r: { x: number; y: number; w: number; h: number }): Promise<Blob> {
  const { domToCanvas } = await import("modern-screenshot");
  const body = document.body, at = body.getBoundingClientRect();
  const scale = Math.min(2, window.devicePixelRatio || 1);
  const full = await domToCanvas(body, {
    scale,
    backgroundColor: getComputedStyle(body).backgroundColor,
    filter: (n) => !(n instanceof HTMLElement && n.dataset.snipUi !== undefined),
    features: { restoreScrollPosition: true },
  });
  const out = document.createElement("canvas");
  out.width = Math.round(r.w * scale);
  out.height = Math.round(r.h * scale);
  out.getContext("2d")!.drawImage(full, (r.x - at.left) * scale, (r.y - at.top) * scale, out.width, out.height, 0, 0, out.width, out.height);
  return new Promise((ok, fail) => out.toBlob((b) => (b ? ok(b) : fail(new Error("The snip could not be made."))), "image/png"));
}
