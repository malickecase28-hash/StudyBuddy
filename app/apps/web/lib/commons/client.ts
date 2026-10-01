import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect } from "react";
import { create } from "zustand";
import { course } from "@/lib/course";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Commons needs a Supabase project. Without one (or with NEXT_PUBLIC_COMMONS=off) it stays switched off. */
export const commonsEnabled = Boolean(url && key) && process.env.NEXT_PUBLIC_COMMONS !== "off";
export const COURSE_ID = course.id;

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!commonsEnabled) throw new Error("Commons is not configured");
  return (client ??= createClient(url!, key!));
}

type Me = { session: Session | null; name: string | null; member: boolean; owner: boolean; ready: boolean };

export const useMe = create<Me & { refresh: () => Promise<void> }>((set) => ({
  session: null, name: null, member: false, owner: false, ready: false,
  refresh: async () => {
    const { data: { session } } = await sb().auth.getSession();
    if (!session) return set({ session: null, name: null, member: false, owner: false, ready: true });
    const uid = session.user.id;
    const [{ data: p }, { data: m }] = await Promise.all([
      sb().from("profiles").select("display_name").eq("id", uid).maybeSingle(),
      sb().from("course_members").select("role").eq("course_id", COURSE_ID).eq("user_id", uid).maybeSingle(),
    ]);
    set({ session, name: p?.display_name ?? null, member: Boolean(m), owner: m?.role === "owner", ready: true });
  },
}));

/** Mounted once in Providers: keeps useMe in step with sign-in and sign-out. */
export function useMeSync() {
  const refresh = useMe((s) => s.refresh);
  useEffect(() => {
    if (!commonsEnabled) return;
    void refresh();
    // Supabase calls inside onAuthStateChange can deadlock; defer them.
    const { data } = sb().auth.onAuthStateChange(() => void setTimeout(() => void refresh(), 0));
    return () => data.subscription.unsubscribe();
  }, [refresh]);
}

/** POST to the battle route with the caller's access token. */
export async function battleApi<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const { data } = await sb().auth.getSession();
  const r = await fetch("/api/battle", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  const out = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(out.error ?? "Something went wrong. Try again.");
  return out;
}
