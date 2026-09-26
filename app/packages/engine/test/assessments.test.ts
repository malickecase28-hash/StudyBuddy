import { describe, expect, it } from "vitest";
import { assessmentTime, daysUntil, nextAssessment, parseQuantity } from "../src";

const course = {
  assessments: [
    { id: "finals", title: "Final exam", short: "Finals", date: "2026-12-15", weight: 60, scope: { concepts: ["a.x", "a.y", "a.z"] } },
    { id: "ict1", title: "In-Course Test 1", short: "ICT 1", date: "2026-10-12", weight: 15, scope: { concepts: ["a.x"] } },
    { id: "ict2", title: "In-Course Test 2", short: "ICT 2", date: "2026-11-16", weight: 15, scope: { concepts: ["a.y"] } },
  ],
};
const ja = (iso: string) => Date.parse(`${iso}-05:00`);

describe("assessments", () => {
  it("counts 09:00 Jamaica time as the sitting", () => {
    expect(assessmentTime(course.assessments[1]!)).toBe(Date.parse("2026-10-12T14:00:00Z"));
  });
  it("is next until the end of its day, then the following one takes over", () => {
    expect(nextAssessment(course, ja("2026-09-26T12:00:00"))!.id).toBe("ict1");
    expect(nextAssessment(course, ja("2026-10-12T23:00:00"))!.id).toBe("ict1");
    expect(nextAssessment(course, ja("2026-10-13T00:01:00"))!.id).toBe("ict2");
    expect(nextAssessment(course, ja("2026-12-16T00:01:00"))).toBeUndefined();
  });
  it("filters by concept scope", () => {
    expect(nextAssessment(course, ja("2026-09-26T12:00:00"), "a.y")!.id).toBe("ict2");
    expect(nextAssessment(course, ja("2026-09-26T12:00:00"), "a.z")!.id).toBe("finals");
    expect(nextAssessment(course, ja("2026-10-13T08:00:00"), "a.x")!.id).toBe("finals");
  });
  it("counts whole days, 0 on the day", () => {
    const ict1 = course.assessments[1]!;
    expect(daysUntil(ict1, ja("2026-09-26T12:00:00"))).toBe(16);
    expect(daysUntil(ict1, ja("2026-10-12T20:00:00"))).toBe(0);
    expect(daysUntil(course.assessments[2]!, ja("2026-10-13T00:01:00"))).toBe(34);
  });
  it("reads degrees as a unit", () => {
    expect(parseQuantity("71.57 °")).toEqual({ value: 71.57, dim: "°" });
  });
});
