import { initialState } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { countdownText, readiness, reviewDateFor } from "@/lib/assessments";

const ja = (iso: string) => Date.parse(`${iso}-05:00`);

describe("assessment countdown", () => {
  it("names the next sitting, then the one after", () => {
    expect(countdownText(ja("2026-09-26T12:00:00"))).toBe("ICT 1 in 16 days");
    expect(countdownText(ja("2026-10-12T23:00:00"))).toBe("ICT 1 today");
    expect(countdownText(ja("2026-10-13T00:01:00"))).toBe("ICT 2 in 34 days");
    expect(countdownText(ja("2026-12-16T00:01:00"))).toBe("");
  });
  it("follows a concept's own scope", () => {
    expect(countdownText(ja("2026-09-26T12:00:00"), "em1.waves.plane-waves")).toBe("Finals in 80 days");
  });
});

describe("scheduler dates by scope", () => {
  it("a Unit 2 concept reviews toward ICT 1; a Unit 4 concept toward finals", () => {
    const now = ja("2026-09-26T12:00:00");
    expect(reviewDateFor("em1.electrostatics.coulomb", now)).toBe(Date.parse("2026-10-12T14:00:00Z"));
    expect(reviewDateFor("em1.dynamic.faraday", now)).toBe(Date.parse("2026-11-16T14:00:00Z"));
    expect(reviewDateFor("em1.waves.plane-waves", now)).toBe(Date.parse("2026-12-15T14:00:00Z"));
  });
});

describe("readiness", () => {
  it("counts unlocked in-scope concepts, none ready at the start", () => {
    const r = readiness(initialState(), "ict1");
    expect(r.ready).toBe(0);
    expect(r.total).toBeGreaterThan(5);
  });
});
