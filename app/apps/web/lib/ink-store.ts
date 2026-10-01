import Dexie, { type Table } from "dexie";
import { useSyncExternalStore } from "react";
import { applyOpToRows, ItemSchema, newId, type InkStore, type Item, type Notebook, type Op, type Page, type Template } from "@forma/ink";

type ItemRow = { pageId: string; id: string; item: Item };

/** Everything in memory: the fallback when IndexedDB is unavailable (private windows, blocked storage). */
export class MemoryInkStore implements InkStore {
  private notebooks = new Map<string, Notebook>();
  private pages = new Map<string, Page>();
  private items = new Map<string, Map<string, Item | null>>();
  private thumbs = new Map<string, Blob>();
  async listNotebooks() { return [...this.notebooks.values()]; }
  async getNotebook(id: string) { return this.notebooks.get(id); }
  async putNotebook(n: Notebook) { this.notebooks.set(n.id, n); }
  async deleteNotebook(id: string) {
    for (const p of [...this.pages.values()].filter((p) => p.notebookId === id)) { this.pages.delete(p.id); this.items.delete(p.id); this.thumbs.delete(p.id); }
    this.notebooks.delete(id);
  }
  async getPage(id: string) {
    const page = this.pages.get(id);
    if (!page) return undefined;
    return { page, items: [...(this.items.get(id)?.values() ?? [])].filter((x): x is Item => !!x) };
  }
  async putPage(p: Page) { this.pages.set(p.id, p); }
  async applyOp(pageId: string, op: Op) {
    let rows = this.items.get(pageId);
    if (!rows) this.items.set(pageId, (rows = new Map()));
    applyOpToRows(rows, op, () => undefined);
  }
  async putThumb(pageId: string, png: Blob) { this.thumbs.set(pageId, png); }
  async getThumb(pageId: string) { return this.thumbs.get(pageId); }
}

class InkDb extends Dexie {
  notebooks!: Table<Notebook, string>;
  pages!: Table<Page, string>;
  items!: Table<ItemRow, [string, string]>;
  thumbs!: Table<{ pageId: string; png: Blob }, string>;
  constructor() {
    super("forma-ink");
    this.version(1).stores({ notebooks: "id,updatedAt,conceptId", pages: "id,notebookId,updatedAt", items: "[pageId+id],pageId", thumbs: "pageId" });
  }
}

/**
 * IndexedDB through Dexie. Item writes are queued per page and flushed 400 ms after the last op, and at once when
 * the tab hides or unloads, so a quick reload keeps the last stroke.
 */
export class DexieInkStore implements InkStore {
  private db = new InkDb();
  private pending = new Map<string, Map<string, Item | null>>();
  /** Rows of pages opened this session, so a reorder can patch z without a read. */
  private mirror = new Map<string, Map<string, Item>>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(private onError: (e: unknown) => void) {
    const now = () => { if (document.visibilityState === "hidden") void this.flush(); };
    window.addEventListener("pagehide", () => void this.flush());
    document.addEventListener("visibilitychange", now);
  }
  /** Resolves when the database opens; rejects if it can't within 3 s. */
  async ready(): Promise<void> {
    await Promise.race([this.db.open(), new Promise((_, no) => setTimeout(() => no(new Error("IndexedDB did not open")), 3000))]);
  }
  listNotebooks() { return this.db.notebooks.orderBy("updatedAt").reverse().toArray(); }
  getNotebook(id: string) { return this.db.notebooks.get(id); }
  async putNotebook(n: Notebook) { await this.db.notebooks.put(n); }
  async deleteNotebook(id: string) {
    await this.db.transaction("rw", [this.db.notebooks, this.db.pages, this.db.items, this.db.thumbs], async () => {
      const pages = await this.db.pages.where("notebookId").equals(id).primaryKeys();
      for (const p of pages) { await this.db.items.where("pageId").equals(p).delete(); this.pending.delete(p); }
      await this.db.thumbs.bulkDelete(pages);
      await this.db.pages.bulkDelete(pages);
      await this.db.notebooks.delete(id);
    });
  }
  async getPage(id: string) {
    await this.flush();
    const page = await this.db.pages.get(id);
    if (!page) return undefined;
    // A row that no longer validates (an older build, a bad import) is left out rather than breaking the page.
    let skipped = 0;
    const items = (await this.db.items.where("pageId").equals(id).toArray()).flatMap((r) => {
      const ok = ItemSchema.safeParse(r.item);
      if (!ok.success) skipped++;
      return ok.success ? [ok.data] : [];
    });
    this.mirror.set(id, new Map(items.map((i) => [i.id, i])));
    return { page, items, skipped };
  }
  async putPage(p: Page) { await this.db.pages.put(p); }
  async applyOp(pageId: string, op: Op) {
    let rows = this.pending.get(pageId);
    if (!rows) this.pending.set(pageId, (rows = new Map()));
    applyOpToRows(rows, op, (id) => this.mirror.get(pageId)?.get(id));
    const m = this.mirror.get(pageId);
    if (m) for (const [id, it] of rows) it ? m.set(id, it) : m.delete(id);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), 400);
  }
  async flush(): Promise<void> {
    clearTimeout(this.timer);
    if (!this.pending.size) return;
    const batch = this.pending;
    this.pending = new Map();
    try {
      await this.db.transaction("rw", this.db.items, async () => {
        for (const [pageId, rows] of batch) {
          const put: ItemRow[] = [], del: [string, string][] = [];
          for (const [id, it] of rows) it ? put.push({ pageId, id, item: it }) : del.push([pageId, id]);
          if (put.length) await this.db.items.bulkPut(put);
          if (del.length) await this.db.items.bulkDelete(del);
        }
      });
    } catch (e) {
      this.onError(e);
      throw e;
    }
  }
  async putThumb(pageId: string, png: Blob) { await this.db.thumbs.put({ pageId, png }); }
  async getThumb(pageId: string) { return (await this.db.thumbs.get(pageId))?.png; }
}

