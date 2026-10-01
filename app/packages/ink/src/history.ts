import type { Item } from "./model";
import { apply, invert, InvalidOp, type Op } from "./ops";

/** Grouped undo/redo over ops. One gesture (begin…end) is one undo step. */
export class History {
  private undoStack: Op[][] = [];
  private redoStack: Op[][] = [];
  private open: Op[] | null = null;
  private depth = 0;
  constructor(private items: Map<string, Item>, private onChange: (op: Op, origin: "do" | "undo" | "redo") => void) {}

  begin(): void {
    if (this.depth++ === 0) this.open = [];
  }
  end(): void {
    if (this.depth === 0) return;
    if (--this.depth > 0) return;
    if (this.open && this.open.length) { this.undoStack.push(this.open); this.redoStack = []; }
    this.open = null;
  }
  push(op: Op): void {
    try {
      apply(this.items, op);
    } catch (e) {
      if (e instanceof InvalidOp) { console.warn("[ink] dropped invalid op", e.message); return; }
      throw e;
    }
    if (this.open) this.open.push(op);
    else { this.undoStack.push([op]); this.redoStack = []; }
    this.onChange(op, "do");
  }
  undo(): boolean {
    const g = this.undoStack.pop();
    if (!g) return false;
    for (let i = g.length - 1; i >= 0; i--) { const inv = invert(g[i]!); apply(this.items, inv); this.onChange(inv, "undo"); }
    this.redoStack.push(g);
    return true;
  }
  redo(): boolean {
    const g = this.redoStack.pop();
    if (!g) return false;
    for (const op of g) { apply(this.items, op); this.onChange(op, "redo"); }
    this.undoStack.push(g);
    return true;
  }
  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }
  clear(): void { this.undoStack = []; this.redoStack = []; this.open = null; this.depth = 0; }
}
