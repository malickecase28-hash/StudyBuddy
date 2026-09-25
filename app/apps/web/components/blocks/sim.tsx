"use client";

import { GaussLabConfig, LAB_CHECKS, type LabState } from "@studybuddy/course-em1";
import type { Block } from "@studybuddy/engine";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStudy } from "@/lib/store";
import { Markup } from "../Markup";
import { Feedback } from "./Feedback";
import type { BlockCtx } from "./types";

const GaussLab = dynamic(() => import("../lab/GaussLab"), { ssr: false, loading: () => <LabPlaceholder /> });
const SurfaceElementLab = dynamic(() => import("../lab/SurfaceElementLab"), { ssr: false, loading: () => <LabPlaceholder /> });

function LabPlaceholder() {
  return <div className="flex h-[380px] items-center justify-center rounded-xl border border-line bg-sunken text-sm text-soft">Loading the lab…</div>;
}

type SimBlock = Extract<Block, { type: "sim-3d" | "sim-2d" | "manipulate" }>;

/** Simulation and manipulation blocks. A manipulate goal completes when its check function passes. */
export function SimView({ block, ctx }: { block: SimBlock; ctx: BlockCtx }) {
  const addNote = useStudy((s) => s.addNote);
  const [achieved, setAchieved] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [saved, setSaved] = useState(false);
  const config = useMemo(() => (block.scene === "gauss-lab" ? GaussLabConfig.parse(block.config) : null), [block]);
  const start = useRef<LabState | null>(config ? { charges: config.charges, surface: config.surface } : null);
  const isGoal = block.type === "manipulate";

  useEffect(() => {
    if (!isGoal) ctx.onDone();
  }, [isGoal, ctx]);

  const onChange = useCallback(
    (s: LabState) => {
      if (!isGoal || achieved || !start.current) return;
      const check = LAB_CHECKS[(block as Extract<Block, { type: "manipulate" }>).check];
      if (check?.(s, start.current)) {
        setAchieved(true);
        ctx.onAnswer({ block, dimensions: [(block as Extract<Block, { type: "manipulate" }>).dimension], correct: true, attempt: 1 });
        ctx.onDone();
      }
    },
    [isGoal, achieved, block, ctx],
  );

  const freeze = (s: LabState) => {
    addNote({
      conceptId: ctx.conceptId,
      kind: "sim-state",
      title: `Lab state: ${s.charges.map((c) => `${c.q > 0 ? "+" : "−"}${Math.abs(c.q)} µC`).join(", ")}${s.surface ? ` in a ${s.surface.kind}` : ""}`,
      body: block.type === "manipulate" ? block.goal : block.caption,
      simState: { scene: block.scene, config: { ...block.config, charges: s.charges, surface: s.surface } },
    });
    setSaved(true);
  };

  return (
    <div className="space-y-2">
      {isGoal && (
        <p className="read font-medium">
          <span className="label mr-2">Try it</span>
          <Markup text={(block as Extract<Block, { type: "manipulate" }>).goal} />
        </p>
      )}
      {config ? (
        <GaussLab config={config} onChange={onChange} onFreeze={freeze} />
      ) : block.scene === "faraday-apparatus" ? (
        <FaradayApparatus />
      ) : block.scene === "surface-element" ? (
        <SurfaceElementLab config={block.config as { tilt?: number; d?: number }} />
      ) : (
        <p className="text-sm text-soft">Unknown simulation scene “{block.scene}”.</p>
      )}
      {"caption" in block && <p className="text-sm text-soft">{block.caption}</p>}
      {saved && <p className="text-xs text-faint">Saved to your notebook. Clicking it there restores this exact setup.</p>}
      {isGoal && achieved && <Feedback correct text="There it is: you've seen it for yourself." />}
      {isGoal && !achieved && !skipped && (
        <button
          className="text-xs text-faint underline"
          onClick={() => {
            setSkipped(true);
            ctx.onDone();
          }}
        >
          Skip this experiment
        </button>
      )}
    </div>
  );
}

function FaradayApparatus() {
  const materials = ["Air", "Glass", "Sulphur", "Shellac"] as const;
  const [material, setMaterial] = useState<(typeof materials)[number]>("Air");
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#10282b] text-[#f4faf8]">
      <div className="grid items-center gap-4 p-5 md:grid-cols-[minmax(0,1fr)_190px] md:p-7">
        <div>
          <p className="label !text-[#94d4cc]">Faraday / 1837</p>
          <h2 className="mt-2 text-xl font-semibold">One charge. Four materials. One measurement.</h2>
          <svg viewBox="0 0 480 300" className="mt-3 w-full" role="img" aria-label={`A charged inner ball surrounded by ${material.toLowerCase()} and an outer metal sphere, connected to a meter whose result is hidden until you predict`}>
            <defs><radialGradient id="faraday-medium"><stop stopColor="#0a5b61" stopOpacity=".3"/><stop offset="1" stopColor={material === "Air" ? "#274b52" : material === "Glass" ? "#416583" : material === "Sulphur" ? "#887041" : "#7f5464"} stopOpacity=".85"/></radialGradient></defs>
            <circle cx="222" cy="150" r="128" fill="url(#faraday-medium)" stroke="#b7d8d3" strokeWidth="13"/>
            <circle cx="222" cy="150" r="43" fill="#df7778" stroke="#ffe0d7" strokeWidth="2"/>
            <text x="222" y="161" textAnchor="middle" fill="#10282b" fontSize="30" fontWeight="700">+Q</text>
            <path d="M350 150h62v-48" fill="none" stroke="#b7d8d3" strokeWidth="2"/>
            <rect x="382" y="46" width="64" height="57" rx="10" fill="#eaf3ef"/>
            <text x="414" y="86" textAnchor="middle" fill="#103236" fontSize="31" fontWeight="600">?</text>
            <text x="222" y="296" textAnchor="middle" fill="#9ac5bf" fontSize="14">OUTER METAL SPHERE</text>
          </svg>
        </div>
        <div className="rounded-xl border border-[#3e6668] bg-[#1d3a3e] p-4">
          <p className="label !text-[#94d4cc]">Change the medium</p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-1">
            {materials.map((m) => <button key={m} onClick={() => setMaterial(m)} aria-pressed={material === m} className="rounded-lg border border-[#517173] px-3 py-2 text-left text-sm hover:bg-[#31585b] aria-pressed:bg-[#d3eee7] aria-pressed:text-[#10282b]">{m}</button>)}
          </div>
          <p className="mt-4 text-xs leading-5 text-[#bad2cd]">The inner charge stays +Q. The meter result is yours to predict next.</p>
        </div>
      </div>
    </div>
  );
}
