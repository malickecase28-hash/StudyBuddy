import { anchorKey, type Anchor } from "./anchor";
import { COURSE_ID, sb } from "./client";

export type Author = { display_name: string } | null;
export type ThreadKind = "question" | "discussion" | "room";
export type Thread = {
  id: string; kind: ThreadKind; anchor: Anchor | null; anchor_key: string | null; title: string; body: string;
  author_id: string; answer_post_id: string | null; hidden: boolean; created_at: string; last_post_at: string;
  author: Author; posts?: { count: number }[];
};
export type Post = { id: string; thread_id: string; author_id: string; body: string; hidden: boolean; created_at: string; author: Author };

// posts!posts_thread_fk: threads and posts are linked twice (thread_id, answer_post_id), so name the one we mean.
const THREAD = "*, author:profiles(display_name), posts!posts_thread_fk(count)";

export async function listThreads(kinds: ThreadKind[], key?: string): Promise<Thread[]> {
  let q = sb().from("threads").select(THREAD).eq("course_id", COURSE_ID).in("kind", kinds).order("last_post_at", { ascending: false }).limit(30);
  if (key) q = q.eq("anchor_key", key);
  const { data, error } = await q;
  if (error) throw error;
  return data as Thread[];
}

export async function getThread(id: string): Promise<Thread | null> {
  const { data } = await sb().from("threads").select(THREAD).eq("id", id).maybeSingle();
  return (data as Thread | null) ?? null;
}

export async function listPosts(threadId: string): Promise<Post[]> {
  const { data, error } = await sb().from("posts").select("*, author:profiles(display_name)").eq("thread_id", threadId).order("created_at");
  if (error) throw error;
  return data as Post[];
}

export async function createThread(kind: ThreadKind, title: string, body: string, anchor: Anchor | null): Promise<string> {
  const { data, error } = await sb()
    .from("threads")
    .insert({ course_id: COURSE_ID, kind, title: title.trim(), body: body.trim(), anchor, anchor_key: anchor ? anchorKey(anchor) : null })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function createRoom(title: string, anchor: Anchor | null): Promise<string> {
  const id = await createThread("room", title, "", anchor);
  const { error } = await sb().from("rooms").insert({ thread_id: id });
  if (error) throw error;
  return id;
}

export const addPost = async (threadId: string, body: string) => {
  const { error } = await sb().from("posts").insert({ thread_id: threadId, body: body.trim() });
  if (error) throw error;
};
export const markAnswer = (threadId: string, postId: string | null) => sb().from("threads").update({ answer_post_id: postId }).eq("id", threadId);
export const deletePost = (id: string) => sb().from("posts").delete().eq("id", id);
export const deleteThread = (id: string) => sb().from("threads").delete().eq("id", id);
export const hideItem = (kind: "thread" | "post", id: string) => sb().rpc("hide_item", { p_kind: kind, p_id: id });
export const reportItem = (kind: "thread" | "post", id: string, reason: string) =>
  sb().from("reports").insert({ course_id: COURSE_ID, target_kind: kind, target_id: id, reason: reason.slice(0, 500) });

export async function countAt(key: string): Promise<number> {
  const { count } = await sb().from("threads").select("id", { count: "exact", head: true }).eq("course_id", COURSE_ID).eq("anchor_key", key);
  return count ?? 0;
}

export const replies = (t: Thread) => t.posts?.[0]?.count ?? 0;
export const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
