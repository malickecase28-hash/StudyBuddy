"use client";

import Link from "next/link";
import { useState } from "react";
import { assessmentsForItem, getConcept, lessonHref, mainLesson, questionBank, splitRef } from "@/lib/course";
import { DiscussLink } from "@/components/commons/Post";
import { conceptProgress, pct } from "@/lib/progress";
import { useStudy } from "@/lib/store";
import { Markup } from "@/components/Markup";

/** Questions from course assessments, grouped by what they test. */
export default function QuestionBankPage() {
  const learner = useStudy((s) => s.learner);
  const [scope, setScope] = useState("all");
  const items = questionBank.filter((q) => scope === "all" || assessmentsForItem(q).includes(scope));
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="label">Question bank</p>
        <h1 className="text-2xl font-semibold">Question bank</h1>
        <p className="read text-soft">Every question from past tests, homework and finals, split into the ideas it tests. The lecturer reuses homework, so these are worth knowing cold.</p>
      </div>
      <fieldset role="radiogroup" aria-label="Assessment" className="flex flex-wrap gap-4">
        {([["all", "All"], ["ict1", "ICT 1"], ["ict2", "ICT 2"], ["finals", "Finals"]] as const).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input type="radio" name="scope" value={value} checked={scope === value} onChange={() => setScope(value)} />
            {label}
          </label>
        ))}
      </fieldset>
      {items.map((q) => {
        const weak = [...q.concepts]
          .map((c) => getConcept(c.conceptId)!)
          .filter((c) => !c.locked && mainLesson(c))
          .sort((a, b) => conceptProgress(learner, a.id).mastery - conceptProgress(learner, b.id).mastery)[0];
        const allLocked = q.concepts.every((c) => getConcept(c.conceptId)?.locked);
        const readiness = q.concepts.reduce((s, c) => s + c.weight * conceptProgress(learner, c.conceptId).mastery, 0);
        const practice = q.practice ? splitRef(q.practice) : undefined;
        return (
          <article key={q.id} id={q.id} className="card space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-semibold">{q.paper} · {q.question}</h2>
              {q.marks !== undefined && <span className="label">{q.marks} marks</span>}
            </div>
            {q.seenIn && q.seenIn.length > 1 && <p className="label">Set {q.seenIn.length} times</p>}
            <p className="read"><Markup text={q.text} /></p>
            {q.solution && (
              <details>
                <summary className="label cursor-pointer">Worked solution</summary>
                <ol className="read mt-2 list-decimal space-y-1 pl-5">
                  {q.solution.map((s, i) => <li key={i}><Markup text={s} /></li>)}
                </ol>
              </details>
            )}
            <div className="space-y-2">
              <p className="label">This question tests</p>
              {q.concepts.map((c) => {
                const m = conceptProgress(learner, c.conceptId).mastery;
                return (
                  <div key={c.conceptId} className="flex items-center gap-3 text-sm">
                    <span className="w-64 truncate">{getConcept(c.conceptId)?.title} <span className="text-faint">({pct(c.weight)})</span></span>
                    <div className="h-2 flex-1 rounded bg-line"><div className="h-2 rounded" style={{ width: pct(m), background: "var(--sem-confirmed)" }} /></div>
                    <span className="w-10 text-right text-soft">{pct(m)}</span>
                  </div>
                );
              })}
            </div>
            {weak && <p className="text-sm"><strong>Readiness: {pct(readiness)}.</strong> Most marks at risk come from <em>{weak.title}</em>.</p>}
            {allLocked && <p className="text-sm text-soft">Coming in a later build.</p>}
            <div className="flex flex-wrap gap-2">
              {practice && <Link className="btn btn-primary" href={lessonHref(practice.conceptId, practice.lessonId)}>Work this question →</Link>}
              {weak && <Link className="btn" href={lessonHref(weak.id, mainLesson(weak)!.id)}>Strengthen {weak.title}</Link>}
              <DiscussLink anchor={{ conceptId: q.concepts[0]!.conceptId, bankItemId: q.id, label: `${q.paper} · ${q.question}` }} />
            </div>
          </article>
        );
      })}
      <p className="text-xs text-faint">Question text is quoted from course materials for private study and will be replaced by original questions before any public release.</p>
    </div>
  );
}
