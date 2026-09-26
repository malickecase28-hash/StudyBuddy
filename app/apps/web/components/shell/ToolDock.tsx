"use client";

import { TOOLS } from "@/lib/tools";
import { useUi } from "@/lib/ui";
import { useToolState } from "./ToolPanel";

/** Click opens a tool beside the page; click again closes it; Shift-click pins it for the current mode. */
export function ToolDock() {
  const { tool, open, close, togglePin } = useToolState();
  const mode = useUi((s) => s.workspaceMode);
  return (
    <nav className="tool-dock" aria-label="Tools">
      {TOOLS.map((t) => (
        <button
          key={t.id} className="tool-button" aria-pressed={tool === t.id}
          title={`${t.label}${mode ? " (Shift-click to pin in this mode)" : ""}`} aria-label={t.label}
          onClick={(e) => {
            if (e.shiftKey) togglePin(t.id);
            else if (tool === t.id) close();
            else open(t.id);
          }}
        >
          <span aria-hidden>{t.glyph}</span>
        </button>
      ))}
    </nav>
  );
}
