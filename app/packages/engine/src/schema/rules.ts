import { z } from "zod";
import { Dimension, Id, Tag } from "./common";

export const Condition = z.discriminatedUnion("type", [
  z.object({ type: z.literal("tagCount"), tag: Tag, gte: z.number().int().positive() }),
  z.object({ type: z.literal("challengePassed"), firstAttempt: z.boolean() }),
  z.object({
    type: z.literal("attemptsFailed"),
    blockType: z.enum(["numeric", "mcq", "step-solve"]),
    gte: z.number().int().positive(),
  }),
]);
export type Condition = z.infer<typeof Condition>;

export const Effect = z.discriminatedUnion("type", [
  z.object({ type: z.literal("offerRemediation"), tag: Tag, lessonRef: z.string().min(1) }),
  z.object({ type: z.literal("offerSkip") }),
  z.object({ type: z.literal("revealWorkedStep") }),
  z.object({ type: z.literal("credit"), dimension: Dimension, amount: z.number().min(0).max(1) }),
]);
export type Effect = z.infer<typeof Effect>;

export const Rule = z.object({
  id: Id,
  when: Condition,
  then: z.array(Effect).min(1),
  once: z.boolean().default(true),
});
export type Rule = z.infer<typeof Rule>;
