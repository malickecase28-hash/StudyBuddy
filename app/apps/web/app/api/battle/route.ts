import { battleConcepts, gradeItem, LIMIT_MS, MAX_PLAYERS, pickItems, scoreFor, type BattleItem } from "@/lib/commons/battle-items";
import { caller, serverReady } from "@/lib/commons/server";
import { course } from "@/lib/course";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

// ponytail: the host's browser moves a timed-out question on; if the host leaves mid-question, the battle waits. Add a cron sweep if that bites.
export async function POST(req: Request) {
  if (!serverReady()) return fail("Battles aren't set up on this server.", 503);
  const who = await caller(req);
  if (!who) return fail("Sign in first.", 401);
  const { db, uid } = who;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const isMember = async (courseId: string) =>
    (await db.from("course_members").select("user_id").eq("course_id", courseId).eq("user_id", uid).maybeSingle()).data !== null;
  const now = Date.now();

  if (body.action === "create") {
    const ids = new Set(battleConcepts().map((c) => c.id));
    const concepts = Array.isArray(body.concepts) ? [...new Set(body.concepts.filter((c): c is string => typeof c === "string" && ids.has(c)))] : [];
    if (concepts.length === 0 || concepts.length > 6) return fail("Pick between one and six topics.");
    if (!(await isMember(course.id))) return fail("Join the course first.", 403);
    const { data, error } = await db.from("battles").insert({ course_id: course.id, host_id: uid, concepts, items: pickItems(concepts) }).select("id").single();
    if (error) return fail("The battle didn't start. Try again.", 500);
    await db.from("battle_players").insert({ battle_id: data.id, user_id: uid });
    return Response.json({ id: data.id });
  }

  if (typeof body.id !== "string") return fail("Which battle?");
  const { data: b } = await db.from("battles").select("*").eq("id", body.id).maybeSingle();
  if (!b || !(await isMember(b.course_id))) return fail("That battle isn't open to you.", 404);
  const items = b.items as BattleItem[];
  const players = async () => (await db.from("battle_players").select("user_id", { count: "exact", head: true }).eq("battle_id", b.id)).count ?? 0;

  switch (body.action) {
    case "join": {
      if (b.phase !== "lobby") return fail("This battle has already started.", 409);
      if ((await players()) >= MAX_PLAYERS) return fail("This battle is full.", 409);
      await db.from("battle_players").upsert({ battle_id: b.id, user_id: uid });
      return Response.json({ ok: true });
    }
    case "start": {
      if (b.host_id !== uid) return fail("Only the host can start.", 403);
      if (b.phase !== "lobby") return fail("This battle has already started.", 409);
      await db.from("battles").update({ phase: "question", item_index: 0, started_at: new Date(now).toISOString() }).eq("id", b.id);
      return Response.json({ ok: true });
    }
    case "answer": {
      if (b.phase !== "question") return fail("This question is closed.", 409);
      const elapsed = now - Date.parse(b.started_at);
      if (elapsed > LIMIT_MS + 2000) return fail("Time's up for this question.", 409);
      const { data: p } = await db.from("battle_players").select("user_id").eq("battle_id", b.id).eq("user_id", uid).maybeSingle();
      if (!p) return fail("You're not in this battle.", 403);
      const input = typeof body.input === "string" ? body.input.slice(0, 200) : "";
      const correct = gradeItem(items[b.item_index]!, input);
      const score = scoreFor(correct, elapsed);
      const { error } = await db.from("battle_answers").insert({ battle_id: b.id, user_id: uid, item_index: b.item_index, correct, score });
      if (error) return fail("You've already answered this one.", 409);
      const { count: answered } = await db.from("battle_answers").select("user_id", { count: "exact", head: true }).eq("battle_id", b.id).eq("item_index", b.item_index);
      if ((answered ?? 0) >= (await players())) {
        await db.from("battles").update({ phase: "reveal" }).eq("id", b.id).eq("phase", "question").eq("item_index", b.item_index);
      }
      return Response.json({ correct, score });
    }
    case "next": {
      if (b.host_id !== uid) return fail("Only the host can move on.", 403);
      if (b.phase === "question") await db.from("battles").update({ phase: "reveal" }).eq("id", b.id);
      else if (b.phase === "reveal")
        await db.from("battles").update(
          b.item_index + 1 < items.length ? { phase: "question", item_index: b.item_index + 1, started_at: new Date(now).toISOString() } : { phase: "done" },
        ).eq("id", b.id);
      return Response.json({ ok: true });
    }
  }
  return fail("Unknown action.");
}
