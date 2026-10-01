import type { InkEngine } from "../engine";
import type { InkPoint, Vec } from "../model";
import type { PointerSample } from "../input";

/** A pointer sample already in world coordinates. */
export type WorldSample = PointerSample & { wx: number; wy: number };
export const toInkPoint = (s: WorldSample): InkPoint => [s.wx, s.wy, s.pressure, s.tiltX, s.tiltY, s.t];
export const vec = (s: WorldSample): Vec => ({ x: s.wx, y: s.wy });

/** A tool is a small state machine fed by the engine's input; it changes the page only through engine.do / engine.group. */
export interface Tool {
  down(s: WorldSample): void;
  move(samples: WorldSample[], predicted: WorldSample[]): void;
  up(s: WorldSample): void;
  cancel(): void;
  /** Overlay in world coordinates, drawn every frame. */
  drawLive?(ctx: CanvasRenderingContext2D, engine: InkEngine): void;
  deactivate?(): void;
  /** CSS cursor while hovering. */
  cursor?: string;
}
export type ToolFactory = (engine: InkEngine) => Tool;
