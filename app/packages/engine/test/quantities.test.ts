import { describe, expect, it } from "vitest";
import { parseQuantity, toSI } from "../src";

describe("parseQuantity", () => {
  it.each([
    ["4 µC", 4e-6, "C"],
    ["4 uC", 4e-6, "C"],
    ["4μC", 4e-6, "C"],
    ["2.5 nC/m^2", 2.5e-9, "C/m^2"],
    ["2.5 nC/m²", 2.5e-9, "C/m^2"],
    ["3 cm", 0.03, "m"],
    ["3 cm^2", 3e-4, "m^2"],
    ["1.2e3 V/m", 1200, "V/m"],
    ["1.2 x 10^3 N/C", 1200, "V/m"],
    ["-7 mC", -7e-3, "C"],
    ["0.5", 0.5, "1"],
    ["5 mm", 5e-3, "m"],
  ])("%s", (input, value, dim) => {
    const q = parseQuantity(input);
    expect(q).not.toBeNull();
    expect(q!.value).toBeCloseTo(value, 15);
    expect(q!.dim).toBe(dim);
  });
  it("rejects garbage and unknown units", () => {
    expect(parseQuantity("abc")).toBeNull();
    expect(parseQuantity("4 furlongs")).toBeNull();
    expect(parseQuantity("")).toBeNull();
  });
  it("toSI converts authored answers and throws on unknown units", () => {
    expect(toSI(4, "µC")).toEqual({ value: 4e-6, dim: "C" });
    expect(() => toSI(1, "parsec")).toThrow();
  });
  it("converts inches, gigahertz and cubic centimetres", () => {
    expect(toSI(0.28, "in").value).toBeCloseTo(0.007112, 12);
    expect(toSI(0.28, "in").dim).toBe("m");
    expect(toSI(2.45, "GHz")).toEqual({ value: 2.45e9, dim: "Hz" });
    expect(toSI(5, "cm^3").value).toBeCloseTo(5e-6, 15);
  });
});
