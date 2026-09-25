import type { LearnEvent } from "./events";
import { emptyProgress, HISTORY_CAP, type ConceptProgress, type LearnerState } from "./learner-state";
import { applyEvidence } from "./mastery";
import { nextReview } from "./scheduler";
import type { Concept } from "./schema/course";
import type { Effect, Rule } from "./schema/rules";

export const MASTERY_REVIEW_THRESHOLD = 0.8;

function conditionMet(rule: Rule, p: ConceptProgress, e: LearnEvent): boolean {
  const c = rule.when;
  if (e.type !== "answer") return false;
  switch (c.type) {
    case "tagCount":
      return !e.correct && e.tag === c.tag && (p.tags[c.tag] ?? 0) >= c.gte;
    case "challengePassed":
      return e.blockType === "challenge" && e.correct && (!c.firstAttempt || e.attempt === 1);
    case "attemptsFailed": {
      const fails = p.blockFails[e.blockId] ?? 0;
      return e.blockType === c.blockType && !e.correct && fails >= c.gte && fails % c.gte === 0;
    }
  }
}

export function reduce(
  state: LearnerState,
  event: LearnEvent,
  concept: Pick<Concept, "id" | "rules">,
  examDate?: number,
): { state: LearnerState; effects: Effect[] } {
  const prev = state.concepts[event.conceptId] ?? emptyProgress();
  const p: ConceptProgress = {
    ...prev,
    dimensions: { ...prev.dimensions },
    tags: { ...prev.tags },
    blockFails: { ...prev.blockFails },
    firedRules: [...prev.firedRules],
    review: { ...prev.review },
    seen: true,
    lastSeen: event.at,
  };
  const effects: Effect[] = [];

  if (event.type === "answer") {
    p.attempts += 1;
    if (!event.correct) {
      p.blockFails[event.blockId] = (p.blockFails[event.blockId] ?? 0) + 1;
      if (event.tag) p.tags[event.tag] = (p.tags[event.tag] ?? 0) + 1;
    }
    const before = { ...p.dimensions };
    p.dimensions = applyEvidence(p.dimensions, event.dimensions, event.correct);

    for (const rule of concept.rules) {
      if (rule.once && p.firedRules.includes(rule.id)) continue;
      if (!conditionMet(rule, p, event)) continue;
      effects.push(...rule.then);
      for (const eff of rule.then) {
        if (eff.type === "credit") p.dimensions[eff.dimension] = Math.max(p.dimensions[eff.dimension], eff.amount);
      }
      if (rule.once) p.firedRules.push(rule.id);
    }

    for (const d of event.dimensions) {
      if (before[d] < MASTERY_REVIEW_THRESHOLD && p.dimensions[d] >= MASTERY_REVIEW_THRESHOLD && !p.review[d]) {
        p.review[d] = nextReview(undefined, true, event.at, examDate);
      }
    }
  }

  if (event.type === "retrieval") {
    p.dimensions = applyEvidence(p.dimensions, [event.dimension], event.correct);
    p.review[event.dimension] = nextReview(p.review[event.dimension], event.correct, event.at, examDate);
  }

  const history = [...state.history, event].slice(-HISTORY_CAP);
  return { state: { ...state, concepts: { ...state.concepts, [event.conceptId]: p }, history }, effects };
}
