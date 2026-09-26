import type { z } from "zod";

export type Instance = { id: string; component: string; params: Record<string, unknown>; links?: Record<string, string>; visible?: boolean };
export type Evaluated = { params: Record<string, unknown>; model: Record<string, unknown>; visible: boolean };
export type ModelCtx = { link: (name: string) => Evaluated };

export type ComponentDef<P, M> = {
  id: string;
  params: z.ZodType<P>;
  model: (params: P, ctx: ModelCtx) => M;
  /** Params the learner may manipulate directly. */
  handles: readonly string[];
  /** Model values the plate may display, with their units. */
  readouts: Readonly<Record<string, string>>;
  /** Model values text may quote though they are not displayed readouts (model key → unit; number or number[]). */
  quotable?: Readonly<Record<string, string>>;
  /** Named upstream inputs (instance links). */
  links?: readonly string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyComponent = ComponentDef<any, any>;

export const defineComponent = <P, M extends Record<string, unknown>>(def: ComponentDef<P, M>): ComponentDef<P, M> => def;

export class Registry {
  private readonly defs = new Map<string, AnyComponent>();
  register(...defs: AnyComponent[]): this {
    for (const d of defs) {
      if (this.defs.has(d.id)) throw new Error(`Duplicate component: ${d.id}`);
      this.defs.set(d.id, d);
    }
    return this;
  }
  get(id: string): AnyComponent {
    const d = this.defs.get(id);
    if (!d) throw new Error(`Unknown component: ${id}`);
    return d;
  }
  has(id: string): boolean {
    return this.defs.has(id);
  }
  ids(): string[] {
    return [...this.defs.keys()];
  }
}
