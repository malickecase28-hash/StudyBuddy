"use client";

import { checks, labs, registry, type Lab } from "@forma/course-em1";
import { applyOverrides, createEvaluator, frameAt, stateAt, type Frame, type Overrides } from "@forma/plate";
import { Segmented } from "@forma/ui";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStudy } from "@/lib/store";
import { PlateStage } from "../plate/PlateStage";
import { PlateReadouts } from "../plate/Readouts";

export function ExploreMode({ conceptId }: { conceptId: string }) {
  const lab = labs[conceptId];
  if (!lab) return <p className="card">No living lab for this concept yet. <Link className="underline" href="/lab">Open the classic 3D lab →</Link></p>;
  return <LabBench lab={lab} conceptId={conceptId} />;
}

function LabBench({ lab, conceptId }: { lab: Lab; conceptId: string }) {
  const dispatch = useStudy((s) => s.dispatch);
  const evaluate = useMemo(() => createEvaluator(registry, lab.plate.instances), [lab]);
  const base = useMemo(() => stateAt(lab.plate, 0), [lab]);
  const start = useMemo(() => evaluate(base), [evaluate, base]);
  const [o, setO] = useState<Overrides>({});
  let frame: Frame;
  try {
    frame = evaluate(applyOverrides(base, o));
  } catch {
    frame = start;
  }
  const done = useRef(new Set<string>());
  const [, rerender] = useState(0);
  useEffect(() => {
    for (const e of lab.experiments)
      if (!done.current.has(e.id) && checks[e.check]?.(frame, start)) {
        done.current.add(e.id);
        dispatch({ type: "answer", conceptId, blockId: `${lab.plate.id}.${e.id}`, blockType: "plate", dimensions: ["application"], correct: true, attempt: 1 });
        rerender((n) => n + 1);
      }
  });
  const set = (id: string, params: Record<string, unknown>) => setO((x) => ({ ...x, [id]: { params: { ...x[id]?.params, ...params } } }));
  return (
    <div className="explore">
      <PlateStage plate={lab.plate} timeline={frameAt(lab.plate, 0)} frame={frame} editable={lab.plate.instances.map((i) => i.id)} onEdit={set} label={`${lab.plate.title}: free exploration`} />
      <aside className="instrument-panel space-y-5" aria-label="Instruments">
        <h2 className="text-xl">Instruments</h2>
        {lab.controls.map((c) => {
          const value = frame[c.instance]!.params[c.param];
          return c.kind === "slider" ? (
            <label key={`${c.instance}.${c.param}`} className="block space-y-1">
              <span className="label">{c.label}</span>
              <input type="range" className="w-full" aria-label={c.label} min={c.min} max={c.max} step={c.step} value={Number(value)} onChange={(e) => set(c.instance, { [c.param]: Number(e.target.value) })} />
              <output className="readout-value">{Number(value).toFixed(2)} {c.unit}</output>
            </label>
          ) : (
            <div key={`${c.instance}.${c.param}`} className="space-y-1">
              <span className="label">{c.label}</span>
              <Segmented label={c.label} value={String(value)} options={c.options} onChange={(v) => set(c.instance, { [c.param]: v })} />
            </div>
          );
        })}
        <PlateReadouts plate={lab.plate} frame={frame} />
        <button className="btn" onClick={() => setO({})}>Reset the bench</button>
        <h2 className="text-xl">Experiments</h2>
        <ul className="space-y-3">
          {lab.experiments.map((e) => (
            <li key={e.id} className="experiment card" data-done={done.current.has(e.id)}>
              <p className="kicker">{done.current.has(e.id) ? "✓ Done" : "To try"}</p>
              <h3>{e.title}</h3>
              <p className="text-sm">{e.goal}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
