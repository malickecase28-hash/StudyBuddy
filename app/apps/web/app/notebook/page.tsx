"use client";

import { GaussLabConfig } from "@forma/course-em1";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Tex } from "@/components/Tex";
import { getConcept } from "@/lib/course";
import { useStudy } from "@/lib/store";

const GaussLab = dynamic(() => import("@/components/lab/GaussLab"), { ssr: false });

/** Personal notebook: equations, reflections and frozen simulation states that restore on click. */
export default function NotebookPage() {
  const notebook = useStudy((s) => s.learner.notebook);
  const remove = useStudy((s) => s.removeNote);
  const add = useStudy((s) => s.addNote);
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="label">Notebook</p>
        <h1 className="text-2xl font-semibold">Your notebook</h1>
        <Link href="/paper" className="btn mt-3 text-sm">✎ Open working paper</Link>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          add({ conceptId: "em1.electrostatics.gauss-law", kind: "note", title: "Note", body: draft.trim() });
          setDraft("");
        }}
      >
        <input className="input flex-1" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Jot something down…" aria-label="New note" />
        <button className="btn">Add</button>
      </form>
      {notebook.length === 0 && (
        <p className="text-soft">
          Nothing here yet. Save equations as you build them, save a lab setup with “Save state to notebook”, or write a reflection at the end of a
          lesson.
        </p>
      )}
      <ul className="space-y-3">
        {notebook.map((n) => (
          <li key={n.id} className="card space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="label">{n.kind === "sim-state" ? "Experiment" : n.kind === "equation" ? "Equation" : n.kind === "drawing" ? "Working paper" : "Note"}</span>
              <span className="text-xs text-faint">
                {getConcept(n.conceptId)?.title} · {new Date(n.createdAt).toLocaleDateString()}
              </span>
              <button className="ml-auto text-xs text-faint underline" onClick={() => remove(n.id)}>
                Delete
              </button>
            </div>
            <p className="font-medium">{n.title}</p>
            {n.kind === "equation" ? <Tex latex={n.body} display /> : n.kind === "drawing" ? <><img src={`data:image/svg+xml,${encodeURIComponent(n.body)}`} alt={`Drawing: ${n.title}`} className="max-h-72 w-full rounded-lg border border-line bg-white object-contain" /><p className="read text-soft">{n.text}</p><Link className="text-sm underline" href={`/paper?note=${encodeURIComponent(n.id)}`}>Open in working paper</Link></> : <p className="read text-soft">{n.body}</p>}
            {n.kind === "sim-state" && n.simState?.scene === "gauss-lab" && (
              <>
                <button className="btn text-sm" onClick={() => setOpen(open === n.id ? null : n.id)}>
                  {open === n.id ? "Close experiment" : "Restore this experiment"}
                </button>
                {open === n.id && <GaussLab config={GaussLabConfig.parse(n.simState.config)} />}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
