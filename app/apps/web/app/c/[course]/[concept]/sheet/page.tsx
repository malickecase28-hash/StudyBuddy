import { course } from "@forma/course-em1";
import { RevisionSheet } from "@/components/plate/RevisionSheet";

export function generateStaticParams() {
  return course.concepts.filter((c) => !c.locked).map((c) => ({ course: course.id, concept: c.id }));
}
export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ concept: string }> }) {
  const { concept } = await params;
  return <RevisionSheet conceptId={decodeURIComponent(concept)} />;
}
