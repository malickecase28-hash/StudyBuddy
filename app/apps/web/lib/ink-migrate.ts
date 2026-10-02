import { newId, type ImageItem, type Item, type Notebook, type TextItem } from "@forma/ink";
import { course, getConcept } from "@/lib/course";
import { createNotebook, inkStore, newPage } from "@/lib/ink-store";
import { measureHtml, TEXT_STYLE, textHtml } from "@/lib/ink-bitmaps";
import { load, save, TIMED_OUT } from "@/lib/persist";
import { useStudy } from "@/lib/store";

/** The notebook for a concept (the first one linked to it), created on first use. */
export async function conceptNotebook(conceptId: string): Promise<Notebook> {
  const found = (await inkStore().listNotebooks()).filter((n) => n.conceptId === conceptId).sort((a, b) => a.createdAt - b.createdAt)[0];
  return found ?? createNotebook(getConcept(conceptId)?.title ?? "Notebook", { conceptId });
}

const KEY = "ink-migrated:v1";
type Done = Record<string, string>; // old note id (or "draft:<concept>") → /ink/<notebook>/<page>

/** Size an old js-draw SVG declared, in px; 800 × 600 when it doesn't say. */
function svgSize(svg: string): { w: number; h: number } {
  const num = (k: string) => Number(new RegExp(`\\b${k}="([\\d.]+)`).exec(svg)?.[1]);
  const vb = /viewBox="[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)"/.exec(svg);
  const w = num("width") || Number(vb?.[1]) || 800, h = num("height") || Number(vb?.[2]) || 600;
  const k = Math.min(1, 900 / w);
  return { w: w * k, h: h * k };
}

/** One migrated page: the old drawing as an image, the typed working as text beneath it. */
async function migratePage(conceptId: string, title: string, svg: string | undefined, text: string | undefined): Promise<string> {
  const nb = await conceptNotebook(conceptId);
  const page = newPage(nb.id, "grid", title);
  const items: Item[] = [];
  let y = 0;
  if (svg) {
    const { w, h } = svgSize(svg);
    const img: ImageItem = { id: newId(), kind: "image", src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg), w, h, z: 1, transform: [1, 0, 0, 1, 0, 0], style: { color: "ink", size: 3, opacity: 1 } };
    items.push(img);
    y = h + 24;
  }
  if (text?.trim()) {
    const t = text.trim();
    const tx: TextItem = { id: newId(), kind: "text", text: t, width: Math.max(40, measureHtml(`<div style="${TEXT_STYLE}">${textHtml(t)}</div>`).w + 4), z: 2, transform: [1, 0, 0, 1, 0, y], style: { color: "ink", size: 1, opacity: 1 } };
    items.push(tx);
  }
  await inkStore().putPage(page);
  if (items.length) await inkStore().applyOp(page.id, { type: "add", items });
  const fresh = (await inkStore().getNotebook(nb.id)) ?? nb;
  await inkStore().putNotebook({ ...fresh, pageIds: [...fresh.pageIds, page.id], updatedAt: Date.now() });
  return `/ink/${nb.id}/${page.id}`;
}

let running: Promise<Done> | null = null;

/**
 * Once per browser: every "drawing" saved from the old working paper, and every unsaved working-paper draft,
 * becomes an Ink page in its concept's notebook. Returns where each one went.
 */
export function migrateWorkingPaper(): Promise<Done> {
  return (running ??= (async () => {
    const prior = await load(KEY, 1500);
    if (prior === TIMED_OUT) { running = null; return {}; } // storage busy: try again next time, never twice
    if (prior && typeof prior === "object") return prior as Done;
    // The learner state (where saved drawings live) loads asynchronously; reading it early would see none.
    if (!useStudy.getState().hydrated) await new Promise<void>((ok) => { const un = useStudy.subscribe((st) => { if (st.hydrated) { un(); ok(); } }); });
    const done: Done = {};
    for (const n of useStudy.getState().learner.notebook) {
      if (n.kind !== "drawing" || !getConcept(n.conceptId)) continue;
      done[n.id] = await migratePage(n.conceptId, n.title, n.body, n.text);
    }
    // Drafts were kept per concept under "paper:<conceptId>" and never had to be saved to the notebook.
    for (const c of course.concepts) {
      const d = await load(`paper:${c.id}`, 500);
      if (!d || d === TIMED_OUT || typeof d !== "object") continue;
      const { svg, text } = d as { svg?: string; text?: string };
      if ((svg && /<path|<polyline|<text/.test(svg)) || text?.trim()) done[`draft:${c.id}`] = await migratePage(c.id, "Working paper draft", svg, text);
    }
    // Pages that couldn't be stored would vanish on reload: then leave the flag unset, so the next visit migrates again.
    if (inkStore().unavailable) { running = null; return done; }
    await save(KEY, done);
    return done;
  })());
}
