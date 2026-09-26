"use client";

import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { conceptHref, course } from "@/lib/course";
import { conceptProgress, pct, STATE_GLYPH } from "@/lib/progress";
import { useStudy } from "@/lib/store";

type ConceptNodeData = { title: string; mastery: number; state: keyof typeof STATE_GLYPH; locked: boolean; onRoute: boolean; unlockHint: string };

function Ring({ value }: { value: number }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" aria-hidden>
      <circle cx={18} cy={18} r={r} fill="none" stroke="var(--line)" strokeWidth={4} />
      <circle
        cx={18}
        cy={18}
        r={r}
        fill="none"
        stroke="var(--sem-confirmed)"
        strokeWidth={4}
        strokeDasharray={`${c * value} ${c}`}
        transform="rotate(-90 18 18)"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ConceptNode({ data }: NodeProps<Node<ConceptNodeData>>) {
  const g = STATE_GLYPH[data.state];
  return (
    <div
      className="w-52 rounded-xl border bg-raised px-3 py-2 text-left shadow-sm data-[locked=true]:opacity-50 data-[route=true]:border-2"
      style={{ borderColor: data.onRoute ? "var(--sem-flux)" : "var(--line)" }}
      data-locked={data.locked}
      data-route={data.onRoute}
      title={data.locked ? data.unlockHint : `${g.label} · ${pct(data.mastery)} mastery`}
    >
      <Handle type="target" position={Position.Left} className="!bg-line" />
      <div className="flex items-center gap-2">
        {data.locked ? <span className="w-9 text-center text-lg">🔒</span> : <Ring value={data.mastery} />}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{data.title}</p>
          <p className="text-xs text-soft">{data.locked ? "Coming later" : `${g.glyph} ${g.label}`}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-line" />
    </div>
  );
}

const nodeTypes = { concept: ConceptNode };

export function ConceptMap({ height = 560 }: { height?: number }) {
  const learner = useStudy((s) => s.learner);
  const router = useRouter();

  const { nodes, edges } = useMemo(() => {
    const byId = new Map(course.concepts.map((c) => [c.id, c]));
    const depth = new Map<string, number>();
    const d = (id: string): number => {
      if (depth.has(id)) return depth.get(id)!;
      const c = byId.get(id)!;
      const v = c.prerequisites.length ? 1 + Math.max(...c.prerequisites.map((p) => d(p.conceptId))) : 0;
      depth.set(id, v);
      return v;
    };
    course.concepts.filter((c) => !c.locked).forEach((c) => d(c.id));
    const maxDepth = Math.max(...depth.values());
    course.concepts.filter((c) => c.locked).forEach((c, i) => depth.set(c.id, maxDepth + 1 + Math.floor(i / 3)));

    const rows = new Map<number, number>();
    const route = new Set(learner.diagnostic?.route ?? []);
    const nodes: Node<ConceptNodeData>[] = course.concepts.map((c) => {
      const col = depth.get(c.id)!;
      const row = rows.get(col) ?? 0;
      rows.set(col, row + 1);
      const { mastery, state } = conceptProgress(learner, c.id);
      return {
        id: c.id,
        type: "concept",
        position: { x: col * 260, y: row * 110 + (col % 2) * 40 },
        data: {
          title: c.title,
          mastery,
          state,
          locked: c.locked,
          onRoute: route.has(c.id),
          unlockHint: "Unlocks in a later build of this course.",
        },
      };
    });
    const edges: Edge[] = course.concepts.flatMap((c) =>
      c.prerequisites.map((p) => ({
        id: `${p.conceptId}->${c.id}`,
        source: p.conceptId,
        target: c.id,
        style: { stroke: "var(--ink-faint)" },
      })),
    );
    return { nodes, edges };
  }, [learner]);

  return (
      <div className="overflow-hidden rounded-xl border border-line bg-raised" style={{ height }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, n) => {
            const c = course.concepts.find((x) => x.id === n.id);
            if (c && !c.locked) router.push(conceptHref(c.id, "learn"));
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} color="var(--line)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
  );
}
