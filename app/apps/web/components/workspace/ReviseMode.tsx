"use client";

import Link from "next/link";
import { countdownText } from "@/lib/assessments";
import { bankLabel, questionBank } from "@/lib/course";
import { useStudy } from "@/lib/store";
import { ConceptMap } from "../map/ConceptMap";
import { RetrievalQuiz } from "../screens/RetrievalQuiz";
import { Split } from "./Split";
import { Markup } from "@/components/Markup";

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
                  <p className="label">{bankLabel(q)}</p>
                  <p><Markup text={q.text} /></p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-soft">No bank questions map to this concept yet.</p>
          )}
          <Link className="underline" href="/questions">All questions →</Link>
        </section>
      </div>
    </Split>
  );
}
