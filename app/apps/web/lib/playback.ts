"use client";

import type { LearnEvent } from "@forma/engine";
import type { Cue, PlateDef } from "@forma/plate";
import { useCallback, useEffect, useState } from "react";

/** One step transition, matching the phase windows in @forma/plate `frameAt`. */
export const STEP_MS = 900;

type Answer = Extract<LearnEvent, { type: "answer" }>;

/** Interaction ids with any answer recorded under `${prefix}.<id>` (e.g. Explore experiments already credited). */
export const attemptedIds = (history: readonly LearnEvent[], prefix: string) =>
  new Set(history.flatMap((e) => (e.type === "answer" && e.blockId.startsWith(`${prefix}.`) ? [e.blockId.slice(prefix.length + 1)] : [])));

/**
 * Interactions that unlocked the timeline in an earlier session, by the same rules the live session uses:
 * a prediction once committed; choose/identify once correct or after two attempts; everything else once correct.
 */
export function answeredFromHistory(history: readonly LearnEvent[], plate: PlateDef): Set<string> {
  const events = history.filter((e): e is Answer => e.type === "answer" && e.blockId.startsWith(`${plate.id}.`));
  return new Set(
    plate.steps.flatMap((s) => {
      const i = s.interaction;
      if (!i) return [];
      const mine = events.filter((e) => e.blockId === `${plate.id}.${i.id}`);
      const done =
        i.type === "predict-drag" ? mine.length > 0
        : s.kind === "check" ? mine.some((e) => e.correct)
        : i.type === "choose" || i.type === "identify" ? mine.some((e) => e.correct) || mine.length >= 2
        : mine.some((e) => e.correct);
      return done ? [i.id] : [];
    }),
  );
}

/** A goal or experiment is credited to mastery once; revisits don't re-dispatch it. */
export const shouldCredit = (id: string, credited: ReadonlySet<string>) => !credited.has(id);

/** Where a plate block opens: a snapshot's step, a deep link naming this block, or the saved position. */
export function resumeStepFor(a: {
  blockId: string; stepCount: number; snapshotStep: number | undefined;
  initialBlock: string | undefined; initialStep: number | undefined;
  position: { blockId: string; plateStep?: number } | null;
}): number {
  const step =
    a.snapshotStep ??
    (a.initialStep !== undefined && a.initialBlock === a.blockId ? a.initialStep
    : a.position?.blockId === a.blockId ? (a.position.plateStep ?? 0)
    : 0);
  return Math.max(0, Math.min(step, a.stepCount - 1));
}

/** Continuous timeline position animated toward a target step; reduced motion jumps. */
export function usePlayback(count: number, lock: number, reduced: boolean, initial = 0) {
  const max = Math.max(0, Math.min(lock, count - 1));
  const start = Math.min(initial, max);
  const [pos, setPos] = useState(start);
  const [target, setTarget] = useState(start);
  const moving = pos !== target;
  useEffect(() => {
    if (!moving) return;
    if (reduced) {
      setPos(target);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / STEP_MS;
      last = now;
      // One step takes STEP_MS; longer jumps speed up with the distance left, so skipping ahead never crawls.
      setPos((p) => {
        const step = dt * Math.max(1, Math.abs(target - p));
        return Math.abs(target - p) <= step ? target : p + Math.sign(target - p) * step;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [moving, target, reduced]);
  const go = useCallback((i: number) => setTarget(Math.max(0, Math.min(max, i))), [max]);
  const scrub = useCallback(
    (p: number) => {
      const c = Math.max(0, Math.min(max, p));
      setPos(c);
      setTarget(c);
    },
    [max],
  );
  const toggle = useCallback(() => (moving ? setTarget(pos) : go(Math.floor(pos) + 1)), [moving, pos, go]);
  return { pos, target, playing: moving, go, scrub, toggle };
}

/** Silent clock for a step's cue track (spec §4.6): runs from arrival until 2 s after the last cue. */
export function useCueClock(cues: readonly Cue[], key: string): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    setT(0);
    if (!cues.length) return;
    const end = Math.max(...cues.map((c) => c.t)) + 2000;
    const t0 = performance.now();
    const id = setInterval(() => {
      const now = performance.now() - t0;
      setT(now);
      if (now > end) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [cues, key]);
  return t;
}
