"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type Editor from "js-draw";
import { getConcept } from "@/lib/course";
import { load, save, TIMED_OUT } from "@/lib/persist";
import { useStudy } from "@/lib/store";

type Draft = { svg: string; text: string };

export function WorkingPaper({ conceptId: requested, noteId, compact = false }: { conceptId?: string; noteId?: string; compact?: boolean }) {
  const learner = useStudy((s) => s.learner);
  const addNote = useStudy((s) => s.addNote);
  const note = learner.notebook.find((n) => n.id === noteId && n.kind === "drawing");
  const want = requested ?? note?.conceptId ?? learner.position?.conceptId;
  const conceptId = want && getConcept(want) ? want : "em1.electrostatics.gauss-law";
  const concept = getConcept(conceptId)!;
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<Editor | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState(note?.title ?? `${concept.title} working`);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const draftKey = `paper:${conceptId}`;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const persist = () => {
      if (editor.current) void save(draftKey, { svg: editor.current.toSVG().outerHTML, text: textarea.current?.value ?? textRef.current } satisfies Draft);
    };
    const open = async () => {
      const stored = await load(draftKey, 1500);
      if (cancelled || !host.current) return;
      const [{ default: DrawEditor, Color4, BackgroundComponentBackgroundType }] = await Promise.all([import("js-draw"), import("js-draw/bundledStyles")]);
      if (cancelled || !host.current) return;
      const instance = new DrawEditor(host.current, { appInfo: { name: "Forma", description: "Working paper" } });
      instance.dispatch(instance.setBackgroundStyle({ color: Color4.white, type: BackgroundComponentBackgroundType.Grid }), false);
      instance.addToolbar();
      instance.getRootElement().style.height = "100%";
      editor.current = instance;
      const draft = stored && stored !== TIMED_OUT && typeof stored === "object" ? stored as Draft : null;
      const svg = note?.body ?? draft?.svg;
      const initialText = note?.text ?? draft?.text ?? "";
      if (svg) {
        try { await instance.loadFromSVG(svg); } catch { setStatus("The previous drawing could not be opened. Your new working will still save."); }
      }
      if (cancelled) return;
      textRef.current = initialText;
      setText(initialText);
      setReady(true);
      timer = setInterval(persist, 5000);
      document.addEventListener("visibilitychange", persist);
    };
    void open();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", persist);
      persist();
      editor.current?.remove();
      editor.current = null;
    };
  }, [draftKey, note?.id]);

  const saveToNotebook = async () => {
    if (!editor.current) return;
    await addNote({ conceptId, kind: "drawing", title: title.trim() || `${concept.title} working`, body: editor.current.toSVG().outerHTML, text: textarea.current?.value ?? text });
    setStatus("Saved to your notebook. Your editable draft also stays here.");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {!compact && (
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Forma / Working paper</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Think on the page.</h1>
          <p className="mt-2 text-sm text-soft">Pen, stylus, mouse, or keyboard. Your editable draft saves as you work.</p>
        </div>
        <Link href="/notebook" className="text-sm underline">View notebook →</Link>
      </div>
      )}
      <div className={compact ? "space-y-3" : "grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]"}>
        <section className="card min-w-0 p-2" aria-label="Drawing area">
          <div ref={host} className={`working-paper ${compact ? "h-[calc(100vh-330px)] min-h-[360px]" : "h-[620px]"} overflow-hidden rounded-xl bg-white`} />
          {!ready && <p className="p-2 text-sm text-soft">Loading drawing tools…</p>}
        </section>
        <aside className="card h-fit space-y-4">
          <p className="label">Paper context</p>
          <p className="font-semibold">{concept.title}</p>
          <label className="block text-sm font-medium">Page title<input className="input mt-1 w-full" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="block text-sm font-medium">Typed working<textarea ref={textarea} className="input mt-1 min-h-40 w-full resize-y" value={text} disabled={!ready} onChange={(e) => { textRef.current = e.target.value; setText(e.target.value); }} placeholder="Write a derivation, question, or conclusion…" /></label>
          <button className="btn btn-primary w-full justify-center" onClick={saveToNotebook} disabled={!ready}>Save page to notebook</button>
          <p className="text-xs text-soft" role="status">{status || "Drawing and typed text are kept as an editable draft. Save a page when you want it in your notebook."}</p>
        </aside>
      </div>
    </div>
  );
}
