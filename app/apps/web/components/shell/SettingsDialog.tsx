"use client";

import * as dialog from "@zag-js/dialog";
import { normalizeProps, Portal, useMachine } from "@zag-js/react";
import type { Settings } from "@studybuddy/engine";
import { useId } from "react";
import { useStudy } from "@/lib/store";

type Option<K extends keyof Settings> = { key: K; label: string; hint: string; values: [Settings[K], string][] };

const OPTIONS = [
  { key: "theme", label: "Theme", hint: "Colour meanings stay the same in every theme.", values: [["paper", "Paper & Ink"], ["night", "Night"], ["contrast", "High contrast"]] },
  { key: "motion", label: "Motion", hint: "Reduced shows the same information without animation.", values: [["standard", "Standard"], ["reduced", "Reduced"]] },
  { key: "density", label: "Density", hint: "", values: [["comfortable", "Comfortable"], ["compact", "Compact"]] },
  { key: "simQuality", label: "Simulation quality", hint: "Low-power uses fewer arrows and a coarser surface.", values: [["high", "High"], ["balanced", "Balanced"], ["low", "Low-power"]] },
  { key: "equationDetail", label: "Equations", hint: "Progressive builds equations term by term.", values: [["progressive", "Progressive"], ["full", "Full at once"]] },
] as const satisfies readonly Option<keyof Settings>[];

/** Cognitive-environment settings. They change how the course is presented, not its academic standard. */
export function SettingsDialog() {
  const service = useMachine(dialog.machine, { id: useId() });
  const api = dialog.connect(service, normalizeProps);
  const settings = useStudy((s) => s.learner.settings);
  const update = useStudy((s) => s.updateSettings);
  const offset = useStudy((s) => s.clockOffsetDays);
  const setOffset = useStudy((s) => s.setClockOffset);
  const reset = useStudy((s) => s.resetProgress);
  const learner = useStudy((s) => s.learner);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(learner, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "studybuddy-progress.json";
    a.click();
  };

  return (
    <>
      <button className="btn px-2.5 py-1" {...api.getTriggerProps()} aria-label="Settings">
        ⚙
      </button>
      {api.open && (
        <Portal>
          <div {...api.getBackdropProps()} className="fixed inset-0 z-40 bg-black/30" />
          <div {...api.getPositionerProps()} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6">
            <div {...api.getContentProps()} className="card w-full max-w-lg space-y-5">
              <div className="flex items-center">
                <h2 {...api.getTitleProps()} className="text-lg font-semibold">
                  Study environment
                </h2>
                <button {...api.getCloseTriggerProps()} className="ml-auto px-2" aria-label="Close">
                  ✕
                </button>
              </div>
              <p {...api.getDescriptionProps()} className="text-sm text-soft">
                These change how things are shown, never what you're expected to know.
              </p>
              {OPTIONS.map((o) => (
                <fieldset key={o.key}>
                  <legend className="label mb-1">{o.label}</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {o.values.map(([v, label]) => (
                      <button
                        key={v}
                        className="btn py-1 text-sm data-[on=true]:border-ink data-[on=true]:bg-sunken"
                        data-on={settings[o.key] === v}
                        aria-pressed={settings[o.key] === v}
                        onClick={() => update({ [o.key]: v } as Partial<Settings>)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {o.hint && <p className="mt-1 text-xs text-faint">{o.hint}</p>}
                </fieldset>
              ))}
              <fieldset className="border-t border-line pt-4">
                <legend className="label mb-1">Developer: simulate time away</legend>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="number"
                    className="input w-24"
                    value={offset}
                    min={0}
                    max={120}
                    onChange={(e) => setOffset(Number(e.target.value) || 0)}
                    aria-label="Days to skip ahead"
                  />
                  days ahead. Try 5 to see the return experience on Home.
                </div>
              </fieldset>
              <div className="flex gap-2 border-t border-line pt-4">
                <button className="btn text-sm" onClick={exportJson}>
                  Export progress
                </button>
                <button
                  className="btn text-sm"
                  onClick={() => {
                    if (confirm("Reset all progress, notes and diagnostic results? This can't be undone.")) reset();
                  }}
                >
                  Reset progress
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
