"use client";

import type { Vec3 } from "@forma/physics";
import { createContext, useContext } from "react";

export type StageApi = {
  toMetres: (clientX: number, clientY: number) => Vec3;
  edit: (id: string, params: Record<string, unknown>) => void;
  editable: (id: string) => boolean;
};

export const StageContext = createContext<StageApi>({ toMetres: () => [0, 0, 0], edit: () => {}, editable: () => false });
export const usePlateStage = () => useContext(StageContext);
