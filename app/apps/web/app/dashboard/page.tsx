"use client";

import { DIMENSIONS } from "@studybuddy/engine";
import Link from "next/link";
import { course, getConcept, lessonHref, mainLesson, misconceptionInfo, pastPapers, splitRef } from "@/lib/course";
import { conceptProgress, pct, STATE_GLYPH } from "@/lib/progress";
import { useStudy } from "@/lib/store";

const DIM: Record<(typeof DIMENSIONS)[number], string> = {
  conceptual: "Why",
  computational: "Calculate",
  recognition: "Recognise",
  independent: "Unaided",
  application: "Apply",
};

/** What the system believes the learner can do, why, and what's weak. */
export default function DashboardPage() {
  const learner = useStudy((s) => s.learner);
  const now = useStudy((s) => s.now)();
  const open = course.concepts.filter((c) => !c.locked);

  const tags = Object.entries(
    Object.values(learner.concepts).reduce<Record<string, number>>((acc, p) => {
      for (const [t, n] of Object.entries(p.tags)) acc[t] = (acc[t] ?? 0) + n;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const reviews = Object.entries(learner.concepts)
    .flatMap(([cid, p]) => Object.entries(p.review).map(([dim, r]) => ({ cid, dim, due: r!.due })))
    .sort((a, b) => a.due - b.due);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="label">Mastery</p>
        <h1 className="text-2xl font-semibold">What you can do, and what's still shaky</h1>
        <p className="text-sm text-soft">
          Mastery is tracked per concept along five dimensions, and every number comes from your answers. Hover a cell for detail.
        </p>
      </div>

      <section className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="label py-2 pr-4">Concept</th>
              <th className="label py-2 pr-4">State</th>
              {DIMENSIONS.map((d) => (
                <th key={d} className="label py-2 pr-2 text-center">
                  {DIM[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {open.map((c) => {
              const { progress, state } = conceptProgress(learner, c.id);
              return (
                <tr key={c.id} className="border-t border-line">
                  <td className="py-2 pr-4">
                    <Link className="hover:underline" href={lessonHref(c.id, mainLesson(c)!.id)}>
                      {c.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-soft">
                    {STATE_GLYPH[state].glyph} {STATE_GLYPH[state].label}
                  </td>
                  {DIMENSIONS.map((d) => {
                    const v = progress.dimensions[d];
                    return (
                      <td key={d} className="px-1 py-2 text-center" title={`${DIM[d]}: ${pct(v)}`}>
                        <div className="mx-auto h-6 w-14 rounded" style={{ background: `color-mix(in srgb, var(--sem-confirmed) ${Math.round(v * 85)}%, var(--bg-sunken))` }}>
                          <span className="text-xs leading-6">{v > 0 ? pct(v) : "·"}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-3">
          <p className="label">Recurring sticking points</p>
          {tags.length === 0 && <p className="text-sm text-soft">None detected yet. They appear here when the same misunderstanding shows up more than once.</p>}
          {tags.map(([tag, n]) => {
            const info = misconceptionInfo.get(tag);
            const ref = info ? splitRef(info.remediation) : null;
            return (
              <div key={tag} className="fb fb-again text-sm">
                <strong>
                  ↺ {info?.description ?? tag} ({n}×)
                </strong>{" "}
                {ref && (
                  <Link className="underline" href={lessonHref(ref.conceptId, ref.lessonId)}>
                    3-minute detour
                  </Link>
                )}
              </div>
            );
          })}
        </section>

        <section className="card space-y-3">
          <p className="label">Review queue</p>
          {reviews.length === 0 && <p className="text-sm text-soft">Mastered dimensions get a review date. Recall them then to keep them strong.</p>}
          <ul className="space-y-1 text-sm">
            {reviews.slice(0, 10).map((r) => (
              <li key={`${r.cid}-${r.dim}`} className="flex justify-between">
                <span>
                  {getConcept(r.cid)?.title} · {DIM[r.dim as (typeof DIMENSIONS)[number]]}
                </span>
                <span className={r.due <= now ? "font-semibold" : "text-soft"}>{r.due <= now ? "due now" : new Date(r.due).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
          {reviews.some((r) => r.due <= now) && (
            <Link className="btn text-sm" href="/review">
              Start review →
            </Link>
          )}
        </section>
      </div>

      <section className="card space-y-3">
        <p className="label">Exam coverage</p>
        {pastPapers.map((q) => {
          const readiness = q.concepts.reduce((s, c) => s + c.weight * conceptProgress(learner, c.conceptId).mastery, 0);
          return (
            <div key={q.id} className="flex items-center gap-3 text-sm">
              <span className="w-72">
                {q.paper} {q.question} ({q.marks} marks)
              </span>
              <div className="h-2 flex-1 rounded bg-line">
                <div className="h-2 rounded" style={{ width: pct(readiness), background: "var(--sem-confirmed)" }} />
              </div>
              <span className="w-10 text-right">{pct(readiness)}</span>
            </div>
          );
        })}
        <Link href="/past-papers" className="text-sm underline">
          See the concept breakdown per question
        </Link>
      </section>
    </div>
  );
}
