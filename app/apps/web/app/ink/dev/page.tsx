"use client";

import { useState } from "react";
import type { InkEngine, ToolId } from "@forma/ink";
import { InkCanvas } from "@/components/ink/InkCanvas";

/** Scratch route for the engine walkthrough (removed in Task 5). */
export default function InkDev() {
  const [engine, setEngine] = useState<InkEngine | null>(null);
  const [tool, setTool] = useState<ToolId>("pen");
  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="flex gap-2 p-2">
        {(["pen", "highlighter", "hand"] as ToolId[]).map((t) => (
          <button key={t} className={`btn ${tool === t ? "btn-primary" : ""}`} onClick={() => { engine?.setTool(t); setTool(t); }}>{t}</button>
        ))}
        <button className="btn" onClick={() => engine?.undo()}>Undo</button>
        <button className="btn" onClick={() => engine?.redo()}>Redo</button>
        <button className="btn" onClick={() => engine?.fitToContent()}>Fit</button>
      </div>
      <div className="min-h-0 flex-1"><InkCanvas onReady={setEngine} /></div>
    </div>
  );
}
