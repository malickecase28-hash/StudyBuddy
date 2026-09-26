"use client";

import type { Effect, ErrorClass, Interaction, NumericSpec } from "@forma/engine";
import { gradePrediction } from "@forma/plate";
import { Readout } from "@forma/ui";
import { useEffect, useRef, useState } from "react";
import { Feedback } from "../blocks/Feedback";
import { NumericField } from "../blocks/numeric";

export type AnswerInput = { correct: boolean; attempt: number; tag?: string; errorClass?: ErrorClass };
type Patch = Record<string, Record<string, unknown>>;
type Props = {
  interaction: Interaction;
  goalMet: boolean;
  truth: (reveal: Patch) => number | null;
  onAnswer: (a: AnswerInput) => Effect[];
  onReveal: (patch: Patch) => void;
  onComplete: () => void;
  onHighlight: (ids: string[]) => void;
  /** A check step: the timeline unlocks only on a correct answer. */
  strict?: boolean;
  onMiss?: () => void;
  /** A template-backed numeric check: this learner's variant. */
  numericVariant?: { key: string; prompt: string; spec: NumericSpec; hints: string[] };
};
type I<T extends Interaction["type"]> = Extract<Interaction, { type: T }>;

function PredictDrag({ i, truth, onAnswer, onReveal, onComplete }: { i: I<"predict-drag"> } & Pick<Props, "truth" | "onAnswer" | "onReveal" | "onComplete">) {
  const [guess, setGuess] = useState((i.range[0] + i.range[1]) / 2);
  const [result, setResult] = useState<{ grade: "close" | "far"; value: number } | null>(null);
  const commit = () => {
    const value = truth(i.reveal);
    if (value === null) return;
    const grade = gradePrediction(guess, value, i.relTol, i.range);
    setResult({ grade, value });
    onReveal(i.reveal);
    onAnswer({ correct: grade === "close", attempt: 1, ...(grade === "far" && i.tag ? { tag: i.tag } : {}) });
    onComplete();
  };
  return (
    <div className="interaction space-y-3">
      <p className="prompt">{i.prompt}</p>
      <input
        type="range" className="w-full" aria-label={`Your prediction, in ${i.unit}`}
        min={i.range[0]} max={i.range[1]} step={(i.range[1] - i.range[0]) / 200}
        value={guess} disabled={!!result} onChange={(e) => setGuess(Number(e.target.value))}
      />
      <div className="readouts">
        <Readout label="Your prediction" value={guess} unit={i.unit} />
        {result && <Readout label="Measured" value={result.value} unit={i.unit} tone="flux" />}
      </div>
      {!result ? (
        <button className="btn btn-primary" onClick={commit}>Commit prediction</button>
      ) : (
        <Feedback correct={result.grade === "close"} text={result.grade === "close" ? i.feedback.close : i.feedback.far} />
      )}
    </div>
  );
}

function Goal({ text, hint, goalMet, onAnswer, onComplete }: { text: string; hint?: string } & Pick<Props, "goalMet" | "onAnswer" | "onComplete">) {
  const done = useRef(false);
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    if (goalMet && !done.current) {
      done.current = true;
      onAnswer({ correct: true, attempt: 1 });
      onComplete();
    }
  }, [goalMet, onAnswer, onComplete]);
  return (
    <div className="interaction space-y-3">
      <p className="prompt">{text}</p>
      {goalMet ? (
        <Feedback correct text="Done. Look at the readouts." />
      ) : (
        hint && (showHint ? <p className="text-soft">{hint}</p> : <button className="btn text-sm" onClick={() => setShowHint(true)}>Hint</button>)
      )}
    </div>
  );
}

