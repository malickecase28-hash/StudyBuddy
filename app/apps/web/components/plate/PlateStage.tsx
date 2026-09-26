"use client";

import { fromSvg, VIEWBOX, type Frame, type PlateDef, type TimelineFrame } from "@forma/plate";
import { Component, useMemo, useRef, type ReactNode } from "react";
import { StageContext, type StageApi } from "./stage-context";
import { EquationView, views2d } from "./views2d";

class Guard extends Component<{ id: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <text className="plate-label">{`${this.props.id}: could not be drawn`}</text> : this.props.children;
  }
}

function PlateDefs() {
  return (
    <defs>
      <pattern id="plate-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M20 0H0V20" fill="none" className="grid-line" />
      </pattern>
      {(["charge", "surface", "graphite"] as const).map((c) => (
        <pattern key={c} id={`hatch-${c}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: `var(--${c})` }} strokeWidth="1" />
        </pattern>
      ))}
      {(["flux", "surface", "graphite"] as const).map((c) => (
        <marker key={c} id={`arrow-${c}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7" fill="none" style={{ stroke: `var(--${c})` }} />
        </marker>
      ))}
      <marker id="tick" markerWidth="2" markerHeight="10" refX="1" refY="5" orient="auto">
        <path d="M1 0V10" style={{ stroke: "var(--graphite)" }} />
      </marker>
    </defs>
  );
}

export function PlateStage({
  plate, timeline, frame, label, highlight = [], editable = [], onEdit, onTerm,
}: {
  plate: PlateDef; timeline: TimelineFrame; frame: Frame; label: string;
  highlight?: string[]; editable?: string[]; onEdit?: (id: string, params: Record<string, unknown>) => void; onTerm?: (key: string) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const api = useMemo<StageApi>(
    () => ({
      toMetres: (cx, cy) => {
        const m = svg.current?.getScreenCTM();
        if (!m) return [0, 0, 0];
        const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
        return fromSvg(p.x, p.y);
      },
      edit: (id, params) => onEdit?.(id, params),
      editable: (id) => editable.includes(id),
    }),
    [editable, onEdit],
  );
  return (
    <StageContext value={api}>
      <figure className="plate">
        <svg ref={svg} viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`} className="plate-svg" role="group" aria-label={label}>
          <PlateDefs />
          <rect x={VIEWBOX.x} y={VIEWBOX.y} width={VIEWBOX.w} height={VIEWBOX.h} fill="url(#plate-grid)" />
          {plate.instances.map((inst) => {
            const ev = frame[inst.id];
            const View = views2d[inst.component];
            if (!ev?.visible || !View) return null;
            const focused = timeline.focus.includes(inst.id);
            return (
              <g key={inst.id} data-instance={inst.id} className="plate-instance" opacity={timeline.opacity[inst.id] ?? 1} data-focus={focused} data-highlight={highlight.includes(inst.id)}>
                <Guard id={inst.id}>
                  <View id={inst.id} ev={ev} appear={timeline.appear[inst.id] ?? 1} focused={focused} highlighted={highlight.includes(inst.id)} />
                </Guard>
              </g>
            );
          })}
        </svg>
        {plate.instances
          .filter((i) => i.component === "equation" && frame[i.id]?.visible)
          .map((i) => (
            <EquationView key={i.id} ev={frame[i.id]!} {...(onTerm ? { onTerm } : {})} />
          ))}
      </figure>
    </StageContext>
  );
}
