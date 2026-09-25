import type { BlockType } from "./schema/blocks";
import type { Dimension, ErrorClass } from "./schema/common";

export type LearnEvent =
  | { type: "blockViewed"; conceptId: string; blockId: string; at: number }
  | {
      type: "answer";
      conceptId: string;
      blockId: string;
      blockType: BlockType;
      dimensions: Dimension[];
      correct: boolean;
      attempt: number;
      tag?: string;
      errorClass?: ErrorClass;
      at: number;
    }
  | { type: "retrieval"; conceptId: string; dimension: Dimension; correct: boolean; at: number };
