"use client";

import { plates, registry } from "@forma/course-em1";
import { createEvaluator, frameAt } from "@forma/plate";
import { useMemo } from "react";
import { PlateStage } from "./PlateStage";

/** A read-only plate at one step: the real model output, not a picture. */
export function PlateThumb({ plateId, step, label }: { plateId: string; step: number; label: string }) {
  const plate = plates[plateId]!;
  const timeline = useMemo(() => frameAt(plate, step), [plate, step]);
  const frame = useMemo(() => createEvaluator(registry, plate.instances)(timeline.state), [plate, timeline]);
  return (
    <div className="plate-thumb" inert>
      <PlateStage plate={plate} timeline={timeline} frame={frame} label={label} />
    </div>
  );
}
