import { describe, expect, it } from "vitest";
import { defaultWorkspace, emptyProgress, initialState, migrate, STATE_VERSION } from "../src";

describe("learner state", () => {
  it("initial state is empty and versioned", () => {
    const s = initialState();
    expect(s.version).toBe(STATE_VERSION);
    expect(s.concepts).toEqual({});
    expect(s.settings.theme).toBe("paper");
    expect(emptyProgress().dimensions.conceptual).toBe(0);
  });
  it("migrate(null) returns a fresh state without reset", () => {
    expect(migrate(null)).toEqual({ state: initialState(), reset: false });
  });
  it("migrate keeps a valid v1 state", () => {
    const s = initialState();
    s.concepts["em1.x.y"] = emptyProgress();
    const out = migrate(JSON.parse(JSON.stringify(s)));
    expect(out.reset).toBe(false);
    expect(out.state.concepts["em1.x.y"]).toBeDefined();
  });
  it("migrate backs up and resets corrupted or unknown-version state", () => {
    const bad = { version: 99, junk: true };
    const out = migrate(bad);
    expect(out.reset).toBe(true);
    expect(out.backup).toBe(bad);
    expect(out.state).toEqual(initialState());
    expect(migrate({ version: 1, concepts: "nope" }).reset).toBe(true);
  });
});
describe("v2", () => {
  it("initial state is v2 with a default workspace", () => {
    const s = initialState();
    expect(s.version).toBe(2);
    expect(s.workspace.lastMode).toBe("learn");
    expect(s.workspace.layouts.solve.split).toBe(0.5);
    expect(s.settings.narration).toBe("off");
  });
  it("migrates real v1 data without losing anything", () => {
    const v1 = {
      version: 1,
      diagnostic: null,
      concepts: {},
      position: { conceptId: "em1.electrostatics.gauss-law", lessonId: "main", blockId: "hook", branchStack: [] },
      notebook: [{ id: "n1", createdAt: 1, conceptId: "c", kind: "drawing", title: "t", body: "<svg/>", text: "hi" }],
      settings: { theme: "night", motion: "reduced", density: "compact", simQuality: "low", equationDetail: "full" },
      history: [],
    };
    const out = migrate(v1);
    expect(out.reset).toBe(false);
    expect(out.state.version).toBe(2);
    expect(out.state.settings.theme).toBe("blueprint");
    expect(out.state.settings.motion).toBe("reduced");
    expect(out.state.notebook[0]).toMatchObject({ kind: "drawing", text: "hi" });
    expect(out.state.position?.blockId).toBe("hook");
    expect(out.state.workspace).toEqual(defaultWorkspace());
    expect(out.state.seeds).toEqual({});
  });
});
