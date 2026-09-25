"use client";

import { Fragment, type ReactNode } from "react";
import { Tex } from "./Tex";

/**
 * Lesson prose markup:
 *   $…$            inline maths (KaTeX)
 *   {{flux|text}}  semantic term span (charge | field | flux | surface | confirmed)
 *   **bold**, *italic*
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

function renderPart(p: string): ReactNode {
  if (p.startsWith("$") && p.endsWith("$") && p.length > 2) return <Tex latex={p.slice(1, -1)} />;
  const sem = /^\{\{(\w+)\|(.+)\}\}$/.exec(p);
  if (sem) return <span className={`sem-${sem[1]}`}>{sem[2]}</span>;
  if (p.startsWith("**") && p.endsWith("**")) return <strong>{p.slice(2, -2)}</strong>;
  if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em>{p.slice(1, -1)}</em>;
  return p;
}
