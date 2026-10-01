"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { AnchorCard } from "@/components/commons/Post";
import { AskForm, ThreadList } from "@/components/commons/Threads";
import { BattlesSection } from "@/components/commons/Battle";
import { CommonsGate } from "@/components/commons/Gate";
import { anchorKey, readAnchorParam, type Anchor } from "@/lib/commons/anchor";
import { sb, useMe } from "@/lib/commons/client";
import { createRoom, listThreads, type Thread } from "@/lib/commons/data";

export default function CommonsPage() {
  return (
    <Suspense>
      <CommonsGate>
        <Hub />
      </CommonsGate>
    </Suspense>
  );
}

function Hub() {
  const anchor = readAnchorParam(useSearchParams().get("a"));
  const name = useMe((s) => s.name);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [rooms, setRooms] = useState<Thread[]>([]);
  const [here, setHere] = useState<Thread[]>([]);
  const key = anchor ? anchorKey(anchor) : undefined;
  useEffect(() => {
    void listThreads(["question", "discussion"]).then(setThreads, () => setThreads([]));
    void listThreads(["room"]).then(setRooms, () => setRooms([]));
    if (key) void listThreads(["question", "discussion", "room"], key).then(setHere, () => setHere([]));
  }, [key]);
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="label">Commons</p>
        <h1 className="text-2xl font-semibold">Study together.</h1>
        <p className="read text-soft">Ask about any step, work a question together on shared paper, or race your classmates on exam-style questions.</p>
      </div>
      {anchor && (
        <section className="space-y-3" aria-label="Here">
          <AnchorCard anchor={anchor} />
          <ThreadList threads={here} empty="Nobody has asked about this yet." />
          <AskForm anchor={anchor} />
          <OpenRoom anchor={anchor} />
        </section>
      )}
      {!anchor && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Ask or discuss</h2>
          <AskForm anchor={null} />
        </section>
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Questions and discussions</h2>
        <ThreadList threads={threads} empty="No questions yet. Ask the first one." />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Rooms</h2>
        <p className="text-sm text-soft">A room is shared working paper with a chat. Everyone in it sees every stroke.</p>
        {!anchor && <OpenRoom anchor={null} />}
        <ThreadList threads={rooms} empty="No rooms open." />
      </section>
      <BattlesSection anchor={anchor} />
      <p className="text-xs text-faint">
        Signed in as {name}. <button className="underline" onClick={() => void sb().auth.signOut()}>Sign out</button>
      </p>
    </div>
  );
}

function OpenRoom({ anchor }: { anchor: Anchor | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(anchor ? `Working on ${anchor.label}` : "");
  const [msg, setMsg] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      router.push(`/commons/r/${await createRoom(title, anchor)}`);
    } catch {
      setMsg("The room didn't open. Titles need 3 to 140 characters.");
    }
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="block flex-1 text-sm font-medium">Room name
        <input className="input mt-1 w-full" required minLength={3} maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <button className="btn">Open a room</button>
      {msg && <p className="fb fb-again w-full text-sm" role="alert">{msg}</p>}
    </form>
  );
}
