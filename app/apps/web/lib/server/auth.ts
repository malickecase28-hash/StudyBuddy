import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Forma's own accounts. Users live in the same KV store as malickecase.com's journal (same record format), so one
 * email and password works on both; Forma keeps its own session cookie and sign-in pages. Zero deps: Web Crypto.
 */
type KV = { get(k: string): Promise<string | null>; put(k: string, v: string): Promise<void>; delete(k: string): Promise<void> };
export type UserRecord = { email: string; name?: string; passwordHash?: string; provider?: string; role?: string; picture?: string | null; createdAt?: string; updatedAt?: string };
export type PublicUser = Omit<UserRecord, "passwordHash"> & { hasPassword: boolean };

/** The USERS KV binding, or null outside Cloudflare (plain `next start`). */
export async function kv(): Promise<KV | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return ((env as unknown as { USERS?: KV }).USERS) ?? null;
  } catch {
    return null;
  }
}

const enc = new TextEncoder();
const dec = new TextDecoder();
const hex = (b: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (h: string) => Uint8Array.from(h.match(/../g) ?? [], (x) => parseInt(x, 16));
const b64u = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

// Passwords: PBKDF2-SHA256 stored as pbkdf2$<iter>$<salt>$<hash> (the journal's format; it may use more iterations).
const ITER = 100_000;
async function pbkdf2(password: string, salt: Uint8Array, iter: number, bytes: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: iter }, key, bytes * 8));
}
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITER}$${hex(salt)}$${hex(await pbkdf2(password, salt, ITER, 32))}`;
}
export async function verifyPassword(password: string, stored?: string) {
  if (!stored?.startsWith("pbkdf2$")) return false;
  const [, iter, salt, want] = stored.split("$");
  const expected = unhex(want ?? "");
  const got = await pbkdf2(password, unhex(salt ?? ""), Number(iter), expected.length);
  let diff = got.length ^ expected.length;
  for (let i = 0; i < got.length; i++) diff |= got[i]! ^ expected[i]!;
  return diff === 0;
}

// Session key: made once and kept in KV (shared with the journal), so nothing has to be pasted into a dashboard.
async function secret(store: KV) {
  let s = await store.get("meta:session-secret");
  if (!s) {
    s = hex(crypto.getRandomValues(new Uint8Array(48)));
    await store.put("meta:session-secret", s);
    s = (await store.get("meta:session-secret")) ?? s;
  }
  return s;
}
const hmac = async (store: KV) => crypto.subtle.importKey("raw", enc.encode(await secret(store)), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

const DAYS = 30;
export async function signSession(store: KV, email: string) {
  const now = Math.floor(Date.now() / 1000);
  const body = `${b64u(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))}.${b64u(enc.encode(JSON.stringify({ email, iat: now, exp: now + DAYS * 86400 })))}`;
  return `${body}.${b64u(await crypto.subtle.sign("HMAC", await hmac(store), enc.encode(body)))}`;
}
async function readSession(store: KV, token?: string): Promise<string | null> {
  const [h, p, s] = (token ?? "").split(".");
  if (!h || !p || !s) return null;
  try {
    if (!(await crypto.subtle.verify("HMAC", await hmac(store), unb64u(s) as BufferSource, enc.encode(`${h}.${p}`)))) return null;
    const claims = JSON.parse(dec.decode(unb64u(p))) as { email?: string; exp?: number };
    return claims.email && (claims.exp ?? 0) > Date.now() / 1000 ? claims.email : null;
  } catch {
    return null;
  }
}

export const COOKIE = "forma_session";
export const sessionCookie = (token: string) => `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS * 86400}`;
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export const normalise = (e: unknown) => String(e ?? "").trim().toLowerCase();
export const userKey = (email: string) => `user:${normalise(email)}`;
export const stateKey = (email: string) => `forma:state:${normalise(email)}`;
export async function getUser(store: KV, email: string): Promise<UserRecord | null> {
  const raw = await store.get(userKey(email));
  return raw ? (JSON.parse(raw) as UserRecord) : null;
}
export const putUser = (store: KV, u: UserRecord) => store.put(userKey(u.email), JSON.stringify(u));
export const publicUser = ({ passwordHash, ...rest }: UserRecord): PublicUser => ({ ...rest, hasPassword: !!passwordHash });

/** The signed-in user's record from the request's cookie. */
export async function currentUser(store: KV, req: Request): Promise<UserRecord | null> {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const email = await readSession(store, token);
  return email ? getUser(store, email) : null;
}

export const json = (body: unknown, status = 200, setCookie?: string) => {
  const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  if (setCookie) headers.append("Set-Cookie", setCookie);
  return new Response(JSON.stringify(body), { status, headers });
};
export const unavailable = () => json({ ok: false, error: "Accounts are not available here." }, 503);
export const readJson = async (req: Request) => (await req.json().catch(() => ({}))) as Record<string, unknown>;
