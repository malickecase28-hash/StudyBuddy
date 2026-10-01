"use client";

import { registry } from "@forma/course-em1";
import type { Frame, PlateDef } from "@forma/plate";
import { Readout } from "@forma/ui";

const LABEL: Record<string, string> = {
  flux: "Ψ, flux out", enclosed: "Q enclosed", area: "Surface area", probeD: "|D| at probe", probeE: "|E| at probe",
  outerQ: "Outer sphere", eMid: "|E| at 0.5 m", dMid: "|D| at 0.5 m", total: "Total charge",
  dPsi: "dΨ through the patch", Dn: "D·n̂", shadow: "Shadow A cos θ", theta: "θ (D to normal)", magnitude: "|D|", sum: "Σ D·dS over the patches", count: "Patches",
  vx: "x-component", vy: "y-component", vz: "z-component", vmag: "Magnitude",
  vxm: "x-component", vym: "y-component", vzm: "z-component", vmagm: "Length",
  px: "x", py: "y", pz: "z", pRho: "ρ", pPhi: "φ", pR: "r", pTheta: "θ (from +z)",
  f: "Value at the probe", gmag: "|∇| at the probe",
  F1: "1st component", F2: "2nd component", F3: "3rd component", div: "∇· at the probe",
  c1: "curl, 1st", c2: "curl, 2nd", c3: "curl, 3rd",
  boxFlux: "Net flux out of the box", boxRatio: "Flux ÷ box volume", circ: "Circulation round the loop", circRatio: "Circulation ÷ loop area",
  len1: "Edge 1", len2: "Edge 2", len3: "Edge 3", volume: "Volume", Q: "Charge Q", patchFlux: "Ψ through the face", Dx: "Dₓ", Dy: "Dᵧ", Dz: "D_z", Dmag: "|D|",
  lambda: "Wavelength λ", si: "In SI base units", siM: "In metres", siM2: "In m²", siM3: "In m³", siC: "In coulombs", siHz: "In hertz", siV: "In volts", siF: "In farads", siN: "In newtons",
  g1: "∇, 1st component", g2: "∇, 2nd component", g3: "∇, 3rd component",
  Fx: "Fₓ", Fy: "Fᵧ", Fz: "F_z", Fmag: "|F|", R: "Resistance R", Ex: "Eₓ", Ey: "Eᵧ", Ez: "E_z", Emag: "|E|", E: "Electric field E",
  W: "Work done W", Vab: "V(end) − V(start)", J: "|J|", P: "Power I²R", pd: "Power density σE²", V: "Potential V", U: "Energy of the pair U",
  Hx: "H x", Hy: "H y", Hz: "H z", Hmag: "|H|", Hphi: "Hφ", Bmag: "|B|", Ienc: "I enclosed",
  H1nx: "H₁ normal, x", H1ny: "H₁ normal, y", H1nz: "H₁ normal, z", H1tx: "H₁ tangential, x", H1ty: "H₁ tangential, y", H1tz: "H₁ tangential, z",
  H1x: "H₁ x", H1y: "H₁ y", H1z: "H₁ z", H2x: "H₂ x", H2y: "H₂ y", H2z: "H₂ z",
  B1x: "B₁ x", B1y: "B₁ y", B1z: "B₁ z", B2x: "B₂ x", B2y: "B₂ y", B2z: "B₂ z",
  M1x: "M₁ x", M1y: "M₁ y", M1z: "M₁ z", M2x: "M₂ x", M2y: "M₂ y", M2z: "M₂ z",
  I: "Current I", emf: "emf", emfPeak: "Peak emf", Phi: "Flux Φ", alpha: "α", beta: "β", u: "Phase velocity u", eta: "|η|", thetaEta: "θη", lossTan: "Loss tangent σ/ωε", delta: "Skin depth δ", Eamp: "E amplitude here", Ewave: "E(z, t)", Hwave: "H(z, t)", Pave: "Average power density",
  H1mag: "|H₁|", H2mag: "|H₂|", B1mag: "|B₁|", B2mag: "|B₂|", L: "Inductance L", link: "Flux linkage LI",
  nx: "n̂ₓ", ny: "n̂ᵧ", nz: "n̂z", D1nx: "D₁ normal, x", D1ny: "D₁ normal, y", D1nz: "D₁ normal, z", D1tx: "D₁ tangential, x", D1ty: "D₁ tangential, y", D1tz: "D₁ tangential, z",
  D1x: "D₁ x", D1y: "D₁ y", D1z: "D₁ z", D2x: "D₂ x", D2y: "D₂ y", D2z: "D₂ z", E1x: "E₁ x", E1y: "E₁ y", E1z: "E₁ z", E2x: "E₂ x", E2y: "E₂ y", E2z: "E₂ z",
  P1x: "P₁ x", P1y: "P₁ y", P1z: "P₁ z", P2x: "P₂ x", P2y: "P₂ y", P2z: "P₂ z", th1: "θ₁", th2: "θ₂", rhoS: "ρs",
  D1mag: "|D₁|", D2mag: "|D₂|", E1mag: "|E₁|", E2mag: "|E₂|", C: "Capacitance C", Eg: "Largest |E|", wE: "Energy density ½εE²",
};
const SYS: Record<string, [string, string, string]> = { cart: ["x", "y", "z"], cyl: ["ρ", "φ", "z"], sph: ["r", "θ", "φ"] };
const TONE: Record<string, "flux" | "charge" | "surface" | "field"> = {
  Ewave: "field", Eamp: "field", Hwave: "flux", Pave: "charge", emf: "charge",
  flux: "flux", enclosed: "charge", area: "surface", probeD: "flux", probeE: "field", outerQ: "charge", eMid: "field", dMid: "flux", total: "charge", Fmag: "charge", Emag: "field",
  Hmag: "field", Hphi: "field", Bmag: "flux", Ienc: "charge", H2x: "field", H2y: "field", H2z: "field", B2x: "flux", B2y: "flux", B2z: "flux", L: "surface",
  dPsi: "flux", Dn: "flux", shadow: "surface", theta: "surface", magnitude: "flux", sum: "flux", vmag: "field", Q: "charge", patchFlux: "flux", Dmag: "flux",
  W: "charge", V: "field", J: "flux", D2x: "flux", D2y: "flux", D2z: "flux", E2x: "field", E2y: "field", E2z: "field", rhoS: "charge", C: "surface", th1: "surface", th2: "surface",
};
const pretty = (unit: string) => unit.replace("^2", "²").replace("^3", "³");

