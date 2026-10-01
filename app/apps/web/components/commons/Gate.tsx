"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { course } from "@/lib/course";
import { commonsEnabled, COURSE_ID, sb, useMe } from "@/lib/commons/client";

/** Commons pages render inside this: it handles "not set up", sign-in and joining the course. */
export function CommonsGate({ children }: { children: ReactNode }) {
  const me = useMe();
  if (!commonsEnabled)
    return (
      <div className="mx-auto max-w-md space-y-2">
        <p className="label">Commons</p>
        <h1 className="text-2xl font-semibold">Commons isn&apos;t set up on this copy of Forma.</h1>
        <p className="read text-soft">Your own study still works and saves on this device.</p>
      </div>
    );
  if (!me.ready) return <p className="p-8 text-soft">Opening Commons…</p>;
  if (!me.session) return <SignIn />;
  if (!me.name || !me.member) return <Join />;
  return <>{children}</>;
}

function Intro() {
  return (
    <div>
      <p className="label">Commons</p>
      <h1 className="text-2xl font-semibold">Study with your classmates.</h1>
      <p className="read text-soft">Ask about any step, work a question together, or race each other on exam-style questions.</p>
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const send = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await sb().auth.signInWithOtp({ email: email.trim() });
    if (error) setMsg(error.message);
    else { setSent(true); setMsg(""); }
  };
  const verify = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await sb().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (error) setMsg("That code didn't work. Check it, or send a new one.");
  };
  return (
    <div className="mx-auto max-w-md space-y-4">
      <Intro />
      {!sent ? (
        <form onSubmit={send} className="card space-y-3">
          <label className="block text-sm font-medium">Email
            <input className="input mt-1 w-full" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="btn btn-primary">Send me a code</button>
        </form>
      ) : (
        <form onSubmit={verify} className="card space-y-3">
          <p className="text-sm">We sent a code to {email}.</p>
          <label className="block text-sm font-medium">Code
            <input className="input mt-1 w-full" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary">Sign in</button>
            <button type="button" className="btn" onClick={() => { setSent(false); setCode(""); }}>Use another email</button>
          </div>
        </form>
      )}
      {msg && <p className="fb fb-again text-sm" role="alert">{msg}</p>}
    </div>
  );
}

function Join() {
  const me = useMe();
  const [name, setName] = useState(me.name ?? "");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const uid = me.session!.user.id;
    const p = await sb().from("profiles").upsert({ id: uid, display_name: name.trim() });
    if (p.error) return setMsg("Use a name of 2 to 40 characters.");
    if (!me.member) {
      const { data, error } = await sb().rpc("join_course", { p_course: COURSE_ID, p_code: code.trim() });
      if (error || !data) return setMsg("That join code doesn't match. Ask the course owner for it.");
    }
    await me.refresh();
  };
  return (
    <div className="mx-auto max-w-md space-y-4">
      <Intro />
      <form onSubmit={submit} className="card space-y-3">
        <label className="block text-sm font-medium">Your name (classmates see this)
          <input className="input mt-1 w-full" required minLength={2} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {!me.member && (
          <label className="block text-sm font-medium">Course join code
            <input className="input mt-1 w-full" required value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary">Join {course.code} Commons</button>
          <button type="button" className="btn" onClick={() => void sb().auth.signOut()}>Sign out</button>
        </div>
      </form>
      {msg && <p className="fb fb-again text-sm" role="alert">{msg}</p>}
    </div>
  );
}
