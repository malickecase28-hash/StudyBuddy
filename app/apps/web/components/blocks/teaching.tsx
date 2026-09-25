"use client";

import type { Block } from "@studybuddy/engine";
import { useEffect, useRef, useState } from "react";
import { useStudy } from "@/lib/store";
import { Markup } from "../Markup";
import { Tex } from "../Tex";
import type { BlockCtx } from "./types";

type B<T extends Block["type"]> = Extract<Block, { type: T }>;

export function ProseView({ block }: { block: B<"prose"> }) {
  return (
    <div className="read">
      <Markup text={block.text} />
    </div>
  );
}

export function FigureView({ block }: { block: B<"figure"> }) {
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={block.asset} alt={block.alt} className="max-w-full rounded-lg border border-line" />
      <figcaption className="mt-1 text-sm text-soft">{block.caption}</figcaption>
    </figure>
  );
}

/**
 * Progressive equation construction: one new relationship at a time.
 * Newly introduced terms pulse, and any lab on screen lights up the matching part.
 */
export function EquationBuildView({ block, ctx }: { block: B<"equation-build">; ctx: BlockCtx }) {
  const progressive = useStudy((s) => s.learner.settings.equationDetail) === "progressive";
  const setLabFocus = useStudy((s) => s.setLabFocus);
  const addNote = useStudy((s) => s.addNote);
  const [shown, setShown] = useState(progressive ? 1 : block.steps.length);
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const step = block.steps[shown - 1]!;
  const complete = shown >= block.steps.length;

  useEffect(() => {
    setLabFocus(step.highlights);
    const el = ref.current;
    if (el) {
      for (const cls of step.highlights) el.querySelectorAll(`.${cls}`).forEach((n) => n.classList.add("pulse"));
    }
    const t = setTimeout(() => setLabFocus([]), 1800);
    return () => clearTimeout(t);
  }, [shown, step.highlights, setLabFocus]);

  useEffect(() => {
    if (complete) ctx.onDone();
  }, [complete, ctx]);

  return (
    <div className="space-y-3">
      <div ref={ref} key={shown} className="reveal overflow-x-auto py-2 text-xl" aria-live="polite">
        <Tex latex={step.latex} display />
      </div>
      <p className="read text-soft">{step.caption}</p>
      <div className="flex flex-wrap items-center gap-2">
        {!complete && (
          <button className="btn" onClick={() => setShown((n) => n + 1)}>
            Next term →
          </button>
        )}
        {progressive && shown > 1 && (
          <span className="text-xs text-faint">
            Step {shown} of {block.steps.length}
          </span>
        )}
        {complete && (
          <button
            className="btn text-sm"
            disabled={saved}
            onClick={() => {
              addNote({ conceptId: ctx.conceptId, kind: "equation", title: step.caption, body: step.latex });
              setSaved(true);
            }}
          >
            {saved ? "Saved ✓" : "Save to notebook"}
          </button>
        )}
      </div>
    </div>
  );
}
