"use client";

import { useMemo, useState } from "react";
import { getConcept } from "@/lib/course";
import { pickRetrieval, type RetrievalItem } from "@/lib/retrieval";
import { useStudy } from "@/lib/store";
import { McqView } from "../blocks/choice";
import type { BlockCtx } from "../blocks/types";

/** Retrieval practice: answers update the spaced-review schedule, not first-exposure mastery. */
export function RetrievalQuiz({ count, onFinished }: { count: number; onFinished?: () => void }) {
  const learner = useStudy((s) => s.learner);
  const now = useStudy((s) => s.now);
  const dispatch = useStudy((s) => s.dispatch);
  // Freeze the selection for this session so answering doesn't reshuffle the questions.
  const [items] = useState<RetrievalItem[]>(() => pickRetrieval(learner, now(), count));
  const [done, setDone] = useState(0);

  const ctxs = useMemo(
    () =>
      items.map(
        (item): BlockCtx => ({
          conceptId: item.conceptId,
          onDone: () => setDone((d) => d + 1),
          onAnswer: (a) => {
            if (a.attempt === 1) dispatch({ type: "retrieval", conceptId: item.conceptId, dimension: item.dimension, correct: a.correct });
            return [];
          },
        }),
      ),
    [items, dispatch],
  );

  if (items.length === 0) return <p className="text-sm text-soft">Nothing to recall yet. Study a concept first.</p>;
  return (
    <div className="space-y-6">
      {items.map((item, i) => (
        <div key={`${item.conceptId}-${item.block.id}`} className="border-l-2 border-line pl-4">
          <p className="label mb-1">
            Recall · {getConcept(item.conceptId)?.title}
          </p>
          <McqView block={item.block} ctx={ctxs[i]!} />
        </div>
      ))}
      {done >= items.length && onFinished && (
        <button className="btn btn-primary" onClick={onFinished}>
          Done
        </button>
      )}
    </div>
  );
}
