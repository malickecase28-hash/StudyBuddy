"use client";

import {
  DAY_MS,
  initialState,
  migrate,
  reduce,
  type Effect,
  type LearnEvent,
  type LearnerState,
  type NotebookEntry,
  type Settings,
  type TopicResult,
  withLayout,
  withNextSeed,
  type Mode,
  type ToolId,
} from "@forma/engine";
import { create } from "zustand";
import { conceptById, examDateMs } from "./course";
import { load, save, TIMED_OUT } from "./persist";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewEvent = DistributiveOmit<LearnEvent, "at">;
type Position = NonNullable<LearnerState["position"]>;

export type ReturnInfo = { gapDays: number; lastEventAt: number; lastConceptId: string } | null;

type Store = {
  hydrated: boolean;
  learner: LearnerState;
  resetNotice: boolean;
  /** Saved progress couldn't be read in time: this session runs in memory and never overwrites storage. */
  storageUnavailable: boolean;
  clockOffsetDays: number;
  returnInfo: ReturnInfo;
  welcomeDismissed: boolean;
  /** Semantic term keys currently highlighted by an equation (e.g. "t-surface"); labs light up matching parts. */
  labFocus: string[];
  hydrate: () => Promise<void>;
  now: () => number;
  dispatch: (event: NewEvent) => Effect[];
  setPosition: (p: Position) => void;
  addNote: (n: Omit<NotebookEntry, "id" | "createdAt">) => Promise<void>;
  removeNote: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  completeDiagnostic: (results: Record<string, TopicResult>, route: string[]) => void;
  setClockOffset: (days: number) => void;
  setLabFocus: (keys: string[]) => void;
  dismissWelcome: () => void;
  dismissResetNotice: () => void;
  resetProgress: () => void;
  setLayout: (mode: Mode, patch: Partial<{ split: number; pinned: ToolId[]; toolWidth: number }>) => void;
  nextVariant: (templateId: string) => void;
};

const STATE_KEY = "learner";
const DEV_KEY = "dev";

function computeReturn(learner: LearnerState, now: number): ReturnInfo {
  const last = learner.history.at(-1);
  if (!last) return null;
  return { gapDays: (now - last.at) / DAY_MS, lastEventAt: last.at, lastConceptId: last.conceptId };
}

export const useStudy = create<Store>((set, get) => ({
  hydrated: false,
  learner: initialState(),
  resetNotice: false,
  storageUnavailable: false,
  clockOffsetDays: 0,
  returnInfo: null,
  welcomeDismissed: false,
  labFocus: [],

  hydrate: async () => {
    if (get().hydrated) return;
    const [raw, dev] = await Promise.all([load(STATE_KEY), load(DEV_KEY)]);
    if (raw === TIMED_OUT) {
      set({ hydrated: true, storageUnavailable: true });
      return;
    }
    const { state, reset, backup } = migrate(raw);
    if (reset && backup) await save(`${STATE_KEY}-backup-${Date.now()}`, backup);
    const clockOffsetDays = typeof (dev as { clockOffsetDays?: unknown })?.clockOffsetDays === "number" ? (dev as { clockOffsetDays: number }).clockOffsetDays : 0;
    const now = Date.now() + clockOffsetDays * DAY_MS;
    set({ hydrated: true, learner: state, resetNotice: reset, clockOffsetDays, returnInfo: computeReturn(state, now) });
  },

  now: () => Date.now() + get().clockOffsetDays * DAY_MS,

  dispatch: (e) => {
    const concept = conceptById.get(e.conceptId);
    if (!concept) return [];
    const event = { ...e, at: get().now() } as LearnEvent;
    const { state, effects } = reduce(get().learner, event, concept, examDateMs);
    set({ learner: state });
    return effects;
  },

  setPosition: (position) => set((s) => ({ learner: { ...s.learner, position } })),

  addNote: (n) => {
    set((s) => ({
      learner: {
        ...s.learner,
        notebook: [{ ...n, id: `n-${s.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, createdAt: s.now() }, ...s.learner.notebook],
      },
    }));
    return get().storageUnavailable ? Promise.resolve() : save(STATE_KEY, get().learner);
  },

  removeNote: (id) => set((s) => ({ learner: { ...s.learner, notebook: s.learner.notebook.filter((n) => n.id !== id) } })),

  updateSettings: (patch) => set((s) => ({ learner: { ...s.learner, settings: { ...s.learner.settings, ...patch } } })),

  completeDiagnostic: (results, route) =>
    set((s) => ({ learner: { ...s.learner, diagnostic: { completedAt: s.now(), results, route } } })),

  setClockOffset: (days) => {
    set((s) => ({ clockOffsetDays: days, returnInfo: computeReturn(s.learner, Date.now() + days * DAY_MS), welcomeDismissed: false }));
    void save(DEV_KEY, { clockOffsetDays: days });
  },

  setLabFocus: (labFocus) => set({ labFocus }),
  dismissWelcome: () => set({ welcomeDismissed: true }),
  dismissResetNotice: () => set({ resetNotice: false }),

  setLayout: (mode, patch) => set((s) => ({ learner: withLayout(s.learner, mode, patch) })),
  nextVariant: (templateId) => set((s) => ({ learner: withNextSeed(s.learner, templateId) })),
  resetProgress: () => set({ learner: { ...initialState(), settings: get().learner.settings }, returnInfo: null }),
}));

// Persist learner state (debounced) once hydrated.
if (typeof window !== "undefined") {
  let timer: ReturnType<typeof setTimeout> | undefined;
  useStudy.subscribe((s, prev) => {
    if (!s.hydrated || s.storageUnavailable || s.learner === prev.learner) return;
    clearTimeout(timer);
    timer = setTimeout(() => void save(STATE_KEY, s.learner), 250);
  });
}
