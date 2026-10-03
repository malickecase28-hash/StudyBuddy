"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";

const SYNC: Record<string, string> = { idle: "Your progress saves to this account.", saving: "Saving…", saved: "All progress saved to your account.", error: "Couldn't reach your account just now; progress is safe on this device and will save on your next change." };

export default function AccountPage() {
  const { status, user, sync, start, rename, changePassword, deleteAccount, signOut } = useAccount();
  const [name, setName] = useState("");
  const [nameNote, setNameNote] = useState("");
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [pwNote, setPwNote] = useState("");
  const [delPw, setDelPw] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [delNote, setDelNote] = useState("");

  useEffect(() => { void start(); }, [start]);
  // Fill the box once; never overwrite what the learner is typing.
  const [filled, setFilled] = useState(false);
  useEffect(() => { if (user && !filled) { setName(user.name ?? ""); setFilled(true); } }, [user, filled]);

  if (status === "loading") return <p className="text-sm text-soft">Loading your account…</p>;
  if (status !== "in" || !user) {
    return (
      <div className="mx-auto max-w-sm space-y-3 py-6">
        <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
        <p className="text-sm text-soft">You're not signed in.</p>
        <Link className="btn btn-primary" href="/signin?next=%2Faccount">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div>
        <p className="label">Forma account</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{user.name || user.email}</h1>
        <p className="mt-1 text-sm text-soft">{user.email}</p>
        <p className="mt-2 text-sm" role="status">{SYNC[sync]}</p>
      </div>

      <form className="card space-y-3" onSubmit={async (e) => { e.preventDefault(); const r = await rename(name); setNameNote(r.ok ? "Saved." : r.error ?? "Couldn't save."); }}>
        <h2 className="text-lg font-semibold">Your name</h2>
        <div className="flex gap-2">
          <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required aria-label="Your name" />
          <button className="btn btn-primary">Save</button>
        </div>
        {nameNote && <p className="text-sm text-soft" role="status">{nameNote}</p>}
      </form>

      <form className="card space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        const r = await changePassword(cur, nw);
        setPwNote(r.ok ? "Password changed." : r.error ?? "Couldn't change it.");
        if (r.ok) { setCur(""); setNw(""); }
      }}>
        <h2 className="text-lg font-semibold">{user.hasPassword === false ? "Set a password" : "Change password"}</h2>
        {user.hasPassword !== false && (
          <label className="block text-sm">Current password
            <input className="input mt-1 w-full" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required />
          </label>
        )}
        <label className="block text-sm">New password
          <input className="input mt-1 w-full" type="password" value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" minLength={8} required />
        </label>
        {pwNote && <p className="text-sm text-soft" role="status">{pwNote}</p>}
        <button className="btn btn-primary">{user.hasPassword === false ? "Set password" : "Change password"}</button>
      </form>

      <div className="flex gap-2">
        <button className="btn" onClick={() => void signOut()}>Sign out</button>
        <Link className="btn" href="/">Back to the Desk</Link>
      </div>

      <form className="card space-y-3 border-[var(--charge)]" onSubmit={async (e) => {
        e.preventDefault();
        if (delConfirm !== "DELETE") { setDelNote("Type DELETE to confirm."); return; }
        const r = await deleteAccount(delPw);
        if (!r.ok) setDelNote(r.error ?? "Couldn't delete the account.");
      }}>
        <h2 className="text-lg font-semibold">Delete account</h2>
        <p className="text-sm text-soft">This deletes your account and the progress saved to it, here and on malickecase.com. Progress on this device stays. It can't be undone.</p>
        {user.hasPassword !== false && <input className="input w-full" type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} placeholder="Your password" aria-label="Your password" autoComplete="current-password" />}
        <input className="input w-full" value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} placeholder="Type DELETE" aria-label="Type DELETE to confirm" />
        {delNote && <p className="text-sm text-[var(--charge-text)]" role="alert">{delNote}</p>}
        <button className="btn" style={{ background: "var(--charge)", color: "var(--paper)" }}>Delete my account</button>
      </form>
    </div>
  );
}
