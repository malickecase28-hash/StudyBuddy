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
  togglePanel: (t: ToolId) => void;
  openPanel: (t: ToolId) => void;
  closePanel: () => void;
  setPalette: (open: boolean) => void;
  setActiveConcept: (id: string | null) => void;
  setWorkspaceMode: (m: Mode | null) => void;
}>((set) => ({
  panel: null,
  paletteOpen: false,
  activeConceptId: null,
  workspaceMode: null,
  togglePanel: (t) => set((s) => ({ panel: s.panel === t ? null : t })),
  openPanel: (t) => set({ panel: t }),
  closePanel: () => set({ panel: null }),
  setPalette: (paletteOpen) => set({ paletteOpen }),
  setActiveConcept: (activeConceptId) => set({ activeConceptId }),
  setWorkspaceMode: (workspaceMode) => set({ workspaceMode }),
}));