export function PlateReadouts({ plate, frame, hidden = [] }: { plate: PlateDef; frame: Frame; hidden?: { instance: string; readout: string }[] }) {
  const rows = plate.instances.flatMap((inst) => {
    const ev = frame[inst.id];
    if (!ev?.visible || ev.params.readout === false || (inst.component === "faraday-spheres" && ev.params.revealed !== true)) return [];
    return Object.entries(registry.get(inst.component).readouts)
      .filter(([name]) => name in ev.model && !hidden.some((h) => h.instance === inst.id && h.readout === name))
      .map(([name, unit]) => {
        let label = (inst.component === "vector3" ? `${String(ev.params.label)} ` : "") + (LABEL[name] ?? name);
        if (inst.component === "spectrum" && name === "f") label = "Frequency f";
        if (inst.component === "conductor" && name === "E") label = "|E| in the conductor";
        if (inst.component === "capacitor" && name === "W") label = "Stored energy W";
        if (inst.component === "inductor" && name === "W") label = "Stored energy W";
        if (inst.component === "emf-loop" && name === "I") label = "Induced current";
        if (inst.component === "coulomb-force" && name === "R") label = "Separation R";
        if (inst.component === "scalar-slice" || inst.component === "vector-slice") {
          const sys = SYS[String(ev.model.system)] ?? SYS.cart!;
          label = label.replace("1st", sys[0]).replace("2nd", sys[1]).replace("3rd", sys[2]);
        }
        return { key: `${inst.id}.${name}`, name, unit, label, value: typeof ev.model[name] === "number" ? (ev.model[name] as number) : null };
      });
  });
  if (!rows.length) return null;
  return (
    <div className="readouts" role="group" aria-label="Instrument readouts">
      {rows.map((r) => (
        <Readout key={r.key} label={r.label} value={r.value} unit={pretty(r.unit)} {...(TONE[r.name] ? { tone: TONE[r.name] } : {})} />
      ))}
    </div>
  );
}
