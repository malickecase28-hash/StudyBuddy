import { z } from "zod";
import { ItemSchema, type Item } from "./model";

/** Every page change is an Op: serializable (Ink 2 broadcasts them) and invertible (undo). */
export type Op =
  | { type: "add"; items: Item[] }
  | { type: "remove"; items: Item[] }
  | { type: "update"; before: Item[]; after: Item[] }
  | { type: "reorder"; ids: string[]; before: number[]; after: number[] };

export const OpSchema: z.ZodType<Op> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add"), items: z.array(ItemSchema).min(1) }),
  z.object({ type: z.literal("remove"), items: z.array(ItemSchema).min(1) }),
  z.object({ type: z.literal("update"), before: z.array(ItemSchema).min(1), after: z.array(ItemSchema).min(1) }),
  z.object({ type: z.literal("reorder"), ids: z.array(z.string()), before: z.array(z.number()), after: z.array(z.number()) }),
]) as z.ZodType<Op>;

export class InvalidOp extends Error {}

export function invert(op: Op): Op {
  switch (op.type) {
    case "add": return { type: "remove", items: op.items };
    case "remove": return { type: "add", items: op.items };
    case "update": return { type: "update", before: op.after, after: op.before };
    case "reorder": return { type: "reorder", ids: op.ids, before: op.after, after: op.before };
  }
}

/** Validates, then mutates `items`. Throws InvalidOp without touching `items` when the op is malformed. */
export function apply(items: Map<string, Item>, op: Op): void {
  const parsed = OpSchema.safeParse(op);
  if (!parsed.success) throw new InvalidOp(parsed.error.message);
  if (op.type === "update" && (op.before.length !== op.after.length || op.before.some((b, i) => b.id !== op.after[i]!.id))) throw new InvalidOp("update before/after ids differ");
  if (op.type === "reorder" && (op.ids.length !== op.before.length || op.ids.length !== op.after.length)) throw new InvalidOp("reorder lengths differ");
  switch (op.type) {
    case "add": for (const it of op.items) items.set(it.id, it); break;
    case "remove": for (const it of op.items) items.delete(it.id); break;
    case "update": for (const it of op.after) items.set(it.id, it); break;
    case "reorder": op.ids.forEach((id, i) => { const it = items.get(id); if (it) items.set(id, { ...it, z: op.after[i]! }); }); break;
  }
}