/** Delegates to IndexedDB; on the first failure, switches to memory for the rest of the session and says so. */
class ResilientInkStore implements InkStore {
  unavailable = false;
  private impl: InkStore | null = null;
  private opening: Promise<InkStore> | null = null;
  private listeners = new Set<() => void>();
  private fail = () => {
    if (this.unavailable) return;
    this.unavailable = true;
    this.impl = new MemoryInkStore();
    for (const l of this.listeners) l();
  };
  private async get(): Promise<InkStore> {
    if (this.impl) return this.impl;
    return (this.opening ??= (async () => {
      try {
        const d = new DexieInkStore(this.fail);
        await d.ready();
        return (this.impl ??= d);
      } catch {
        this.fail();
        return this.impl!;
      }
    })());
  }
  private run = async <T,>(f: (s: InkStore) => Promise<T>): Promise<T> => {
    const s = await this.get();
    try { return await f(s); } catch (e) {
      if (s instanceof MemoryInkStore) throw e;
      this.fail();
      return f(this.impl!);
    }
  };
  subscribe = (l: () => void) => { this.listeners.add(l); return () => void this.listeners.delete(l); };
  listNotebooks() { return this.run((s) => s.listNotebooks()); }
  getNotebook(id: string) { return this.run((s) => s.getNotebook(id)); }
  putNotebook(n: Notebook) { return this.run((s) => s.putNotebook(n)); }
  deleteNotebook(id: string) { return this.run((s) => s.deleteNotebook(id)); }
  getPage(id: string) { return this.run((s) => s.getPage(id)); }
  putPage(p: Page) { return this.run((s) => s.putPage(p)); }
  applyOp(pageId: string, op: Op) { return this.run((s) => s.applyOp(pageId, op)); }
  putThumb(pageId: string, png: Blob) { return this.run((s) => s.putThumb(pageId, png)); }
  getThumb(pageId: string) { return this.run((s) => s.getThumb(pageId)); }
}

let store: ResilientInkStore | null = null;
/** The app's ink store (client only). */
export const inkStore = () => (store ??= new ResilientInkStore());

/** True once storage has failed and pages live only in this tab. */
export function useStorageUnavailable(): boolean {
  return useSyncExternalStore((l) => inkStore().subscribe(l), () => inkStore().unavailable, () => false);
}

/** A new page row (not yet stored). */
export function newPage(notebookId: string, template: Template = "grid", title = "Page"): Page {
  const t = Date.now();
  return { id: newId(), notebookId, title, template, frame: "none", createdAt: t, updatedAt: t };
}

/** Creates a notebook with one page and stores both. */
export async function createNotebook(title: string, opts: { id?: string; conceptId?: string; color?: Notebook["color"]; template?: Template } = {}): Promise<Notebook> {
  const t = Date.now(), id = opts.id ?? newId();
  const page = newPage(id, opts.template ?? "grid", "Page 1");
  const nb: Notebook = { id, title, color: opts.color ?? "ink", pageIds: [page.id], createdAt: t, updatedAt: t, ...(opts.conceptId ? { conceptId: opts.conceptId } : {}) };
  await inkStore().putPage(page);
  await inkStore().putNotebook(nb);
  return nb;
}

/** The scratch whiteboard has a fixed id, so renaming it doesn't make another. */
export const SCRATCH_ID = "scratch";

/** Notebooks, newest first; creates the scratch whiteboard the first time. */
export async function listNotebooksEnsuringScratch(): Promise<Notebook[]> {
  const list = await inkStore().listNotebooks();
  if (!list.some((n) => n.id === SCRATCH_ID)) list.push(await createNotebook("Scratch whiteboard", { id: SCRATCH_ID, template: "blank" }));
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

