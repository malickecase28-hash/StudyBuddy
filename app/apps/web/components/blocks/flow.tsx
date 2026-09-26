"use client";

import type { Block } from "@forma/engine";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { lessonHref, splitRef } from "@/lib/course";
import { Markup } from "../Markup";
import { BlockView } from "./BlockView";
import { McqView } from "./choice";
import { Feedback } from "./Feedback";
import { NumericView } from "./numeric";
import type { BlockCtx } from "./types";

type B<T extends Block["type"]> = Extract<Block, { type: T }>;

export function OrderView({ block, ctx }: { block: B<"order">; ctx: BlockCtx }) {
  const initial = useMemo(() => [...block.items].sort((a, b) => a.label.localeCompare(b.label)), [block.items]);
  const [items, setItems] = useState(initial);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<boolean | null>(null);
  const move = (i: number, d: -1 | 1) =>
    setItems((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const next = [...xs];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  const check = () => {
    const ok = items.map((x) => x.id).join() === block.correctOrder.join();
    setAttempts((a) => a + 1);
    setResult(ok);
    ctx.onAnswer({ block, dimensions: [block.dimension], correct: ok, attempt: attempts + 1 });
    if (ok || attempts + 1 >= 3) ctx.onDone();
  };
  return (
    <div className="space-y-3">
      <p className="read font-medium">
        <Markup text={block.prompt} />
      </p>
      <ol className="space-y-1.5">
        {items.map((x, i) => (
          <li key={x.id} className="choice flex items-center gap-2">
            <span className="w-5 text-faint">{i + 1}.</span>
            <span className="flex-1">
              <Markup text={x.label} />
            </span>
            <button className="btn px-2 py-0.5" onClick={() => move(i, -1)} aria-label={`Move ${x.label} up`}>
              ↑
            </button>
            <button className="btn px-2 py-0.5" onClick={() => move(i, 1)} aria-label={`Move ${x.label} down`}>
              ↓
            </button>
          </li>
        ))}
      </ol>
      <button className="btn btn-primary" onClick={check} disabled={result === true}>
        Check order
      </button>
      {result !== null && <Feedback correct={result} text={result ? "That's the order." : block.feedback} />}
    </div>
  );
}

/** Authored "questions you might ask": each option opens its own branch of blocks. Optional. */
export function BranchView({ block, ctx }: { block: B<"branch">; ctx: BlockCtx }) {
  const [open, setOpen] = useState<string[]>([]);
  useEffect(() => ctx.onDone(), [ctx]);
  const noop = useMemo<BlockCtx>(() => ({ ...ctx, onDone: () => {} }), [ctx]);
  return (
    <div className="space-y-3">
      <p className="label">
        <Markup text={block.prompt} />
      </p>
      <div className="flex flex-wrap gap-2">
        {block.options.map((o) => (
          <button
            key={o.id}
            className="btn text-sm data-[on=true]:border-ink data-[on=true]:bg-sunken"
            data-on={open.includes(o.id)}
            aria-expanded={open.includes(o.id)}
            onClick={() => setOpen((xs) => (xs.includes(o.id) ? xs.filter((x) => x !== o.id) : [...xs, o.id]))}
          >
            {o.label}
          </button>
        ))}
      </div>
      {block.options
        .filter((o) => open.includes(o.id))
        .map((o) => (
          <div key={o.id} className="reveal space-y-4 rounded-lg border border-line bg-sunken/60 p-4">
            <p className="label">{o.label}</p>
            {o.blocks.map((b) => (
              <BlockView key={b.id} block={b} ctx={noop} />
            ))}
          </div>
        ))}
    </div>
  );
}

/** A short set of assessment items; reports a pass/look-again summary once all are answered. */
export function CheckpointView({ block, ctx }: { block: B<"checkpoint">; ctx: BlockCtx }) {
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState<Record<string, boolean>>({});
  const total = block.items.length;
  const allDone = Object.keys(finished).length === total;
  const score = Object.values(results).filter(Boolean).length;
  const passed = score / total >= block.passRatio;
  useEffect(() => {
    if (allDone) ctx.onDone();
  }, [allDone, ctx]);
  return (
    <div className="space-y-5">
      <p className="label">
        {block.title}: {total} questions, first attempts count
      </p>
      {block.items.map((item, i) => {
        const itemCtx: BlockCtx = { ...ctx, onDone: () => setFinished((f) => ({ ...f, [item.id]: true })) };
        const onResult = (ok: boolean) => setResults((r) => (item.id in r ? r : { ...r, [item.id]: ok }));
        return (
          <div key={item.id} className="border-l-2 border-line pl-4">
            <p className="label mb-1">
              {i + 1} / {total}
            </p>
            {item.type === "mcq" ? (
              <McqView block={item} ctx={itemCtx} onResult={onResult} />
            ) : item.type === "numeric" ? (
              <NumericView block={item} ctx={itemCtx} onResult={onResult} />
            ) : (
              <BlockView block={item} ctx={itemCtx} />
            )}
          </div>
        );
      })}
      {allDone && (
        <Feedback
          correct={passed}
          text={
            passed
              ? `${score} of ${total} on first attempts. This concept is holding together.`
              : `${score} of ${total} on first attempts. Worth revisiting the parts you missed before moving on; the Mastery page shows which idea is shaky.`
          }
        />
      )}
    </div>
  );
}

export function RemediateView({ block }: { block: B<"remediate"> }) {
  const { conceptId, lessonId } = splitRef(block.lessonRef);
  return (
    <div className="fb fb-again">
      ↺ <Markup text={block.message} />{" "}
      <Link className="underline" href={lessonHref(conceptId, lessonId)}>
        Take the detour
      </Link>
    </div>
  );
}

/** Spaced retrieval: answering updates the review schedule rather than first-exposure mastery. */
export function RetrievalView({ block, ctx }: { block: B<"retrieval">; ctx: BlockCtx }) {
  const inner: BlockCtx = {
    ...ctx,
    onAnswer: (a) => {
      if (a.attempt === 1) ctx.onRetrieval?.(block.dimension, a.correct);
      return [];
    },
  };
  return block.item.type === "mcq" ? <McqView block={block.item} ctx={inner} /> : <NumericView block={block.item} ctx={inner} />;
}
