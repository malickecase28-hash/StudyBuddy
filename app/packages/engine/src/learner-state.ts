import { z } from "zod";
import type { LearnEvent } from "./events";
import { zeroDimensions, type Dimensions } from "./mastery";
import type { Review } from "./scheduler";
import { DIMENSIONS, type Dimension } from "./schema/common";

export const STATE_VERSION = 1;
export const HISTORY_CAP = 500;

export type ConceptProgress = {
  dimensions: Dimensions;
  seen: boolean;
  attempts: number;
  tags: Record<string, number>;
  blockFails: Record<string, number>;
  firedRules: string[];
  lastSeen: number | null;
  review: Partial<Record<Dimension, Review>>;
};

export type NotebookEntry = {
  id: string;
  createdAt: number;
  conceptId: string;
  kind: "note" | "equation" | "sim-state" | "drawing";
  title: string;
  body: string;
  text?: string;
  simState?: { scene: string; config: Record<string, unknown> };
};

export type Settings = {
  theme: "paper" | "night" | "contrast";
  motion: "standard" | "reduced";
  density: "comfortable" | "compact";
  simQuality: "high" | "balanced" | "low";
  equationDetail: "progressive" | "full";
};

export type LearnerState = {
  version: 1;
  diagnostic: { completedAt: number; results: Record<string, "ready" | "partial" | "gap">; route: string[] } | null;
  concepts: Record<string, ConceptProgress>;
  position: { conceptId: string; lessonId: string; blockId: string; branchStack: string[] } | null;
  notebook: NotebookEntry[];
  settings: Settings;
  history: LearnEvent[];
};

export const emptyProgress = (): ConceptProgress => ({
  dimensions: zeroDimensions(),
  seen: false,
  attempts: 0,
  tags: {},
  blockFails: {},
  firedRules: [],
  lastSeen: null,
  review: {},
});

export const initialState = (): LearnerState => ({
  version: STATE_VERSION,
  diagnostic: null,
  concepts: {},
  position: null,
  notebook: [],
  settings: { theme: "paper", motion: "standard", density: "comfortable", simQuality: "balanced", equationDetail: "progressive" },
  history: [],
});

const num01 = z.number().min(0).max(1);
const ReviewS = z.object({ due: z.number(), intervalDays: z.number().positive() });
const ProgressS = z.object({
  dimensions: z.object(Object.fromEntries(DIMENSIONS.map((d) => [d, num01])) as Record<Dimension, typeof num01>),
  seen: z.boolean(),
  attempts: z.number().int().nonnegative(),
  tags: z.record(z.string(), z.number()),
  blockFails: z.record(z.string(), z.number()),
  firedRules: z.array(z.string()),
  lastSeen: z.number().nullable(),
  review: z.record(z.string(), ReviewS),
});
const StateV1 = z.object({
  version: z.literal(1),
  diagnostic: z
    .object({
      completedAt: z.number(),
      results: z.record(z.string(), z.enum(["ready", "partial", "gap"])),
      route: z.array(z.string()),
    })
    .nullable(),
  concepts: z.record(z.string(), ProgressS),
  position: z
    .object({ conceptId: z.string(), lessonId: z.string(), blockId: z.string(), branchStack: z.array(z.string()) })
    .nullable(),
  notebook: z.array(z.any()),
  settings: z.object({
    theme: z.enum(["paper", "night", "contrast"]),
    motion: z.enum(["standard", "reduced"]),
    density: z.enum(["comfortable", "compact"]),
    simQuality: z.enum(["high", "balanced", "low"]),
    equationDetail: z.enum(["progressive", "full"]),
  }),
  history: z.array(z.any()),
});

/** Validate persisted state; unknown versions or corrupt data are backed up and reset. */
export function migrate(raw: unknown): { state: LearnerState; reset: boolean; backup?: unknown } {
  if (raw === null || raw === undefined) return { state: initialState(), reset: false };
  const parsed = StateV1.safeParse(raw);
  if (parsed.success) return { state: parsed.data as LearnerState, reset: false };
  return { state: initialState(), reset: true, backup: raw };
}
