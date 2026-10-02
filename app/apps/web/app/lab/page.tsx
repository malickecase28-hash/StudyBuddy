"use client";

import { GaussLabConfig, LAB_CHECKS, type LabState } from "@forma/course-em1";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useStudy } from "@/lib/store";
import { Markup } from "@/components/Markup";

const GaussLab = dynamic(() => import("@/components/lab/GaussLab"), { ssr: false });

const EXPLORE = GaussLabConfig.parse({
  charges: [
    { id: "a", q: 3, pos: [0, 0, 0], draggable: true },
    { id: "b", q: -2, pos: [0.4, 0, 0.4], draggable: true },
  ],
  surface: { kind: "sphere", radius: 1 },
  shapes: ["sphere", "cube", "blob"],
  resizable: true,
  show: { field: true, normals: false, contributions: true, readout: true },
  toggles: ["field", "normals", "contributions"],
  addCharge: true,
});

const EXPERIMENTS = [
  { title: "What counts as enclosed?", prompt: "Drag a charge outside the boundary. Watch its contribution to total flux disappear.", check: "outside-zero" },
  { title: "Does shape matter?", prompt: "Swap the sphere for a cube or uneven surface while a charge remains inside.", check: "shape-swap" },
  { title: "Does size matter?", prompt: "Grow or shrink the surface by at least 40% while keeping a charge inside.", check: "resize-constant" },
] as const;

export default function LabPage() {
  const addNote = useStudy((s) => s.addNote);
  const [state, setState] = useState<LabState>({ charges: EXPLORE.charges, surface: EXPLORE.surface });
  const onChange = useCallback((next: LabState) => setState(next), []);
  const [experiment, setExperiment] = useState(0);
  const current = EXPERIMENTS[experiment]!;
  const complete = LAB_CHECKS[current.check]!(state, { charges: EXPLORE.charges, surface: EXPLORE.surface });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className="label">Simulation lab / Electromagnetics I</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Electric flux workbench</h1>
        <p className="mt-2 max-w-3xl text-sm text-soft">Move charges, change their strength, and reshape the boundary. The model calculates the flux as you work. Start with an experiment or investigate your own question.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
        <GaussLab
          config={EXPLORE}
          onChange={onChange}
          onFreeze={(s) =>
            addNote({
              conceptId: "em1.electrostatics.gauss-law",
              kind: "sim-state",
              title: `Explore: ${s.charges.map((c) => `${c.q > 0 ? "+" : "−"}${Math.abs(c.q)} µC`).join(", ")}`,
              body: "Saved from Explore mode.",
              simState: { scene: "gauss-lab", config: { ...EXPLORE, charges: s.charges, surface: s.surface } },
            })
          }
        />
        <aside className="card h-fit" aria-label="Suggested experiments">
          <p className="label">Experiment cards</p>
          <div className="mt-4 space-y-1">
            {EXPERIMENTS.map((item, i) => <button key={item.check} onClick={() => setExperiment(i)} aria-pressed={experiment === i} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-sunken data-[on=true]:bg-sunken data-[on=true]:font-semibold" data-on={experiment === i}>{String(i + 1).padStart(2, "0")} · {item.title}</button>)}
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <h2 className="font-semibold">{current.title}</h2>
            <p className="mt-2 text-sm leading-6 text-soft"><Markup text={current.prompt} /></p>
            <p className={`mt-4 text-sm font-medium ${complete ? "text-confirmed" : "text-faint"}`} role="status">{complete ? "✓ You made it happen. Try another setup." : "Observe the flux readout as you change the model."}</p>
          </div>
          <Link href="/learn/em1.electrostatics.gauss-law/main" className="mt-5 inline-block text-sm underline">Learn the reasoning →</Link>
        </aside>
      </div>
    </div>
  );
}
