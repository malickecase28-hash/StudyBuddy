"use client";

import { checkNumeric, type Block, type Dimension, type NumericSpec, type Verdict } from "@forma/engine";
import { useState, type FormEvent } from "react";
import { Markup } from "../Markup";
import { Feedback } from "./Feedback";
import type { AnswerInput, BlockCtx } from "./types";

type B<T extends Block["type"]> = Extract<Block, { type: T }>;

const fmt = (spec: NumericSpec) => `${spec.answer.value} ${spec.answer.unit}`;

/**
 * One numeric answer with graded support: hints on request, the worked step after
 * repeated misses (or when a rule fires), and named error classes in feedback.
 */
export function NumericField({
  spec,
  prompt,
  hints,
  worked,
  onAnswer,
  onSolved,
  showAnswerAfter = 3,
}: {
  spec: NumericSpec;
  prompt: string;
  hints: string[];
  worked?: string;
  onAnswer: (v: Verdict, attempt: number) => { revealWorked: boolean };
  onSolved: () => void;
  showAnswerAfter?: number;
}) {
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [last, setLast] = useState<Verdict | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [showWorked, setShowWorked] = useState(false);
  const [solved, setSolved] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || solved) return;
    const v = checkNumeric(spec, value);
    const attempt = attempts + 1;
    setAttempts(attempt);
    setLast(v);
    const { revealWorked } = onAnswer(v, attempt);
    if (revealWorked) setShowWorked(true);
    if (v.correct) {
      setSolved(true);
      onSolved();
    }
  };

  const giveUp = () => {
    setShowWorked(true);
    setSolved(true);
    onSolved();
  };

  return (
    <div className="space-y-3">
      <p className="read font-medium">
        <Markup text={prompt} />
      </p>
      <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        <input
          className="input w-56"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`e.g. 12.5 ${spec.answer.unit}`}
          aria-label="Your answer, with units"
          disabled={solved}
        />
        <button className="btn btn-primary" disabled={solved || !value.trim()}>
          Check
        </button>
        {!solved && hintsShown < hints.length && (
          <button type="button" className="btn text-sm" onClick={() => setHintsShown((n) => n + 1)}>
            {hintsShown === 0 ? "Hint" : "Another hint"}
          </button>
        )}
      </form>
      {hintsShown > 0 && (
        <ol className="read list-decimal space-y-1 pl-6 text-soft">
          {hints.slice(0, hintsShown).map((h, i) => (
            <li key={i}>
              <Markup text={h} />
            </li>
          ))}
        </ol>
      )}
      {last && <Feedback correct={last.correct} text={last.feedback} {...(last.errorClass ? { errorClass: last.errorClass } : {})} />}
      {!solved && attempts >= showAnswerAfter && (
        <button className="btn text-sm" onClick={giveUp}>
          {worked ? "Show the worked step" : "Show the answer"}
        </button>
      )}
      {showWorked && (
        <div className="read reveal rounded-lg border-l-4 border-surface bg-sunken px-4 py-3">
          <p className="label mb-1">Worked step</p>
          <Markup text={worked ?? `The answer is ${fmt(spec)}.`} />
          {worked && !last?.correct && <p className="mt-1 text-sm text-soft">Answer: {fmt(spec)}</p>}
        </div>
      )}
    </div>
  );
}

const answerOf =
  (ctx: BlockCtx, block: Block, dimensions: Dimension[]) =>
  (v: Verdict, attempt: number) => {
    const input: AnswerInput = {
      block,
      dimensions,
      correct: v.correct,
      attempt,
      ...(v.tag ? { tag: v.tag } : {}),
      ...(v.errorClass ? { errorClass: v.errorClass } : {}),
    };
    const effects = ctx.onAnswer(input);
    return { revealWorked: effects.some((e) => e.type === "revealWorkedStep") };
  };

export function NumericView({ block, ctx, onResult }: { block: B<"numeric">; ctx: BlockCtx; onResult?: (correct: boolean) => void }) {
  const record = answerOf(ctx, block, [block.dimension]);
  return (
    <NumericField
      spec={block}
      prompt={block.prompt}
      hints={block.hints}
      onAnswer={(v, attempt) => {
        if (attempt === 1) onResult?.(v.correct);
        return record(v, attempt);
      }}
      onSolved={ctx.onDone}
    />
  );
}

/** Multi-part problem worked one step at a time; each step unlocks the next. */
export function StepSolveView({ block, ctx }: { block: B<"step-solve">; ctx: BlockCtx }) {
  const [current, setCurrent] = useState(0);
  const record = answerOf(ctx, block, [block.dimension]);
  return (
    <div className="space-y-5">
      <p className="read font-medium">
        <Markup text={block.prompt} />
      </p>
      {block.steps.slice(0, current + 1).map((s, i) => (
        <div key={s.id} className="reveal border-l-2 border-line pl-4">
          <p className="label mb-1">
            Step {i + 1} of {block.steps.length}
          </p>
          <NumericField
            spec={s}
            prompt={s.prompt}
            hints={s.hints}
            worked={s.workedStep}
            onAnswer={record}
            onSolved={() => {
              if (i === block.steps.length - 1) ctx.onDone();
              else setCurrent((c) => Math.max(c, i + 1));
            }}
          />
        </div>
      ))}
    </div>
  );
}

/** Minimal scaffolding: no hints. Passing on the first try can unlock "skip ahead". */
export function ChallengeView({ block, ctx }: { block: B<"challenge">; ctx: BlockCtx }) {
  const record = answerOf(ctx, block, block.dimensions);
  return (
    <div className="space-y-2">
      <p className="label">Mastery challenge: no hints, just you</p>
      <NumericField spec={block} prompt={block.prompt} hints={[]} onAnswer={record} onSolved={ctx.onDone} />
    </div>
  );
}