function Choose({ i, onAnswer, onComplete, strict, onMiss }: { i: I<"choose"> } & Pick<Props, "onAnswer" | "onComplete" | "strict" | "onMiss">) {
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [reason, setReason] = useState<string | null>(null);
  const choice = i.options.find((o) => o.id === checked);
  const check = () => {
    const o = i.options.find((x) => x.id === picked);
    if (!o) return;
    const a = attempt + 1;
    setAttempt(a);
    setChecked(o.id);
    onAnswer({ correct: o.correct, attempt: a, ...(!o.correct && o.tag ? { tag: o.tag } : {}) });
    if (!o.correct) onMiss?.();
    if (o.correct || (!strict && a >= 2)) onComplete();
  };
  return (
    <fieldset className="interaction space-y-2">
      <legend className="prompt">{i.prompt}</legend>
      {i.options.map((o) => (
        <label key={o.id} className="option flex gap-2">
          <input type="radio" name={i.id} value={o.id} checked={picked === o.id} disabled={!!choice?.correct} onChange={() => setPicked(o.id)} />
          {o.label}
        </label>
      ))}
      {!choice?.correct && <button className="btn btn-primary" disabled={!picked} onClick={check}>Check</button>}
      {choice && <Feedback correct={choice.correct} text={choice.feedback} />}
      {choice?.correct && i.selfExplain && (
        <fieldset className="space-y-1">
          <legend className="text-sm">{i.selfExplain.prompt}</legend>
          {i.selfExplain.options.map((o) => (
            <label key={o.id} className="option flex gap-2 text-sm">
              <input type="radio" name={`${i.id}-why`} checked={reason === o.id} onChange={() => setReason(o.id)} />
              {o.label}
            </label>
          ))}
          {reason && <Feedback correct={!!i.selfExplain.options.find((o) => o.id === reason)?.correct} text={i.selfExplain.options.find((o) => o.id === reason)!.feedback} />}
        </fieldset>
      )}
    </fieldset>
  );
}

function Identify({ i, onAnswer, onComplete, onHighlight, strict, onMiss }: { i: I<"identify"> } & Pick<Props, "onAnswer" | "onComplete" | "onHighlight" | "strict" | "onMiss">) {
  const [attempt, setAttempt] = useState(0);
  const [last, setLast] = useState<(typeof i.targets)[number] | null>(null);
  return (
    <div className="interaction space-y-2">
      <p className="prompt">{i.prompt}</p>
      <div className="flex flex-wrap gap-2">
        {i.targets.map((t) => (
          <button
            key={t.id} className="btn" disabled={!!last?.correct}
            onFocus={() => onHighlight([t.id])} onMouseEnter={() => onHighlight([t.id])} onBlur={() => onHighlight([])} onMouseLeave={() => onHighlight([])}
            onClick={() => {
              const a = attempt + 1;
              setAttempt(a);
              setLast(t);
              onAnswer({ correct: t.correct, attempt: a, ...(!t.correct && t.tag ? { tag: t.tag } : {}) });
              if (!t.correct) onMiss?.();
              if (t.correct || (!strict && a >= 2)) onComplete();
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {last && <Feedback correct={last.correct} text={last.feedback} />}
    </div>
  );
}

export function InteractionView(p: Props) {
  const i = p.interaction;
  switch (i.type) {
    case "predict-drag":
      return <PredictDrag i={i} truth={p.truth} onAnswer={p.onAnswer} onReveal={p.onReveal} onComplete={p.onComplete} />;
    case "manipulate-goal":
      return <Goal text={i.goal} goalMet={p.goalMet} onAnswer={p.onAnswer} onComplete={p.onComplete} />;
    case "place":
      return <Goal text={i.prompt} hint={i.hint} goalMet={p.goalMet} onAnswer={p.onAnswer} onComplete={p.onComplete} />;
    case "choose":
      return <Choose i={i} onAnswer={p.onAnswer} onComplete={p.onComplete} {...(p.strict ? { strict: true } : {})} {...(p.onMiss ? { onMiss: p.onMiss } : {})} />;
    case "identify":
      return <Identify i={i} onAnswer={p.onAnswer} onComplete={p.onComplete} onHighlight={p.onHighlight} {...(p.strict ? { strict: true } : {})} {...(p.onMiss ? { onMiss: p.onMiss } : {})} />;
    case "numeric": {
      const v = p.numericVariant;
      let lastCorrect = false;
      return (
        <NumericField
          key={v?.key ?? i.id}
          spec={v?.spec ?? { answer: i.answer, relTol: i.relTol, distractors: i.distractors }}
          prompt={v?.prompt ?? i.prompt}
          hints={v?.hints ?? i.hints}
          onAnswer={(verdict, attempt) => {
            lastCorrect = verdict.correct;
            if (!verdict.correct) p.onMiss?.();
            const fx = p.onAnswer({ correct: verdict.correct, attempt, ...(verdict.tag ? { tag: verdict.tag } : {}), ...(verdict.errorClass ? { errorClass: verdict.errorClass } : {}) });
            return { revealWorked: fx.some((e) => e.type === "revealWorkedStep") };
          }}
          onSolved={() => (!p.strict || lastCorrect) && p.onComplete()}
        />
      );
    }
    default:
      return <p className="text-soft">This step's activity isn&apos;t available in this build yet.</p>;
  }
}
