"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TOOLS } from "@/lib/tools";
import { useUi } from "@/lib/ui";
import { useToolState } from "./ToolPanel";

/** 20 px line icons, drawn in currentColor so they follow the theme. */
const I = (d: ReactNode) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>;
const ICONS: Record<string, ReactNode> = {
  desk: I(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>),
  courses: I(<><path d="M4 19V5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5" /></>),
  ink: I(<><path d="M4 20c3-1 4-4 6-4s2 3 5 3 4-3 5-5" /><path d="M14.5 3.5l3 3L9 15l-4 1 1-4z" /></>),
  bank: I(<><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M8 8h8M8 12h8M8 16h5" /></>),
  review: I(<><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></>),
  progress: I(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  map: I(<><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="8" r="2.5" /><circle cx="10" cy="18" r="2.5" /><path d="M8.4 6.3l7.2 1.3M16.6 10l-5.2 6M6.8 8.4l2.4 7.2" /></>),
  paper: I(<><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M9 13h7M9 17h5" /></>),
  notebook: I(<><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9 3v18M12 8h4M12 12h4" /></>),
  formulas: I(<path d="M17 4H7l6 8-6 8h10" />),
  sources: I(<><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>),
  calculator: I(<><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></>),
};

/** Where you can go. Short captions on the rail; the full name is the accessible name and the tooltip. */
const PLACES: { href: string; label: string; caption: string; icon: string; match: (p: string) => boolean }[] = [
  { href: "/", label: "Desk", caption: "Desk", icon: "desk", match: (p) => p === "/" },
  { href: "/courses", label: "Learn: courses and lessons", caption: "Learn", icon: "courses", match: (p) => p.startsWith("/courses") || p.startsWith("/c/") || p.startsWith("/learn") },
  { href: "/ink", label: "Ink: your handwritten notebooks", caption: "Ink", icon: "ink", match: (p) => p.startsWith("/ink") || p.startsWith("/paper") },
  { href: "/questions", label: "Question bank", caption: "Questions", icon: "bank", match: (p) => p.startsWith("/questions") },
  { href: "/review", label: "Review what's due", caption: "Review", icon: "review", match: (p) => p.startsWith("/review") },
  { href: "/dashboard", label: "Progress and exam readiness", caption: "Progress", icon: "progress", match: (p) => p.startsWith("/dashboard") || p.startsWith("/diagnostic") },
  { href: "/map", label: "Concept map", caption: "Map", icon: "map", match: (p) => p.startsWith("/map") },
];

const CAPTIONS: Record<string, string> = { notebook: "Saved", formulas: "Formulas", sources: "Sources", calculator: "Calc" };

/**
 * The left rail: places to go, then tools that open beside the page.
 * A tool opens beside the page; click again to close it; Shift-click keeps it open in the current mode.
 */
export function ToolDock() {
  const path = usePathname();
  const { tool, open, close, togglePin } = useToolState();
  const mode = useUi((s) => s.workspaceMode);
  return (
    <div className="tool-dock">
      <div className="rail-inner">
      <nav aria-label="Main" className="rail-group">
        {PLACES.map((p) => (p.icon === "ink" && mode ? (
          <button key={p.href} className="rail-item tool-button" aria-pressed={tool === "paper"} aria-label="Ink" title="Ink: write beside this lesson (your notebook for this concept)"
            onClick={(e) => { if (e.shiftKey) togglePin("paper"); else if (tool === "paper") close(); else open("paper"); }}>
            {ICONS.ink}
            <span className="rail-caption" aria-hidden>Ink</span>
          </button>
        ) : (
          <Link key={p.href} href={p.href} className="rail-item" title={p.label} aria-label={p.label} aria-current={p.match(path) ? "page" : undefined}>
            {ICONS[p.icon]}
            <span className="rail-caption" aria-hidden>{p.caption}</span>
          </Link>
        )))}
      </nav>
      <nav aria-label="Tools" className="rail-group rail-tools">
        <span className="rail-heading" aria-hidden>Tools</span>
        {TOOLS.filter((t) => t.id !== "paper").map((t) => (
          <button
            key={t.id} className="rail-item tool-button" aria-pressed={tool === t.id}
            title={`${t.label}: opens beside the page${mode ? ". Shift-click to keep it open in this mode" : ""}`} aria-label={t.label}
            onClick={(e) => {
              if (e.shiftKey) togglePin(t.id);
              else if (tool === t.id) close();
              else open(t.id);
            }}
          >
            {ICONS[t.id]}
            <span className="rail-caption" aria-hidden>{CAPTIONS[t.id] ?? t.label}</span>
          </button>
        ))}
      </nav>
      </div>
    </div>
  );
}
