import type { Licence, Mood, Source } from "@forma/engine";

export const SLIDES = "Course notes, Unit 2b";
export const SLIDES_2A = "Course notes, Unit 2a";
export const WENT = "Wentworth, Fundamentals of Electromagnetics with Engineering Applications (2006)";
export const HAYT = "Hayt & Buck, Engineering Electromagnetics";
export const F2425 = "Exam-style question";
export const F2324 = "Exam-style question";
export const ORIGINAL = "Forma original";

export const src = (doc: string, locator: string): Source => ({ doc, locator });

/** Block metadata: mood + source + licence. All teaching text is written in our own words; the source is a citation. */
export const meta = (mood: Mood, source: Source, licence: Licence = "original") => ({
  mood,
  source,
  licence,
});

export const orig = (locator = "authored for this slice") => src(ORIGINAL, locator);
