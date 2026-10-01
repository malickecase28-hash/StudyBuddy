import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** The caller, from the bearer token, with a service-role client. null when signed out. */
export async function caller(req: Request): Promise<{ db: SupabaseClient; uid: string } | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await db.auth.getUser(token);
  return data.user ? { db, uid: data.user.id } : null;
}

export const serverReady = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
