import { describe, expect, it } from "vitest";
import { DAY_MS, nextReview } from "../src";

const now = Date.UTC(2026, 8, 25);

describe("nextReview", () => {
  it("starts at 1 day and doubles on success, capped at 60", () => {
    let r = nextReview(undefined, true, now);
    expect(r.intervalDays).toBe(1);
    r = nextReview(r, true, now);
    expect(r.intervalDays).toBe(2);
    r = nextReview({ due: now, intervalDays: 40 }, true, now);
    expect(r.intervalDays).toBe(60);
    expect(r.due).toBe(now + 60 * DAY_MS);
  });
  it("resets to 1 day on a miss", () => {
    expect(nextReview({ due: now, intervalDays: 16 }, false, now).intervalDays).toBe(1);
  });
  it("compresses intervals when the exam is within 21 days", () => {
    const exam = now + 10 * DAY_MS;
    expect(nextReview({ due: now, intervalDays: 16 }, true, now, exam).intervalDays).toBe(5);
    const farExam = now + 90 * DAY_MS;
    expect(nextReview({ due: now, intervalDays: 16 }, true, now, farExam).intervalDays).toBe(32);
  });
});
