"use client";

import { DAY_MS } from "@studybuddy/engine";
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
  { href: "/", label: "Home" },
  { href: "/map", label: "Map" },
  { href: "/past-papers", label: "Past papers" },
  { href: "/dashboard", label: "Mastery" },
  { href: "/notebook", label: "Notebook" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const railOpen = useUi((s) => s.railOpen);
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <ResetNotice />
      <div className="flex flex-1">
        {railOpen && <CourseRail />}
        <main className="min-w-0 flex-1 px-6 py-6 lg:px-10">
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
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-line bg-raised/95 px-4 py-2 backdrop-blur">
      <button className="btn px-2 py-1" onClick={toggleRail} aria-label="Toggle course rail">
        ☰
      </button>
      <Link href="/" className="font-semibold tracking-tight">
        <span className="label mr-2">{course.code}</span>
        {course.title}
      </Link>
      <nav className="ml-4 hidden gap-1 md:flex" aria-label="Main">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="rounded-md px-2.5 py-1 text-sm text-soft hover:bg-sunken data-[on=true]:bg-sunken data-[on=true]:text-ink"
            data-on={path === n.href}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-4 text-sm">
        {hydrated && (
          <span title="Average mastery across this slice's concepts">
            <span className="label mr-1">Mastery</span>
            {pct(courseMastery(learner))}
          </span>
        )}
        <span title={`Finals on ${course.examDate}`}>
          <span className="label mr-1">Finals</span>
          {days} days
        </span>
        <button className="btn px-2.5 py-1" onClick={() => openDrawer()} aria-label="Open sources, formulas and notebook">
          Sources &amp; notes
        </button>
        <SettingsDialog />
      </div>
    </header>
  );
}

function ResetNotice() {
  const notice = useStudy((s) => s.resetNotice);
  const dismiss = useStudy((s) => s.dismissResetNotice);
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
  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-bg px-3 py-5 text-sm lg:block" aria-label="Course contents">
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
                        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-sunken data-[on=true]:bg-sunken data-[on=true]:font-semibold"
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
