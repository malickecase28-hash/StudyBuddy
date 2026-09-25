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
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="label">
          Unit {concept.unit} · {concept.title}
          {detour && " · Detour"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{lesson.title}</h1>
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
      <LessonPlayer conceptId={conceptId} lessonId={lessonId} {...(returnTo ? { returnTo } : {})} {...(resumeBlockId ? { resumeBlockId } : {})} />
    </article>
  );
}
