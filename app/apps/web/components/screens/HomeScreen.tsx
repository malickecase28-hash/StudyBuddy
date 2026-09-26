"use client";

import { DAY_MS } from "@forma/engine";
import { GaussLabConfig } from "@forma/course-em1";
import dynamic from "next/dynamic";
import Link from "next/link";
import { conceptById, conceptOrder, course, diagnosticSolid, examDateMs, getConcept, getLesson, lessonHref, mainLesson, misconceptionInfo } from "@/lib/course";
import { conceptProgress, pct, STATE_GLYPH } from "@/lib/progress";
import { dueCount } from "@/lib/retrieval";
import { useStudy } from "@/lib/store";
import { RetrievalQuiz } from "./RetrievalQuiz";

const GaussLab = dynamic(() => import("../lab/GaussLab"), { ssr: false });
const PREVIEW = GaussLabConfig.parse({
  charges: [{ id: "preview-charge", q: 2, pos: [0, 0, 0], draggable: true }],
  surface: { kind: "sphere", radius: 1 },
  shapes: ["sphere", "cube", "blob"],
  resizable: true,
  show: { field: true, normals: false, contributions: true, readout: true },
  toggles: ["field", "normals", "contributions"],
});

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
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="studio-hero grid gap-8 p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:p-8">
          <div className="flex flex-col justify-center py-3 lg:py-8">
            <p className="label">StudyBuddy / Your learning workspace</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.04em] lg:text-5xl">Make the invisible <span className="text-[#8cddd2]">make sense.</span></h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#c7d9d5]">Explore a model, make a prediction, work a real problem. Your first course is Electromagnetics I; the workspace is built for everything you study next.</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {firstRun ? <Link href="/diagnostic" className="btn btn-primary">Start the readiness check</Link> : <Link href={pos && posLesson ? lessonHref(pos.conceptId, pos.lessonId) : nextUp ? lessonHref(nextUp, mainLesson(getConcept(nextUp)!)!.id) : "/lab"} className="btn btn-primary">Continue studying →</Link>}
              {firstRun ? <Link href={lessonHref("em1.electrostatics.gauss-law", "main")} className="btn">Go straight to Gauss&apos;s law →</Link> : <Link href="/lab" className="btn">Open the lab →</Link>}
            </div>
            <p className="mt-6 text-xs text-[#9ab8b2]">{firstRun ? "5 minute check · No streaks · Work at your own depth" : "Experiment freely · Return to your place · Work at your own depth"}</p>
          </div>
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3"><p className="label">Live experiment / Electric flux</p><span className="text-xs text-[#a7c4bd]">Drag the charge across the boundary</span></div>
            <div className="lab-shell"><GaussLab config={PREVIEW} /></div>
          </div>
      </section>
      {returning && returnInfo && <WelcomeBack gapDays={returnInfo.gapDays} lastConceptId={returnInfo.lastConceptId} onDone={dismissWelcome} />}

      {!firstRun && !returning && (
        <div className="grid gap-4 md:grid-cols-3">
          <section className="studio-hero p-7 md:col-span-2">
            <p className="label">Pick up your work</p>
            {pos && posLesson ? (
              <>
                <h2 className="mt-3 text-3xl font-semibold">{posLesson.title}</h2>
                <p className="mt-1 text-sm text-[#c7d9d5]">{getConcept(pos.conceptId)?.title}</p>
                <Link href={lessonHref(pos.conceptId, pos.lessonId)} className="btn btn-primary mt-3">
                  Continue where you left off →
                </Link>
              </>
            ) : nextUp ? (
              <>
                <h2 className="mt-3 text-3xl font-semibold">{getConcept(nextUp)?.title}</h2>
                <Link href={lessonHref(nextUp, mainLesson(getConcept(nextUp)!)!.id)} className="btn btn-primary mt-3">
                  Start →
                </Link>
              </>
            ) : (
              <p className="mt-1">Everything in this slice is underway. Try the mastery challenge or a past paper.</p>
            )}
          </section>
          <section className="card space-y-2">
            <p className="label">On the horizon / Finals</p>
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Workspace tools">
        {[
          { href: "/map", eyebrow: "01 / Navigate", title: "Concept map", text: "See how ideas depend on one another." },
          { href: "/lab", eyebrow: "02 / Experiment", title: "Simulation lab", text: "Change a system and watch the maths respond." },
          { href: "/past-papers", eyebrow: "03 / Apply", title: "Problem desk", text: "Work tutorial and exam questions." },
          { href: "/notebook", eyebrow: "04 / Keep", title: "Notebook", text: "Collect your equations, experiments and thinking." },
          { href: "/paper", eyebrow: "05 / Work", title: "Working paper", text: "Sketch, write, and save your working." },
        ].map((tool) => <Link key={tool.href} href={tool.href} className="card group block transition-transform hover:-translate-y-1"><p className="label">{tool.eyebrow}</p><h2 className="mt-3 text-lg font-semibold">{tool.title} <span className="float-right text-faint group-hover:text-ink">↗</span></h2><p className="mt-2 text-sm text-soft">{tool.text}</p></Link>)}
      </section>

      <section className="card">
        <div className="flex items-baseline justify-between">
          <p className="label">Your route / Electromagnetics I</p>
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
        <ol className="workspace-route mt-3">
          {route.map((id, i) => {
            const c = conceptById.get(id)!;
            const { state, mastery } = conceptProgress(learner, id);
            const fromDiagnostic = learner.diagnostic?.route.includes(id);
            return (
              <li key={id} className="flex items-center gap-3 rounded-md px-2 py-3 data-[next=true]:bg-sunken" data-next={id === nextUp}>
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
      {learner.notebook.length > 0 && (
        <section className="card space-y-2" aria-labelledby="recent-notes">
          <h2 id="recent-notes" className="label">Recent in your notebook</h2>
          <ul className="space-y-1 text-sm">
            {learner.notebook.slice(0, 3).map((n) => (
              <li key={n.id}><Link className="underline" href="/notebook">{n.title}</Link></li>
            ))}
          </ul>
        </section>
      )}
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
