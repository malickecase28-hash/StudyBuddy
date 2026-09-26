import { describe, expect, it } from "vitest";
import { densities, electricField, enclosedCharge, totalCharge, vectorFields } from "../src";

const EPS0 = 8.8541878128e-12;

describe("densities", () => {
  it("HW02 2.5(a): ρL = 12x² mC/m on 1 < x < 5 m gives 496 mC", () => {
    expect(totalCharge(densities["hw-2.5a"]!, [[1, 5], [0, 0], [0, 0]])).toBeCloseTo(0.496, 12);
  });
  it("HW02 2.5(b): ρS = πρz² pC/m² on ρ = 4 m, 0 < z < 7 m gives 36.11 nC", () => {
    expect(totalCharge(densities["hw-2.5b"]!, [[4, 4], [0, 2 * Math.PI], [0, 7]])).toBeCloseTo(3.610959e-8, 13);
  });
  it("HW02 2.5(c): ρv = 3.05/(r sin θ) C/m³ within r = 5.25 m gives 829.69 C (needs the r² sin θ Jacobian)", () => {
    expect(totalCharge(densities["hw-2.5c"]!, [[0, 5.25], [0, Math.PI], [0, 2 * Math.PI]])).toBeCloseTo(829.6945, 3);
  });
  it("MST Q4(b): ρv = ρ² sin φ µC/m³ over the half-cylinder gives 1.6 nC", () => {
    expect(totalCharge(densities["mst-4b"]!, [[0, 0.2], [0, Math.PI], [-4, -2]])).toBeCloseTo(1.6e-9, 16);
  });
  it("HW02 2.6: ρv = 3y C/m³ in 0 < x, y, z < 2 gives 24 C", () => {
    expect(totalCharge(densities["hw-2.6"]!, [[0, 2], [0, 2], [0, 2]])).toBeCloseTo(24, 10);
  });
});

describe("ball charge", () => {
  const ball = { kind: "ball" as const, rhoV: 3e-6, radius: 1, center: [0, 0, 0] as [number, number, number] };
  it("E inside grows linearly; outside it falls as 1/r²", () => {
    expect(electricField([ball], [0.5, 0, 0])[0] * EPS0 * 1e6).toBeCloseTo(0.5, 10);
    expect(electricField([ball], [1.5, 0, 0])[0] * EPS0 * 1e6).toBeCloseTo(4 / 9, 10);
  });
  it("a concentric sphere encloses ρv(4/3)π min(r, a)³", () => {
    expect(enclosedCharge([ball], { kind: "sphere", center: [0, 0, 0], radius: 0.5 })).toBeCloseTo(3e-6 * (Math.PI / 6), 18);
    expect(enclosedCharge([ball], { kind: "sphere", center: [0, 0, 0], radius: 2 })).toBeCloseTo(3e-6 * (4 * Math.PI) / 3, 18);
  });
  it("refuses a partial, off-centre enclosure", () => {
    expect(() => enclosedCharge([ball], { kind: "sphere", center: [0.8, 0, 0], radius: 0.5 })).toThrow();
  });
});

describe("new vector fields", () => {
  it("HW02 2.6: ∇·D = 3y", () => {
    expect(vectorFields["hw-2.6"]!.div([1, 2, 0.5])).toBe(6);
  });
  it("Finals 23-24 Q2(b): ε₀∇·E = 8πε₀ at r = 2 and −6πε₀/625 at r = 5", () => {
    expect(EPS0 * vectorFields["f2324-2b"]!.div([2, 1, 1])).toBeCloseTo(2.2253e-10, 13);
    expect(EPS0 * vectorFields["f2324-2b"]!.div([5, 1, 1])).toBeCloseTo(-2.67036e-13, 17);
  });
});
