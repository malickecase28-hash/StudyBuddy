"use client";

import { ConceptMap } from "@/components/map/ConceptMap";

export default function MapPage() {
  return (
    <div className="space-y-3">
      <div>
        <p className="label">Concept map</p>
        <h1 className="text-2xl font-semibold">How the ideas depend on each other</h1>
        <p className="text-sm text-soft">
          Left to right: each concept builds on the ones pointing into it. Rings show mastery; a blue border marks refreshers on your route.
          Click any open concept to study it.
        </p>
      </div>
      <ConceptMap />
    </div>
  );
}
