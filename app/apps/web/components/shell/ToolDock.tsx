"use client";

import type { Mode } from "@forma/engine";
import { usePathname, useSearchParams } from "next/navigation";
import { useStudy } from "@/lib/store";
import { TOOLS } from "@/lib/tools";
import { useUi } from "@/lib/ui";

/** Click opens a tool in the margin; Shift-click pins it for the current mode. */
export function ToolDock() {
  const { panel, togglePanel } = useUi();
  const path = usePathname();
  const mode = (useSearchParams().get("mode") ?? "learn") as Mode;
  const layouts = useStudy((s) => s.learner.workspace.layouts);
  const setLayout = useStudy((s) => s.setLayout);
  const inWorkspace = path.startsWith("/c/") && path.split("/").length === 4;
  const pinned = inWorkspace ? layouts[mode]?.pinned ?? [] : [];
  return (
    <nav className="tool-dock" aria-label="Tools">
      {TOOLS.map((t) => (
        <button
          key={t.id} className="tool-button" aria-pressed={panel === t.id || pinned.includes(t.id)}
          title={`${t.label}${inWorkspace ? " (Shift-click to pin)" : ""}`} aria-label={t.label}
          onClick={(e) => {
            if (e.shiftKey && inWorkspace) setLayout(mode, { pinned: pinned.includes(t.id) ? pinned.filter((x) => x !== t.id) : [...pinned, t.id] });
            else togglePanel(t.id);
          }}
        >
          <span aria-hidden>{t.glyph}</span>
        </button>
      ))}
    </nav>
  );
}
