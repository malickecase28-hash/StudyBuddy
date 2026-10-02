import { courses } from "@/lib/course";
import { Suspense } from "react";
import { ConceptWorkspace } from "@/components/workspace/ConceptWorkspace";

export function generateStaticParams() {
  return courses.flatMap((k) => k.concepts.filter((c) => !c.locked).map((c) => ({ course: k.id, concept: c.id })));
}
export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ concept: string }> }) {
  const { concept } = await params;
  return (
    <Suspense>
      <ConceptWorkspace conceptId={decodeURIComponent(concept)} />
    </Suspense>
  );
}
