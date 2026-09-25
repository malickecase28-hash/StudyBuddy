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
