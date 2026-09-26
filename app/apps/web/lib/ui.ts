"use client";

import type { ToolId } from "@forma/engine";
import { create } from "zustand";

/** Ephemeral UI state (not persisted). Pinned tools live in the learner's per-mode layouts. */
export const useUi = create<{
  panel: ToolId | null;
  paletteOpen: boolean;
  activeConceptId: string | null;
  togglePanel: (t: ToolId) => void;
  openPanel: (t: ToolId) => void;
  closePanel: () => void;
  setPalette: (open: boolean) => void;
  setActiveConcept: (id: string | null) => void;
}>((set) => ({
  panel: null,
  paletteOpen: false,
  activeConceptId: null,
  togglePanel: (t) => set((s) => ({ panel: s.panel === t ? null : t })),
  openPanel: (t) => set({ panel: t }),
  closePanel: () => set({ panel: null }),
  setPalette: (paletteOpen) => set({ paletteOpen }),
  setActiveConcept: (activeConceptId) => set({ activeConceptId }),
}));
