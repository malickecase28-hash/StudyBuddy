import { describe, expect, it } from "vitest";
import { checkChoice, checkNumeric, type NumericSpec } from "../src";

const spec: NumericSpec = {
  answer: { value: 4, unit: "µC" },
  relTol: 0.02,
  distractors: [
    { value: 16, unit: "µC", errorClass: "conceptual", tag: "FLUX_SCALES_WITH_AREA", feedback: "You scaled flux with area." },
  ],
};

describe("checkNumeric", () => {
  it("accepts equivalent values in other prefixes", () => {
    expect(checkNumeric(spec, "4 µC").correct).toBe(true);
    expect(checkNumeric(spec, "0.004 mC").correct).toBe(true);
    expect(checkNumeric(spec, "4.05e-6 C").correct).toBe(true);
  });
  it("matches authored distractors with their tag", () => {
    const v = checkNumeric(spec, "16 uC");
    expect(v).toMatchObject({ correct: false, errorClass: "conceptual", tag: "FLUX_SCALES_WITH_AREA" });
  });
  it("detects sign errors", () => {
    expect(checkNumeric(spec, "-4 µC").errorClass).toBe("sign");
  });
  it("detects prefix/power-of-ten slips as unit errors", () => {
    expect(checkNumeric(spec, "4 nC").errorClass).toBe("unit");
    expect(checkNumeric(spec, "4 mC").errorClass).toBe("unit");
  });
  it("detects wrong dimension and missing units", () => {
    expect(checkNumeric(spec, "4 V/m").errorClass).toBe("unit");
    expect(checkNumeric(spec, "4").errorClass).toBe("unit");
  });
  it("flags unreadable input as notation", () => {
    expect(checkNumeric(spec, "four").errorClass).toBe("notation");
  });
  it("near misses are arithmetic, far misses conceptual", () => {
    expect(checkNumeric(spec, "4.3 µC").errorClass).toBe("arithmetic");
    expect(checkNumeric(spec, "9 µC").errorClass).toBe("conceptual");
  });
});

describe("checkChoice", () => {
  const options = [
    { id: "a", label: "Doubles", correct: false, feedback: "D weakens as 1/r².", tag: "FLUX_SCALES_WITH_AREA" },
    { id: "b", label: "Same", correct: true, feedback: "Only enclosed charge matters." },
  ];
  it("returns the option's feedback and tag", () => {
    expect(checkChoice(options, "a")).toEqual({
      correct: false,
      errorClass: "conceptual",
      tag: "FLUX_SCALES_WITH_AREA",
      feedback: "D weakens as 1/r².",
    });
    expect(checkChoice(options, "b")).toEqual({ correct: true, feedback: "Only enclosed charge matters." });
  });
  it("throws on unknown option id", () => {
    expect(() => checkChoice(options, "z")).toThrow();
  });
});
