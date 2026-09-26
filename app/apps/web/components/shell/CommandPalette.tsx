"use client";

import * as dialog from "@zag-js/dialog";
import type { Mode } from "@forma/engine";
import { normalizeProps, Portal, useMachine } from "@zag-js/react";
import { rankCommands } from "@forma/ui";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { buildCommands, type PaletteCommand } from "@/lib/commands";
import { conceptHref, getConcept } from "@/lib/course";
import { dueCount } from "@/lib/retrieval";
import { useStudy } from "@/lib/store";
import { useUi } from "@/lib/ui";

const MODE_KEYS: Record<string, Mode> = { "1": "learn", "2": "solve", "3": "explore", "4": "revise" };
const typing = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable='true']");

export function useShortcuts() {
  const router = useRouter();
  const path = usePathname();
  const { setPalette, openPanel, setWorkspaceMode } = useUi();
  const setLayout = useStudy((s) => s.setLayout);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
        return;
      }
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      const [, c, , raw] = path.split("/");
      const concept = c === "c" && raw ? getConcept(decodeURIComponent(raw)) : undefined;
      const mode = MODE_KEYS[e.key];
      if (mode && concept) {
        setLayout(mode, {});
        router.replace(conceptHref(concept.id, mode));
      } else if (e.key === "p" || e.key === "n") {
        const mode = MODE_KEYS[new URLSearchParams(window.location.search).get("mode") ?? ""];
        if (mode) setWorkspaceMode(mode);
        openPanel(e.key === "p" ? "paper" : "notebook");
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [path, router, setPalette, openPanel, setWorkspaceMode, setLayout]);
}

export function CommandPalette() {
  const { paletteOpen, setPalette, openPanel } = useUi();
  const router = useRouter();
  const learner = useStudy((s) => s.learner);
  const now = useStudy((s) => s.now);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const all = useMemo(() => buildCommands({ dueReviews: dueCount(learner, now()) }), [learner, now]);
  const results = rankCommands(q, all);
  const service = useMachine(dialog.machine, { id: useId(), open: paletteOpen, onOpenChange: (d) => setPalette(d.open) });
  const api = dialog.connect(service, normalizeProps);
  const run = (c: PaletteCommand) => {
    setPalette(false);
    setQ("");
    if (c.action.kind === "href") router.push(c.action.href);
    else openPanel(c.action.tool);
  };
  if (!api.open) return null;
  return (
    <Portal>
      <div {...api.getBackdropProps()} className="fixed inset-0 z-40 bg-black/30" />
      <div {...api.getPositionerProps()} className="fixed inset-0 z-50 flex items-start justify-center p-6 pt-[12vh]">
        <div {...api.getContentProps()} className="palette">
          <h2 {...api.getTitleProps()} className="sr-only">Search and jump</h2>
          <input
            autoFocus className="palette-input" role="combobox" aria-expanded aria-controls="palette-list"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
            placeholder="Jump to a concept, mode, tool or formula…" value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter" && results[active]) { e.preventDefault(); run(results[active]); }
            }}
          />
          <ul id="palette-list" role="listbox" aria-label="Results" className="palette-list">
            {results.map((c, i) => (
              <li key={c.id} id={`cmd-${c.id}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => run(c)}>
                <span>{c.label}</span>
                <span className="label">{c.group}</span>
              </li>
            ))}
            {!results.length && <li className="text-soft">Nothing matches “{q}”.</li>}
          </ul>
        </div>
      </div>
    </Portal>
  );
}
