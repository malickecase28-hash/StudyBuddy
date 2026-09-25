import { z } from "zod";

export const Source = z.object({ doc: z.string().min(1), locator: z.string().min(1) });
export type Source = z.infer<typeof Source>;

export const Licence = z.enum(["restricted", "original"]);
export type Licence = z.infer<typeof Licence>;

export const Mood = z.enum(["quiet", "vivid", "intense", "assessment", "reflect"]);
export type Mood = z.infer<typeof Mood>;

export const DIMENSIONS = ["conceptual", "computational", "recognition", "independent", "application"] as const;
export const Dimension = z.enum(DIMENSIONS);
export type Dimension = z.infer<typeof Dimension>;

export const Semantic = z.enum(["charge", "field", "flux", "surface", "confirmed"]);
export type Semantic = z.infer<typeof Semantic>;

export const ErrorClass = z.enum(["conceptual", "arithmetic", "unit", "sign", "notation"]);
export type ErrorClass = z.infer<typeof ErrorClass>;

export const Id = z.string().regex(/^[a-z0-9-]+$/);
export const Tag = z.string().regex(/^[A-Z][A-Z0-9_]*$/);

export const Choice = z.object({
  id: Id,
  label: z.string().min(1),
  correct: z.boolean(),
  feedback: z.string().min(1),
  tag: Tag.optional(),
});
export type Choice = z.infer<typeof Choice>;

export const AuthoredQuantity = z.object({ value: z.number(), unit: z.string() });
export type AuthoredQuantity = z.infer<typeof AuthoredQuantity>;

export const Distractor = AuthoredQuantity.extend({
  errorClass: ErrorClass,
  tag: Tag.optional(),
  feedback: z.string().min(1),
});
export type Distractor = z.infer<typeof Distractor>;

/** Shared numeric-answer fields used by numeric, step-solve steps and challenge. */
export const NumericAnswerFields = {
  answer: AuthoredQuantity,
  relTol: z.number().positive().default(0.02),
  distractors: z.array(Distractor).default([]),
};
