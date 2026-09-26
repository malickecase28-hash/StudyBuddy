"use client";

import type { LearnEvent } from "@forma/engine";
import type { Cue } from "@forma/plate";
import { useCallback, useEffect, useState } from "react";

/** One step transition, matching the phase windows in @forma/plate `frameAt`. */
export const STEP_MS = 900;

export const answeredFromHistory = (history: readonly LearnEvent[], plateId: string) =>
  new Set(history.flatMap((e) => (e.type === "answer" && e.blockId.startsWith(`${plateId}.`) ? [e.blockId.slice(plateId.length + 1)] : [])));

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
      setPos((p) => (Math.abs(target - p) <= dt ? target : p + Math.sign(target - p) * dt));
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
  return { pos, playing: moving, go, scrub, toggle };
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
