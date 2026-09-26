"use client";

import { getLesson, isPlateLesson } from "@/lib/course";
import type { WorkspaceParams } from "@/lib/workspace";
import { PlatePlayer } from "../plate/PlatePlayer";
import { LessonPlayer } from "../player/LessonPlayer";

export function LearnMode({ conceptId, p, split, onSplit }: { conceptId: string; p: WorkspaceParams; split: number; onSplit: (r: number) => void }) {
  const lesson = getLesson(conceptId, p.lessonId)!;
  if (isPlateLesson(lesson))
    return (
      <PlatePlayer
        key={`${p.lessonId}:${p.snapshotId ?? ""}`} conceptId={conceptId} lessonId={p.lessonId} split={split} onSplit={onSplit}
        {...(p.returnTo ? { returnTo: p.returnTo } : {})} {...(p.snapshotId ? { snapshotId: p.snapshotId } : {})}
        {...(p.step !== undefined ? { initialStep: p.step } : {})} {...(p.blockId ? { initialBlock: p.blockId } : {})}
      />
    );
  return (
    <div className="space-y-4">
      <p className="text-sm text-soft">This concept hasn&apos;t been rebuilt as a living plate yet, so it opens as a classic lesson.</p>
      <LessonPlayer conceptId={conceptId} lessonId={p.lessonId} {...(p.returnTo ? { returnTo: p.returnTo } : {})} />
    </div>
  );
}
