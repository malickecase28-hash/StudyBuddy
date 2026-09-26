"use client";

import { DAY_MS } from "@forma/engine";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { course, examDateMs, lessonHref, mainLesson } from "@/lib/course";
import { conceptProgress, courseMastery, pct, STATE_GLYPH } from "@/lib/progress";
import { useStudy } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { ContextDrawer } from "./ContextDrawer";
import { Hydrated } from "./Providers";
import { SettingsDialog } from "./SettingsDialog";

const NAV = [
  { href: "/", label: "Workspace" },
  { href: "/map", label: "Concept map" },
  { href: "/lab", label: "Lab" },
  { href: "/past-papers", label: "Problems" },
  { href: "/dashboard", label: "Progress" },
  { href: "/notebook", label: "Notebook" },
  { href: "/paper", label: "Working paper" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const railOpen = useUi((s) => s.railOpen);
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <ResetNotice />
      <div className="flex flex-1">
        {railOpen && <CourseRail />}
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Hydrated>{children}</Hydrated>
        </main>
        <ContextDrawer />
      </div>
    </div>
  );
}

function TopBar() {
  const learner = useStudy((s) => s.learner);
  const hydrated = useStudy((s) => s.hydrated);
  const now = useStudy((s) => s.now);
  const toggleRail = useUi((s) => s.toggleRail);
  const openDrawer = useUi((s) => s.openDrawer);
  const path = usePathname();
  const days = Math.max(0, Math.ceil((examDateMs - now()) / DAY_MS));
  return (
    <header className="workspace-topbar sticky top-0 z-20 flex items-center gap-4 border-b border-line px-4 py-2.5 backdrop-blur">
      <button className="btn px-2 py-1" onClick={toggleRail} aria-label="Toggle course rail">
        ☰
      </button>
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="StudyBuddy workspace home">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-raised" aria-hidden>✳</span>
        <span>StudyBuddy<span className="hidden text-faint sm:inline"> / {course.code}</span></span>
      </Link>
      <nav className="workspace-nav ml-4 hidden gap-1 xl:flex" aria-label="Main">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="rounded-lg px-3 py-1.5 text-sm text-soft hover:bg-sunken"
            data-on={path === n.href}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3 text-sm">
        {hydrated && (
          <span title="Average mastery across this slice's concepts">
            <span className="label mr-1">Mastery</span>
            {pct(courseMastery(learner))}
          </span>
        )}
        <span className="hidden md:inline" title={`Finals on ${course.examDate}`}>
          <span className="label mr-1">Finals</span>
          {days} days
        </span>
        <button className="btn px-2.5 py-1" onClick={() => openDrawer()} aria-label="Open sources, formulas and notebook">
          Reference desk
        </button>
        <SettingsDialog />
      </div>
    </header>
  );
}

function ResetNotice() {
  const notice = useStudy((s) => s.resetNotice);
  const unavailable = useStudy((s) => s.storageUnavailable);
  const dismiss = useStudy((s) => s.dismissResetNotice);
  if (unavailable) {
    return (
      <div className="fb fb-again m-4" role="status">
        ↺ Your saved progress couldn't be opened (another tab may be holding it). This session works normally but won't be saved. Close other
        StudyBuddy tabs and reload to pick your progress back up.
      </div>
    );
  }
  if (!notice) return null;
  return (
    <div className="fb fb-again m-4" role="status">
      ↺ Your saved progress couldn't be read, so it was backed up and a fresh workspace was started.{" "}
      <button className="underline" onClick={dismiss}>
        OK
      </button>
    </div>
  );
}

function CourseRail() {
  const learner = useStudy((s) => s.learner);
  const hydrated = useStudy((s) => s.hydrated);
  const active = useUi((s) => s.activeConceptId);
  const path = usePathname();
  return (
    <aside className="workspace-rail hidden w-64 shrink-0 border-r border-line px-3 py-6 text-sm lg:block" aria-label="Course contents">
      <div className="mb-7 px-2">
        <p className="label">Current course</p>
        <p className="mt-1 text-base font-semibold">{course.title}</p>
        <p className="text-xs text-faint">{course.code} · Concept workspace</p>
      </div>
      <nav className="mb-7 space-y-1 border-b border-line px-1 pb-6 xl:hidden" aria-label="Workspace tools">
        {NAV.map((n) => <Link key={n.href} href={n.href} className="block rounded-lg px-2 py-1.5 hover:bg-sunken" data-on={path === n.href}>{n.label}</Link>)}
      </nav>
      {course.units.map((u) => {
        const concepts = course.concepts.filter((c) => c.unit === u.number);
        return (
          <section key={u.number} className="mb-5">
            <h2 className="label mb-2 px-2">
              Unit {u.number} · {u.title}
            </h2>
            <ul className="space-y-0.5">
              {concepts.map((c) => {
                const { state } = hydrated ? conceptProgress(learner, c.id) : { state: "NOT_STARTED" as const };
                const g = STATE_GLYPH[state];
                const lesson = mainLesson(c);
                return (
                  <li key={c.id}>
                    {c.locked || !lesson ? (
                      <span className="flex items-center gap-2 rounded-md px-2 py-1 text-faint" title="Coming in a later build">
                        <span aria-hidden>🔒</span>
                        {c.title}
                      </span>
                    ) : (
                      <Link
                        href={lessonHref(c.id, lesson.id)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-sunken data-[on=true]:font-semibold"
                        data-on={active === c.id}
                      >
                        <span aria-label={g.label} title={g.label} className="w-4 text-center">
                          {g.glyph}
                        </span>
                        {c.title}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </aside>
  );
}
