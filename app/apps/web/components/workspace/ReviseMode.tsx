"use client";

import Link from "next/link";
import { countdownText } from "@/lib/assessments";
import { questionBank } from "@/lib/course";
import { useStudy } from "@/lib/store";
import { ConceptMap } from "../map/ConceptMap";
import { RetrievalQuiz } from "../screens/RetrievalQuiz";
import { Split } from "./Split";

export function ReviseMode({ conceptId, split, onSplit }: { conceptId: string; split: number; onSplit: (r: number) => void }) {
  const now = useStudy((s) => s.now);
  const exam = questionBank.filter((q) => q.concepts.some((c) => c.conceptId === conceptId));
  return (
    <Split ratio={split} onRatio={onSplit} label="Resize the map and the review column">
      <section aria-labelledby="rv-map" className="space-y-2">
        <h2 id="rv-map" className="text-xl">Concept map</h2>
        <ConceptMap height={520} />
      </section>
      <div className="space-y-8">
        <section aria-labelledby="rv-due" className="space-y-2">
          <h2 id="rv-due" className="text-xl">Due reviews</h2>
          <RetrievalQuiz count={3} />
        </section>
        <section aria-labelledby="rv-exam" className="space-y-2">
          <h2 id="rv-exam" className="text-xl">Exam view</h2>
          <p className="text-sm text-soft">{countdownText(now(), conceptId)}</p>
          {exam.length ? (
            <ul className="space-y-3">
              {exam.map((q) => (
                <li key={q.id} className="card space-y-1 text-sm">
                  <p className="label">{q.paper} · {q.question}{q.marks ? ` · ${q.marks} marks` : ""}</p>
                  <p>{q.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-soft">No bank questions map to this concept yet.</p>
          )}
          <Link className="underline" href="/past-papers">All past papers →</Link>
        </section>
      </div>
    </Split>
  );
}
