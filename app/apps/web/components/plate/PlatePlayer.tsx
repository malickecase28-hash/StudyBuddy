"use client";

import { checks, course, plates, registry, templates } from "@forma/course-em1";
import { instantiate, pickRoute, seedOf, type Block, type Effect, type Interaction } from "@forma/engine";
import {
  applyCues, applyOverrides, askState, createEvaluator, frameAt, hiddenReadouts, lockIndex, readAloudText, stateAt, stepLocation, stillFrame, termTargets, timelineMarks,
  type Frame, type Overrides, type PlateDef,
} from "@forma/plate";
import { MarginNote, Timeline } from "@forma/ui";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { conceptHref, getLesson, ideaMetaFor, lessonHref, misconceptionFor, splitRef } from "@/lib/course";
import { answeredFromHistory, resumeStepFor, shouldCredit, useCueClock, usePlayback } from "@/lib/playback";
import { conceptProgress } from "@/lib/progress";
import { useStudy } from "@/lib/store";
import { Tex } from "../Tex";
import { Split } from "../workspace/Split";
import { AsksList, RecapCard, recapMarkdown, TrapNote, WorkedLines } from "./idea";
import { InteractionView, type AnswerInput } from "./interactions";
import { PlateStage } from "./PlateStage";
import { PlateReadouts } from "./Readouts";

type PlateBlock = Extract<Block, { type: "plate" }>;
type Snapshot = { plateId: string; stepId: string; state: Overrides };
type Offer = { key: string; text: string; href: string };
const toOverrides = (p: Record<string, Record<string, unknown>>): Overrides => Object.fromEntries(Object.entries(p).map(([id, params]) => [id, { params }]));

