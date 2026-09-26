"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { formatValue } from "./format";

export function Readout({ label, value, unit, digits = 4, tone }: { label: string; value: number | null; unit: string; digits?: number; tone?: "charge" | "field" | "flux" | "surface" }) {
  return (
    <div className="readout" data-tone={tone}>
      <span className="readout-label">{label}</span>
      <output className="readout-value">
        {formatValue(value, digits)}
        {value !== null && Number.isFinite(value) && <span className="readout-unit"> {unit}</span>}
      </output>
      {(value === null || !Number.isFinite(value)) && <span className="sr-only">undefined at this point</span>}
    </div>
  );
}

export function TitleBlock({ cells }: { cells: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="title-block">
      {cells.map((c) => (
        <div key={c.label}>
          <dt>{c.label}</dt>
          <dd>{c.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MarginNote({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="margin-note" aria-label={title}>
      <p className="kicker">{kicker}</p>
      <h2>{title}</h2>
      <div className="margin-body">{children}</div>
    </section>
  );
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  const move = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = options[(i + d + options.length) % options.length]!;
    onChange(next[0]);
    ((e.currentTarget.parentElement?.children[(i + d + options.length) % options.length]) as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="segmented">
      {options.map(([v, l], i) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} tabIndex={value === v ? 0 : -1} onClick={() => onChange(v)} onKeyDown={(e) => move(e, i)}>
          {l}
        </button>
      ))}
    </div>
  );
}

/** Scrub bar: a native range (continuous, keyboard-operable) plus § ticks. Positions past `lock` are unreachable. */
export function Timeline({ steps, pos, lock, playing, onScrub, onTogglePlay }: { steps: { id: string; title: string }[]; pos: number; lock: number; playing: boolean; onScrub: (pos: number) => void; onTogglePlay: () => void }) {
  const i = Math.min(Math.round(pos), steps.length - 1);
  return (
    <div className="timeline">
      <button type="button" className="btn" onClick={onTogglePlay} aria-label={playing ? "Pause" : "Play to the next step"}>
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="timeline-track">
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          step="any"
          value={pos}
          aria-label="Lesson timeline"
          aria-valuetext={`§${i + 1} of ${steps.length}: ${steps[i]?.title ?? ""}`}
          onChange={(e) => onScrub(Math.min(Number(e.target.value), lock))}
        />
        <ol className="timeline-ticks">
          {steps.map((s, k) => (
            <li key={s.id}>
              <button type="button" disabled={k > lock} aria-current={k === i ? "step" : undefined} onClick={() => onScrub(k)}>
                §{k + 1}
                <span className="sr-only"> {s.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
