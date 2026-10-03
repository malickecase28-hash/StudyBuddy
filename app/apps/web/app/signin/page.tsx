"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";

/** Only paths on this site: "/c/em1/…". Anything else goes to the Desk. */
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

export default function SignInPage() {
  const router = useRouter();
  const { status, start, signIn, signUp } = useAccount();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/");

  useEffect(() => { setNext(safeNext(new URLSearchParams(window.location.search).get("next"))); void start(); }, [start]);
  useEffect(() => { if (status === "in") router.replace(next); }, [status, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const r = mode === "in" ? await signIn(email, password) : await signUp(name, email, password);
    setBusy(false);
    if (!r.ok) setError(r.error ?? "Something went wrong. Try again.");
  };

  return (
    <div className="mx-auto max-w-sm space-y-5 py-6">
      <div>
        <p className="label">Forma account</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{mode === "in" ? "Sign in" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-soft">Your progress follows you to any device. The same account works on malickecase.com.</p>
      </div>
      <div role="tablist" aria-label="Sign in or create an account" className="segmented w-full">
        <button type="button" role="tab" aria-selected={mode === "in"} className="flex-1" onClick={() => { setMode("in"); setError(""); }}>Sign in</button>
        <button type="button" role="tab" aria-selected={mode === "up"} className="flex-1" onClick={() => { setMode("up"); setError(""); }}>Create account</button>
      </div>
      <form className="card space-y-3" onSubmit={submit}>
        {mode === "up" && (
          <label className="block text-sm">Your name
            <input className="input mt-1 w-full" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={80} />
          </label>
        )}
        <label className="block text-sm">Email
          <input className="input mt-1 w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="block text-sm">Password
          <input className="input mt-1 w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={mode === "up" ? 8 : undefined} required />
        </label>
        {mode === "up" && <p className="text-xs text-soft">At least 8 characters.</p>}
        {error && <p role="alert" className="text-sm text-[var(--charge-text)]">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}</button>
      </form>
      <p className="text-center text-sm text-soft"><Link className="underline" href={next}>Continue without an account</Link> · progress then stays on this device.</p>
    </div>
  );
}
