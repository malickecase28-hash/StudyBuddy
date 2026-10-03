import type { ToolId } from "@forma/engine";

export const TOOLS: { id: ToolId; label: string; glyph: string; keywords: string }[] = [
  { id: "paper", label: "Ink", glyph: "✎", keywords: "ink working paper draw sketch pen write notes" },
  { id: "notebook", label: "Saved items", glyph: "▤", keywords: "notebook notes saved snapshots equations" },
  { id: "formulas", label: "Formula sheet", glyph: "∑", keywords: "equations formulas" },
  { id: "sources", label: "Sources", glyph: "ⓘ", keywords: "references notes textbook provenance" },
  { id: "calculator", label: "Calculator", glyph: "⌗", keywords: "compute evaluate numbers" },
];
