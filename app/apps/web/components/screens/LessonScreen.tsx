"use client";

import { unmetPrerequisites } from "@studybuddy/engine";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { course, diagnosticSolid, getConcept, getLesson, isDetour, lessonHref, mainLesson } from "@/lib/course";
import { useStudy } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { Markup } from "../Markup";
import { LessonPlayer } from "../player/LessonPlayer";

export function LessonScreen({ conceptId, lessonId }: { conceptId: string; lessonId: string }) {
  const search = useSearchParams();
  const returnTo = search.get("return") ?? undefined;
  const resumeBlockId = search.get("resume") ?? undefined;
  return <LessonBody key={`${conceptId}/${lessonId}/${resumeBlockId ?? ""}`} conceptId={conceptId} lessonId={lessonId} returnTo={returnTo} resumeBlockId={resumeBlockId} />;
}

function LessonBody({ conceptId, lessonId, returnTo, resumeBlockId }: { conceptId: string; lessonId: string; returnTo: string | undefined; resumeBlockId: string | undefined }) {
  const concept = getConcept(conceptId);
  const lesson = getLesson(conceptId, lessonId);
  const learner = useStudy((s) => s.learner);
  const setActive = useUi((s) => s.setActiveConcept);
  useEffect(() => {
    setActive(conceptId);
    return () => setActive(null);
  }, [conceptId, setActive]);

  if (!concept || !lesson) {
    return (
      <div className="card">
        <p>That lesson doesn't exist (yet).</p>
        <Link className="underline" href="/map">
          Back to the concept map
        </Link>
      </div>
    );
  }

  const solid = diagnosticSolid(learner.diagnostic?.results);
  const unmet = unmetPrerequisites(course, conceptId, learner)
    .filter((u) => !solid.has(u.conceptId))
    .map((u) => getConcept(u.conceptId)!);
  const main = concept.lessons.filter((l) => !isDetour(conceptId, l.id));
  const detours = concept.lessons.filter((l) => isDetour(conceptId, l.id));
  const detour = isDetour(conceptId, lessonId);

  return (
    <article className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-2 border-b border-line pb-5">
        <p className="label">
          StudyBuddy / {course.title} / Unit {concept.unit} · {concept.title}
          {detour && " · Detour"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{lesson.title}</h1>
        <p className="text-sm text-soft">
          About {lesson.minutes} minutes
          {conceptId === "em1.electrostatics.gauss-law" && lessonId === "main" && (
            <>
              {" · "}
              <Link className="underline" href="/learn/em1.electrostatics.gauss-applications/challenge">
                Already know this? Prove it with the mastery challenge
              </Link>
            </>
          )}
        </p>
        {main.length > 1 && (
          <nav className="flex flex-wrap gap-1.5 pt-1" aria-label="Lessons in this concept">
            {main.map((l) => (
              <Link
                key={l.id}
                href={lessonHref(conceptId, l.id)}
                className="rounded-md border border-line px-2.5 py-1 text-sm data-[on=true]:border-ink data-[on=true]:bg-sunken"
                data-on={l.id === lessonId}
              >
                {l.title}
              </Link>
            ))}
          </nav>
        )}
        {!detour && (
          <details className="text-sm">
            <summary className="cursor-pointer text-soft">What you'll be able to do</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {concept.objectives.map((o, i) => (
                <li key={i}>
                  <Markup text={o} />
                </li>
              ))}
            </ul>
            {detours.length > 0 && (
              <p className="mt-3 text-faint">
                Detours available: {detours.map((d, i) => (
                  <span key={d.id}>
                    {i > 0 && ", "}
                    <Link className="underline" href={lessonHref(conceptId, d.id)}>
                      {d.title.replace(/^Detour: /, "")}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </details>
        )}
        {unmet.length > 0 && !detour && (
          <div className="fb fb-again text-sm">
            ↺ This builds on{" "}
            {unmet.map((c, i) => (
              <span key={c.id}>
                {i > 0 && " and "}
                <Link className="underline" href={lessonHref(c.id, mainLesson(c)!.id)}>
                  {c.title}
                </Link>
              </span>
            ))}
            . You can go ahead anyway; the lesson will point you back if something's missing.
          </div>
        )}
      </header>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0"><LessonPlayer conceptId={conceptId} lessonId={lessonId} {...(returnTo ? { returnTo } : {})} {...(resumeBlockId ? { resumeBlockId } : {})} /></div>
        <aside className="h-fit space-y-4 xl:sticky xl:top-24" aria-label="Lesson tools">
          <div className="card">
            <p className="label">Your desk</p>
            <nav className="mt-3 space-y-1 text-sm" aria-label="Study tools">
              <Link href={`/paper?concept=${encodeURIComponent(conceptId)}`} className="block rounded-lg px-2 py-2 hover:bg-sunken">✎ Working paper <span className="float-right">↗</span></Link>
              <Link href="/lab" className="block rounded-lg px-2 py-2 hover:bg-sunken">◉ Simulation lab <span className="float-right">↗</span></Link>
              <Link href="/notebook" className="block rounded-lg px-2 py-2 hover:bg-sunken">▤ Notebook <span className="float-right">↗</span></Link>
              <Link href="/past-papers" className="block rounded-lg px-2 py-2 hover:bg-sunken">↗ Problems and papers <span className="float-right">↗</span></Link>
            </nav>
          </div>
          <div className="card text-sm">
            <p className="label">In this concept</p>
            <p className="mt-2 font-semibold">{concept.title}</p>
            <p className="mt-1 text-soft">{concept.objectives.length} learning objectives · {main.length} guided {main.length === 1 ? "lesson" : "lessons"}</p>
          </div>
        </aside>
      </div>
    </article>
  );
}
