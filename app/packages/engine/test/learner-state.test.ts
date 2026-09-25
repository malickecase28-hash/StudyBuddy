import { describe, expect, it } from "vitest";
import { emptyProgress, initialState, migrate, STATE_VERSION } from "../src";

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
