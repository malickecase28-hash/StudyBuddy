import { z } from "zod";
import type { LearnEvent } from "./events";
import { zeroDimensions, type Dimensions } from "./mastery";
import type { Review } from "./scheduler";
import { DIMENSIONS, type Dimension } from "./schema/common";

export type Mode = "learn" | "solve" | "explore" | "revise";
export type ToolId = "paper" | "notebook" | "formulas" | "sources" | "calculator";
export type Workspace = { lastMode: Mode; layouts: Record<Mode, { split: number; pinned: ToolId[]; toolWidth: number }> };
/** A learner's edits layered over one authored plate step (not the full scene), so restoring keeps later steps live. */
type PlateSnapshot = { plateId: string; stepId: string; state: Record<string, { params?: Record<string, unknown>; visible?: boolean }> };

export const defaultWorkspace = (): Workspace => ({
  lastMode: "learn",
  layouts: {
    learn: { split: 0.7, pinned: [], toolWidth: 0.45 },
    solve: { split: 0.5, pinned: ["paper"], toolWidth: 0.5 },
    explore: { split: 1, pinned: [], toolWidth: 0.45 },
    revise: { split: 0.33, pinned: [], toolWidth: 0.45 },
  },
});

export const STATE_VERSION = 2;
export const HISTORY_CAP = 500;

export type ConceptProgress = {
  dimensions: Dimensions;
  seen: boolean;
  attempts: number;
  tags: Record<string, number>;
  blockFails: Record<string, number>;
  firedRules: string[];
  lastSeen: number | null;
  review: Partial<Record<Dimension, Review>>;
};

export type NotebookEntry = {
  id: string;
  createdAt: number;
  conceptId: string;
  kind: "note" | "equation" | "sim-state" | "drawing";
  title: string;
  body: string;
  text?: string;
  simState?: { scene: string; config: Record<string, unknown> };
  plate?: PlateSnapshot;
};

export type Settings = {
  theme: "paper" | "blueprint" | "contrast";
  narration: "off" | "device";
  motion: "standard" | "reduced";
  density: "comfortable" | "compact";
  simQuality: "high" | "balanced" | "low";
  equationDetail: "progressive" | "full";
};

export type LearnerState = {
  version: 2;
  diagnostic: { completedAt: number; results: Record<string, "ready" | "partial" | "gap">; route: string[] } | null;
  concepts: Record<string, ConceptProgress>;
  position: { conceptId: string; lessonId: string; blockId: string; branchStack: string[]; plateStep?: number } | null;
  notebook: NotebookEntry[];
  settings: Settings;
  history: LearnEvent[];
  workspace: Workspace;
  seeds: Record<string, number>;
};

export const emptyProgress = (): ConceptProgress => ({
  dimensions: zeroDimensions(),
  seen: false,
  attempts: 0,
  tags: {},
  blockFails: {},
  firedRules: [],
  lastSeen: null,
  review: {},
});

export const initialState = (): LearnerState => ({
  version: STATE_VERSION,
  diagnostic: null,
  concepts: {},
  position: null,
  notebook: [],
  settings: { theme: "paper", motion: "standard", density: "comfortable", simQuality: "balanced", equationDetail: "progressive", narration: "off" },
  history: [],
  workspace: defaultWorkspace(),
  seeds: {},
});

