"use client";

import { migrate } from "@forma/engine";
import { create } from "zustand";
import { useStudy } from "./store";

/**
 * One account for malickecase.com and Forma. The session cookie belongs to malickecase.com and is shared with its
 * subdomains, so Forma asks that site who is signed in and keeps the learner's progress there (/api/forma/state).
 * Sync: a device signing in to an account for the first time takes the account's copy (if it has one); after that,
 * the newer copy wins on sign-in, and every change is saved to the account a few seconds later. Ink notebooks stay
 * on the device.
 */
export const ACCOUNT_ORIGIN = process.env.NEXT_PUBLIC_ACCOUNT_ORIGIN ?? "https://malickecase.com";
export const signInHref = () => `${ACCOUNT_ORIGIN}/signin?next=${encodeURIComponent(typeof window === "undefined" ? "https://forma.malickecase.com/" : window.location.href)}`;
export const accountHref = () => `${ACCOUNT_ORIGIN}/account?next=${encodeURIComponent(typeof window === "undefined" ? "https://forma.malickecase.com/" : window.location.href)}`;

export type AccountUser = { email: string; name?: string; picture?: string | null };
type Sync = "idle" | "saving" | "saved" | "error";

const LOCAL_AT = "forma:progress-updated";
const SYNCED = "forma:synced-account";
const syncedWith = () => { try { return localStorage.getItem(SYNCED); } catch { return null; } };
const markSynced = (email: string) => { try { localStorage.setItem(SYNCED, email); } catch { /* private mode */ } };
const readLocalAt = () => { try { return Number(localStorage.getItem(LOCAL_AT)) || 0; } catch { return 0; } };
const writeLocalAt = (t: number) => { try { localStorage.setItem(LOCAL_AT, String(t)); } catch { /* private mode */ } };

const api = (path: string, init: RequestInit = {}) =>
  fetch(`${ACCOUNT_ORIGIN}${path}`, { ...init, credentials: "include", signal: AbortSignal.timeout(8000), headers: { "Content-Type": "application/json", ...init.headers } });

export const useAccount = create<{
  status: "loading" | "in" | "out";
  user: AccountUser | null;
  sync: Sync;
  start: () => Promise<void>;
  signOut: () => Promise<void>;
}>((set, get) => ({
  status: "loading",
  user: null,
  sync: "idle",
  start: async () => {
    if (get().status !== "loading") return;
    try {
      const me = (await (await api("/api/auth/me")).json()) as { ok: boolean; user?: AccountUser };
      if (!me.ok || !me.user) { set({ status: "out" }); return; }
      set({ status: "in", user: me.user });
      await pullThenPush(me.user.email);
    } catch {
      set({ status: "out" });
    }
  },
  signOut: async () => {
    try { await api("/api/auth/logout", { method: "POST", body: "{}" }); } catch { /* offline: the cookie expires on its own */ }
    set({ status: "out", user: null, sync: "idle" });
  },
}));

let applyingRemote = false;
let pulling = false; // no auto-save until the sign-in pull has decided which copy wins
let timer: ReturnType<typeof setTimeout> | undefined;

async function push(): Promise<void> {
  if (useAccount.getState().status !== "in") return;
  const at = readLocalAt() || Date.now();
  useAccount.setState({ sync: "saving" });
  try {
    const res = await api("/api/forma/state", { method: "PUT", body: JSON.stringify({ state: useStudy.getState().learner, updatedAt: at }) });
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
    const res = await api("/api/forma/state");
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
