"use client";

import { DAY_MS } from "@studybuddy/engine";
import Link from "next/link";
import { conceptById, conceptOrder, course, diagnosticSolid, examDateMs, getConcept, getLesson, lessonHref, mainLesson, misconceptionInfo } from "@/lib/course";
import { conceptProgress, pct, STATE_GLYPH } from "@/lib/progress";
import { dueCount } from "@/lib/retrieval";
import { useStudy } from "@/lib/store";
import { RetrievalQuiz } from "./RetrievalQuiz";

export function HomeScreen() {
  const learner = useStudy((s) => s.learner);
  const now = useStudy((s) => s.now)();
  const returnInfo = useStudy((s) => s.returnInfo);
  const welcomeDismissed = useStudy((s) => s.welcomeDismissed);
  const dismissWelcome = useStudy((s) => s.dismissWelcome);

  const firstRun = !learner.diagnostic && learner.history.length === 0;
  const daysToExam = Math.max(0, Math.ceil((examDateMs - now) / DAY_MS));
  const due = dueCount(learner, now);
  const returning = !!returnInfo && returnInfo.gapDays >= 2 && !welcomeDismissed;

  const route = [
    ...(learner.diagnostic?.route ?? []),
    ...conceptOrder.filter((id) => !conceptById.get(id)!.locked && !(learner.diagnostic?.route ?? []).includes(id)),
  ];
  const solid = diagnosticSolid(learner.diagnostic?.results);
  const nextUp = route.find((id) => !solid.has(id) && ["NOT_STARTED", "INTRODUCED", "EXPLORED"].includes(conceptProgress(learner, id).state));
  const pos = learner.position;
  const posLesson = pos ? getLesson(pos.conceptId, pos.lessonId) : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {firstRun ? (
        <section className="card space-y-3">
          <p className="label">Welcome</p>
          <h1 className="text-2xl font-semibold tracking-tight">Electromagnetics I, built to be understood</h1>
          <p className="read text-soft">
            This workspace follows your ELE3001 course: your lecturer's notation, the Wentworth textbook, and real past-paper questions. It starts
            with <span className="sem-flux">electric flux</span> and <span className="sem-flux">Gauss's law</span>. First, a 5-minute readiness
            check finds any maths or physics worth refreshing, then builds your route.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/diagnostic" className="btn btn-primary">
              Start the readiness check
            </Link>
            <Link href={lessonHref("em1.electrostatics.gauss-law", "main")} className="btn">
              Skip it: go straight to Gauss's law
            </Link>
          </div>
        </section>
      ) : returning && returnInfo ? (
        <WelcomeBack gapDays={returnInfo.gapDays} lastConceptId={returnInfo.lastConceptId} onDone={dismissWelcome} />
      ) : null}

      {!firstRun && !returning && (
        <div className="grid gap-4 md:grid-cols-3">
          <section className="card md:col-span-2">
            <p className="label">Continue</p>
            {pos && posLesson ? (
              <>
                <h2 className="mt-1 text-lg font-semibold">{posLesson.title}</h2>
                <p className="text-sm text-soft">{getConcept(pos.conceptId)?.title}</p>
                <Link href={lessonHref(pos.conceptId, pos.lessonId)} className="btn btn-primary mt-3">
                  Continue where you left off →
                </Link>
              </>
            ) : nextUp ? (
              <>
                <h2 className="mt-1 text-lg font-semibold">{getConcept(nextUp)?.title}</h2>
                <Link href={lessonHref(nextUp, mainLesson(getConcept(nextUp)!)!.id)} className="btn btn-primary mt-3">
                  Start →
                </Link>
              </>
            ) : (
              <p className="mt-1">Everything in this slice is underway. Try the mastery challenge or a past paper.</p>
            )}
          </section>
          <section className="card space-y-2">
            <p className="label">Finals</p>
            <p className="text-3xl font-semibold">{daysToExam} days</p>
            <p className="text-sm text-soft">{course.examDate}</p>
            {due > 0 ? (
              <Link href="/review" className="btn mt-2 text-sm">
                {due} review{due > 1 ? "s" : ""} due →
              </Link>
            ) : (
              <p className="text-xs text-faint">No reviews due. Mastered ideas come back here when it's time to recall them.</p>
            )}
          </section>
        </div>
      )}

      <section className="card">
        <div className="flex items-baseline justify-between">
          <p className="label">Your route through this slice</p>
          {learner.diagnostic ? (
            <Link href="/diagnostic" className="text-xs text-faint underline">
              Retake readiness check
            </Link>
          ) : (
            !firstRun && (
              <Link href="/diagnostic" className="text-xs underline">
                Take the readiness check to personalise this
              </Link>
            )
          )}
        </div>
        <ol className="mt-3 space-y-1.5">
          {route.map((id, i) => {
            const c = conceptById.get(id)!;
            const { state, mastery } = conceptProgress(learner, id);
            const fromDiagnostic = learner.diagnostic?.route.includes(id);
            return (
              <li key={id} className="flex items-center gap-3 rounded-md px-2 py-1.5 data-[next=true]:bg-sunken" data-next={id === nextUp}>
                <span className="w-5 text-faint">{i + 1}.</span>
                <span title={STATE_GLYPH[state].label} aria-label={STATE_GLYPH[state].label}>
                  {STATE_GLYPH[state].glyph}
                </span>
                <Link href={lessonHref(id, mainLesson(c)!.id)} className="flex-1 hover:underline">
                  {c.title}
                </Link>
                {fromDiagnostic && <span className="label">refresher</span>}
                {solid.has(id) && state === "NOT_STARTED" && <span className="label">ready per check</span>}
                {id === nextUp && <span className="label" style={{ color: "var(--sem-flux)" }}>next up</span>}
                <span className="w-10 text-right text-sm text-soft">{pct(mastery)}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

/** Re-entry after time away: what you were doing, what was shaky, and two retrieval questions. */
function WelcomeBack({ gapDays, lastConceptId, onDone }: { gapDays: number; lastConceptId: string; onDone: () => void }) {
  const learner = useStudy((s) => s.learner);
  const pos = learner.position;
  const concept = getConcept(lastConceptId);
  const p = learner.concepts[lastConceptId];
  const shaky = Object.entries(p?.tags ?? {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => misconceptionInfo.get(tag)?.description)
    .filter(Boolean);
  const { state } = conceptProgress(learner, lastConceptId);
  return (
    <section className="card space-y-4">
      <div>
        <p className="label">Welcome back</p>
        <h1 className="text-xl font-semibold">It's been {Math.floor(gapDays)} days.</h1>
        <p className="read mt-1 text-soft">
          Last time you were working on <strong>{concept?.title}</strong> ({STATE_GLYPH[state].label.toLowerCase()}).
          {shaky.length > 0 && <> You had some trouble with: {shaky.join(" ").replace(/\.$/, "")}.</>} Before picking up again, two quick questions to
          bring it back to mind:
        </p>
      </div>
      <RetrievalQuiz count={2} />
      <div className="flex gap-2">
        {pos && (
          <Link href={lessonHref(pos.conceptId, pos.lessonId)} className="btn btn-primary" onClick={onDone}>
            Continue where you left off →
          </Link>
        )}
        <button className="btn" onClick={onDone}>
          Dismiss
        </button>
      </div>
    </section>
  );
}
