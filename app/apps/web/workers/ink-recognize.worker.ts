/// <reference lib="webworker" />
// Handwriting → LaTeX on this device: pix2text-mfr-1.5 (a TrOCR-style encoder and decoder) through onnxruntime-web,
// greedy decoding. See docs/superpowers/resources/ink-recognition-benchmark.md for why this model and this setup.
import * as ort from "onnxruntime-web/webgpu";
import { MODEL, ORT_WASM, type RecognizeIn, type RecognizeOut } from "@/lib/ink-recognize-protocol";

declare const self: DedicatedWorkerGlobalScope;
const post = (m: RecognizeOut) => self.postMessage(m);

const CACHE = "forma-ink-model-v1";

/** Cache-first download with progress. Files stay in Cache Storage, so later sessions work offline. */
async function cachedBytes(url: string, onBytes: (n: number) => void): Promise<ArrayBuffer> {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(url);
  if (hit) { const b = await hit.arrayBuffer(); onBytes(b.byteLength); return b; }
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}) for ${url.split("/").pop()}`);
  const reader = res.body.getReader(), parts: Uint8Array[] = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value); n += value.byteLength; onBytes(value.byteLength);
  }
  const buf = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { buf.set(p, o); o += p.byteLength; }
  await cache.put(url, new Response(buf, { headers: { "content-type": "application/octet-stream" } }));
  return buf.buffer;
}

/** GPT-2 byte-level BPE decoding: each vocab character stands for one byte. */
function byteDecoder(): Map<string, number> {
  const bs: number[] = [];
  for (let b = 33; b <= 126; b++) bs.push(b);
  for (let b = 161; b <= 172; b++) bs.push(b);
  for (let b = 174; b <= 255; b++) bs.push(b);
  const cs = [...bs];
  let n = 0;
  for (let b = 0; b < 256; b++) if (!bs.includes(b)) { bs.push(b); cs.push(256 + n++); }
  return new Map(bs.map((b, i) => [String.fromCharCode(cs[i]!), b]));
}

/** Token ids → text, skipping special tokens (the tokenizer's added tokens). */
function makeDecoder(tokenizerJson: ArrayBuffer): (ids: number[]) => string {
  const t = JSON.parse(new TextDecoder().decode(tokenizerJson)) as { model: { vocab: Record<string, number> }; added_tokens: { id: number; special: boolean }[] };
  const byId: string[] = [];
  for (const [tok, id] of Object.entries(t.model.vocab)) byId[id] = tok;
  const special = new Set(t.added_tokens.filter((a) => a.special).map((a) => a.id));
  const bytes = byteDecoder(), utf8 = new TextDecoder();
  return (ids) => utf8.decode(Uint8Array.from([...ids.filter((i) => !special.has(i)).map((i) => byId[i] ?? "").join("")].map((c) => bytes.get(c) ?? 63))).trim();
}

let ready: Promise<{ enc: ort.InferenceSession; dec: ort.InferenceSession; decode: (ids: number[]) => string }> | null = null;

function load() {
  return (ready ??= (async () => {
    let loaded = 0;
    const tick = (n: number) => { loaded += n; post({ type: "progress", loaded, total: MODEL.bytes }); };
    const [wasm, encBytes, decBytes, tokJson] = await Promise.all([
      cachedBytes(ORT_WASM, tick),
      cachedBytes(`${MODEL.base}encoder_model.onnx`, tick),
      cachedBytes(`${MODEL.base}decoder_model.onnx`, tick),
      cachedBytes(`${MODEL.base}tokenizer.json`, () => {}),
    ]);
    ort.env.wasm.wasmBinary = wasm;
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
    ort.env.wasm.proxy = false;
    // navigator.gpu can exist with no usable adapter (headless, blocklisted GPUs); only then is WebGPU worth trying.
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    const adapter = gpu ? await gpu.requestAdapter().catch(() => null) : null;
    const providers = adapter ? ["webgpu", "wasm"] : ["wasm"];
    const opts: ort.InferenceSession.SessionOptions = { executionProviders: providers };
    const [enc, dec] = await Promise.all([ort.InferenceSession.create(encBytes, opts), ort.InferenceSession.create(decBytes, opts)]);
    return { enc, dec, decode: makeDecoder(tokJson) };
  })().catch((e) => { ready = null; throw e; }));
}

/** PNG → 384×384 RGB, stretched (the benchmark's best preprocessing), normalised to [−1, 1]. */
async function pixels(png: ArrayBuffer): Promise<Float32Array> {
  const S = 384;
  const bmp = await createImageBitmap(new Blob([png], { type: "image/png" }));
  const c = new OffscreenCanvas(S, S), ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, S, S);
  ctx.drawImage(bmp, 0, 0, S, S);
  const d = ctx.getImageData(0, 0, S, S).data, px = new Float32Array(3 * S * S);
  for (let p = 0; p < S * S; p++) for (let ch = 0; ch < 3; ch++) px[ch * S * S + p] = (d[p * 4 + ch]! / 255 - 0.5) / 0.5;
  return px;
}

/** Greedy decode. Stops at EOS, at 160 tokens, or when the last 6 tokens repeat the 6 before them (a runaway). */
async function recognize(png: ArrayBuffer): Promise<string> {
  const { enc, dec, decode } = await load();
  const { last_hidden_state: h } = await enc.run({ pixel_values: new ort.Tensor("float32", await pixels(png), [1, 3, 384, 384]) });
  const ids = [MODEL.bos];
  for (let s = 0; s < 160; s++) {
    const { logits } = await dec.run({ input_ids: new ort.Tensor("int64", BigInt64Array.from(ids.map(BigInt)), [1, ids.length]), encoder_hidden_states: h! });
    const data = (await logits!.getData()) as Float32Array, V = logits!.dims[2]!, off = (ids.length - 1) * V;
    let best = 0;
    for (let v = 1; v < V; v++) if (data[off + v]! > data[off + best]!) best = v;
    if (best === MODEL.eos) break;
    ids.push(best);
    const n = ids.length;
    if (n > 13 && ids.slice(n - 6).every((t, i) => t === ids[n - 12 + i])) { ids.splice(n - 6); break; }
  }
  return decode(ids.slice(1));
}

self.onmessage = async (e: MessageEvent<RecognizeIn>) => {
  try {
    if (e.data.type === "load") { await load(); post({ type: "ready" }); }
    else { const t0 = performance.now(); const latex = await recognize(e.data.png); post({ type: "result", latex, ms: Math.round(performance.now() - t0) }); }
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
