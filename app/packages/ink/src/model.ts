import { z } from "zod";

export type Vec = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
/** 2D affine in canvas `setTransform(a, b, c, d, e, f)` order. */
export type Affine = [number, number, number, number, number, number];
/** x, y (world), pressure 0–1, tiltX, tiltY (degrees), t (ms). */
export type InkPoint = [number, number, number, number, number, number];
export type ColorToken = "ink" | "graphite" | "charge" | "field" | "flux" | "surface";
export type Style = { color: ColorToken; size: number; opacity: number };
export type ItemBase = { id: string; z: number; transform: Affine; style: Style };
export type StrokeItem = ItemBase & { kind: "stroke"; tool: "pen" | "highlighter"; points: InkPoint[] };
export type ShapeKind = "line" | "arrow" | "rect" | "ellipse" | "triangle" | "polygon";
export type ShapeItem = ItemBase & { kind: "shape"; shape: ShapeKind; pts: Vec[] };
export type TextItem = ItemBase & { kind: "text"; text: string; width: number };
export type EquationItem = ItemBase & { kind: "equation"; latex: string; w: number; h: number; source?: StrokeItem[] };
export type ImageItem = ItemBase & { kind: "image"; src: string; w: number; h: number };
export type PlateItem = ItemBase & { kind: "plate"; svg: string; w: number; h: number; href: string; caption: string };
export type BankItemCard = ItemBase & { kind: "bank"; questionId: string; title: string; text: string; w: number; h: number; href: string };
export type LinkItem = ItemBase & { kind: "link"; label: string; href: string };
export type Item = StrokeItem | ShapeItem | TextItem | EquationItem | ImageItem | PlateItem | BankItemCard | LinkItem;
export type Template = "blank" | "grid" | "lined" | "dot" | "derivation";
export type Page = { id: string; notebookId: string; title: string; template: Template; frame: "none" | "a4"; createdAt: number; updatedAt: number };
export type Notebook = { id: string; title: string; conceptId?: string; color: ColorToken; pageIds: string[]; createdAt: number; updatedAt: number };

export const COLOR_TOKENS: readonly ColorToken[] = ["ink", "graphite", "charge", "field", "flux", "surface"];
export const IDENTITY: Affine = [1, 0, 0, 1, 0, 0];
export const newId = (): string => crypto.randomUUID();

const num = z.number().refine(Number.isFinite, "must be finite");
const VecS = z.object({ x: num, y: num });
const AffineS = z.tuple([num, num, num, num, num, num]);
const StyleS = z.object({ color: z.enum(["ink", "graphite", "charge", "field", "flux", "surface"]), size: num.refine((n) => n > 0), opacity: num.refine((n) => n >= 0 && n <= 1) });
const base = { id: z.string().min(1), z: num, transform: AffineS, style: StyleS };
const PointS = z.tuple([num, num, num, num, num, num]);
const StrokeS = z.object({ ...base, kind: z.literal("stroke"), tool: z.enum(["pen", "highlighter"]), points: z.array(PointS).min(1) });

export const ItemSchema: z.ZodType<Item> = z.discriminatedUnion("kind", [
  StrokeS,
  z.object({ ...base, kind: z.literal("shape"), shape: z.enum(["line", "arrow", "rect", "ellipse", "triangle", "polygon"]), pts: z.array(VecS).min(2) }),
  z.object({ ...base, kind: z.literal("text"), text: z.string(), width: num }),
  z.object({ ...base, kind: z.literal("equation"), latex: z.string(), w: num, h: num, source: z.array(StrokeS).optional() }),
  z.object({ ...base, kind: z.literal("image"), src: z.string().min(1), w: num, h: num }),
  z.object({ ...base, kind: z.literal("plate"), svg: z.string().min(1), w: num, h: num, href: z.string(), caption: z.string() }),
  z.object({ ...base, kind: z.literal("bank"), questionId: z.string(), title: z.string(), text: z.string(), w: num, h: num, href: z.string() }),
  z.object({ ...base, kind: z.literal("link"), label: z.string(), href: z.string() }),
]) as z.ZodType<Item>;

const TEMPLATE = z.enum(["blank", "grid", "lined", "dot", "derivation"]);
export const PageSchema: z.ZodType<Page> = z.object({ id: z.string().min(1), notebookId: z.string().min(1), title: z.string(), template: TEMPLATE, frame: z.enum(["none", "a4"]), createdAt: num, updatedAt: num });
export const NotebookSchema: z.ZodType<Notebook> = z.object({
  id: z.string().min(1), title: z.string(), conceptId: z.string().optional(), color: StyleS.shape.color, pageIds: z.array(z.string()), createdAt: num, updatedAt: num,
}) as z.ZodType<Notebook>;

export const DEFAULT_STYLE: Style = { color: "ink", size: 3, opacity: 1 };
