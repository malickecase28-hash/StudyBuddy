"use client";

import type { AskInput } from "@forma/plate";
import { Tex } from "../Tex";
import { Markup } from "@/components/Markup";

export function AsksList({ asks, open, onOpen }: { asks: AskInput[]; open: string | null; onOpen: (id: string | null) => void }) {
  const current = asks.find((a) => a.id === open);
  return (
    <section className="asks space-y-2" aria-labelledby="asks-title">
      {current ? (
        <div className="ask-open card space-y-2" role="region" aria-label={current.q}>
          <p className="kicker">Question students ask</p>
          <h3 className="text-lg">{current.q}</h3>
          <p className="margin-body">{current.a}</p>
          <button className="btn text-sm" onClick={() => onOpen(null)}>Back to the step</button>
        </div>
      ) : (
        <details>
          <summary id="asks-title">Questions students ask ({asks.length})</summary>
          <ul className="mt-2 space-y-1">
            {asks.map((a) => (
              <li key={a.id}>
                <button className="text-left underline" onClick={() => onOpen(a.id)}>{a.q}</button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function TrapNote({ text }: { text: string }) {
  return (
    <div className="fb fb-again text-sm" role="note">
      <strong>Trap.</strong> {text}
    </div>
  );
}

export function WorkedLines({ title, lines }: { title: string; lines: { text: string; latex?: string }[] }) {
  return (
    <div className="card space-y-2" role="region" aria-label={title}>
      <p className="kicker">{title}</p>
      <ol className="list-decimal space-y-1 pl-5">
        {lines.map((l, i) => (
          <li key={i}>
            <Markup text={l.text} />
            {l.latex && <Tex latex={l.latex} display />}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RecapCard({ title, points, traps }: { title: string; points: string[]; traps: string[] }) {
  return (
    <section className="recap-card card space-y-2" aria-label={`Recap: ${title}`}>
      <p className="kicker">Recap</p>
      <h3 className="text-lg">{title}</h3>
      <ul className="list-disc space-y-1 pl-5">{points.map((p, i) => <li key={i}>{p}</li>)}</ul>
      {traps.length > 0 && (
        <>
          <p className="label">Traps</p>
          <ul className="list-disc space-y-1 pl-5">{traps.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </>
      )}
    </section>
  );
}

/** Note body for a recap card (the note's title already names the idea). */
export const recapMarkdown = (points: string[], traps: string[]) =>
  [...points.map((p) => `- ${p}`), ...(traps.length ? ["", "Traps:", ...traps.map((t) => `- ${t}`)] : [])].join("\n");
