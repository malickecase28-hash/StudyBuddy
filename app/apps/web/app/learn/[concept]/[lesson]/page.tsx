import { LessonScreen } from "@/components/screens/LessonScreen";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ concept: string; lesson: string }>;
  searchParams: Promise<{ return?: string; resume?: string }>;
}) {
  const { concept, lesson } = await params;
  const { return: returnTo, resume } = await searchParams;
  const conceptId = decodeURIComponent(concept);
  const lessonId = decodeURIComponent(lesson);
  return (
    <LessonScreen
      key={`${conceptId}/${lessonId}/${resume ?? ""}`}
      conceptId={conceptId}
      lessonId={lessonId}
      {...(returnTo ? { returnTo } : {})}
      {...(resume ? { resumeBlockId: resume } : {})}
    />
  );
}
