"use client";

import { useStudy } from "@/lib/store";
import { TOOLS } from "@/lib/tools";
import { useUi } from "@/lib/ui";

/** Click opens a tool in the margin; Shift-click pins it for the current mode. */
export function ToolDock() {
  const { panel, togglePanel } = useUi();
  const mode = useUi((s) => s.workspaceMode);
  const layouts = useStudy((s) => s.learner.workspace.layouts);
  const setLayout = useStudy((s) => s.setLayout);
  const inWorkspace = mode !== null;
  const pinned = mode ? layouts[mode].pinned : [];
  return (
    <nav className="tool-dock" aria-label="Tools">
      {TOOLS.map((t) => (
        <button
          key={t.id} className="tool-button" aria-pressed={panel === t.id || pinned.includes(t.id)}
          title={`${t.label}${inWorkspace ? " (Shift-click to pin)" : ""}`} aria-label={t.label}
          onClick={(e) => {
            if (e.shiftKey && mode) setLayout(mode, { pinned: pinned.includes(t.id) ? pinned.filter((x) => x !== t.id) : [...pinned, t.id] });
            else togglePanel(t.id);
          }}
        >
          <span aria-hidden>{t.glyph}</span>
        </button>
      ))}
    </nav>
  );
}
