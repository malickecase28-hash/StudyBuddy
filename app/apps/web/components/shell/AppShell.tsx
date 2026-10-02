"use client";

import { Mark, Segmented, TitleBlock, Wordmark } from "@forma/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { conceptHref, course, getConcept } from "@/lib/course";
import { commonsEnabled, useMe } from "@/lib/commons/client";
import { useStudy } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { CommandPalette, useShortcuts } from "./CommandPalette";
import { Hydrated } from "./Providers";
import { SettingsDialog } from "./SettingsDialog";
import { ToolDock } from "./ToolDock";
import { ToolSplit } from "./ToolPanel";

const MODES = [["learn", "Learn"], ["solve", "Solve"], ["explore", "Explore"], ["revise", "Revise"]] as const;
const PAGES: Record<string, string> = {
  "/courses": "Library", "/notebook": "Notebook", "/dashboard": "Progress", "/past-papers": "Question bank",
  "/review": "Review", "/diagnostic": "Readiness check", "/paper": "Ink", "/lab": "Classic lab", "/map": "Concept map", "/commons": "Commons", "/ink": "Ink", "/calculator": "Calculator", "/formulas": "Formulas",
};

/** The shell reads no search params, so every page pre-renders with its frame (no blank first paint). */
export function AppShell({ children }: { children: ReactNode }) {
  useShortcuts();
  return (
    <div className="shell">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      <TopBar />
      <ResetNotice />
      <div className="shell-body">
        <ToolDock />
        <ToolSplit>
          <main id="main" className="shell-main">
            <Hydrated>{children}</Hydrated>
          </main>
        </ToolSplit>
      </div>
      <StatusFooter />
      <CommandPalette />
    </div>
  );
}

function TopBar() {
  const path = usePathname();
  const router = useRouter();
  const setPalette = useUi((s) => s.setPalette);
  const setLayout = useStudy((s) => s.setLayout);
  const shortcut = useShortcutLabel();
  const [, , courseId, rawConcept] = path.split("/");
  const concept = rawConcept ? getConcept(decodeURIComponent(rawConcept)) : undefined;
  const mode = useUi((s) => s.workspaceMode);
  const crumbs: { label: string; href?: string }[] =
    path === "/" ? [{ label: "Desk" }]
    : path.startsWith("/c/") ? [{ label: "Library", href: "/courses" }, { label: course.title, ...(concept ? { href: `/c/${courseId}` } : {}) }, ...(concept ? [{ label: `Unit ${concept.unit}` }, { label: concept.title }] : [])]
    : [{ label: PAGES[path] ?? (path.startsWith("/learn/") ? "Classic lesson" : path.startsWith("/ink/") ? "Ink" : "Forma") }];
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="Forma: go to your desk">
        <Mark size={22} title="" />
        <Wordmark height={16} title="" />
      </Link>
      <nav aria-label="Breadcrumb" className="crumbs">
        <ol>
          {crumbs.map((c, i) => (
            <li key={i}>{c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current={i === crumbs.length - 1 ? "page" : undefined}>{c.label}</span>}</li>
          ))}
        </ol>
      </nav>
      {concept && mode && (
        <Segmented
          label="Mode" value={mode} options={MODES}
          onChange={(m) => {
            setLayout(m, {});
            router.replace(conceptHref(concept.id, m));
          }}
        />
      )}
      <div className="topbar-end">
        <button className="btn" onClick={() => setPalette(true)} aria-label="Search and jump (Control K)">
          <span className="topbar-wide">Search </span><span className="topbar-narrow" aria-hidden>⌕</span><kbd className="label topbar-wide">{shortcut}</kbd>
        </button>
        <SettingsDialog />
        <AccountLink />
      </div>
    </header>
  );
}

/** Off: the old Guest label, unchanged (visual baselines). On: a link into Commons. */
function AccountLink() {
  const name = useMe((s) => s.name);
  if (!commonsEnabled) return <span className="label topbar-wide" title="Accounts arrive with sub-project 5">Guest</span>;
  return <Link className="btn" href="/commons">{name ?? "Commons"}</Link>;
}

/** "Ctrl K" everywhere, "⌘K" on Apple devices (decided after mount, so server and client HTML match). */
function useShortcutLabel() {
  const [label, setLabel] = useState("Ctrl K");
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) setLabel("⌘K");
  }, []);
  return label;
}

function StatusFooter() {
  const hydrated = useStudy((s) => s.hydrated);
  const unavailable = useStudy((s) => s.storageUnavailable);
  return (
    <footer className="status-footer">
      <TitleBlock
        cells={[
          { label: "Course", value: course.code },
          { label: "Progress", value: !hydrated ? "…" : unavailable ? "Not saved (memory only)" : "Saved on this device" },
        ]}
      />
    </footer>
  );
}

function ResetNotice() {
  const notice = useStudy((s) => s.resetNotice);
  const unavailable = useStudy((s) => s.storageUnavailable);
  const dismiss = useStudy((s) => s.dismissResetNotice);
  if (unavailable)
    return (
      <div className="fb fb-again m-4" role="status">
        ↺ Your saved progress couldn&apos;t be opened (another tab may be holding it). This session works normally but won&apos;t be saved.
      </div>
    );
  if (!notice) return null;
  return (
    <div className="fb fb-again m-4" role="status">
      ↺ Your saved progress couldn&apos;t be read, so it was backed up and a fresh workspace was started.{" "}
      <button className="underline" onClick={dismiss}>OK</button>
    </div>
  );
}
