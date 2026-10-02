"use client";

import { useState } from "react";
import { Markup } from "@/components/Markup";
import { Tex } from "@/components/Tex";
import { formulaSheet } from "@/lib/course";
import { mathToolkit } from "@/lib/math-toolkit";

/** The course's formulas by unit, and the maths toolkit the course assumes. Searchable. */
export function FormulaSheet() {
  const [tab, setTab] = useState<"course" | "maths">("course");
  const [q, setQ] = useState("");
  const match = (...s: (string | undefined)[]) => !q.trim() || s.some((x) => x?.toLowerCase().includes(q.trim().toLowerCase()));
  const groups = [...new Set(formulaSheet.map((f) => f.group))];
  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Formula sheet" className="segmented w-full">
        <button type="button" role="tab" aria-selected={tab === "course"} aria-checked={tab === "course"} className="flex-1" onClick={() => setTab("course")}>Course formulas</button>
        <button type="button" role="tab" aria-selected={tab === "maths"} aria-checked={tab === "maths"} className="flex-1" onClick={() => setTab("maths")}>Maths toolkit</button>
      </div>
      <input className="input w-full" type="search" placeholder="Search formulas" aria-label="Search formulas" value={q} onChange={(e) => setQ(e.target.value)} />
      {tab === "course" ? groups.map((g) => {
        const items = formulaSheet.filter((f) => f.group === g && match(f.title, g));
        return items.length ? (
          <section key={g} className="space-y-2">
            <h3 className="kicker">{g}</h3>
            <ul className="space-y-3">
              {items.map((f) => (
                <li key={f.id}>
                  <p className="label">{f.title}</p>
                  <div className="overflow-x-auto"><Tex latex={f.latex} display /></div>
                  <p className="text-xs text-soft">{f.source}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      }) : mathToolkit.map((s) => {
        const items = s.items.filter((i) => match(i.title, i.note, s.section));
        return items.length ? (
          <section key={s.section} className="space-y-2">
            <h3 className="kicker">{s.section}</h3>
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.title}>
                  <p className="label">{i.title}</p>
                  <div className="overflow-x-auto"><Tex latex={i.latex} display /></div>
                  {i.note && <p className="text-sm text-soft"><Markup text={i.note} /></p>}
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      })}
    </div>
  );
}
