import Link from "next/link";
import { courses, course } from "@/lib/course";

export const metadata = { title: "Library" };

export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <p className="kicker">Library</p>
      <h1 className="text-4xl">Courses</h1>
      {courses.filter((k) => k.concepts.some((c) => !c.locked)).map((k) => (
        <Link key={k.id} href={`/c/${k.id}`} className="card block space-y-1 hover:bg-sunken">
          <p className="label">{k.id === course.id ? k.code : `Prerequisite · ${k.code}`}</p>
          <h2 className="text-2xl">{k.title}</h2>
          <p className="text-soft">
            {k.concepts.filter((c) => !c.locked).length} concepts open
            {k.id === course.id ? ` · final exam ${k.examDate}` : " · the maths Electromagnetics leans on"}
          </p>
        </Link>
      ))}
    </div>
  );
}
