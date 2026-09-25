import { course } from "@studybuddy/course-em1";
import { Suspense } from "react";
import { LessonScreen } from "@/components/screens/LessonScreen";

/** Every lesson is pre-rendered, so the whole workspace can be served as static files. */
export function generateStaticParams() {
  return course.concepts.flatMap((c) => c.lessons.map((l) => ({ concept: c.id, lesson: l.id })));
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ concept: string; lesson: string }> }) {
  const { concept, lesson } = await params;
  return (
    <Suspense>
      <LessonScreen conceptId={decodeURIComponent(concept)} lessonId={decodeURIComponent(lesson)} />
    </Suspense>
  );
}
