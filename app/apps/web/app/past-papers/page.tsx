"use client";

import Link from "next/link";
import { getConcept, lessonHref, mainLesson, pastPapers, splitRef } from "@/lib/course";
import { conceptProgress, pct } from "@/lib/progress";
import { useStudy } from "@/lib/store";

/** Past-paper questions broken into the concepts they test, with the learner's mastery on each. */
export default function PastPapersPage() {
  const learner = useStudy((s) => s.learner);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="label">Past papers</p>
        <h1 className="text-2xl font-semibold">What the exam asks, concept by concept</h1>
        <p className="read text-soft">
          Each question is split into the ideas it tests. Your readiness is the weighted mastery across those ideas, so you can see exactly which
          one would cost you marks.
        </p>
      </div>
      {pastPapers.map((q) => {
        const readiness = q.concepts.reduce((s, c) => s + c.weight * conceptProgress(learner, c.conceptId).mastery, 0);
        const weakest = [...q.concepts].sort((a, b) => conceptProgress(learner, a.conceptId).mastery - conceptProgress(learner, b.conceptId).mastery)[0]!;
        const practice = splitRef(q.practice);
        const weakConcept = getConcept(weakest.conceptId)!;
        return (
          <article key={q.id} className="card space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-semibold">
                {q.paper} · {q.question}
              </h2>
              <span className="label">{q.marks} marks</span>
            </div>
            <p className="read">{q.text}</p>
            <div className="space-y-2">
              <p className="label">This question tests</p>
              {q.concepts.map((c) => {
                const m = conceptProgress(learner, c.conceptId).mastery;
                return (
                  <div key={c.conceptId} className="flex items-center gap-3 text-sm">
                    <span className="w-64 truncate">
                      {getConcept(c.conceptId)?.title} <span className="text-faint">({pct(c.weight)})</span>
                    </span>
                    <div className="h-2 flex-1 rounded bg-line">
                      <div className="h-2 rounded" style={{ width: pct(m), background: "var(--sem-confirmed)" }} />
                    </div>
                    <span className="w-10 text-right text-soft">{pct(m)}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-sm">
              <strong>Readiness: {pct(readiness)}.</strong> Most marks at risk come from <em>{weakConcept.title}</em>.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link className="btn btn-primary" href={lessonHref(practice.conceptId, practice.lessonId)}>
                Work this question →
              </Link>
              <Link className="btn" href={lessonHref(weakConcept.id, mainLesson(weakConcept)!.id)}>
                Strengthen {weakConcept.title}
              </Link>
            </div>
          </article>
        );
      })}
      <p className="text-xs text-faint">
        Past-paper text is quoted from UTech ELE3001 finals for private study; it is marked restricted and will be replaced by original questions
        before any public release.
      </p>
    </div>
  );
}
