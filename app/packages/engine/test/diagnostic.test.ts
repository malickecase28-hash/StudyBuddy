import { describe, expect, it } from "vitest";
import { diagnosticRoute, nextDiagnosticItem, type Diagnostic } from "../src";

const opt = [
  { id: "a", label: "A", correct: true, feedback: "ok" },
  { id: "b", label: "B", correct: false, feedback: "no" },
];
const d: Diagnostic = {
  topics: [
    { id: "dot", label: "Dot product", refresher: "em1.math.vectors" },
    { id: "sph", label: "Spherical coords", refresher: "em1.math.surface-integrals" },
    { id: "coul", label: "Coulomb", refresher: null },
  ],
  items: [
    { id: "dot-core", topic: "dot", role: "core", prompt: "p", options: opt },
    { id: "dot-probe", topic: "dot", role: "probe", prompt: "p", options: opt },
    { id: "sph-core", topic: "sph", role: "core", prompt: "p", options: opt },
    { id: "sph-probe", topic: "sph", role: "probe", prompt: "p", options: opt },
    { id: "coul-core", topic: "coul", role: "core", prompt: "p", options: opt },
    { id: "coul-probe", topic: "coul", role: "probe", prompt: "p", options: opt },
  ],
};

describe("diagnostic", () => {
  it("asks core first, probes only after a miss, then moves on", () => {
    expect(nextDiagnosticItem(d, {})!.id).toBe("dot-core");
    expect(nextDiagnosticItem(d, { "dot-core": true })!.id).toBe("sph-core");
    expect(nextDiagnosticItem(d, { "dot-core": true, "sph-core": false })!.id).toBe("sph-probe");
    const done = { "dot-core": true, "sph-core": false, "sph-probe": true, "coul-core": false, "coul-probe": false };
    expect(nextDiagnosticItem(d, done)).toBeNull();
  });
  it("routes refreshers for partial/gap topics only", () => {
    const answers = { "dot-core": true, "sph-core": false, "sph-probe": true, "coul-core": false, "coul-probe": false };
    expect(diagnosticRoute(d, answers)).toEqual({
      results: { dot: "ready", sph: "partial", coul: "gap" },
      route: ["em1.math.surface-integrals"],
    });
  });
});
