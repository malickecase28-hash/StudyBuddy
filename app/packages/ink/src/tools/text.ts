import type { InkEngine } from "../engine";
import { vec, type Tool } from "./types";

/** Text and equation tools: a tap edits the item under the pointer, or starts a new one there. */
export const makeEditTool = (kind: "text" | "equation") => (engine: InkEngine): Tool => ({
  cursor: kind === "text" ? "text" : "crosshair",
  down() {},
  move() {},
  up(s) {
    const at = vec(s);
    const item = engine.itemAt(at, 4 / engine.camera.zoom, (it) => it.kind === kind);
    engine.requestEdit(item ? { kind, at, item } : { kind, at });
  },
  cancel() {},
});
