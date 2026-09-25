"use client";

import { create } from "zustand";

type DrawerTab = "sources" | "formulas" | "notebook";

/** Ephemeral UI state (not persisted). */
export const useUi = create<{
  drawerOpen: boolean;
  drawerTab: DrawerTab;
  railOpen: boolean;
  activeConceptId: string | null;
  openDrawer: (tab?: DrawerTab) => void;
  closeDrawer: () => void;
  toggleRail: () => void;
  setActiveConcept: (id: string | null) => void;
}>((set) => ({
  drawerOpen: false,
  drawerTab: "sources",
  railOpen: true,
  activeConceptId: null,
  openDrawer: (tab) => set((s) => ({ drawerOpen: true, drawerTab: tab ?? s.drawerTab })),
  closeDrawer: () => set({ drawerOpen: false }),
  toggleRail: () => set((s) => ({ railOpen: !s.railOpen })),
  setActiveConcept: (activeConceptId) => set({ activeConceptId }),
}));
