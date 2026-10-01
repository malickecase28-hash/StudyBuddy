"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Anchor } from "@/lib/commons/anchor";
import { sb, useMe } from "@/lib/commons/client";
import {
  addPost, createThread, deletePost, hideItem, listPosts, markAnswer, replies, reportItem, when, type Post, type Thread,
} from "@/lib/commons/data";
import { PostBody } from "./Post";

const KIND = { question: "Question", discussion: "Discussion", room: "Room" } as const;
export const threadHref = (t: Pick<Thread, "id" | "kind">) => (t.kind === "room" ? `/commons/r/${t.id}` : `/commons/t/${t.id}`);

export function ThreadList({ threads, empty }: { threads: Thread[]; empty: string }) {
  if (threads.length === 0) return <p className="text-sm text-soft">{empty}</p>;
  return (
    <ul className="space-y-2">
      {threads.map((t) => (
        <li key={t.id} className="card space-y-1">
          <p className="label">{KIND[t.kind]}{t.answer_post_id ? " · Answered" : ""}{t.anchor ? ` · ${t.anchor.label}` : ""}</p>
          <Link className="font-semibold underline" href={threadHref(t)}>{t.title}</Link>
          <p className="text-xs text-faint">{t.author?.display_name ?? "Someone"} · {when(t.last_post_at)} · {replies(t)} {replies(t) === 1 ? "reply" : "replies"}</p>
        </li>
      ))}
    </ul>
  );
}

export function AskForm({ anchor }: { anchor: Anchor | null }) {
  const router = useRouter();
  const [kind, setKind] = useState<"question" | "discussion">("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      router.push(`/commons/t/${await createThread(kind, title, body, anchor)}`);
    } catch {
      setMsg("That didn't post. Titles need 3 to 140 characters.");
    }
  };
  return (
    <form onSubmit={submit} className="card space-y-3">
      <fieldset role="radiogroup" aria-label="Kind" className="flex gap-4 text-sm">
        {(["question", "discussion"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2">
            <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} /> {KIND[k]}
          </label>
        ))}
      </fieldset>
      <label className="block text-sm font-medium">Title
        <input className="input mt-1 w-full" required minLength={3} maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block text-sm font-medium">Details
        <textarea className="input mt-1 min-h-28 w-full" maxLength={8000} value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="Say what you tried. $…$ for maths. Paste a Forma link to point at a step." />
      </label>
      <button className="btn btn-primary">{kind === "question" ? "Ask" : "Start the discussion"}</button>
      {msg && <p className="fb fb-again text-sm" role="alert">{msg}</p>}
    </form>
  );
}

/** Posts under a thread or room, live, with the reply box. */
export function ThreadPosts({ thread, onThreadChange, compact = false }: { thread: Thread; onThreadChange?: () => void; compact?: boolean }) {
  const me = useMe();
  const uid = me.session?.user.id;
  const [posts, setPosts] = useState<Post[]>([]);
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const load = useCallback(() => void listPosts(thread.id).then(setPosts, () => setMsg("Couldn't load the replies.")), [thread.id]);
  useEffect(() => {
    load();
    const ch = sb()
      .channel(`posts:${thread.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts", filter: `thread_id=eq.${thread.id}` }, load)
      .subscribe();
    return () => void sb().removeChannel(ch);
  }, [thread.id, load]);
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await addPost(thread.id, body);
      setBody("");
      setMsg("");
    } catch {
      setMsg("That didn't send. Try again.");
    }
  };
  const act = (fn: () => PromiseLike<unknown>) => async () => {
    await fn();
    load();
    onThreadChange?.();
  };
  const report = (id: string) => async () => {
    const reason = window.prompt("What's wrong with this post?");
    if (reason !== null) await reportItem("post", id, reason);
  };
  return (
    <section className="space-y-3" aria-label={compact ? "Room chat" : "Replies"}>
      {posts.map((p) => {
        const answer = thread.answer_post_id === p.id;
        return (
          <article key={p.id} className="card space-y-2" style={answer ? { borderColor: "var(--sem-field)" } : undefined}>
            <p className="label">{answer ? "Answer · " : ""}{p.author?.display_name ?? "Someone"} · {when(p.created_at)}{p.hidden ? " · Hidden" : ""}</p>
            <PostBody text={p.body} />
            <div className="flex flex-wrap gap-2 text-xs">
              {thread.kind === "question" && thread.author_id === uid && (
                <button className="underline" onClick={act(() => markAnswer(thread.id, answer ? null : p.id))}>{answer ? "Unmark the answer" : "Mark as the answer"}</button>
              )}
              {p.author_id === uid ? (
                <button className="underline" onClick={act(() => deletePost(p.id))}>Delete</button>
              ) : (
                <button className="underline" onClick={report(p.id)}>Report</button>
              )}
              {me.owner && !p.hidden && <button className="underline" onClick={act(() => hideItem("post", p.id))}>Hide</button>}
            </div>
          </article>
        );
      })}
      <form onSubmit={send} className="space-y-2">
        <label className="block text-sm font-medium">{compact ? "Message" : "Your reply"}
          <textarea className="input mt-1 min-h-20 w-full" maxLength={8000} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <button className="btn btn-primary">{compact ? "Send" : "Post reply"}</button>
        {msg && <p className="fb fb-again text-sm" role="alert">{msg}</p>}
      </form>
    </section>
  );
}
