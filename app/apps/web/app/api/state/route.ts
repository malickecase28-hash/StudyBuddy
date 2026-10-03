import { currentUser, json, kv, stateKey, unavailable } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
const MAX = 2_000_000;

/** GET: the signed-in learner's saved progress { ok, state, updatedAt }. */
export async function GET(req: Request) {
  const store = await kv();
  if (!store) return unavailable();
  const user = await currentUser(store, req);
  if (!user) return json({ ok: false, error: "signed-out" }, 401);
  const raw = await store.get(stateKey(user.email));
  const saved = raw ? (JSON.parse(raw) as { state: unknown; updatedAt: number }) : null;
  return json({ ok: true, state: saved?.state ?? null, updatedAt: saved?.updatedAt ?? 0 });
}

/** PUT { state, updatedAt }: save progress to the account. */
export async function PUT(req: Request) {
  const store = await kv();
  if (!store) return unavailable();
  const user = await currentUser(store, req);
  if (!user) return json({ ok: false, error: "signed-out" }, 401);
  const text = await req.text();
  if (text.length > MAX) return json({ ok: false, error: "too-large" }, 413);
  let body: { state?: unknown; updatedAt?: unknown };
  try { body = JSON.parse(text); } catch { return json({ ok: false, error: "bad-json" }, 400); }
  if (!body.state || typeof body.state !== "object") return json({ ok: false, error: "no-state" }, 400);
  const updatedAt = Number(body.updatedAt) || Date.now();
  await store.put(stateKey(user.email), JSON.stringify({ state: body.state, updatedAt }));
  return json({ ok: true, updatedAt });
}
