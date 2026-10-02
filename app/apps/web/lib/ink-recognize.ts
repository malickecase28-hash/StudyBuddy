import { COLOR_TOKENS, itemBounds, renderToCanvas, unionRect, type Colors, type StrokeItem } from "@forma/ink";
import { MODEL, type RecognizeOut } from "./ink-recognize-protocol";

let worker: Worker | null = null;
const listeners = new Set<(m: RecognizeOut) => void>();
function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("../workers/ink-recognize.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent<RecognizeOut>) => { for (const l of listeners) l(e.data); };
  worker.onerror = (e) => { for (const l of listeners) l({ type: "error", message: e.message || "The handwriting worker stopped." }); };
  return worker;
}

/** Send one request; resolve on the reply that ends it, reporting progress on the way. */
function ask<T extends RecognizeOut["type"]>(msg: Parameters<Worker["postMessage"]>[0], until: T, onProgress?: (loaded: number, total: number) => void, transfer: Transferable[] = []): Promise<Extract<RecognizeOut, { type: T }>> {
  return new Promise((ok, no) => {
    const l = (m: RecognizeOut) => {
      if (m.type === "progress") onProgress?.(m.loaded, m.total);
      else if (m.type === until) { listeners.delete(l); ok(m as Extract<RecognizeOut, { type: T }>); }
      else if (m.type === "error") { listeners.delete(l); no(new Error(m.message)); }
    };
    listeners.add(l);
    getWorker().postMessage(msg, transfer);
  });
}

export const MODEL_MB = Math.round(MODEL.bytes / 1e6);

/** True when the model is already on this device (no download needed). */
export async function modelCached(): Promise<boolean> {
  try { return !!(await (await caches.open("forma-ink-model-v1")).match(`${MODEL.base}decoder_model.onnx`)); } catch { return false; }
}

export const loadModel = (onProgress?: (loaded: number, total: number) => void) => ask({ type: "load" }, "ready", onProgress);

const BLACK = Object.fromEntries([...COLOR_TOKENS, "paper", "paper-2", "grid"].map((k) => [k, "black"])) as Colors;

/**
 * Strokes as the model sees them: black on white, a tight crop (longest side 368 px) with 8 px of padding.
 * The worker then stretches it to 384 × 384; padding to a square instead scored 2/11 against 6/11 in the benchmark.
 */
export async function strokesPng(strokes: StrokeItem[]): Promise<ArrayBuffer> {
  const ink = strokes.map((s) => ({ ...s, tool: "pen" as const, style: { ...s.style, color: "ink" as const, opacity: 1 } }));
  const b = unionRect(ink.map(itemBounds))!;
  const k = 368 / Math.max(b.w, b.h, 1);
  const c = renderToCanvas(ink, BLACK, Math.round(b.w * k) + 16, Math.round(b.h * k) + 16, { pad: 8, background: "white" });
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/png"));
  if (!blob) throw new Error("Couldn't read the strokes.");
  return blob.arrayBuffer();
}

export async function recognize(strokes: StrokeItem[]): Promise<{ latex: string; ms: number }> {
  const png = await strokesPng(strokes);
  const r = await ask({ type: "recognize", png }, "result", undefined, [png]);
  return { latex: r.latex, ms: r.ms };
}
