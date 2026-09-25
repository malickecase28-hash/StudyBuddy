import { z } from "zod";
import { Choice, Dimension, Id, Licence, Mood, NumericAnswerFields, Semantic, Source, Tag } from "./common";

const base = { id: Id, mood: Mood, source: Source, licence: Licence };
const simConfig = z.record(z.string(), z.unknown());

export const ProseBlock = z.object({ ...base, type: z.literal("prose"), text: z.string().min(1) });

export const EquationBuildBlock = z.object({
  ...base,
  type: z.literal("equation-build"),
  steps: z
    .array(z.object({ latex: z.string().min(1), caption: z.string(), highlights: z.array(z.string()).default([]) }))
    .min(1),
  bindings: z.record(z.string(), Semantic).default({}),
});

export const FigureBlock = z.object({
  ...base,
  type: z.literal("figure"),
  asset: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string(),
});

export const Sim3dBlock = z.object({
  ...base,
  type: z.literal("sim-3d"),
  scene: z.string().min(1),
  config: simConfig,
  caption: z.string(),
});
export const Sim2dBlock = z.object({
  ...base,
  type: z.literal("sim-2d"),
  scene: z.string().min(1),
  config: simConfig,
  caption: z.string(),
});

export const PredictBlock = z.object({
  ...base,
  type: z.literal("predict"),
  prompt: z.string().min(1),
  options: z.array(Choice).min(2),
  reveal: z.string().min(1),
  dimension: Dimension,
});

export const ManipulateBlock = z.object({
  ...base,
  type: z.literal("manipulate"),
  scene: z.string().min(1),
  config: simConfig,
  goal: z.string().min(1),
  check: z.string().min(1),
  dimension: Dimension,
});

export const IdentifyBlock = z.object({
  ...base,
  type: z.literal("identify"),
  prompt: z.string().min(1),
  scene: z.string().min(1),
  targets: z.array(Choice).min(2),
  dimension: Dimension,
});

export const OrderBlock = z.object({
  ...base,
  type: z.literal("order"),
  prompt: z.string().min(1),
  items: z.array(z.object({ id: Id, label: z.string().min(1) })).min(2),
  correctOrder: z.array(Id).min(2),
  feedback: z.string().min(1),
  dimension: Dimension,
});

export const McqBlock = z.object({
  ...base,
  type: z.literal("mcq"),
  prompt: z.string().min(1),
  options: z.array(Choice).min(2),
  selfExplain: z.object({ prompt: z.string().min(1), options: z.array(Choice).min(2) }).optional(),
  dimension: Dimension,
});

export const NumericBlock = z.object({
  ...base,
  type: z.literal("numeric"),
  prompt: z.string().min(1),
  ...NumericAnswerFields,
  hints: z.array(z.string()).max(3).default([]),
  dimension: Dimension,
});

export const StepSolveBlock = z.object({
  ...base,
  type: z.literal("step-solve"),
  prompt: z.string().min(1),
  steps: z
    .array(
      z.object({
        id: Id,
        prompt: z.string().min(1),
        ...NumericAnswerFields,
        hints: z.array(z.string().min(1)).length(3),
        workedStep: z.string().min(1),
      }),
    )
    .min(1),
  dimension: Dimension,
});

export const ChallengeBlock = z.object({
  ...base,
  type: z.literal("challenge"),
  prompt: z.string().min(1),
  ...NumericAnswerFields,
  dimensions: z.array(Dimension).min(1),
});

export const RemediateBlock = z.object({
  ...base,
  type: z.literal("remediate"),
  tag: Tag,
  lessonRef: z.string().min(1),
  message: z.string().min(1),
});

export const RetrievalBlock = z.object({
  ...base,
  type: z.literal("retrieval"),
  conceptId: z.string().min(1),
  dimension: Dimension,
  item: z.discriminatedUnion("type", [McqBlock, NumericBlock]),
});

export const AssessmentBlock = z.discriminatedUnion("type", [McqBlock, NumericBlock, StepSolveBlock, ChallengeBlock]);

export const CheckpointBlock = z.object({
  ...base,
  type: z.literal("checkpoint"),
  title: z.string().min(1),
  items: z.array(AssessmentBlock).min(1),
  passRatio: z.number().min(0).max(1),
});

const LeafBlock = z.discriminatedUnion("type", [
  ProseBlock,
  EquationBuildBlock,
  FigureBlock,
  Sim3dBlock,
  Sim2dBlock,
  PredictBlock,
  ManipulateBlock,
  IdentifyBlock,
  OrderBlock,
  McqBlock,
  NumericBlock,
  StepSolveBlock,
  ChallengeBlock,
  CheckpointBlock,
  RemediateBlock,
  RetrievalBlock,
]);
type LeafBlock = z.infer<typeof LeafBlock>;

// Branches contain blocks, so the recursive types are written out explicitly.
const branchHead = z.object({ ...base, type: z.literal("branch"), prompt: z.string().min(1) });
export type BranchOption = { id: string; label: string; blocks: Block[] };
export type BranchBlock = z.infer<typeof branchHead> & { options: BranchOption[] };
export type Block = LeafBlock | BranchBlock;

export const BranchBlock: z.ZodType<BranchBlock> = branchHead.extend({
  options: z
    .array(z.object({ id: Id, label: z.string().min(1), blocks: z.array(z.lazy(() => Block)).min(1) }))
    .min(1),
});

export const Block: z.ZodType<Block> = z.union([LeafBlock, BranchBlock]);

export type McqBlock = z.infer<typeof McqBlock>;
export type NumericBlock = z.infer<typeof NumericBlock>;
export type StepSolveBlock = z.infer<typeof StepSolveBlock>;
export type ChallengeBlock = z.infer<typeof ChallengeBlock>;
export type CheckpointBlock = z.infer<typeof CheckpointBlock>;
export type BlockType = Block["type"];
