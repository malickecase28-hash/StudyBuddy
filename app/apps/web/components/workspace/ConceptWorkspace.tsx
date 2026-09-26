"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { course, getConcept } from "@/lib/course";
import { useStudy } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { parseWorkspaceParams } from "@/lib/workspace";
import { ExploreMode } from "./ExploreMode";
import { LearnMode } from "./LearnMode";
import { ReviseMode } from "./ReviseMode";
import { SolveMode } from "./SolveMode";

export function ConceptWorkspace({ conceptId }: { conceptId: string }) {
  const search = useSearchParams();
  const learner = useStudy((s) => s.learner);
  const setLayout = useStudy((s) => s.setLayout);
  const setActive = useUi((s) => s.setActiveConcept);
  const setWorkspaceMode = useUi((s) => s.setWorkspaceMode);
  const concept = getConcept(conceptId);
  const p = concept ? parseWorkspaceParams(search, concept, learner) : null;
  useEffect(() => {
    setActive(conceptId);
    return () => setActive(null);
  }, [conceptId, setActive]);
  useEffect(() => {
    setWorkspaceMode(p?.mode ?? null);
    return () => setWorkspaceMode(null);
  }, [p?.mode, setWorkspaceMode]);
  useEffect(() => {
    if (p && learner.workspace.lastMode !== p.mode) setLayout(p.mode, {});
  }, [p?.mode, learner.workspace.lastMode, setLayout, p]);
  if (!concept || !p || concept.locked)
    return (
      <div className="card">
        That concept isn&apos;t open yet. <Link className="underline" href={`/c/${course.id}`}>Back to the course</Link>
      </div>
    );
  const layout = learner.workspace.layouts[p.mode];
  const onSplit = (split: number) => setLayout(p.mode, { split });
  return (
    <div className="workspace space-y-4" data-mode={p.mode}>
      <header>
        <p className="kicker">Unit {concept.unit} · {course.title}</p>
        <h1 className="text-3xl">{concept.title}</h1>
      </header>
      {p.mode === "learn" && <LearnMode conceptId={conceptId} p={p} split={layout.split} onSplit={onSplit} />}
      {p.mode === "solve" && <SolveMode conceptId={conceptId} split={layout.split} onSplit={onSplit} pinned={layout.pinned} />}
      {p.mode === "explore" && <ExploreMode conceptId={conceptId} />}
      {p.mode === "revise" && <ReviseMode conceptId={conceptId} split={layout.split} onSplit={onSplit} />}
    </div>
  );
}
