import { z } from "zod";
import { Choice, Id } from "./common";

export const DiagnosticItem = z.object({
  id: Id,
  topic: Id,
  role: z.enum(["core", "probe"]),
  prompt: z.string().min(1),
  options: z.array(Choice).min(2),
});
export type DiagnosticItem = z.infer<typeof DiagnosticItem>;

export const Diagnostic = z.object({
  topics: z.array(z.object({ id: Id, label: z.string().min(1), refresher: z.string().nullable() })).min(1),
  items: z.array(DiagnosticItem).min(1),
});
export type Diagnostic = z.infer<typeof Diagnostic>;
