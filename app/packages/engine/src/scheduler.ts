export const DAY_MS = 86_400_000;
export type Review = { due: number; intervalDays: number };

export function nextReview(prev: Review | undefined, correct: boolean, now: number, examDate?: number): Review {
  let interval = !correct ? 1 : prev ? Math.min(prev.intervalDays * 2, 60) : 1;
  if (examDate !== undefined) {
    const daysToExam = (examDate - now) / DAY_MS;
    if (daysToExam > 0 && daysToExam <= 21) interval = Math.min(interval, Math.max(1, Math.floor(daysToExam / 2)));
  }
  return { due: now + interval * DAY_MS, intervalDays: interval };
}
