"use client";

import { Fragment, type ReactNode } from "react";
import { proseMath } from "@/lib/prose-math";
import { Tex } from "./Tex";

/**
 * Lesson prose markup:
 *   $…$            inline maths (KaTeX)
 *   {{flux|text}}  semantic term span (charge | field | flux | surface | confirmed)
 *   **bold**, *italic*
 * Plain text between those gets proper maths typography (subscripts, superscripts, unit vectors): see proseMath.
 */
const TOKEN = /(\$[^$]+\$|\{\{(?:charge|field|flux|surface|confirmed)\|[^}]+\}\}|\*\*[^*]+\*\*|\*[^*]+\*)/g;

export function Markup({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter((p) => p !== "");
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{renderPart(p)}</Fragment>
      ))}
    </>
  );
}

/** Plain text with maths typography. */
export function Prose({ text }: { text: string }) {
  return (
    <>
      {proseMath(text).map((t, i) =>
        t.kind === "text" ? <Fragment key={i}>{t.s}</Fragment>
        : t.kind === "uv" ? <span key={i} className="uv"><b>a</b><sub>{t.s}</sub></span>
        : t.kind === "sub" ? <Fragment key={i}>{t.base}<sub>{t.s}</sub></Fragment>
        : <Fragment key={i}>{t.base}<sup>{t.s}</sup></Fragment>,
      )}
    </>
  );
}

function renderPart(p: string): ReactNode {
  if (p.startsWith("$") && p.endsWith("$") && p.length > 2) return <Tex latex={p.slice(1, -1)} />;
  const sem = /^\{\{(\w+)\|(.+)\}\}$/.exec(p);
  if (sem) return <span className={`sem-${sem[1]}`}><Prose text={sem[2]!} /></span>;
  if (p.startsWith("**") && p.endsWith("**")) return <strong><Prose text={p.slice(2, -2)} /></strong>;
  if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em><Prose text={p.slice(1, -1)} /></em>;
  return <Prose text={p} />;
}
