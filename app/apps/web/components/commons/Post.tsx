"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Markup } from "@/components/Markup";
import { getConcept, questionBank } from "@/lib/course";
import { anchorHref, anchorKey, anchorParam, type Anchor } from "@/lib/commons/anchor";
import { commonsEnabled, useMe } from "@/lib/commons/client";
import { countAt } from "@/lib/commons/data";

// A Forma course link, absolute or relative: /c/<course>/<concept>?lesson=…&block=…&step=…
const REF = /((?:https?:\/\/[^\s/]+)?\/c\/[a-z0-9-]+\/[a-z0-9.%-]+(?:\?[\w=&%.-]*)?)/g;

/** User text: lesson markup plus course-link chips. Text nodes and KaTeX only; \htmlClass is stripped. */
export function PostBody({ text }: { text: string }) {
  let safe = text;
  // Loop: one pass would turn "\html\htmlClassClass" back into "\htmlClass".
  while (safe.includes("\\htmlClass")) safe = safe.replaceAll("\\htmlClass", "");
  const parts = safe.split(REF);
  return (
    <div className="read whitespace-pre-wrap">
      {parts.map((p, i) => (i % 2 ? <RefChip key={i} raw={p} /> : <Markup key={i} text={p} />))}
    </div>
  );
}

function RefChip({ raw }: { raw: string }) {
  const u = new URL(raw, "https://forma.invalid");
  const concept = getConcept(decodeURIComponent(u.pathname.split("/")[3] ?? ""));
  if (!concept) return <>{raw}</>;
  const step = u.searchParams.get("step");
  return (
    <Link className="ref-chip" href={u.pathname + u.search}>
      {concept.title}{step && /^\d+$/.test(step) ? ` §${Number(step) + 1}` : ""}
    </Link>
  );
}

/** The place in the course a thread or room is about. */
export function AnchorCard({ anchor }: { anchor: Anchor }) {
  const href = anchorHref(anchor);
  const bank = anchor.bankItemId ? questionBank.find((q) => q.id === anchor.bankItemId) : undefined;
  return (
    <div className="card space-y-2">
      <p className="label">About</p>
      {href ? <Link className="ref-chip" href={href}>{anchor.label}</Link> : <span>{anchor.label}</span>}
      {bank && <p className="read text-sm">{bank.text}</p>}
    </div>
  );
}

/** "Discuss" on a plate step or bank question. Renders nothing while Commons is off. */
export function DiscussLink({ anchor }: { anchor: Anchor }) {
  const member = useMe((s) => s.member);
  const [n, setN] = useState(0);
  const key = anchorKey(anchor);
  useEffect(() => {
    if (!commonsEnabled || !member) return;
    void countAt(key).then(setN, () => setN(0));
  }, [key, member]);
  if (!commonsEnabled) return null;
  return <Link className="btn" href={`/commons?${anchorParam(anchor)}`}>Discuss{n ? ` (${n})` : ""}</Link>;
}
