import type { PlateDef } from "./plate";

export const termTargets = (plate: PlateDef, key: string): string[] => plate.bindings[key] ?? [];

export const instanceTerms = (plate: PlateDef, instanceId: string): string[] =>
  Object.entries(plate.bindings)
    .filter(([, ids]) => ids.includes(instanceId))
    .map(([k]) => k);
