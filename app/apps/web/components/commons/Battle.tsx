"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Markup } from "@/components/Markup";
import type { Anchor } from "@/lib/commons/anchor";
import { answerText, battleConcepts, LIMIT_MS, showItem, type BattleItem } from "@/lib/commons/battle-items";
import { battleApi, COURSE_ID, sb, useMe } from "@/lib/commons/client";
import { getConcept } from "@/lib/course";

type BattleRow = { id: string; host_id: string; concepts: string[]; items: BattleItem[]; phase: "lobby" | "question" | "reveal" | "done"; item_index: number; started_at: string | null };
type Player = { user_id: string; profile: { display_name: string } | null };
type Answer = { user_id: string; item_index: number; correct: boolean; score: number };
type Open = { id: string; concepts: string[]; host: { display_name: string } | null };

/** Hub section: start a battle on chosen topics, or join an open lobby. */
export function BattlesSection({ anchor }: { anchor: Anchor | null }) {
  const router = useRouter();
  const concepts = useMemo(battleConcepts, []);
  const [picked, setPicked] = useState<string[]>(() => (anchor && concepts.some((c) => c.id === anchor.conceptId) ? [anchor.conceptId] : []));
  const [open, setOpen] = useState<Open[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const since = new Date(Date.now() - 2 * 3_600_000).toISOString();
    void sb().from("battles").select("id, concepts, host:profiles(display_name)").eq("course_id", COURSE_ID).eq("phase", "lobby").gte("created_at", since)
      .order("created_at", { ascending: false }).then(({ data }) => setOpen((data ?? []) as unknown as Open[]));
  }, []);
  const start = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { id } = await battleApi<{ id: string }>({ action: "create", concepts: picked });
      router.push(`/commons/b/${id}`);
    } catch (err) {
      setMsg((err as Error).message);
    }
  };
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Battles</h2>
      <p className="text-sm text-soft">Five exam-style questions, 45 seconds each. Right and fast scores most.</p>
      <form onSubmit={start} className="card space-y-3">
        <fieldset className="grid gap-1 text-sm sm:grid-cols-2">
          <legend className="label mb-1">Topics (up to six)</legend>
          {concepts.map((c) => (
            <label key={c.id} className="flex items-center gap-2">
              <input type="checkbox" checked={picked.includes(c.id)} disabled={!picked.includes(c.id) && picked.length >= 6}
                onChange={(e) => setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)))} />
              {c.title}
            </label>
          ))}
        </fieldset>
        <button className="btn btn-primary" disabled={picked.length === 0}>Start a battle</button>
        {msg && <p className="fb fb-again text-sm" role="alert">{msg}</p>}
      </form>
      {open.length > 0 && (
        <ul className="space-y-2">
          {open.map((b) => (
            <li key={b.id} className="card flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">{b.host?.display_name ?? "Someone"} · {b.concepts.map((c) => getConcept(c)?.title ?? c).join(", ")}</span>
              <Link className="btn" href={`/commons/b/${b.id}`}>Join</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function useBattle(id: string) {
  const [s, setS] = useState<{ b: BattleRow; players: Player[]; answers: Answer[] } | null | undefined>(undefined);
  const load = useCallback(async () => {
    const [b, p, a] = await Promise.all([
      sb().from("battles").select("*").eq("id", id).maybeSingle(),
      sb().from("battle_players").select("user_id, profile:profiles(display_name)").eq("battle_id", id),
      sb().from("battle_answers").select("user_id, item_index, correct, score").eq("battle_id", id),
    ]);
    setS(b.data ? { b: b.data as BattleRow, players: (p.data ?? []) as unknown as Player[], answers: (a.data ?? []) as Answer[] } : null);
  }, [id]);
  useEffect(() => {
    void load();
    const reload = () => void load();
    const ch = sb()
      .channel(`battle:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "battles", filter: `id=eq.${id}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_players", filter: `battle_id=eq.${id}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_answers", filter: `battle_id=eq.${id}` }, reload)
      .subscribe();
    return () => void sb().removeChannel(ch);
  }, [id, load]);
  return s;
}

/** The battle screen: lobby → question → reveal → … → done. */
export function BattleView({ id }: { id: string }) {
  const s = useBattle(id);
  const uid = useMe((m) => m.session?.user.id);
  const [msg, setMsg] = useState("");
  const call = (body: Record<string, unknown>) => battleApi({ id, ...body }).then(() => setMsg(""), (e: Error) => setMsg(e.message));
  if (s === undefined) return <p className="p-8 text-soft">Opening the battle…</p>;
  if (s === null) return <p className="p-8">This battle is gone, or it isn&apos;t open to you. <Link className="underline" href="/commons">Back to Commons</Link></p>;
  const { b, players, answers } = s;
  const host = b.host_id === uid;
  const inIt = players.some((p) => p.user_id === uid);
  const name = (u: string) => players.find((p) => p.user_id === u)?.profile?.display_name ?? "Someone";
  const totals = players
    .map((p) => ({ id: p.user_id, name: name(p.user_id), total: answers.filter((a) => a.user_id === p.user_id).reduce((n, a) => n + a.score, 0) }))
    .sort((x, y) => y.total - x.total);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link className="text-sm underline" href="/commons">← Commons</Link>
      <div>
        <p className="label">Battle · {b.concepts.map((c) => getConcept(c)?.title ?? c).join(", ")}</p>
        <h1 className="text-2xl font-semibold">
          {b.phase === "lobby" ? "Waiting to start" : b.phase === "done" ? "Results" : `Question ${b.item_index + 1} of ${b.items.length}`}
        </h1>
      </div>
      {b.phase === "lobby" && (
        <div className="card space-y-3">
          <p className="text-sm">In this battle: {players.map((p) => p.profile?.display_name ?? "Someone").join(", ")}.</p>
          <div className="flex flex-wrap gap-2">
            {!inIt && <button className="btn btn-primary" onClick={() => void call({ action: "join" })}>Join this battle</button>}
            {host && <button className="btn btn-primary" onClick={() => void call({ action: "start" })}>Start</button>}
            {!host && inIt && <p className="text-sm text-soft">The host starts when everyone is in.</p>}
          </div>
        </div>
      )}
      {b.phase === "question" && (
        <QuestionCard key={b.item_index} b={b} host={host} answered={answers.some((a) => a.user_id === uid && a.item_index === b.item_index)} inIt={inIt} call={call} />
      )}
      {b.phase === "reveal" && (
        <div className="card space-y-3">
          <p className="read"><strong>Answer:</strong> {answerText(b.items[b.item_index]!)}</p>
          <ul className="text-sm">
            {players.map((p) => {
              const a = answers.find((x) => x.user_id === p.user_id && x.item_index === b.item_index);
              return <li key={p.user_id}>{name(p.user_id)}: {a ? (a.correct ? `right, ${a.score} points` : "not this time") : "no answer"}</li>;
            })}
          </ul>
          {host && (
            <button className="btn btn-primary" onClick={() => void call({ action: "next" })}>
              {b.item_index + 1 < b.items.length ? "Next question" : "Show the results"}
            </button>
          )}
        </div>
      )}
      {b.phase === "done" && totals[0] && (
        <p className="read text-lg">
          {totals.length > 1 && totals[1]!.total === totals[0].total ? `It's a draw at ${totals[0].total} points.` : `${totals[0].name} wins with ${totals[0].total} points.`}
        </p>
      )}
      {b.phase !== "lobby" && (
        <section className="card" aria-label="Scores">
          <p className="label">Scores</p>
          <ol className="text-sm">{totals.map((t) => <li key={t.id}>{t.name}: {t.total}</li>)}</ol>
        </section>
      )}
      {msg && <p className="fb fb-again text-sm" role="alert">{msg}</p>}
    </div>
  );
}

function QuestionCard({ b, host, answered, inIt, call }: { b: BattleRow; host: boolean; answered: boolean; inIt: boolean; call: (body: Record<string, unknown>) => Promise<void> }) {
  const shown = useMemo(() => showItem(b.items[b.item_index]!), [b]);
  const [input, setInput] = useState("");
  const end = Date.parse(b.started_at ?? "") + LIMIT_MS;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((end - now) / 1000));
  // ponytail: the countdown uses this device's clock; a few seconds of skew only shifts when the host's screen moves on.
  useEffect(() => {
    if (host && left === 0) void call({ action: "next" });
  }, [host, left]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (input) void call({ action: "answer", input });
  };
  return (
    <form onSubmit={submit} className="card space-y-3">
      <p className="label" aria-live="off">{left} s left</p>
      <p className="read"><Markup text={shown.prompt} /></p>
      {!inIt ? (
        <p className="text-sm text-soft">You&apos;re watching this battle.</p>
      ) : answered ? (
        <p className="text-sm text-soft">Answer in. Waiting for the others.</p>
      ) : shown.options ? (
        <fieldset role="radiogroup" aria-label="Choices" className="space-y-2">
          {shown.options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm">
              <input type="radio" name="choice" checked={input === o.id} onChange={() => setInput(o.id)} /> <Markup text={o.label} />
            </label>
          ))}
          <button className="btn btn-primary" disabled={!input}>Lock it in</button>
        </fieldset>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <label className="block text-sm font-medium">Your answer, with units
            <input className="input mt-1 w-56" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`e.g. 12.5 ${shown.unit ?? ""}`} />
          </label>
          <button className="btn btn-primary" disabled={!input}>Lock it in</button>
        </div>
      )}
    </form>
  );
}
