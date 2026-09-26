import type { ReactNode } from "react";

export function generateStaticParams() {
  return [{ course: "em1" }];
}
export const dynamicParams = false;

export default function CourseLayout({ children }: { children: ReactNode }) {
  return children;
}
