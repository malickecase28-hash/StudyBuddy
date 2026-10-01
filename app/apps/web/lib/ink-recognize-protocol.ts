/** Messages between the page and the handwriting worker, and where the model lives. */
export type RecognizeIn = { type: "load" } | { type: "recognize"; png: ArrayBuffer };
export type RecognizeOut =
  | { type: "progress"; loaded: number; total: number }
  | { type: "ready" }
  | { type: "result"; latex: string; ms: number }
  | { type: "error"; message: string };

const ORT_VERSION = "1.31.0-dev.20260914-8d85527a0";
/** The WebAssembly runtime that onnxruntime-web/webgpu runs (its asyncify build, WebGPU and CPU), the same version as the installed package. */
export const ORT_WASM = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/ort-wasm-simd-threaded.asyncify.wasm`;

export const MODEL = {
  id: "breezedeus/pix2text-mfr-1.5",
  base: "https://huggingface.co/breezedeus/pix2text-mfr-1.5/resolve/main/",
  bos: 1,
  eos: 2,
  /** Encoder 87.5 MB + decoder 32.0 MB + runtime ≈ 26 MB. */
  bytes: 146_000_000,
};
