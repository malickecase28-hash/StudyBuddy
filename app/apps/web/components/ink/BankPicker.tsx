"use client";

import { newId, type BankItemCard, type InkEngine } from "@forma/ink";
import { useEffect, useRef, useState } from "react";
import { bankLabel, bankNumber, questionBank } from "@/lib/course";

/** Search the question bank and insert a card that links to the question. */
export function BankPicker({ engine, open, onClose }: { engine: InkEngine; open: boolean; onClose: () => void }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  useEffect(() => { const d = dlg.current; if (open && d && !d.open) d.showModal(); else if (!open && d?.open) d.close(); }, [open]);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = questionBank.filter((b) => { const hay = `${bankNumber(b.id)} ${b.text}`.toLowerCase(); return words.every((w) => hay.includes(w)); }).slice(0, 30);

  const insert = (b: (typeof questionBank)[number]) => {
    const w = 320, h = 150, v = engine.camera.visibleRect(engine.renderer.w, engine.renderer.h);
    const card: BankItemCard = {
      id: newId(), kind: "bank", questionId: b.id, title: bankLabel(b),
      text: b.text.length > 220 ? b.text.slice(0, 219) + "…" : b.text, w, h, href: `/questions#${b.id}`,
      z: engine.nextZ(), transform: [1, 0, 0, 1, v.x + v.w / 2 - w / 2, v.y + v.h / 2 - h / 2], style: { ...engine.style },
    };
    engine.do({ type: "add", items: [card] });
    engine.select([card.id]);
    onClose();
  };

  return (
    <dialog ref={dlg} onClose={onClose} className="card m-auto w-[min(640px,95vw)] space-y-3 p-5" aria-label="Insert a question card">
      <h2 className="text-lg font-semibold">Question card</h2>
      <input className="input w-full" type="search" placeholder="Search by paper, question or words" aria-label="Search questions" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
        {hits.map((b) => (
          <li key={b.id}>
            <button className="w-full rounded p-2 text-left text-sm hover:bg-[var(--paper-2)]" onClick={() => insert(b)}>
              <span className="font-semibold">{bankLabel(b)}</span>
              <span className="line-clamp-2 block text-soft">{b.text}</span>
            </button>
          </li>
        ))}
        {!hits.length && <li className="text-soft">No questions match.</li>}
      </ul>
      <div className="flex justify-end"><button className="btn" onClick={onClose}>Close</button></div>
    </dialog>
  );
}
