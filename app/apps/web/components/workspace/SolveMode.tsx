"use client";

import { instantiate, seedOf } from "@forma/engine";
import { Segmented } from "@forma/ui";
import Link from "next/link";
import { useState } from "react";
import { conceptHref, course, templatesFor } from "@/lib/course";
import { useStudy } from "@/lib/store";
import { NumericField } from "../blocks/numeric";

const TITLES: Record<string, string> = {
  "q06-octant": "Flux through an octant", "q08-e": "|E| from a given D", "q08-q": "Charge from a given D", "q09a-cube": "Flux out of a cube", "f2425-qt": "Charge in a sphere from D",
};

export function SolveMode({ conceptId }: { conceptId: string }) {
  const list = templatesFor(conceptId);
  const [id, setId] = useState(list[0]?.id ?? "");
  const learner = useStudy((s) => s.learner);
  const dispatch = useStudy((s) => s.dispatch);
  const nextVariant = useStudy((s) => s.nextVariant);
  const t = list.find((x) => x.id === id);
  if (!t) {
    const withProblems = course.concepts.filter((c) => templatesFor(c.id).length > 0);
    return (
      <div className="card space-y-2">
        <p>No templated problems for this concept yet.</p>
        {withProblems.map((c) => (
          <Link key={c.id} className="underline block" href={conceptHref(c.id, "solve")}>Practise {c.title} →</Link>
        ))}
      </div>
    );
  }
  const v = instantiate(t, seedOf(learner, t.id));
  const sheet = (
    <section className="problem-sheet space-y-4" aria-label="Problem sheet">
      <Segmented label="Problem" value={t.id} options={list.map((x) => [x.id, TITLES[x.id] ?? x.id] as const)} onChange={setId} />
      <p className="label">Variant {v.seed} · {v.key}</p>
      <NumericField
        key={v.key} spec={v.spec} prompt={v.prompt} hints={v.hints}
        onAnswer={(verdict, attempt) => {
          const fx = dispatch({
            type: "answer", conceptId, blockId: v.key, blockType: "numeric", dimensions: [v.dimension], correct: verdict.correct, attempt,
            ...(verdict.tag ? { tag: verdict.tag } : {}), ...(verdict.errorClass ? { errorClass: verdict.errorClass } : {}),
          });
          return { revealWorked: fx.some((e) => e.type === "revealWorkedStep") };
        }}
        onSolved={() => {}}
      />
      <button className="btn" onClick={() => nextVariant(t.id)}>New variant</button>
    </section>
  );
  return sheet;
}
