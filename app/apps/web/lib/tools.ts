import type { ToolId } from "@forma/engine";

export const TOOLS: { id: ToolId; label: string; glyph: string; keywords: string }[] = [
  { id: "paper", label: "Working paper", glyph: "✎", keywords: "draw sketch pen write" },
  { id: "notebook", label: "Notebook", glyph: "▤", keywords: "notes saved snapshots" },
  { id: "formulas", label: "Formula sheet", glyph: "∑", keywords: "equations formulas" },
  { id: "sources", label: "Sources", glyph: "ⓘ", keywords: "references slides textbook provenance" },
  { id: "calculator", label: "Calculator", glyph: "⌗", keywords: "compute evaluate numbers" },
];
