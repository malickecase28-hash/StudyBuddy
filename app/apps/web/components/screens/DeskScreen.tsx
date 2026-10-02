"use client";

import { nextAssessment } from "@forma/engine";
import Link from "next/link";
import { useEffect, useState } from "react";
import { countdownText, readiness } from "@/lib/assessments";
import { conceptHref, conceptOrder, course, getConcept } from "@/lib/course";
import { deskContinue } from "@/lib/desk";
import { conceptProgress, STATE_GLYPH } from "@/lib/progress";
import { dueCount } from "@/lib/retrieval";
import { useStudy } from "@/lib/store";
import { PlateThumb } from "../plate/PlateThumb";
import { RetrievalQuiz } from "./RetrievalQuiz";

export function DeskScreen() {
  const learner = useStudy((s) => s.learner);
  const now = useStudy((s) => s.now)();
  const returnInfo = useStudy((s) => s.returnInfo);
  const welcomeDismissed = useStudy((s) => s.welcomeDismissed);
  const dismissWelcome = useStudy((s) => s.dismissWelcome);
  const c = deskContinue(learner);
  const due = dueCount(learner, now);
  const current = learner.position?.conceptId;
  const returning = !!returnInfo && returnInfo.gapDays >= 2 && !welcomeDismissed;
  const SKIP_KEY = "forma:skip-foundations";
  const [skipped, setSkipped] = useState(false);
  useEffect(() => { try { setSkipped(localStorage.getItem(SKIP_KEY) === "1"); } catch { /* private mode: the card shows */ } }, []);
  // Foundation lessons the readiness check put on the route and that aren't demonstrated yet. Recommend only; nothing locks.
  const foundationsDue = (learner.diagnostic?.route ?? []).filter((id) => {
    if (!id.startsWith("m0.") || !getConcept(id)) return false;
    const s = conceptProgress(learner, id).state;
    return s !== "DEMONSTRATED" && s !== "MASTERED";
  });

  return (
    <div className="desk">
      <h1 className="sr-only">Your desk</h1>
      {returning && (
        <section className="card space-y-3 desk-wide" aria-labelledby="welcome-back">
          <h2 id="welcome-back" className="text-xl">It&apos;s been {Math.floor(returnInfo.gapDays)} days.</h2>
          <p className="text-soft">Two quick recalls before you continue, so your place comes back.</p>
          <RetrievalQuiz count={2} onFinished={dismissWelcome} />
          <button className="btn" onClick={dismissWelcome}>Not now</button>
        </section>
      )}
      {!skipped && foundationsDue.length > 0 && (
        <section className="card space-y-2 desk-wide" aria-labelledby="foundations-title">
          <p className="kicker">Maths first</p>
          <h2 id="foundations-title" className="text-xl">Before Electromagnetics: {foundationsDue.length} foundation lesson{foundationsDue.length === 1 ? "" : "s"}</h2>
          <p className="text-soft">Your readiness check found maths that Electromagnetics leans on. Each lesson is short. You can skip them and come back any time from Learn.</p>
          <ol className="desk-route-list">
            {foundationsDue.map((id) => <li key={id}><Link href={conceptHref(id, "learn")}>{getConcept(id)!.title}</Link></li>)}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-primary" href={conceptHref(foundationsDue[0]!, "learn")}>Start →</Link>
            <button className="btn" onClick={() => { try { localStorage.setItem(SKIP_KEY, "1"); } catch { /* session only */ } setSkipped(true); }}>Skip for now</button>
          </div>
        </section>
      )}
      <section className="desk-continue" data-plate={!!c.plate} aria-labelledby="continue-title">
        {c.plate && <PlateThumb plateId={c.plate.plateId} step={c.plate.step} label={`Where you stopped: ${c.title}`} />}
        <div className="space-y-3">
          <p className="kicker">Continue</p>
          <h2 id="continue-title" className="text-3xl">{c.title}</h2>
          <p className="text-soft">{c.sub}</p>
          <Link href={c.href} className="btn btn-primary">Continue →</Link>
        </div>
      </section>
      <section className="desk-due card space-y-2" aria-labelledby="due-title">
        <p id="due-title" className="kicker">Due today</p>
        <p className="text-xl">{due ? `${due} recall${due === 1 ? "" : "s"} due` : "Nothing due"}</p>
        {due > 0 && <Link className="btn" href="/review">Start review →</Link>}
        {(() => {
          const next = nextAssessment(course, now);
          if (!next) return null;
          const r = readiness(learner, next.id);
          return (
            <>
              <p className="text-sm text-soft">{countdownText(now)} · {course.code}</p>
              <p className="text-sm text-soft">{next.short} readiness: {r.ready} of {r.total} topics demonstrated</p>
            </>
          );
        })()}
      </section>
      <section className="desk-route card" aria-labelledby="route-title">
        <h2 id="route-title" className="kicker">{course.title} · your route</h2>
        <ol className="desk-route-list">
          {conceptOrder.map((id) => {
            const k = getConcept(id)!;
            const g = STATE_GLYPH[conceptProgress(learner, id).state];
            return (
              <li key={id}>
                {k.locked ? (
                  <span className="text-faint">🔒 {k.title}</span>
                ) : (
                  <Link href={conceptHref(id, "learn")} aria-current={id === current ? "step" : undefined}>
                    <span aria-label={g.label}>{id === current ? "▶" : g.glyph}</span> {k.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>
      {learner.notebook.length > 0 && (
        <section className="desk-notes card space-y-2" aria-labelledby="recent-notes">
          <h2 id="recent-notes" className="kicker">Recent in your notebook</h2>
          <ul className="space-y-1 text-sm">
            {learner.notebook.slice(0, 3).map((n) => (
              <li key={n.id}>
                <Link className="underline" href="/notebook">{n.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
