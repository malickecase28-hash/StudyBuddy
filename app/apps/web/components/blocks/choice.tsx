"use client";

import { checkChoice, type Block, type Choice, type Verdict } from "@studybuddy/engine";
import { useState } from "react";
import { Markup } from "../Markup";
import { Feedback } from "./Feedback";
import type { BlockCtx } from "./types";

type B<T extends Block["type"]> = Extract<Block, { type: T }>;

function Options({
  options,
  picked,
  locked,
  onPick,
}: {
  options: Choice[];
  picked: Record<string, "right" | "again">;
  locked: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className="space-y-2" role="group">
      {options.map((o) => (
        <button key={o.id} className="choice" data-state={picked[o.id]} disabled={locked || !!picked[o.id]} onClick={() => onPick(o.id)}>
          <span className="mr-2" aria-hidden>
            {picked[o.id] === "right" ? "✓" : picked[o.id] === "again" ? "↺" : "○"}
          </span>
          <Markup text={o.label} />
        </button>
      ))}
    </div>
  );
}

/** Commit before reveal: the learner must predict before the result is shown. */
export function PredictView({ block, ctx }: { block: B<"predict">; ctx: BlockCtx }) {
  const [choice, setChoice] = useState<string | null>(null);
  const verdict = choice ? checkChoice(block.options, choice) : null;
  return (
    <div className="space-y-3">
      <p className="label">Predict first</p>
      <p className="read font-medium">
        <Markup text={block.prompt} />
      </p>
      <Options
        options={block.options}
        picked={choice && verdict ? { [choice]: verdict.correct ? "right" : "again" } : {}}
        locked={!!choice}
        onPick={(id) => {
          setChoice(id);
          const v = checkChoice(block.options, id);
          ctx.onAnswer({ block, dimensions: [block.dimension], correct: v.correct, attempt: 1, ...(v.tag ? { tag: v.tag } : {}) });
          ctx.onDone();
        }}
      />
      {verdict && (
        <>
          <Feedback correct={verdict.correct} text={verdict.feedback} />
          <div className="read reveal rounded-lg border-l-4 border-flux bg-sunken px-4 py-3">
            <Markup text={block.reveal} />
          </div>
        </>
      )}
    </div>
  );
}

/** Multiple choice with retries, optional self-explanation, and "show answer" after two misses. */
export function McqView({ block, ctx, onResult }: { block: B<"mcq">; ctx: BlockCtx; onResult?: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<Record<string, "right" | "again">>({});
  const [last, setLast] = useState<Verdict | null>(null);
  const [solved, setSolved] = useState(false);
  const [explained, setExplained] = useState<string | null>(null);
  const misses = Object.values(picked).filter((v) => v === "again").length;

  const finish = () => ctx.onDone();

  const pick = (id: string) => {
    const v = checkChoice(block.options, id);
    const attempt = Object.keys(picked).length + 1;
    setPicked((p) => ({ ...p, [id]: v.correct ? "right" : "again" }));
    setLast(v);
    ctx.onAnswer({ block, dimensions: [block.dimension], correct: v.correct, attempt, ...(v.tag ? { tag: v.tag } : {}), ...(v.errorClass ? { errorClass: v.errorClass } : {}) });
    if (attempt === 1) onResult?.(v.correct);
    if (v.correct) {
      setSolved(true);
      if (!block.selfExplain) finish();
    }
  };

  const reveal = () => {
    const right = block.options.find((o) => o.correct)!;
    setPicked((p) => ({ ...p, [right.id]: "right" }));
    setLast({ correct: true, feedback: `The answer is: ${right.label}. ${right.feedback}` });
    setSolved(true);
    finish();
  };

  return (
    <div className="space-y-3">
      <p className="read font-medium">
        <Markup text={block.prompt} />
      </p>
      <Options options={block.options} picked={picked} locked={solved} onPick={pick} />
      {last && <Feedback correct={last.correct} text={last.feedback} {...(last.errorClass ? { errorClass: last.errorClass } : {})} />}
      {!solved && misses >= 2 && (
        <button className="btn text-sm" onClick={reveal}>
          Show the answer
        </button>
      )}
      {solved && block.selfExplain && (
        <div className="reveal space-y-2 border-t border-line pt-3">
          <p className="label">{block.selfExplain.prompt}</p>
          <Options
            options={block.selfExplain.options}
            picked={explained ? { [explained]: checkChoice(block.selfExplain.options, explained).correct ? "right" : "again" } : {}}
            locked={!!explained}
            onPick={(id) => {
              setExplained(id);
              const v = checkChoice(block.selfExplain!.options, id);
              ctx.onAnswer({ block, dimensions: ["conceptual"], correct: v.correct, attempt: 1, ...(v.tag ? { tag: v.tag } : {}) });
              finish();
            }}
          />
          {explained && (() => {
            const v = checkChoice(block.selfExplain!.options, explained);
            return <Feedback correct={v.correct} text={v.feedback} />;
          })()}
        </div>
      )}
    </div>
  );
}

/** Identify blocks fall back to choosing among the named targets. */
export function IdentifyView({ block, ctx }: { block: B<"identify">; ctx: BlockCtx }) {
  return (
    <McqView
      block={{ ...block, type: "mcq", options: block.targets, dimension: block.dimension }}
      ctx={ctx}
    />
  );
}
