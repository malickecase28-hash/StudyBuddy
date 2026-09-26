"use client";

import type { Block } from "@forma/engine";
import { Component, type ReactNode } from "react";
import { McqView, IdentifyView, PredictView } from "./choice";
import { SourceTag } from "./Feedback";
import { BranchView, CheckpointView, OrderView, RemediateView, RetrievalView } from "./flow";
import { ChallengeView, NumericView, StepSolveView } from "./numeric";
import { SimView } from "./sim";
import { EquationBuildView, FigureView, ProseView } from "./teaching";
import type { BlockCtx } from "./types";

/** Blocks that are complete as soon as they're shown (no interaction required to continue). */
export const PASSIVE: ReadonlySet<Block["type"]> = new Set(["prose", "figure", "sim-3d", "sim-2d", "remediate"]);

function render(block: Block, ctx: BlockCtx): ReactNode {
  switch (block.type) {
    case "prose":
      return <ProseView block={block} />;
    case "figure":
      return <FigureView block={block} />;
    case "equation-build":
      return <EquationBuildView block={block} ctx={ctx} />;
    case "sim-3d":
    case "sim-2d":
    case "manipulate":
      return <SimView block={block} ctx={ctx} />;
    case "predict":
      return <PredictView block={block} ctx={ctx} />;
    case "mcq":
      return <McqView block={block} ctx={ctx} />;
    case "identify":
      return <IdentifyView block={block} ctx={ctx} />;
    case "numeric":
      return <NumericView block={block} ctx={ctx} />;
    case "step-solve":
      return <StepSolveView block={block} ctx={ctx} />;
    case "challenge":
      return <ChallengeView block={block} ctx={ctx} />;
    case "order":
      return <OrderView block={block} ctx={ctx} />;
    case "branch":
      return <BranchView block={block} ctx={ctx} />;
    case "checkpoint":
      return <CheckpointView block={block} ctx={ctx} />;
    case "remediate":
      return <RemediateView block={block} />;
    case "retrieval":
      return <RetrievalView block={block} ctx={ctx} />;
  }
}

export function BlockView({ block, ctx }: { block: Block; ctx: BlockCtx }) {
  return (
    <section className="group relative" data-block={block.id} data-mood={block.mood}>
      <div className="absolute -right-6 top-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <SourceTag doc={block.source.doc} locator={block.source.locator} licence={block.licence} />
      </div>
      <BlockBoundary id={block.id}>{render(block, ctx)}</BlockBoundary>
    </section>
  );
}

/** One broken block must not take down the lesson. */
class BlockBoundary extends Component<{ id: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error(`Block ${this.props.id} failed to render`, error);
  }
  render() {
    if (this.state.failed) {
      return (
        <p className="rounded-md border border-line p-3 text-sm text-soft">
          This part of the lesson couldn't be displayed. You can safely continue.
        </p>
      );
    }
    return this.props.children;
  }
}
