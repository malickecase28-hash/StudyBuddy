"use client";

import { migrate } from "@forma/engine";
import { create } from "zustand";
import { useStudy } from "./store";

/**
 * Forma's own accounts (pages /signin and /account, API /api/account/* and /api/state on this site). The user store
 * is shared with malickecase.com's journal, so the same email and password work on both.
 * Sync: a device signing in to an account for the first time takes the account's copy (if it has one); after that,
 * the newer copy wins on sign-in, and every change is saved to the account a few seconds later. Ink notebooks stay
 * on the device.
 */
const here = () => (typeof window === "undefined" ? "/" : window.location.pathname + window.location.search);
export const signInHref = () => `/signin?next=${encodeURIComponent(here())}`;
export const accountHref = () => "/account";

export type AccountUser = { email: string; name?: string; picture?: string | null; hasPassword?: boolean };
type Result = { ok: boolean; error?: string; user?: AccountUser };
type Sync = "idle" | "saving" | "saved" | "error";

const LOCAL_AT = "forma:progress-updated";
const SYNCED = "forma:synced-account";
const syncedWith = () => { try { return localStorage.getItem(SYNCED); } catch { return null; } };
const markSynced = (email: string) => { try { localStorage.setItem(SYNCED, email); } catch { /* private mode */ } };
const readLocalAt = () => { try { return Number(localStorage.getItem(LOCAL_AT)) || 0; } catch { return 0; } };
const writeLocalAt = (t: number) => { try { localStorage.setItem(LOCAL_AT, String(t)); } catch { /* private mode */ } };

const api = (path: string, init: RequestInit = {}) =>
  fetch(path, { ...init, credentials: "same-origin", signal: AbortSignal.timeout(15000), headers: { "Content-Type": "application/json", ...init.headers } });
const post = async (action: string, body: object): Promise<Result> => {
  try { return (await (await api(`/api/account/${action}`, { method: "POST", body: JSON.stringify(body) })).json()) as Result; }
  catch { return { ok: false, error: "Couldn't reach Forma. Check your connection and try again." }; }
};

export const useAccount = create<{
  status: "loading" | "in" | "out";
  user: AccountUser | null;
  sync: Sync;
  start: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (name: string, email: string, password: string) => Promise<Result>;
  rename: (name: string) => Promise<Result>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<Result>;
  deleteAccount: (password: string) => Promise<Result>;
}>((set, get) => ({
  status: "loading",
  user: null,
  sync: "idle",
  start: async () => {
    if (get().status !== "loading") return;
    try {
      const me = (await (await api("/api/account/me")).json()) as Result;
      if (!me.ok || !me.user) { set({ status: "out" }); return; }
      set({ status: "in", user: me.user });
      await pullThenPush(me.user.email);
    } catch {
      set({ status: "out" });
    }
  },
  signOut: async () => {
    await post("logout", {});
    set({ status: "out", user: null, sync: "idle" });
  },
  signIn: async (email, password) => signedIn(await post("login", { email, password })),
  signUp: async (name, email, password) => signedIn(await post("signup", { name, email, password })),
  rename: async (name) => { const r = await post("profile", { name }); if (r.ok && r.user) set({ user: r.user }); return r; },
  changePassword: (currentPassword, newPassword) => post("password", { currentPassword, newPassword }),
  deleteAccount: async (password) => { const r = await post("delete", { password, confirm: "DELETE" }); if (r.ok) set({ status: "out", user: null, sync: "idle" }); return r; },
}));

async function signedIn(r: Result): Promise<Result> {
  if (r.ok && r.user) {
    useAccount.setState({ status: "in", user: r.user });
    await pullThenPush(r.user.email);
  }
  return r;
}

let applyingRemote = false;
let pulling = false; // no auto-save until the sign-in pull has decided which copy wins
let timer: ReturnType<typeof setTimeout> | undefined;

async function push(): Promise<void> {
  if (useAccount.getState().status !== "in") return;
  const at = readLocalAt() || Date.now();
  useAccount.setState({ sync: "saving" });
  try {
    const res = await api("/api/state", { method: "PUT", body: JSON.stringify({ state: useStudy.getState().learner, updatedAt: at }) });
    if (res.status === 401) { useAccount.setState({ status: "out", user: null, sync: "idle" }); return; }
    useAccount.setState({ sync: res.ok ? "saved" : "error" });
  } catch {
    useAccount.setState({ sync: "error" });
  }
}

/** On sign-in: take the account's copy if this device never synced with it or the copy is newer; else send this device's up. */
async function pullThenPush(email: string): Promise<void> {
  pulling = true;
  try { await pullOrPush(email); } finally { pulling = false; }
}

async function pullOrPush(email: string): Promise<void> {
  await waitForHydration();
  try {
    const res = await api("/api/state");
    const body = (await res.json()) as { ok: boolean; state?: unknown; updatedAt?: number };
    if (body.ok && body.state && (syncedWith() !== email || (body.updatedAt ?? 0) > readLocalAt())) {
      const { state, reset } = migrate(body.state);
      if (!reset) {
        applyingRemote = true;
        useStudy.setState({ learner: state });
        applyingRemote = false;
        writeLocalAt(body.updatedAt ?? Date.now());
        markSynced(email);
        useAccount.setState({ sync: "saved" });
        return;
      }
    }
  } catch {
    useAccount.setState({ sync: "error" });
    return;
  }
  await push();
  if (useAccount.getState().sync === "saved") markSynced(email);
}

function waitForHydration(): Promise<void> {
  if (useStudy.getState().hydrated) return Promise.resolve();
  return new Promise((ok) => { const off = useStudy.subscribe((s) => { if (s.hydrated) { off(); ok(); } }); });
}

// Every local change stamps the time; signed in, it is saved to the account 3 s after the last change.
if (typeof window !== "undefined") {
  useStudy.subscribe((s, prev) => {
    if (!s.hydrated || s.learner === prev.learner || !prev.hydrated || applyingRemote) return;
    writeLocalAt(Date.now());
    if (useAccount.getState().status !== "in" || pulling) return;
    clearTimeout(timer);
    timer = setTimeout(() => void push(), 3000);
  });
}