function useReducedMotion() {
  const setting = useStudy((s) => s.learner.settings.motion);
  const [media, setMedia] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMedia(m.matches);
    const on = () => setMedia(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return setting === "reduced" || media;
}

function ReadAloud({ text }: { text: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => setSupported("speechSynthesis" in window), []);
  useEffect(() => () => window.speechSynthesis?.cancel(), [text]);
  if (!supported) return null;
  return (
    <button
      className="btn text-sm" aria-pressed={speaking}
      onClick={() => {
        speechSynthesis.cancel();
        if (speaking) return setSpeaking(false);
        const u = new SpeechSynthesisUtterance(text);
        u.onend = () => setSpeaking(false);
        setSpeaking(true);
        speechSynthesis.speak(u);
      }}
    >
      🔊 {speaking ? "Stop reading" : "Read this"}
    </button>
  );
}

export function PlatePlayer(props: {
  conceptId: string; lessonId: string; returnTo?: string; snapshotId?: string; initialStep?: number; initialBlock?: string; initialAsk?: string;
  split: number; onSplit: (r: number) => void;
}) {
  const lesson = getLesson(props.conceptId, props.lessonId)!;
  const blocks = lesson.blocks.filter((b): b is PlateBlock => b.type === "plate");
  const snapshot = useStudy((s) => (props.snapshotId ? s.learner.notebook.find((n) => n.id === props.snapshotId)?.plate : undefined));
  const position = useStudy((s) => s.learner.position);
  const start = Math.max(
    0,
    blocks.findIndex((b) =>
      snapshot ? b.plateId === snapshot.plateId : props.initialBlock ? b.id === props.initialBlock : position?.lessonId === props.lessonId && position.conceptId === props.conceptId && b.id === position.blockId,
    ),
  );
  const [bi, setBi] = useState(start);
  const block = blocks[bi]!;
  const plate = plates[block.plateId]!;
  const resumeStep = resumeStepFor({
    blockId: block.id,
    stepCount: plate.steps.length,
    snapshotStep: snapshot?.plateId === plate.id ? Math.max(0, plate.steps.findIndex((s) => s.id === snapshot.stepId)) : undefined,
    initialBlock: bi === start ? props.initialBlock ?? blocks[start]!.id : undefined,
    initialStep: bi === start ? props.initialStep : undefined,
    position,
  });
  const next = blocks[bi + 1];
  return (
    <PlateRun
      key={block.id} {...props} initialAsk={bi === start ? props.initialAsk : undefined} block={block} plate={plate} resumeStep={resumeStep}
      snapshot={snapshot?.plateId === plate.id ? snapshot : undefined}
      next={next ? { title: plates[next.plateId]!.title, go: () => setBi(bi + 1) } : undefined}
    />
  );
}

function PlateRun({
  conceptId, lessonId, returnTo, split, onSplit, block, plate, resumeStep, snapshot, next, initialAsk,
}: {
  conceptId: string; lessonId: string; returnTo?: string; split: number; onSplit: (r: number) => void;
  block: PlateBlock; plate: PlateDef; resumeStep: number; snapshot?: Snapshot; next?: { title: string; go: () => void }; initialAsk?: string | undefined;
}) {
  const reduced = useReducedMotion();
  const dispatch = useStudy((s) => s.dispatch);
  const setPosition = useStudy((s) => s.setPosition);
  const addNote = useStudy((s) => s.addNote);
  const narration = useStudy((s) => s.learner.settings.narration);
  const history = useStudy((s) => s.learner.history);
  const evaluate = useMemo(() => createEvaluator(registry, plate.instances), [plate]);

  const [answered, setAnswered] = useState<Set<string>>(() => answeredFromHistory(history, plate));
  const lock = lockIndex(plate, answered);
  const pb = usePlayback(plate.steps.length, lock, reduced, resumeStep);
  const index = Math.min(Math.round(pb.pos), plate.steps.length - 1);
  const step = plate.steps[index]!;
  const meta = ideaMetaFor(plate.id);
  const idea = meta?.ideas.find((x) => index >= x.start && index <= x.end);
  const learner = useStudy((s) => s.learner);
  const nextVariant = useStudy((s) => s.nextVariant);
  const [askOpen, setAskOpen] = useState<string | null>(initialAsk ?? null);
  // ⌘K can open a question while this lesson is already on screen: follow the URL's ask.
  useEffect(() => {
    if (initialAsk) setAskOpen(initialAsk);
  }, [initialAsk]);
  const openAsk = useCallback((id: string | null) => {
    setAskOpen(id);
    if (id === null && typeof window !== "undefined") {
      const u = new URL(window.location.href);
      if (u.searchParams.has("ask")) {
        u.searchParams.delete("ask");
        window.history.replaceState(window.history.state, "", u);
      }
    }
  }, []);
  const [misses, setMisses] = useState<Record<string, number>>({});
  const ask = askOpen ? meta?.ideas.flatMap((x) => x.asks.map((a) => ({ a, x }))).find((y) => y.a.id === askOpen) : undefined;

  const [overrides, setOverrides] = useState<Overrides>(() => (snapshot ? snapshot.state : {}));
  const [editedAt, setEditedAt] = useState<number | null>(snapshot ? resumeStep : null);
  const [revealed, setRevealed] = useState<{ step: number; o: Overrides } | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [highlight, setHighlight] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const cueMs = useCueClock(step.cues, `${plate.id}:${index}`);

  // Frame: timeline state → learner overrides → authored reveal → cue track.
  const tl = frameAt(plate, pb.pos, { reducedMotion: reduced });
  // An open ask previews its own plate state; the learner's overrides stay layered and untouched.
  // An open ask shows its own authored state alone: the learner's edits, reveals and cues stay untouched underneath.
  const askView = ask ? askState(plate, ask.x, ask.a) : null;
  let state = askView ?? applyOverrides(tl.state, overrides);
  if (!askView && revealed?.step === index) state = applyOverrides(state, revealed.o);
  const cued = askView ? { state, highlight: [] as string[], camera: null } : applyCues(state, step.cues, cueMs);
  const stageTimeline = askView ? stillFrame(askView, ask?.a.focus ?? []) : tl;
  let frame: Frame;
  try {
    frame = evaluate(cued.state);
  } catch {
    frame = evaluate(tl.state);
  }
  const settled = useMemo(() => evaluate(stateAt(plate, index)), [evaluate, plate, index]);

  useEffect(() => {
    setPosition({ conceptId, lessonId, blockId: block.id, branchStack: [], plateStep: index });
    dispatch({ type: "blockViewed", conceptId, blockId: `${plate.id}#${step.id}` });
  }, [conceptId, lessonId, block.id, index, plate.id, step.id, setPosition, dispatch]);

  // Global shortcuts for the lesson (spec §3). Keys a focused control already used are left alone.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target instanceof Element ? e.target : document.body;
      if (t.closest("input, textarea, select, [contenteditable='true'], [role='separator'], [role='radiogroup'], .handle")) return;
      // Step from where the timeline is heading, so quick presses queue instead of repeating the same step.
      if (e.key === "ArrowRight") pb.go(Math.floor(pb.target) + 1);
      else if (e.key === "ArrowLeft") pb.go(Math.ceil(pb.target) - 1);
      else if (e.key === " " && !t.closest("button, a, summary")) pb.toggle();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pb, index]);

  const interaction = step.interaction;
  const tpl = interaction?.type === "numeric" && interaction.template ? templates.find((t) => t.id === interaction.template) : undefined;
  const variant = tpl ? instantiate(tpl, seedOf(learner, tpl.id)) : undefined;
  const remediation = tpl ? instantiate(tpl, seedOf(learner, tpl.id) + 1000) : undefined;
  const notebook = learner.notebook;
  // Recap cards are saved once per idea, when all its checks are answered correctly.
  useEffect(() => {
    for (const x of meta?.ideas ?? []) {
      const title = `Recap · ${x.title}`;
      if (x.checks.every((c) => answered.has(c.id)) && !notebook.some((n) => n.title === title))
        void addNote({ conceptId, kind: "note", title, body: recapMarkdown(x.recap.points, x.recap.traps) });
    }
  }, [meta, answered, notebook, addNote, conceptId]);
  const editable =
    interaction?.type === "manipulate-goal" ? plate.instances.filter((x) => registry.get(x.component).handles.length > 0).map((x) => x.id)
    : interaction?.type === "place" ? [interaction.handle.instance]
    : [];
  const goalMet = interaction && (interaction.type === "manipulate-goal" || interaction.type === "place") ? (checks[interaction.check]?.(frame, settled) ?? false) : false;

  const onEdit = useCallback(
    (id: string, params: Record<string, unknown>) => {
      setOverrides((o) => ({ ...o, [id]: { ...o[id], params: { ...o[id]?.params, ...params } } }));
      setEditedAt(index);
    },
    [index],
  );

  const here = conceptHref(conceptId, "learn", { lesson: lessonId, block: block.id, step: String(index) });
  const onAnswer = useCallback(
    (i: Interaction) => (a: AnswerInput): Effect[] => {
      const effects = dispatch({
        type: "answer", conceptId, blockId: `${plate.id}.${i.id}`, blockType: "plate", dimensions: [i.dimension],
        correct: a.correct, attempt: a.attempt, ...(a.tag ? { tag: a.tag } : {}), ...(a.errorClass ? { errorClass: a.errorClass } : {}),
      });
      const learner = useStudy.getState().learner;
      const route = pickRoute(i.routes, {
        outcome: a.correct ? "correct" : "incorrect", attempt: a.attempt, ...(a.tag ? { tag: a.tag } : {}),
        tags: learner.concepts[conceptId]?.tags ?? {}, mastery: (id) => conceptProgress(learner, id).mastery,
      });
      const back = `?return=${encodeURIComponent(here)}`;
      const found: Offer[] = effects.flatMap((e) => {
        if (e.type !== "offerRemediation") return [];
        const { conceptId: c, lessonId: l } = splitRef(e.lessonRef);
        return [{ key: `${e.tag}-${Date.now()}`, text: misconceptionFor(conceptId, e.tag)?.description ?? "Take a short detour.", href: lessonHref(c, l, back) }];
      });
      if (route?.goto.lessonRef) {
        const { conceptId: c, lessonId: l } = splitRef(route.goto.lessonRef);
        found.push({ key: `route-${Date.now()}`, text: route.say ?? "Take a short detour.", href: lessonHref(c, l, back) });
      }
      if (found.length) setOffers((o) => [...o, ...found]);
      if (route?.goto.step) {
        const k = plate.steps.findIndex((s) => s.id === route.goto.step);
        if (k >= 0) {
          setAnswered((s) => new Set(s).add(i.id));
          pb.go(k);
        }
      }
      return effects;
    },
    [dispatch, conceptId, plate, here, pb],
  );
  const onComplete = useCallback(() => interaction && setAnswered((s) => new Set(s).add(interaction.id)), [interaction]);
  // Goals re-fire when revisited (their check is still met); credit them to mastery once.
  const answer = useMemo(() => {
    if (!interaction) return () => [];
    const goal = interaction.type === "manipulate-goal" || interaction.type === "place";
    return goal && !shouldCredit(interaction.id, answered) ? () => [] : onAnswer(interaction);
  }, [interaction, onAnswer, answered]);

  const truth = (reveal: Record<string, Record<string, unknown>>) => {
    if (interaction?.type !== "predict-drag") return null;
    const s = applyOverrides(applyOverrides(stateAt(plate, index), overrides), toOverrides(reveal));
    const v = evaluate(s)[interaction.target.instance]?.model[interaction.target.readout];
    return typeof v === "number" ? v : null;
  };

  const saveSnapshot = async () => {
    // Only the learner's edits are stored: the authored step state rebuilds the rest exactly, and later steps stay live.
    await addNote({ conceptId, kind: "sim-state", title: `${plate.title} · §${index + 1} ${step.title}`, body: "Saved plate setup", plate: { plateId: plate.id, stepId: step.id, state: overrides } });
    setStatus("Saved to your notebook. Restore it from there.");
  };

  const last = plate.steps.length - 1;
  const finished = index === last && plate.steps.every((s) => !s.interaction || answered.has(s.interaction.id));
  const hasEdits = Object.keys(overrides).length > 0;

  return (
    <div className="plate-player space-y-4">
      <Split ratio={split} onRatio={onSplit} label="Resize the plate and the margin">
        <div className="space-y-2">
          <PlateStage
            plate={plate} timeline={stageTimeline} frame={frame} label={`${plate.title}, §${index + 1}: ${step.title}`}
            highlight={[...highlight, ...cued.highlight]} editable={askView ? [] : editable} onEdit={onEdit}
            onTerm={(k) => setHighlight(termTargets(plate, k))}
          />
          <PlateReadouts plate={plate} frame={frame} hidden={hiddenReadouts(plate, index, answered)} />
        </div>
        <aside className="margin space-y-5 pl-4" aria-label="Margin">
          <MarginNote kicker={meta ? stepLocation(meta, index) : `§${index + 1} of ${plate.steps.length} · ${plate.title}`} title={step.title}>
            {step.kind === "recap" && idea ? (
              <>
                <RecapCard title={idea.title} points={idea.recap.points} traps={idea.recap.traps} />
                <Link className="underline" href={`/c/${course.id}/${encodeURIComponent(conceptId)}/sheet`}>Open the revision sheet →</Link>
              </>
            ) : (
              <p>{step.note}</p>
            )}
            {step.latex && <Tex latex={step.latex} display />}
            {(() => {
              const ex = idea?.examples.find((e) => e.end === index);
              return ex?.trap ? <TrapNote text={ex.trap} /> : null;
            })()}
            {step.why && (
              <details>
                <summary>Why?</summary>
                <p>{step.why}</p>
              </details>
            )}
            {step.derivation && (
              <details>
                <summary>Derivation</summary>
                <p>{step.derivation}</p>
              </details>
            )}
            {narration === "device" && <ReadAloud text={readAloudText(plate, index)} />}
          </MarginNote>
          {interaction && (
            <InteractionView
              key={`${plate.id}:${interaction.id}`} interaction={interaction} goalMet={goalMet} truth={truth}
              onAnswer={answer} onReveal={(p) => setRevealed({ step: index, o: toOverrides(p) })} onComplete={onComplete} onHighlight={setHighlight}
              strict={step.kind === "check"}
              onMiss={() => setMisses((m) => ({ ...m, [interaction.id]: (m[interaction.id] ?? 0) + 1 }))}
              {...(variant ? { numericVariant: { key: variant.key, prompt: variant.prompt, spec: variant.spec, hints: variant.hints } } : {})}
            />
          )}
          {interaction && step.kind === "check" && (misses[interaction.id] ?? 0) >= 2 && !answered.has(interaction.id) && (
            <div className="space-y-2" role="status">
              {remediation && tpl ? (
                <>
                  <WorkedLines title="Worked example with new numbers" lines={[{ text: remediation.prompt }, ...remediation.worked]} />
                  <button className="btn" onClick={() => { nextVariant(tpl.id); setMisses((m) => ({ ...m, [interaction.id]: 0 })); }}>Try a new one</button>
                </>
              ) : (
                <p className="text-sm">
                  Look again at{" "}
                  {idea?.examples.map((ex, k) => (
                    <button key={ex.id} className="mr-2 underline" onClick={() => pb.go(ex.start)}>worked example {k + 1}</button>
                  ))}
                  then try this check again.
                </p>
              )}
            </div>
          )}
          {idea && <AsksList asks={idea.asks} open={askOpen} onOpen={openAsk} />}
          {offers.map((o) => (
            <div key={o.key} className="fb fb-again text-sm" role="status">
              ↺ {o.text} <Link className="underline" href={o.href}>Take the detour</Link>
            </div>
          ))}
          {hasEdits && editedAt !== null && editedAt !== index && (
            <div className="fb fb-again text-sm" role="status">
              You changed the setup on §{editedAt + 1}.{" "}
              <button className="underline" onClick={() => setEditedAt(index)}>Keep it</button>{" · "}
              <button className="underline" onClick={() => { setOverrides({}); setEditedAt(null); }}>Reset</button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 text-sm">
            {hasEdits && <button className="btn" onClick={() => { setOverrides({}); setEditedAt(null); }}>Reset the setup</button>}
            <button className="btn" onClick={saveSnapshot}>Save this setup to the notebook</button>
          </div>
          {status && <p className="text-sm text-soft" role="status">{status}</p>}
          {finished && (
            <div className="space-y-2">
              {next ? (
                <button className="btn btn-primary" onClick={next.go}>Continue: {next.title} →</button>
              ) : returnTo ? (
                <Link className="btn btn-primary" href={returnTo}>Back to where you were →</Link>
              ) : (
                <Link className="btn btn-primary" href={conceptHref(conceptId, "solve")}>Practise in Solve mode →</Link>
              )}
            </div>
          )}
        </aside>
      </Split>
      <footer className="title-strip">
        <Timeline steps={plate.steps} pos={pb.pos} lock={lock} playing={pb.playing} onScrub={pb.scrub} onTogglePlay={pb.toggle} {...(meta ? { marks: timelineMarks(meta) } : {})} />
      </footer>
    </div>
  );
}
