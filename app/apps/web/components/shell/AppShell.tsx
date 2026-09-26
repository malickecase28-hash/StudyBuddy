"use client";

import { DAY_MS, type Mode } from "@forma/engine";
import { Mark, Segmented, TitleBlock, Wordmark } from "@forma/ui";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { conceptHref, course, examDateMs, getConcept } from "@/lib/course";
import { dueCount } from "@/lib/retrieval";
import { useStudy } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { CommandPalette, useShortcuts } from "./CommandPalette";
import { Hydrated } from "./Providers";
import { SettingsDialog } from "./SettingsDialog";
import { ToolDock } from "./ToolDock";
import { ToolPanel } from "./ToolPanel";

const MODES = [["learn", "Learn"], ["solve", "Solve"], ["explore", "Explore"], ["revise", "Revise"]] as const;
const PAGES: Record<string, string> = {
  "/courses": "Library", "/notebook": "Notebook", "/dashboard": "Progress", "/past-papers": "Past papers",
  "/review": "Review", "/diagnostic": "Readiness check", "/paper": "Working paper", "/lab": "Classic lab", "/map": "Concept map",
};

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

function Shell({ children }: { children: ReactNode }) {
  useShortcuts();
  return (
    <div className="shell">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      <TopBar />
      <ResetNotice />
      <div className="shell-body">
        <ToolDock />
        <main id="main" className="shell-main">
          <Hydrated>{children}</Hydrated>
        </main>
        <ToolPanel />
      </div>
      <StatusFooter />
      <CommandPalette />
    </div>
  );
}

function TopBar() {
  const path = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const setPalette = useUi((s) => s.setPalette);
  const setLayout = useStudy((s) => s.setLayout);
  const lastMode = useStudy((s) => s.learner.workspace.lastMode);
  const [, , courseId, rawConcept] = path.split("/");
  const concept = rawConcept ? getConcept(decodeURIComponent(rawConcept)) : undefined;
  const mode = (search.get("mode") ?? lastMode) as Mode;
  const crumbs: { label: string; href?: string }[] =
    path === "/" ? [{ label: "Desk" }]
    : path.startsWith("/c/") ? [{ label: "Library", href: "/courses" }, { label: course.title, ...(concept ? { href: `/c/${courseId}` } : {}) }, ...(concept ? [{ label: `Unit ${concept.unit}` }, { label: concept.title }] : [])]
    : [{ label: PAGES[path] ?? (path.startsWith("/learn/") ? "Classic lesson" : "Forma") }];
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
      {concept && (
        <Segmented
          label="Mode" value={mode} options={MODES}
          onChange={(m) => {
            setLayout(m, {});
            router.replace(conceptHref(concept.id, m));
          }}
        />
      )}
      <div className="topbar-end">
        <button className="btn" onClick={() => setPalette(true)} aria-label="Search and jump (Control K)">⌘K</button>
        <SettingsDialog />
        <span className="label" title="Accounts arrive with sub-project 5">Guest</span>
      </div>
    </header>
  );
}

function StatusFooter() {
  const hydrated = useStudy((s) => s.hydrated);
  const unavailable = useStudy((s) => s.storageUnavailable);
  const learner = useStudy((s) => s.learner);
  const now = useStudy((s) => s.now);
  const days = Math.max(0, Math.ceil((examDateMs - now()) / DAY_MS));
  return (
    <footer className="status-footer">
      <TitleBlock
        cells={[
          { label: "Course", value: course.code },
          { label: "Progress", value: !hydrated ? "…" : unavailable ? "Not saved (memory only)" : "Saved on this device" },
          { label: "Finals", value: `${days} days` },
          { label: "Due reviews", value: hydrated ? String(dueCount(learner, now())) : "…" },
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
