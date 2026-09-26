"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { WorkingPaper } from "@/components/paper/WorkingPaper";

function Paper() {
  const search = useSearchParams();
  return <WorkingPaper {...(search.get("concept") ? { conceptId: search.get("concept")! } : {})} {...(search.get("note") ? { noteId: search.get("note")! } : {})} />;
}

export default function PaperPage() {
  return <Suspense fallback={<p className="p-8 text-soft">Opening working paper…</p>}><Paper /></Suspense>;
}
