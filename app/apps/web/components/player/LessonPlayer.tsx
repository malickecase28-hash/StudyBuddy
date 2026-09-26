"use client";

import type { Block, Effect } from "@forma/engine";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getConcept, getLesson, isDetour, lessonHref, misconceptionFor, nextConcept, splitRef } from "@/lib/course";
import { useStudy } from "@/lib/store";
import { BlockView, PASSIVE } from "../blocks/BlockView";
import type { AnswerInput, BlockCtx } from "../blocks/types";
import { LessonComplete } from "./LessonComplete";

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

type Offer = { key: string; afterBlock: string; effect: Extract<Effect, { type: "offerRemediation" | "offerSkip" }> };

/**
 * Plays a lesson as a progressively revealed sequence of blocks. Interactive blocks gate
 * "Continue"; rule effects surface as offers (detour / skip) right after the block that triggered them.
 */
export function LessonPlayer({ conceptId, lessonId, returnTo, resumeBlockId }: { conceptId: string; lessonId: string; returnTo?: string; resumeBlockId?: string }) {
  const concept = getConcept(conceptId)!;
  const lesson = getLesson(conceptId, lessonId)!;
  const blocks = lesson.blocks;
  const dispatch = useStudy((s) => s.dispatch);
  const setPosition = useStudy((s) => s.setPosition);
  const position = useStudy((s) => s.learner.position);

  const resumeAt = useMemo(() => {
    const explicit = resumeBlockId ? blocks.findIndex((b) => b.id === resumeBlockId) : -1;
    if (explicit >= 0) return explicit;
    if (position?.conceptId !== conceptId || position.lessonId !== lessonId) return 0;
    return Math.max(0, blocks.findIndex((b) => b.id === position.blockId));
    // Only on first mount: resume where the learner left off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [cursor, setCursor] = useState(resumeAt);
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set(blocks.slice(0, resumeAt).map((b) => b.id)));
  const [offers, setOffers] = useState<Offer[]>([]);
  const [finished, setFinished] = useState(false);
  const refs = useRef(new Map<string, HTMLDivElement>());

  const current = blocks[cursor]!;

  useEffect(() => {
    setPosition({ conceptId, lessonId, blockId: current.id, branchStack: [] });
    dispatch({ type: "blockViewed", conceptId, blockId: current.id });
    if (cursor > resumeAt) refs.current.get(current.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [cursor, current.id, conceptId, lessonId, setPosition, dispatch, resumeAt]);

  const markDone = useCallback((id: string) => setDone((d) => (d.has(id) ? d : new Set(d).add(id))), []);

  const answer = useCallback(
    (a: AnswerInput): Effect[] => {
      const effects = dispatch({
        type: "answer",
        conceptId,
        blockId: a.block.id,
        blockType: a.block.type,
        dimensions: a.dimensions,
        correct: a.correct,
        attempt: a.attempt,
        ...(a.tag ? { tag: a.tag } : {}),
        ...(a.errorClass ? { errorClass: a.errorClass } : {}),
      });
      const newOffers = effects
        .filter((e): e is Offer["effect"] => e.type === "offerRemediation" || e.type === "offerSkip")
        .map((effect) => ({ key: `${a.block.id}-${effect.type}-${Date.now()}`, afterBlock: a.block.id, effect }));
      if (newOffers.length) setOffers((o) => [...o, ...newOffers]);
      return effects;
    },
    [dispatch, conceptId],
  );

  const ctxFor = useMemo(() => {
    const cache = new Map<string, BlockCtx>();
    return (b: Block): BlockCtx => {
      let c = cache.get(b.id);
      if (!c) {
        c = { conceptId, onDone: () => markDone(b.id), onAnswer: answer };
        cache.set(b.id, c);
      }
      return c;
    };
  }, [conceptId, markDone, answer]);

  const canContinue = done.has(current.id) || PASSIVE.has(current.type);
  const isLast = cursor === blocks.length - 1;
  const detour = isDetour(conceptId, lessonId);

  return (
    <div className="space-y-8">
      {blocks.slice(0, cursor + 1).map((b, i) => (
        <div
          key={b.id}
          ref={(el) => {
            if (el) refs.current.set(b.id, el);
          }}
          className={`reveal scroll-mt-20 transition-opacity ${i < cursor ? (["assessment", "intense"].includes(current.mood) ? "opacity-40" : "opacity-85") : ""}`}
          data-current={i === cursor}
        >
          <BlockView block={b} ctx={ctxFor(b)} />
          {offers
            .filter((o) => o.afterBlock === b.id)
            .map((o) => (
              <OfferCard key={o.key} offer={o} conceptId={conceptId} lessonId={lessonId} dismiss={() => setOffers((xs) => xs.filter((x) => x.key !== o.key))} />
            ))}
        </div>
      ))}

      {!finished && (
        <div className="flex items-center gap-3 border-t border-line pt-4">
          {isLast ? (
            <button className="btn btn-primary" disabled={!canContinue} onClick={() => setFinished(true)}>
              Finish lesson
            </button>
          ) : (
            <button className="btn btn-primary" disabled={!canContinue} onClick={() => setCursor((c) => c + 1)}>
              Continue ↓
            </button>
          )}
          {!canContinue && <span className="text-sm text-faint">Have a go first; hints are there if you need them.</span>}
          <span className="ml-auto text-xs text-faint">
            {cursor + 1} / {blocks.length}
          </span>
        </div>
      )}

      {finished && <LessonComplete concept={concept} lesson={lesson} detour={detour} returnTo={returnTo} next={nextConcept(conceptId)} />}
    </div>
  );
}

function OfferCard({ offer, conceptId, lessonId, dismiss }: { offer: Offer; conceptId: string; lessonId: string; dismiss: () => void }) {
  if (offer.effect.type === "offerRemediation") {
    const info = misconceptionFor(conceptId, offer.effect.tag);
    const target = splitRef(offer.effect.lessonRef);
    return (
      <div className="fb fb-again reveal mt-4 space-y-2" role="status">
        <p>
          <strong>↺ Same sticking point twice:</strong> <em>{lowerFirst(info?.description.replace(/\.$/, "") ?? "")}</em>. It's one of the most common in
          this topic, and a 3-minute detour usually clears it. You'll come straight back here afterwards.
        </p>
        <div className="flex gap-2">
          <Link className="btn text-sm" href={lessonHref(target.conceptId, target.lessonId, `?return=${encodeURIComponent(`${conceptId}/${lessonId}@${offer.afterBlock}`)}`)}>
            Take the detour
          </Link>
          <button className="btn text-sm" onClick={dismiss}>
            Keep going
          </button>
        </div>
      </div>
    );
  }
  const next = nextConcept(conceptId);
  return (
    <div className="fb fb-right reveal mt-4 space-y-2" role="status">
      <p>
        <strong>✓ First-try solve.</strong> You've shown you can do this without scaffolding. You're free to skip ahead.
      </p>
      <div className="flex gap-2">
        {next?.lessons[0] && (
          <Link className="btn text-sm" href={lessonHref(next.id, next.lessons[0].id)}>
            Skip to {next.title}
          </Link>
        )}
        <button className="btn text-sm" onClick={dismiss}>
          Stay here
        </button>
      </div>
    </div>
  );
}
