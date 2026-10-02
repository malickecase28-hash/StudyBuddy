"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { getConcept } from "@/lib/course";
import { conceptNotebook, migrateWorkingPaper } from "@/lib/ink-migrate";

/** Old working-paper links: ?note= opens the migrated page, ?concept= that concept's notebook, otherwise Ink. */
function Redirect() {
  const search = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const note = search.get("note"), concept = search.get("concept");
    void (async () => {
      const done = await migrateWorkingPaper();
      if (note && done[note]) return router.replace(done[note]);
      if (concept && getConcept(concept)) {
        const nb = await conceptNotebook(concept);
        return router.replace(`/ink/${nb.id}/${nb.pageIds[nb.pageIds.length - 1]}`);
      }
      router.replace("/ink");
    })();
  }, [search, router]);
  return <p className="p-8 text-soft">Opening your working paper in Ink…</p>;
}

export default function PaperPage() {
  return <Suspense fallback={<p className="p-8 text-soft">Opening your working paper in Ink…</p>}><Redirect /></Suspense>;
}
