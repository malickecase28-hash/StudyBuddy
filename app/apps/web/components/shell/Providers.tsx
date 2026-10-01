"use client";

import { useEffect, type ReactNode } from "react";
import { useMeSync } from "@/lib/commons/client";
import { useStudy } from "@/lib/store";

/** Hydrates the learner store and mirrors cognitive-environment settings onto <html>. */
export function Providers({ children }: { children: ReactNode }) {
  useMeSync();
  const hydrate = useStudy((s) => s.hydrate);
  const settings = useStudy((s) => s.learner.settings);
  useEffect(() => void hydrate(), [hydrate]);
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = settings.theme;
    el.dataset.motion = settings.motion;
    el.dataset.density = settings.density;
  }, [settings]);
  return <>{children}</>;
}

export function Hydrated({ children }: { children: ReactNode }) {
  const hydrated = useStudy((s) => s.hydrated);
  if (!hydrated) return <p className="p-8 text-soft">Opening your workspace…</p>;
  return <>{children}</>;
}
