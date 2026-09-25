"use client";

import Link from "next/link";
import { RetrievalQuiz } from "@/components/screens/RetrievalQuiz";

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="label">Spaced review</p>
      <h1 className="text-2xl font-semibold">Recall, don't reread</h1>
      <p className="read text-soft">
        These come back on a schedule. Each correct recall pushes the next review further out; a miss brings it back tomorrow. With the exam close,
        intervals tighten automatically.
      </p>
      <RetrievalQuiz count={5} />
      <Link href="/" className="btn">
        Back home
      </Link>
    </div>
  );
}
