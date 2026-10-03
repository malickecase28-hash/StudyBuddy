import {
  clearCookie, currentUser, getUser, hashPassword, json, kv, normalise, publicUser, putUser, readJson, sessionCookie,
  signSession, stateKey, unavailable, userKey, verifyPassword,
} from "@/lib/server/auth";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ action: string }> };

/** GET /api/account/me: the signed-in user, or { ok: false }. */
export async function GET(req: Request, { params }: Ctx) {
  if ((await params).action !== "me") return json({ ok: false }, 404);
  const store = await kv();
  if (!store) return json({ ok: false, unavailable: true });
  const user = await currentUser(store, req);
  return json(user ? { ok: true, user: publicUser(user) } : { ok: false });
}

/** POST /api/account/{signup|login|logout|profile|password|delete} */
export async function POST(req: Request, { params }: Ctx) {
  const action = (await params).action;
  if (action === "logout") return json({ ok: true }, 200, clearCookie());
  const store = await kv();
  if (!store) return unavailable();
  const body = await readJson(req);

  if (action === "signup") {
    const email = normalise(body.email), password = String(body.password ?? ""), name = String(body.name ?? "").trim().slice(0, 80);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "Enter a valid email address." }, 400);
    if (password.length < 8) return json({ ok: false, error: "Use at least 8 characters for your password." }, 400);
    if (!name) return json({ ok: false, error: "Please enter your name." }, 400);
    if (await getUser(store, email)) return json({ ok: false, error: "That email already has an account. Sign in instead." }, 409);
    const user = { email, name, passwordHash: await hashPassword(password), provider: "password", role: "member", createdAt: new Date().toISOString() };
    await putUser(store, user);
    return json({ ok: true, user: publicUser(user) }, 200, sessionCookie(await signSession(store, email)));
  }

  if (action === "login") {
    const user = await getUser(store, normalise(body.email));
    if (!user?.passwordHash || !(await verifyPassword(String(body.password ?? ""), user.passwordHash))) {
      return json({ ok: false, error: user && !user.passwordHash ? "This account signs in with Google on malickecase.com. Set a password there first." : "Incorrect email or password." }, 401);
    }
    return json({ ok: true, user: publicUser(user) }, 200, sessionCookie(await signSession(store, user.email)));
  }

  const user = await currentUser(store, req);
  if (!user) return json({ ok: false, error: "Please sign in again." }, 401);

  if (action === "profile") {
    const name = String(body.name ?? "").trim().slice(0, 80);
    if (!name) return json({ ok: false, error: "Please enter a name." }, 400);
    const updated = { ...user, name, updatedAt: new Date().toISOString() };
    await putUser(store, updated);
    return json({ ok: true, user: publicUser(updated) });
  }

  if (action === "password") {
    const next = String(body.newPassword ?? "");
    if (next.length < 8) return json({ ok: false, error: "Use at least 8 characters." }, 400);
    if (user.passwordHash && !(await verifyPassword(String(body.currentPassword ?? ""), user.passwordHash))) {
      return json({ ok: false, error: "Your current password is not right." }, 401);
    }
    await putUser(store, { ...user, passwordHash: await hashPassword(next), updatedAt: new Date().toISOString() });
    return json({ ok: true });
  }

  if (action === "delete") {
    if (body.confirm !== "DELETE") return json({ ok: false, error: "Type DELETE to confirm." }, 400);
    if (user.passwordHash && !(await verifyPassword(String(body.password ?? ""), user.passwordHash))) {
      return json({ ok: false, error: "Your password is not right." }, 401);
    }
    await store.delete(userKey(user.email));
    await store.delete(stateKey(user.email));
    return json({ ok: true }, 200, clearCookie());
  }

  return json({ ok: false }, 404);
}
