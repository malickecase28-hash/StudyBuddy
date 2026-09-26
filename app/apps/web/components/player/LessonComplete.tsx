"use client";

import { DIMENSIONS, type Concept, type Lesson } from "@forma/engine";
import Link from "next/link";
import { useState } from "react";
import { isDetour, lessonHref, splitRef } from "@/lib/course";
import { conceptProgress, pct, STATE_GLYPH } from "@/lib/progress";
import { useStudy } from "@/lib/store";

const DIM_LABEL: Record<(typeof DIMENSIONS)[number], string> = {
  conceptual: "Understands why",
  computational: "Can calculate",
  recognition: "Recognises it",
  independent: "Solves unaided",
  application: "Applies it",
};

/** End of a lesson: brief acknowledgement, what changed, a reflection prompt, and where to go next. */
export function LessonComplete({ concept, lesson, detour, returnTo, next }: { concept: Concept; lesson: Lesson; detour: boolean; returnTo?: string; next?: Concept }) {
  const learner = useStudy((s) => s.learner);
  const addNote = useStudy((s) => s.addNote);
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);
  const { progress, state } = conceptProgress(learner, concept.id);
  const back = returnTo ? { ...splitRef(returnTo.split("@")[0]!), blockId: returnTo.split("@")[1] } : null;
  const moreLessons = concept.lessons.filter((l) => l.id !== lesson.id && !isDetour(concept.id, l.id));

  return (
    <div className="card reveal space-y-5" aria-live="polite">
      <div>
        <p className="label">{detour ? "Detour complete" : "Lesson complete"}</p>
        <h2 className="text-xl font-semibold">{lesson.title}</h2>
        <p className="mt-1 text-soft">
          {concept.title}: <span title={STATE_GLYPH[state].label}>{STATE_GLYPH[state].glyph}</span> {STATE_GLYPH[state].label}
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {DIMENSIONS.map((d) => (
          <div key={d} className="rounded-md bg-sunken p-2">
            <dt className="text-xs text-soft">{DIM_LABEL[d]}</dt>
            <dd className="font-semibold">{pct(progress.dimensions[d])}</dd>
            <div className="mt-1 h-1 rounded bg-line">
              <div className="h-1 rounded" style={{ width: pct(progress.dimensions[d]), background: "var(--sem-confirmed)" }} />
            </div>
          </div>
        ))}
      </dl>

      {!detour && (
        <div className="space-y-2">
          <label htmlFor="reflect" className="label">
            In your own words: what's the one idea to keep?
          </label>
          <textarea
            id="reflect"
            className="input h-20 w-full"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="e.g. Flux out of a closed surface only counts the charge inside…"
          />
          <button
            className="btn text-sm"
            disabled={!reflection.trim() || saved}
            onClick={() => {
              addNote({ conceptId: concept.id, kind: "note", title: `Reflection: ${lesson.title}`, body: reflection.trim() });
              setSaved(true);
            }}
          >
            {saved ? "Saved to notebook ✓" : "Save to notebook"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {back && (
          <Link className="btn btn-primary" href={lessonHref(back.conceptId, back.lessonId, back.blockId ? `?resume=${encodeURIComponent(back.blockId)}` : "")}>
            ← Back to where you were
          </Link>
        )}
        {!back &&
          moreLessons.map((l) => (
            <Link key={l.id} className="btn" href={lessonHref(concept.id, l.id)}>
              {l.title}
            </Link>
          ))}
        {!back && next?.lessons[0] && (
          <Link className="btn btn-primary" href={lessonHref(next.id, next.lessons[0].id)}>
            Next: {next.title} →
          </Link>
        )}
        {concept.id.startsWith("em1.electrostatics.gauss") && (
          <Link className="btn" href="/lab">
            Explore the lab freely
          </Link>
        )}
        <Link className="btn" href="/map">
          Concept map
        </Link>
      </div>
    </div>
  );
}
