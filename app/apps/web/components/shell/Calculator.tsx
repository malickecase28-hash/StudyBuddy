"use client";

import { evaluateNumeric } from "@forma/engine";
import { formatValue } from "@forma/ui";
import { useState } from "react";

/** LaTeX-in, number-out. ε₀ is its SI value; anything with a free variable is refused. */
export function Calculator() {
  const [input, setInput] = useState("\\frac{2\\times10^{-6}}{4\\pi (0.5)^2}");
  const value = evaluateNumeric(input);
  return (
    <div className="space-y-2">
      <label className="label block" htmlFor="calc">Expression (LaTeX)</label>
      <input id="calc" className="input w-full font-mono" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
      <output className="readout-value block" aria-live="polite">{value === null ? "Can't evaluate that yet" : `= ${formatValue(value, 6)}`}</output>
      <p className="text-xs text-soft">{String.raw`Use \frac{a}{b}, ^{…}, \pi, \times, \varepsilon_0.`}</p>
    </div>
  );
}
