"use client";

import type { Mode, ToolId } from "@forma/engine";
import { create } from "zustand";

/** Ephemeral UI state (not persisted). Pinned tools live in the learner's per-mode layouts. */
export const useUi = create<{
  panel: ToolId | null;
  paletteOpen: boolean;
  activeConceptId: string | null;
  /** The concept workspace's validated mode, published for the shell (which must not read search params). */
  workspaceMode: Mode | null;
  /** Tool width outside a concept workspace (session only). */
  toolWidth: number;
  toolExpanded: boolean;
  togglePanel: (t: ToolId) => void;
  openPanel: (t: ToolId) => void;
  closePanel: () => void;
  setPalette: (open: boolean) => void;
  setActiveConcept: (id: string | null) => void;
  setWorkspaceMode: (m: Mode | null) => void;
  setToolWidth: (w: number) => void;
  setToolExpanded: (b: boolean) => void;
}>((set) => ({
  panel: null,
  paletteOpen: false,
  activeConceptId: null,
  workspaceMode: null,
  toolWidth: 0.45,
  toolExpanded: false,
  togglePanel: (t) => set((s) => ({ panel: s.panel === t ? null : t })),
  openPanel: (t) => set({ panel: t }),
  closePanel: () => set({ panel: null, toolExpanded: false }),
  setPalette: (paletteOpen) => set({ paletteOpen }),
  setActiveConcept: (activeConceptId) => set({ activeConceptId }),
  // A tool opened by hand belongs to the mode it was opened in; each mode then shows its own pinned tool.
  setWorkspaceMode: (workspaceMode) => set((s) => (s.workspaceMode === workspaceMode ? {} : { workspaceMode, panel: null, toolExpanded: false })),
  setToolWidth: (w) => set({ toolWidth: Math.min(0.8, Math.max(0.2, w)) }),
  setToolExpanded: (toolExpanded) => set({ toolExpanded }),
}));
