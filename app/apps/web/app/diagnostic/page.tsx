"use client";

import { checkChoice, diagnosticRoute, nextDiagnosticItem, type DiagnosticAnswers } from "@forma/engine";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Feedback } from "@/components/blocks/Feedback";
import { Markup } from "@/components/Markup";
import { diagnostic, getConcept, lessonHref, mainLesson } from "@/lib/course";
import { useStudy } from "@/lib/store";

const RESULT = {
  ready: { glyph: "✓", label: "Ready", tone: "fb-right" },
  partial: { glyph: "◑", label: "Mostly there: a short refresher will help", tone: "fb-again" },
  gap: { glyph: "↺", label: "Worth refreshing first", tone: "fb-again" },
} as const;

/** Adaptive readiness check: a miss on a core question triggers a simpler probe on the same idea. */
export default function DiagnosticPage() {
  const [answers, setAnswers] = useState<DiagnosticAnswers>({});
  const [last, setLast] = useState<{ correct: boolean; text: string } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const complete = useStudy((s) => s.completeDiagnostic);
  const router = useRouter();

  const item = pending ? null : nextDiagnosticItem(diagnostic, answers);
  const answered = Object.keys(answers).length;

  if (!item && !pending) {
    const { results, route } = diagnosticRoute(diagnostic, answers);
    const first = route[0] ?? "em1.electrostatics.gauss-law";
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <p className="label">Readiness check · results</p>
        <h1 className="text-2xl font-semibold">{route.length === 0 ? "You're ready for Gauss's law." : "Here's your route."}</h1>
        <ul className="space-y-2">
          {diagnostic.topics.map((t) => {
            const r = RESULT[results[t.id]!];
            return (
              <li key={t.id} className={`fb ${r.tone} flex items-center gap-3`}>
                <span aria-hidden>{r.glyph}</span>
                <strong className="w-56">{t.label}</strong>
                <span>{r.label}</span>
              </li>
            );
          })}
        </ul>
        {route.length > 0 && (
          <p className="read text-soft">
            Refreshers added to your route, in order: {route.map((id) => getConcept(id)?.title).join(" → ")}. They're short, and you can always skip
            ahead: nothing is locked.
          </p>
        )}
        <div className="flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              complete(results, route);
              const c = getConcept(first)!;
              router.push(lessonHref(c.id, mainLesson(c)!.id));
            }}
          >
            Save my route and start →
          </button>
          <button
            className="btn"
            onClick={() => {
              complete(results, route);
              router.push("/");
            }}
          >
            Save and go home
          </button>
        </div>
      </div>
    );
  }

  const current = item ?? diagnostic.items.find((i) => i.id === pending)!;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-baseline justify-between">
        <p className="label">Readiness check · {diagnostic.topics.find((t) => t.id === current.topic)?.label}</p>
        <span className="text-xs text-faint">{answered} answered · about 12 questions</span>
      </div>
      <div className="h-1 rounded bg-line">
        <div className="h-1 rounded bg-ink transition-all" style={{ width: `${Math.min(100, (answered / 12) * 100)}%` }} />
      </div>
      {current.role === "probe" && <p className="text-sm text-soft">A quick follow-up on the same idea:</p>}
      <p className="read text-lg font-medium">
        <Markup text={current.prompt} />
      </p>
      <div className="space-y-2">
        {current.options.map((o) => (
          <button
            key={o.id}
            className="choice"
            disabled={!!pending}
            onClick={() => {
              const v = checkChoice(current.options, o.id);
              setLast({ correct: v.correct, text: v.feedback });
              setPending(current.id);
              setAnswers((a) => ({ ...a, [current.id]: v.correct }));
            }}
          >
            <Markup text={o.label} />
          </button>
        ))}
        <button
          className="text-sm text-faint underline"
          disabled={!!pending}
          onClick={() => {
            setLast({ correct: false, text: "No problem: that's exactly what this check is for." });
            setPending(current.id);
            setAnswers((a) => ({ ...a, [current.id]: false }));
          }}
        >
          I'm not sure
        </button>
      </div>
      {pending && last && (
        <>
          <Feedback correct={last.correct} text={last.text} />
          <button className="btn btn-primary" onClick={() => setPending(null)} autoFocus>
            Next →
          </button>
        </>
      )}
      <p className="text-xs text-faint">
        Not a test: nothing here is graded. <Link href="/">Skip for now</Link>
      </p>
    </div>
  );
}
