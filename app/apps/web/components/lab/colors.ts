"use client";

import { useEffect, useState } from "react";
import { useStudy } from "@/lib/store";

export type LabColors = { charge: string; field: string; flux: string; surface: string; bg: string; ink: string };

const read = (): LabColors => {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return {
    charge: v("--sem-charge", "#c2455c"),
    field: v("--sem-field", "#1b8a96"),
    flux: v("--sem-flux", "#6d4fd0"),
    surface: v("--sem-surface", "#b27716"),
    bg: v("--lab-bg", "#f1ece3"),
    ink: v("--ink", "#1f2a37"),
  };
};

/** Semantic colours from the active theme's tokens, so 3D matches equations and prose. */
export function useLabColors(): LabColors {
  const theme = useStudy((s) => s.learner.settings.theme);
  const [colors, setColors] = useState<LabColors>({
    charge: "#c2455c",
    field: "#1b8a96",
    flux: "#6d4fd0",
    surface: "#b27716",
    bg: "#f1ece3",
    ink: "#1f2a37",
  });
  useEffect(() => {
    // Wait a frame so the new data-theme attribute has applied.
    const id = requestAnimationFrame(() => setColors(read()));
    return () => cancelAnimationFrame(id);
  }, [theme]);
  return colors;
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
