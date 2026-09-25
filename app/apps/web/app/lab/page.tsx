"use client";

import { GaussLabConfig } from "@studybuddy/course-em1";
import dynamic from "next/dynamic";
import Link from "next/link";
import { conceptProgress } from "@/lib/progress";
import { useStudy } from "@/lib/store";

const GaussLab = dynamic(() => import("@/components/lab/GaussLab"), { ssr: false });

const EXPLORE = GaussLabConfig.parse({
  charges: [
    { id: "a", q: 3, pos: [0, 0, 0], draggable: true },
    { id: "b", q: -2, pos: [1.4, 0, 0.4], draggable: true },
  ],
  surface: { kind: "sphere", radius: 1 },
  shapes: ["sphere", "cube", "blob"],
  resizable: true,
  show: { field: true, normals: false, contributions: true, readout: true },
  toggles: ["field", "normals", "contributions"],
  addCharge: true,
});

/**
 * Explore mode: the same engine as the lessons, with the guided contract removed.
 * Opens once Gauss's law has been explored in Learn mode.
 */
export default function LabPage() {
  const learner = useStudy((s) => s.learner);
  const addNote = useStudy((s) => s.addNote);
  const { state } = conceptProgress(learner, "em1.electrostatics.gauss-law");
  const unlocked = !["NOT_STARTED", "INTRODUCED"].includes(state);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <p className="label">Explore mode</p>
        <h1 className="text-2xl font-semibold">The Gauss lab, no instructions</h1>
        <p className="read text-soft">
          Add charges, drag them in and out, swap the surface, stretch it. Try to break Gauss's law. (You won't.) Save anything interesting to
          your notebook.
        </p>
      </div>
      {unlocked ? (
        <GaussLab
          config={EXPLORE}
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
      ) : (
        <div className="fb fb-again">
          ↺ Explore mode opens once you've worked through the first part of Gauss's law in Learn mode, so the lab makes sense when you get here.{" "}
          <Link className="underline" href="/learn/em1.electrostatics.gauss-law/main">
            Start Gauss's law
          </Link>
        </div>
      )}
    </div>
  );
}
