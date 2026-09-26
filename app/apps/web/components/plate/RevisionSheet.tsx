"use client";

import Link from "next/link";
import { conceptHref, getConcept, ideaMetaFor } from "@/lib/course";
import { RecapCard } from "./idea";

export function RevisionSheet({ conceptId }: { conceptId: string }) {
  const concept = getConcept(conceptId);
  const ideas = (concept?.lessons ?? []).flatMap((l) => l.blocks.flatMap((b) => (b.type === "plate" ? ideaMetaFor(b.plateId)?.ideas ?? [] : [])));
  return (
    <article className="revision-sheet mx-auto max-w-3xl space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="kicker">Revision sheet</p>
          <h1 className="text-3xl">{concept?.title ?? "Unknown concept"}</h1>
        </div>
        <button className="btn print:hidden" onClick={() => window.print()}>Print</button>
      </header>
      {ideas.length ? ideas.map((x) => <RecapCard key={x.id} title={x.title} points={x.recap.points} traps={x.recap.traps} />) : <p className="text-soft">This concept has no in-depth ideas yet.</p>}
      <Link className="underline print:hidden" href={conceptHref(conceptId, "learn")}>Back to the concept</Link>
    </article>
  );
}
