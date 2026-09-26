import { course } from "@forma/course-em1";
import { Suspense } from "react";
import { ConceptWorkspace } from "@/components/workspace/ConceptWorkspace";

export function generateStaticParams() {
  return course.concepts.filter((c) => !c.locked).map((c) => ({ course: course.id, concept: c.id }));
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
