import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assessmentsForItem, course, questionBank } from "../src";

const ids = new Set(course.concepts.map((c) => c.id));
const catalog = readFileSync(fileURLToPath(new URL("../../../../docs/superpowers/resources/emag-catalog.md", import.meta.url)), "utf8");

describe("question bank", () => {
  it("every item maps to real concepts with weights summing to 1, and cites a catalog id", () => {
    for (const q of questionBank) {
      expect(q.concepts.reduce((s, c) => s + c.weight, 0), q.id).toBeCloseTo(1, 10);
      for (const c of q.concepts) expect(ids.has(c.conceptId), `${q.id} → ${c.conceptId}`).toBe(true);
      expect(catalog, `${q.id} source ${q.source}`).toContain(`\`${q.source}\``);
    }
  });
  it("ids are unique", () => {
    expect(new Set(questionBank.map((q) => q.id)).size).toBe(questionBank.length);
  });
  it("holds every in-scope question from the test, ICT, homework and finals sources", () => {
    const want = [
      "mst-2324-q1a", "mst-2324-q1b", "mst-2324-q2a", "mst-2324-q2b", "mst-2324-q2c", "mst-2324-q3a", "mst-2324-q3b",
      "mst-2324-q4a", "mst-2324-q4b", "mst-2324-q4c", "mst-2324-q5a", "mst-2324-q5b",
      "f2425-q1a", "f2425-q1b", "f2425-q1c", "f2425-q2a", "f2425-q2b", "f2425-q3a", "f2425-q3b", "f2425-q4a", "f2425-q4b", "f2425-q4c",
      "f2324-q1a", "f2324-q1b", "f2324-q2a", "f2324-q2b", "f2324-q3a", "f2324-q3b", "f2324-q3c", "f2324-q4a", "f2324-q4b", "f2324-q4c",
      "ict2-2425-q1", "ict2-2425-q2", "ict2-2425-q3",
      "hw-2324-2.1", "hw-2324-2.2", "hw-2324-2.3", "hw-2324-2.4", "hw-2324-2.5", "hw-2324-2.6",
      "hw03-2425-3.1a", "hw03-2425-3.1b", "hw03-2425-3.2", "hw03-2425-3.3", "hw04-2425-4.1", "hw04-2425-4.2", "hw04-2425-4.3",
    ];
    expect(questionBank.map((q) => q.id).sort()).toEqual([...want].sort());
  });
  it("derives assessments from concept scope: a Coulomb item is ICT 1 and finals; a wave item is finals only", () => {
    expect(assessmentsForItem(questionBank.find((q) => q.id === "mst-2324-q1b")!)).toEqual(["ict1", "finals"]);
    expect(assessmentsForItem(questionBank.find((q) => q.id === "f2425-q4c")!)).toEqual(["finals"]);
    expect(assessmentsForItem(questionBank.find((q) => q.id === "ict2-2425-q1")!)).toEqual(["ict1", "ict2", "finals"]);
  });
  it("records that HW02 2023-24 was reissued as HW01 2024-25", () => {
    expect(questionBank.find((q) => q.id === "hw-2324-2.1")!.seenIn).toEqual(["hw02-2324", "hw01-2425"]);
  });
});

describe("assessments", () => {
  it("ICT 1 covers all of units 1–2 plus Ampère; ICT 2 covers units 3–4; finals covers everything", () => {
    const a = Object.fromEntries(course.assessments.map((x) => [x.id, x]));
    const unit = (n: number) => course.concepts.filter((c) => c.unit === n).map((c) => c.id);
    expect(a.ict1!.scope.concepts).toEqual([...unit(1), ...unit(2), "em1.magnetostatics.ampere"]);
    expect(a.ict2!.scope.concepts).toEqual([...unit(3), ...unit(4)]);
    expect(a.finals!.scope.concepts).toEqual(course.concepts.map((c) => c.id));
    expect(a.finals!.date).toBe(course.examDate);
  });
});
