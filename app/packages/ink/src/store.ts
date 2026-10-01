import type { Item, Notebook, Page } from "./model";
import type { Op } from "./ops";

/** Where notebooks, pages and their items live. The web app supplies an IndexedDB store with an in-memory fallback. */
export interface InkStore {
  listNotebooks(): Promise<Notebook[]>;
  getNotebook(id: string): Promise<Notebook | undefined>;
  putNotebook(n: Notebook): Promise<void>;
  deleteNotebook(id: string): Promise<void>;
  getPage(id: string): Promise<{ page: Page; items: Item[] } | undefined>;
  putPage(p: Page): Promise<void>;
  /** Upsert or delete the item rows an op touches. */
  applyOp(pageId: string, op: Op): Promise<void>;
  putThumb(pageId: string, png: Blob): Promise<void>;
  getThumb(pageId: string): Promise<Blob | undefined>;
}

/** Applies an op to a page's rows (id → item, null = deleted). Shared by every store so they agree on the result. */
export function applyOpToRows(rows: Map<string, Item | null>, op: Op, existing: (id: string) => Item | undefined): void {
  switch (op.type) {
    case "add": for (const it of op.items) rows.set(it.id, it); break;
    case "remove": for (const it of op.items) rows.set(it.id, null); break;
    case "update": for (const it of op.after) rows.set(it.id, it); break;
    case "reorder": op.ids.forEach((id, i) => {
      const it = rows.get(id) ?? existing(id);
      if (it) rows.set(id, { ...it, z: op.after[i]! });
    }); break;
  }
}
