"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CommonsGate } from "@/components/commons/Gate";
import { AnchorCard, PostBody } from "@/components/commons/Post";
import { ThreadPosts } from "@/components/commons/Threads";
import { parseAnchor } from "@/lib/commons/anchor";
import { useMe } from "@/lib/commons/client";
import { deleteThread, getThread, hideItem, reportItem, when, type Thread } from "@/lib/commons/data";

export default function ThreadPage() {
  return (
    <CommonsGate>
      <ThreadView id={useParams<{ id: string }>().id} />
    </CommonsGate>
  );
}

function ThreadView({ id }: { id: string }) {
  const router = useRouter();
  const me = useMe();
  const [t, setT] = useState<Thread | null | undefined>(undefined);
  const load = useCallback(() => void getThread(id).then(setT, () => setT(null)), [id]);
  useEffect(load, [load]);
  if (t === undefined) return <p className="p-8 text-soft">Opening the thread…</p>;
  if (t === null) return <p className="p-8">This thread is gone, or it isn&apos;t open to you. <Link className="underline" href="/commons">Back to Commons</Link></p>;
  const anchor = parseAnchor(t.anchor);
  const mine = t.author_id === me.session?.user.id;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link className="text-sm underline" href="/commons">← Commons</Link>
      <div className="space-y-2">
        <p className="label">{t.kind === "question" ? "Question" : "Discussion"} · {t.author?.display_name ?? "Someone"} · {when(t.created_at)}{t.hidden ? " · Hidden" : ""}</p>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        {t.body && <PostBody text={t.body} />}
        <div className="flex flex-wrap gap-2 text-xs">
          {mine ? (
            <button className="underline" onClick={async () => { await deleteThread(t.id); router.push("/commons"); }}>Delete this thread</button>
          ) : (
            <button className="underline" onClick={async () => { const r = window.prompt("What's wrong with this thread?"); if (r !== null) await reportItem("thread", t.id, r); }}>Report</button>
          )}
          {me.owner && !t.hidden && <button className="underline" onClick={async () => { await hideItem("thread", t.id); load(); }}>Hide</button>}
        </div>
      </div>
      {anchor && <AnchorCard anchor={anchor} />}
      <ThreadPosts thread={t} onThreadChange={load} />
    </div>
  );
}
