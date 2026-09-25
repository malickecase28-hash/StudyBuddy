import type { Block } from "./schema/blocks";

/** Depth-first visit of every block, including branch options, checkpoint items and retrieval items. */
export function walkBlocks(blocks: readonly Block[], visit: (b: Block) => void): void {
  for (const b of blocks) {
    visit(b);
    if (b.type === "branch") for (const o of b.options) walkBlocks(o.blocks, visit);
    if (b.type === "checkpoint") walkBlocks(b.items, visit);
    if (b.type === "retrieval") walkBlocks([b.item], visit);
  }
}
