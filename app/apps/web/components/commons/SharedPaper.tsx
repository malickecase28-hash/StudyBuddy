"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import type Editor from "js-draw";
import { useEffect, useRef, useState } from "react";
import { sb } from "@/lib/commons/client";

type Ink = { op: "do" | "undo"; cmd: Record<string, unknown> };

/**
 * Working paper shared live through a private Realtime channel `room:<id>`:
 * - local CommandDone/CommandUndone events are broadcast as serialized commands;
 * - remote ones are applied with cmd.apply/unapply, which fire no events, so nothing echoes.
 * The SVG is saved to `rooms` 4 s after the last local stroke, and loaded first by anyone who joins.
 */
// ponytail: last-writer-wins snapshot; a stroke made while the snapshot loads is buffered and applied after. Move to Yjs if rooms grow past a handful of people.
export function SharedPaper({ roomId, me, onPeople }: { roomId: string; me: { id: string; name: string }; onPeople: (names: string[]) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading the shared paper…");

  useEffect(() => {
    let cancelled = false;
    let editor: Editor | null = null;
    let channel: RealtimeChannel | null = null;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let saveNow: (() => void) | null = null;
    let quiet = true;
    const pending: Ink[] = [];

    const open = async () => {
      const [{ default: DrawEditor, Color4, BackgroundComponentBackgroundType, EditorEventType, SerializableCommand }] = await Promise.all([
        import("js-draw"),
        import("js-draw/bundledStyles"),
      ]);
      if (cancelled || !host.current) return;
      const ed = new DrawEditor(host.current, { appInfo: { name: "Forma", description: "Shared working paper" } });
      ed.dispatch(ed.setBackgroundStyle({ color: Color4.white, type: BackgroundComponentBackgroundType.Grid }), false);
      ed.addToolbar();
      ed.getRootElement().style.height = "100%";
      editor = ed;

      const apply = (m: Ink) => {
        try {
          const cmd = SerializableCommand.deserialize(m.cmd, ed);
          void (m.op === "do" ? cmd.apply(ed) : cmd.unapply(ed));
        } catch {
          // A command about something this copy doesn't have (e.g. erasing a stroke from before a reload): skip it.
        }
      };
      saveNow = () => {
        clearTimeout(saveTimer);
        saveTimer = undefined;
        void sb().from("rooms").update({ svg: ed.toSVG().outerHTML, updated_at: new Date().toISOString() }).eq("thread_id", roomId);
      };
      const send = (op: Ink["op"], command: unknown) => {
        if (quiet || !(command instanceof SerializableCommand)) return;
        void channel?.send({ type: "broadcast", event: "ink", payload: { op, cmd: command.serialize() } satisfies Ink });
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => saveNow?.(), 4000);
      };
      ed.notifier.on(EditorEventType.CommandDone, (e) => { if (e.kind === EditorEventType.CommandDone) send("do", e.command); });
      ed.notifier.on(EditorEventType.CommandUndone, (e) => { if (e.kind === EditorEventType.CommandUndone) send("undo", e.command); });

      await sb().realtime.setAuth();
      if (cancelled) return;
      const ch = sb().channel(`room:${roomId}`, { config: { private: true, broadcast: { self: false }, presence: { key: me.id } } });
      channel = ch;
      ch.on("broadcast", { event: "ink" }, ({ payload }) => {
        const m = payload as Ink;
        if (quiet) pending.push(m);
        else apply(m);
      })
        .on("presence", { event: "sync" }, () => {
          onPeople(Object.values(ch.presenceState<{ name: string }>()).map((p) => p[0]?.name ?? "").filter(Boolean));
        })
        .subscribe((s) => {
          if (s === "SUBSCRIBED") void ch.track({ name: me.name });
          if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("Live drawing is unavailable right now. Your strokes won't reach the others.");
        });

      const { data } = await sb().from("rooms").select("svg").eq("thread_id", roomId).maybeSingle();
      if (cancelled) return;
      if (data?.svg) {
        try {
          await ed.loadFromSVG(data.svg as string);
        } catch {
          setStatus("The saved paper couldn't be opened. New strokes still sync.");
        }
      }
      quiet = false;
      pending.splice(0).forEach(apply);
      setStatus((s) => (s.startsWith("Loading") ? "" : s));
    };
    void open();
    return () => {
      cancelled = true;
      if (saveTimer) saveNow?.();
      if (channel) void sb().removeChannel(channel);
      editor?.remove();
    };
  }, [roomId, me.id, me.name, onPeople]);

  return (
    <section className="card min-w-0 p-2" aria-label="Shared drawing area">
      <div ref={host} className="working-paper h-[620px] overflow-hidden rounded-xl bg-white" />
      {status && <p className="p-2 text-sm text-soft" role="status">{status}</p>}
    </section>
  );
}
