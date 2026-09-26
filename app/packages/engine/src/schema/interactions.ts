import { z } from "zod";
import { StepSolveBlock } from "./blocks";
import { Choice, Dimension, Id, NumericAnswerFields, Tag } from "./common";

export const Route = z.object({
  when: z.object({
    outcome: z.enum(["correct", "incorrect", "any"]).default("any"),
    choice: Id.optional(),
    reason: Id.optional(),
    attemptGte: z.number().int().positive().optional(),
    tag: Tag.optional(),
    masteryBelow: z.object({ conceptId: z.string().min(1), value: z.number().min(0).max(1) }).optional(),
  }),
  goto: z.object({ step: Id.optional(), lessonRef: z.string().min(1).optional() }),
  say: z.string().optional(),
});
export type Route = z.infer<typeof Route>;

const base = { id: Id, routes: z.array(Route).default([]) };
const Patch = z.record(z.string(), z.record(z.string(), z.unknown()));

export const Interaction = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("predict-drag"),
    prompt: z.string().min(1),
    target: z.object({ instance: z.string().min(1), readout: z.string().min(1) }),
    range: z.tuple([z.number(), z.number()]),
    unit: z.string(),
    relTol: z.number().positive().default(0.05),
    reveal: Patch.default({}),
    dimension: Dimension,
    feedback: z.object({ close: z.string().min(1), far: z.string().min(1) }),
    tag: Tag.optional(),
  }),
  z.object({
    ...base,
    type: z.literal("place"),
    prompt: z.string().min(1),
    handle: z.object({ instance: z.string().min(1), param: z.string().min(1) }),
    check: z.string().min(1),
    hint: z.string().min(1),
    dimension: Dimension,
  }),
  z.object({ ...base, type: z.literal("manipulate-goal"), goal: z.string().min(1), check: z.string().min(1), dimension: Dimension }),
  z.object({ ...base, type: z.literal("identify"), prompt: z.string().min(1), targets: z.array(Choice).min(2), dimension: Dimension }),
  z.object({
    ...base,
    type: z.literal("build-equation"),
    prompt: z.string().min(1),
    template: z.string().min(1),
    answers: z.record(Id, z.string().min(1)),
    feedback: z.object({ correct: z.string().min(1), incorrect: z.string().min(1) }),
    tag: Tag.optional(),
    dimension: Dimension,
  }),
  z.object({
    ...base,
    type: z.literal("choose"),
    prompt: z.string().min(1),
    options: z.array(Choice).min(2),
    selfExplain: z.object({ prompt: z.string().min(1), options: z.array(Choice).min(2) }).optional(),
    dimension: Dimension,
  }),
  z.object({ ...base, type: z.literal("numeric"), prompt: z.string().min(1), ...NumericAnswerFields, hints: z.array(z.string()).max(3).default([]), dimension: Dimension }),
  z.object({ ...base, type: z.literal("step-solve"), prompt: z.string().min(1), steps: StepSolveBlock.shape.steps, dimension: Dimension }),
  z.object({ ...base, type: z.literal("sketch"), prompt: z.string().min(1), solution: z.string().min(1), dimension: Dimension }),
]);
export type Interaction = z.infer<typeof Interaction>;
