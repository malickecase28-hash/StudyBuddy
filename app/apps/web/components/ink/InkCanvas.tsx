"use client";

import { useEffect, useRef } from "react";
import { InkEngine, type EngineEvents } from "@forma/ink";

/** Mounts an InkEngine on a full-size host. The engine is created once; `onReady` hands it to the parent. */
export function InkCanvas({ onReady, events, className = "", label = "Ink page" }: { onReady: (e: InkEngine) => void; events?: EngineEvents; className?: string; label?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const ev = useRef(events);
  ev.current = events;
  useEffect(() => {
    if (!host.current) return;
    const engine = new InkEngine(host.current, {
      onChange: (op, o) => ev.current?.onChange?.(op, o),
      onSelection: (ids) => ev.current?.onSelection?.(ids),
      onView: () => ev.current?.onView?.(),
      onTool: (t) => ev.current?.onTool?.(t),
    });
    (window as unknown as { __ink?: InkEngine }).__ink = engine; // handle for the browser walkthrough and debugging
    onReady(engine);
    return () => engine.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={host} role="img" aria-label={label} className={`ink-host relative h-full w-full select-none overflow-hidden ${className}`} />;
}
