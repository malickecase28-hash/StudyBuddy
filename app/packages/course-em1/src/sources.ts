import type { Licence, Mood, Source } from "@studybuddy/engine";

export const SLIDES = "UTech ELE3001 Unit 2b slides (G. D. Boswell)";
export const SLIDES_2A = "UTech ELE3001 Unit 2a slides (G. D. Boswell)";
export const WENT = "Wentworth, Fundamentals of Electromagnetics with Engineering Applications (2006)";
export const HAYT = "Hayt & Buck, Engineering Electromagnetics";
export const F2425 = "UTech ELE3001 Finals 2024-25 Sem 1";
export const F2324 = "UTech ELE3001 Finals 2023-24 Sem 1";
export const ORIGINAL = "StudyBuddy original";

export const src = (doc: string, locator: string): Source => ({ doc, locator });

/** Block metadata: mood + source + licence. Original content uses licence "original". */
export const meta = (mood: Mood, source: Source, licence: Licence = source.doc === ORIGINAL ? "original" : "restricted") => ({
  mood,
  source,
  licence,
});

export const orig = (locator = "authored for this slice") => src(ORIGINAL, locator);
