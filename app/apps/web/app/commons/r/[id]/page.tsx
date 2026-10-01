"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CommonsGate } from "@/components/commons/Gate";
import { AnchorCard } from "@/components/commons/Post";
import { SharedPaper } from "@/components/commons/SharedPaper";
import { ThreadPosts } from "@/components/commons/Threads";
import { parseAnchor } from "@/lib/commons/anchor";
import { useMe } from "@/lib/commons/client";
import { getThread, type Thread } from "@/lib/commons/data";

export default function RoomPage() {
  return (
    <CommonsGate>
      <Room id={useParams<{ id: string }>().id} />
    </CommonsGate>
  );
}

function Room({ id }: { id: string }) {
  const me = useMe();
  const [t, setT] = useState<Thread | null | undefined>(undefined);
  const [people, setPeople] = useState<string[]>([]);
  const load = useCallback(() => void getThread(id).then(setT, () => setT(null)), [id]);
  useEffect(load, [load]);
  if (t === undefined) return <p className="p-8 text-soft">Opening the room…</p>;
  if (t === null || t.kind !== "room") return <p className="p-8">This room is gone, or it isn&apos;t open to you. <Link className="underline" href="/commons">Back to Commons</Link></p>;
  const anchor = parseAnchor(t.anchor);
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link className="text-sm underline" href="/commons">← Commons</Link>
      <div>
        <p className="label">Room</p>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-soft">In the room: {people.length ? people.join(", ") : "just you"}.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SharedPaper roomId={t.id} me={{ id: me.session!.user.id, name: me.name ?? "Someone" }} onPeople={setPeople} />
        <aside className="space-y-4">
          {anchor && <AnchorCard anchor={anchor} />}
          <ThreadPosts thread={t} onThreadChange={load} compact />
        </aside>
      </div>
    </div>
  );
}
