import type { InkEngine } from "../engine";
import type { Tool, WorldSample } from "./types";

/** Drag to pan. Works in screen space so it doesn't drift as the camera moves. */
export const makeHand = (engine: InkEngine): Tool => {
  let last: { x: number; y: number } | null = null;
  return {
    cursor: "grab",
    down(s) { last = { x: s.x, y: s.y }; },
    move(samples: WorldSample[]) {
      const s = samples[samples.length - 1];
      if (!last || !s) return;
      engine.panBy(s.x - last.x, s.y - last.y);
      last = { x: s.x, y: s.y };
    },
    up() { last = null; },
    cancel() { last = null; },
  };
};
