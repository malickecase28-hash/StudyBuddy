"use client";

import Link from "next/link";
import { ConceptMap } from "@/components/map/ConceptMap";
import { conceptHref, course } from "@/lib/course";
import { conceptProgress, STATE_GLYPH } from "@/lib/progress";
import { useStudy } from "@/lib/store";

export default function CourseOverview() {
  const learner = useStudy((s) => s.learner);
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="kicker">{course.code}</p>
        <h1 className="text-4xl">{course.title}</h1>
      </header>
      <ConceptMap height={420} />
      {course.units.map((u) => (
        <section key={u.number} aria-labelledby={`unit-${u.number}`} className="space-y-2">
          <h2 id={`unit-${u.number}`} className="text-xl">Unit {u.number} · {u.title}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {course.concepts.filter((c) => c.unit === u.number).map((c) => {
              const g = STATE_GLYPH[conceptProgress(learner, c.id).state];
              return (
                <li key={c.id}>
                  {c.locked ? (
                    <span className="card block text-faint">🔒 {c.title}</span>
                  ) : (
                    <Link className="card block hover:bg-sunken" href={conceptHref(c.id, "learn")}>
                      <span aria-label={g.label}>{g.glyph}</span> {c.title}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
