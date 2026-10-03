"use client";

import type { ErrorClass } from "@forma/engine";
import { Markup } from "../Markup";
import { ERROR_LABEL } from "./types";

/**
 * Feedback, not judgement: confirmed = green ✓, "take another look" = amber ↺ with the reason.
 * Red is reserved for real system errors. State is never carried by colour alone.
 */
export function Feedback({ correct, text, errorClass }: { correct: boolean; text: string; errorClass?: ErrorClass }) {
  return (
    <div className={`fb reveal ${correct ? "fb-right" : "fb-again"}`} role="status" aria-live="polite">
      <strong className="mr-1">{correct ? "✓ Understood." : "↺ Take another look."}</strong>
      {!correct && errorClass && <span className="label mr-1.5 align-middle">{ERROR_LABEL[errorClass]}</span>}
      <Markup text={text} />
    </div>
  );
}

export function SourceTag({ doc, locator, licence }: { doc: string; locator: string; licence: string }) {
  return (
    <span
      className="cursor-help text-xs text-faint"
      title={`${doc}, ${locator}${licence === "restricted" ? ". Quoted material." : ""}`}
      aria-label={`Source: ${doc}, ${locator}`}
    >
      ⓘ
    </span>
  );
}
