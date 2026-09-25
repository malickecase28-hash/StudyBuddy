import type { Block, Dimension, Effect, ErrorClass } from "@studybuddy/engine";

export type AnswerInput = {
  block: Block;
  dimensions: Dimension[];
  correct: boolean;
  attempt: number;
  tag?: string;
  errorClass?: ErrorClass;
};

/** What every block renderer receives from the lesson player. */
export type BlockCtx = {
  conceptId: string;
  /** The block has met its completion condition (the player may now offer Continue). */
  onDone: () => void;
  /** Record an answer; returns rule effects (e.g. revealWorkedStep) for the block to act on. */
  onAnswer: (a: AnswerInput) => Effect[];
  /** Retrieval blocks report through here instead of onAnswer. */
  onRetrieval?: (dimension: Dimension, correct: boolean) => void;
};

export const ERROR_LABEL: Record<ErrorClass, string> = {
  conceptual: "Concept",
  arithmetic: "Arithmetic slip",
  unit: "Units",
  sign: "Sign",
  notation: "Format",
};