const num01 = z.number().min(0).max(1);
const ReviewS = z.object({ due: z.number(), intervalDays: z.number().positive() });
const ProgressS = z.object({
  dimensions: z.object(Object.fromEntries(DIMENSIONS.map((d) => [d, num01])) as Record<Dimension, typeof num01>),
  seen: z.boolean(),
  attempts: z.number().int().nonnegative(),
  tags: z.record(z.string(), z.number()),
  blockFails: z.record(z.string(), z.number()),
  firedRules: z.array(z.string()),
  lastSeen: z.number().nullable(),
  review: z.record(z.string(), ReviewS),
});
const ModeLayout = z.object({ split: z.number().min(0).max(1), pinned: z.array(z.enum(["paper", "notebook", "formulas", "sources", "calculator"])), toolWidth: z.number().min(0).max(1).default(0.45) });
const common = {
  diagnostic: z
    .object({ completedAt: z.number(), results: z.record(z.string(), z.enum(["ready", "partial", "gap"])), route: z.array(z.string()) })
    .nullable(),
  concepts: z.record(z.string(), ProgressS),
  position: z
    .object({ conceptId: z.string(), lessonId: z.string(), blockId: z.string(), branchStack: z.array(z.string()), plateStep: z.number().optional() })
    .nullable(),
  notebook: z.array(z.any()),
  history: z.array(z.any()),
};
const SettingsBase = {
  motion: z.enum(["standard", "reduced"]),
  density: z.enum(["comfortable", "compact"]),
  simQuality: z.enum(["high", "balanced", "low"]),
  equationDetail: z.enum(["progressive", "full"]),
};
const StateV1 = z.object({ version: z.literal(1), ...common, settings: z.object({ theme: z.enum(["paper", "night", "contrast"]), ...SettingsBase }) });
const StateV2 = z.object({
  version: z.literal(2),
  ...common,
  settings: z.object({ theme: z.enum(["paper", "blueprint", "contrast"]), narration: z.enum(["off", "device"]), ...SettingsBase }),
  workspace: z.object({
    lastMode: z.enum(["learn", "solve", "explore", "revise"]),
    layouts: z.object({ learn: ModeLayout, solve: ModeLayout, explore: ModeLayout, revise: ModeLayout }),
  }),
  seeds: z.record(z.string(), z.number()),
});

/** Validate persisted state, upgrading v1 → v2; anything else is backed up and reset. */
export function migrate(raw: unknown): { state: LearnerState; reset: boolean; backup?: unknown } {
  if (raw === null || raw === undefined) return { state: initialState(), reset: false };
  const v2 = StateV2.safeParse(raw);
  if (v2.success) return { state: v2.data as LearnerState, reset: false };
  const v1 = StateV1.safeParse(raw);
  if (v1.success) {
    const { theme, ...rest } = v1.data.settings;
    return {
      state: {
        ...(v1.data as unknown as Omit<LearnerState, "version" | "settings" | "workspace" | "seeds">),
        version: 2,
        settings: { ...rest, theme: theme === "night" ? "blueprint" : theme, narration: "off" },
        workspace: defaultWorkspace(),
        seeds: {},
      },
      reset: false,
    };
  }
  return { state: initialState(), reset: true, backup: raw };
}

/** Moves a learner off a retired concept: position and notebook go to its successor; its progress is dropped. */
export function retireConcept(s: LearnerState, from: string, to: string, lessonId: string): LearnerState {
  const touches = from in s.concepts || s.position?.conceptId === from || s.notebook.some((n) => n.conceptId === from);
  if (!touches) return s;
  const { [from]: _dropped, ...concepts } = s.concepts;
  return {
    ...s,
    concepts,
    position: s.position?.conceptId === from ? { ...s.position, conceptId: to, lessonId } : s.position,
    notebook: s.notebook.map((n) => (n.conceptId === from ? { ...n, conceptId: to } : n)),
  };
}
export const seedOf = (s: LearnerState, templateId: string) => s.seeds[templateId] ?? 1;

export const withNextSeed = (s: LearnerState, templateId: string): LearnerState => ({
  ...s,
  seeds: { ...s.seeds, [templateId]: seedOf(s, templateId) + 1 },
});

export function withLayout(s: LearnerState, mode: Mode, patch: Partial<Workspace["layouts"][Mode]>): LearnerState {
  const cur = s.workspace.layouts[mode];
  const split = Math.min(1, Math.max(0.2, patch.split ?? cur.split));
  const toolWidth = Math.min(0.8, Math.max(0.2, patch.toolWidth ?? cur.toolWidth));
  return { ...s, workspace: { lastMode: mode, layouts: { ...s.workspace.layouts, [mode]: { ...cur, ...patch, split, toolWidth } } } };
}

