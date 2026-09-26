import Link from "next/link";
import { course } from "@/lib/course";

export const metadata = { title: "Library" };

export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <p className="kicker">Library</p>
      <h1 className="text-4xl">Courses</h1>
      <Link href={`/c/${course.id}`} className="card block space-y-1 hover:bg-sunken">
        <p className="label">{course.code}</p>
        <h2 className="text-2xl">{course.title}</h2>
        <p className="text-soft">{course.concepts.filter((c) => !c.locked).length} concepts open · finals {course.examDate}</p>
      </Link>
    </div>
  );
}
