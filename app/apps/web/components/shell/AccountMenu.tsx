"use client";

import { useEffect, useRef } from "react";
import { accountHref, signInHref, useAccount } from "@/lib/account";

const SYNC: Record<string, string> = { idle: "Progress saves to your account", saving: "Saving to your account…", saved: "Progress saved to your account", error: "Couldn't reach your account; saved on this device" };

/** Top bar: "Sign in" (one account with malickecase.com), or the signed-in name with sync status, account and sign-out. */
export function AccountMenu() {
  const { status, user, sync, start, signOut } = useAccount();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => { void start(); }, [start]);

  if (status !== "in" || !user) {
    return <a className="btn" href={signInHref()} onClick={(e) => { e.currentTarget.href = signInHref(); }}>Sign in</a>;
  }
  const name = user.name || user.email;
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <details ref={menu} className="relative">
      <summary className="btn list-none" aria-label={`Account: ${name}`}>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ink)] text-[0.7rem] font-semibold text-[var(--paper)]" aria-hidden>{initials}</span>
        <span className="topbar-wide max-w-[10rem] truncate">{name}</span>
      </summary>
      <div className="absolute right-0 z-50 mt-1 w-64 space-y-2 rounded border border-[var(--grid)] bg-[var(--paper-2)] p-3 text-sm shadow-sm" role="menu">
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-soft">{user.email}</p>
        </div>
        <p className="text-xs text-soft" role="status">{SYNC[sync]}</p>
        <a role="menuitem" className="btn w-full justify-start" href={accountHref()}>Manage account</a>
        <button role="menuitem" className="btn w-full justify-start" onClick={() => { if (menu.current) menu.current.open = false; void signOut(); }}>Sign out</button>
      </div>
    </details>
  );
}
