import { expect, it } from "vitest";
import { answeredFromHistory } from "@/lib/playback";

it("recovers answered interactions for one plate from the event history", () => {
  const h = [
    { type: "answer", conceptId: "c", blockId: "gauss.flux-guess", blockType: "plate", dimensions: [], correct: false, attempt: 1, at: 1 },
    { type: "answer", conceptId: "c", blockId: "faraday.faraday-predict", blockType: "plate", dimensions: [], correct: true, attempt: 1, at: 2 },
    { type: "blockViewed", conceptId: "c", blockId: "gauss#charge", at: 3 },
  ] as const;
  expect([...answeredFromHistory(h as never, "gauss")]).toEqual(["flux-guess"]);
  expect([...answeredFromHistory([], "gauss")]).toEqual([]);
});
