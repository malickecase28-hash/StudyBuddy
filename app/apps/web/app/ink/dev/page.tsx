"use client";

import { useState } from "react";
import { toggleRuler, type InkEngine, type ToolId } from "@forma/ink";
import { InkCanvas } from "@/components/ink/InkCanvas";
import { SelectionHandles } from "@/components/ink/SelectionHandles";

const TOOLS: ToolId[] = ["pen", "highlighter", "eraser", "precise-eraser", "lasso", "shape", "ruler", "hand"];

/** Scratch route for the engine walkthrough (removed in Task 5). */
export default function InkDev() {
  const [engine, setEngine] = useState<InkEngine | null>(null);
  const [tool, setTool] = useState<ToolId>("pen");
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);
  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="flex flex-wrap gap-2 p-2">
        {TOOLS.map((t) => (
          <button key={t} className={`btn ${tool === t ? "btn-primary" : ""}`} onClick={() => { engine?.setTool(t); setTool(t); }}>{t}</button>
        ))}
        <button className="btn" onClick={() => engine && toggleRuler(engine)}>Ruler on/off</button>
        <button className="btn" onClick={() => engine?.undo()}>Undo</button>
        <button className="btn" onClick={() => engine?.redo()}>Redo</button>
        <button className="btn" onClick={() => engine?.fitToContent()}>Fit</button>
      </div>
      <div className="relative min-h-0 flex-1">
        <InkCanvas onReady={setEngine} events={{ onView: bump, onSelection: bump, onChange: bump }} />
        <SelectionHandles engine={engine} version={version} />
      </div>
    </div>
  );
}
