"use client";

import { useParams } from "next/navigation";
import { InkEditor } from "@/components/ink/InkEditor";

export default function InkPage() {
  const { notebook, page } = useParams<{ notebook: string; page: string }>();
  return <InkEditor notebookId={decodeURIComponent(notebook)} pageId={decodeURIComponent(page)} />;
}
