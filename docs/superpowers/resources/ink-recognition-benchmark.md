# Ink handwriting → LaTeX: recognition benchmark

**Date:** 2026-10-01 (Forma Ink 1, Task 1).

**Samples:** 11 handwritten equations cropped from the lecturer's ICT 02 solution (2024-25): a tablet pen in coloured ink, inverted to dark-on-white. Truth LaTeX was written by hand.

**Scoring:** "usable" means a normalised Levenshtein distance ≤ 0.15 after notation synonyms are mapped and spaces and braces are stripped. The synonyms: `\widehat`→`\hat`, `\overrightarrow`→`\vec`, `\stackrel{\wedge}`→`\hat`, `\bigtriangledown`→`\nabla`, `\parallel`→`\|`.

**Runtime:** onnxruntime (CPU) in Node, greedy decoding with no KV cache: encoder once, then the decoder on the growing `input_ids`. The browser runs the same graph through onnxruntime-web (WebGPU or WASM).

| Model | Download | Load | Avg time / equation (CPU) | Usable |
|---|---|---|---|---|
| `breezedeus/pix2text-mfr-1.5`, input stretched to 384×384 | 119.5 MB (encoder 87.5 + decoder 32.0) | 0.6 s | 0.84 s (one runaway sample: 3.2 s) | **6 / 11 (55%)** |
| same model, input padded to a square | — | — | 2.5 s | 2 / 11 |
| `Brian314/pix2text-mfr-quantized` | 53.2 MB | 0.5 s | 1.8 s (two runaways: 3.4 s and 13.6 s) | 0 / 11 (broken output: repeated tokens, a mismatched vocabulary) |

**Failures (full model):**
- The lecturer's Greek letters: ε read as E or ∈, θ as Q, ρ as P. One stylised ρ became P, and z became 2.
- One multi-part line (`E₂ = 1/(ε₂ε₀) D₂`, written with wide gaps) came back as an `array`.
- Every Latin-and-digit equation was right.

**Decision:**
- Ship `breezedeus/pix2text-mfr-1.5` (full precision), with the input stretched to 384×384.
- Usable rate 55% < 80%, so the converter ships labelled **Beta**. The result always opens in a MathLive editor for correction before it is inserted.
- Cap decoding at 160 tokens, and stop on a repeated 6-token cycle, so runaways end quickly.
- Task 8 re-scores the model on equations written with Ink's own pen, which gives clean strokes with no colour noise.

**Model files:** fetched from `https://huggingface.co/breezedeus/pix2text-mfr-1.5/resolve/main/` (`encoder_model.onnx`, `decoder_model.onnx`, `tokenizer.json`, `tokenizer_config.json`, `special_tokens_map.json`, `generation_config.json`), and cached in the browser on first use. Tokens: BOS 1, EOS 2, PAD 0. Preprocessing: RGB, (x/255 − 0.5)/0.5, 384×384.

## In the app (Task 8, 2026-10-01)

**Setup:** the browser worker runs the same two ONNX graphs through `onnxruntime-web` (the `webgpu` bundle, which runs its asyncify WASM build), with greedy decoding as above. Headless Chromium has no GPU adapter, so these runs used WASM on one thread (the page isn't cross-origin isolated). The tokenizer is decoded in the worker (byte-level BPE); transformers.js isn't used. The model, tokenizer and runtime are cached in Cache Storage (`forma-ink-model-v1`, about 146 MB) on first use.

**Input:** five equations written with Ink's pen through synthetic pointer events, from simple single-stroke glyphs (not real handwriting). Selected with the lasso, rasterised black on white as a tight crop (longest side 368 px, 8 px padding), and stretched to 384 × 384 in the worker.

| Written | Model output | Read in | Usable |
|---|---|---|---|
| `E=mc^{2}` | `\mathrm { E = } \mathrm { m \, c } ^ { 2 }` | 2.8 s | yes |
| `x+y=2` | `\times + y = 2` | 1.9 s | no (x read as ×) |
| `a^{2}+b^{2}=c^{2}` | `\textbf { c } ^ { 2 } { + } \textbf { b } ^ { 2 } { = } \textbf { c } ^ { 2 }` | 5.4 s | no (a read as c) |
| `F=qE` | `\mathrm { F } = \omicron \mathrm { E }` | 5.8 s | no (q read as ο) |
| `V=IR` | `\bigvee = \textsc { l } \mathbb { R }` | 5.8 s | no |

**Offline:** a second session with `huggingface.co` and `cdn.jsdelivr.net` blocked gave the same five outputs from the cache (1.8–3.8 s each).

**Reading:** the synthetic glyphs are crude (a circle-and-stem `a`, a two-line `x`), so this measures the pipeline more than the model; the lecturer-handwriting result above (6/11) is the better estimate. The converter stays **Beta**, and every result opens in the equation field for correction before it is inserted. Insert swaps the strokes for the equation in one undo step (checked: undo restored all 8 strokes of `E=mc²`).
