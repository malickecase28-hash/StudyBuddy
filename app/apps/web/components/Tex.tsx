"use client";

import katex from "katex";
import { useMemo } from "react";

/** KaTeX renderer. `trust` allows only \htmlClass, used for semantic term colouring. */
export function Tex({ latex, display = false, className }: { latex: string; display?: boolean; className?: string }) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        trust: (ctx) => ctx.command === "\\htmlClass",
        strict: "ignore",
      }),
    [latex, display],
  );
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
