import { z } from "zod";
import { Block } from "./blocks";
import { Id, Source, Tag } from "./common";
import { Rule } from "./rules";

export const ConceptId = z.string().regex(/^[a-z0-9]+(\.[a-z0-9-]+)+$/);

export const Lesson = z.object({
  id: Id,
  title: z.string().min(1),
  minutes: z.number().positive(),
  blocks: z.array(Block).min(1),
});
export type Lesson = z.infer<typeof Lesson>;

export const Concept = z.object({
  id: ConceptId,
  title: z.string().min(1),
  unit: z.number().int().nonnegative(),
  objectives: z.array(z.string().min(1)).min(1),
  prerequisites: z.array(z.object({ conceptId: ConceptId, minMastery: z.number().min(0).max(1) })),
  misconceptions: z.array(z.object({ tag: Tag, description: z.string().min(1), remediation: z.string().min(1) })),
  examLinks: z.array(
    z.object({
      paper: z.string().min(1),
      question: z.string().min(1),
      marks: z.number().positive(),
      weight: z.number().min(0).max(1),
    }),
  ),
  sources: z.array(Source),
  status: z.enum(["draft", "verified", "ready"]),
  lessons: z.array(Lesson),
  rules: z.array(Rule),
  locked: z.boolean().default(false),
});
export type Concept = z.infer<typeof Concept>;

export const Assessment = z.object({
  id: Id,
  title: z.string().min(1),
  short: z.string().min(1),
  date: z.iso.date(),
  weight: z.number().positive().max(100),
  scope: z.object({ concepts: z.array(ConceptId).min(1) }),
});
export type Assessment = z.infer<typeof Assessment>;

export const Course = z.object({
  id: Id,
  code: z.string().min(1),
  title: z.string().min(1),
  examDate: z.iso.date(),
  assessments: z.array(Assessment).default([]),
  units: z.array(z.object({ number: z.number().int().nonnegative(), title: z.string().min(1) })),
  concepts: z.array(Concept),
});
export type Course = z.infer<typeof Course>;
