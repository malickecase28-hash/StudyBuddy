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
  len1: "Edge 1", len2: "Edge 2", len3: "Edge 3", volume: "Volume", Q: "Total charge Q", patchFlux: "Ψ through the face", Dx: "Dₓ", Dy: "Dᵧ", Dz: "D_z", Dmag: "|D|",
  lambda: "Wavelength λ", si: "In SI base units", siM: "In metres", siM2: "In m²", siM3: "In m³", siC: "In coulombs", siHz: "In hertz", siV: "In volts", siF: "In farads", siN: "In newtons",
  g1: "∇, 1st component", g2: "∇, 2nd component", g3: "∇, 3rd component",
  Fx: "Fₓ", Fy: "Fᵧ", Fz: "F_z", Fmag: "|F|", R: "Resistance R", Ex: "Eₓ", Ey: "Eᵧ", Ez: "E_z", Emag: "|E|", E: "Electric field E",
  W: "Work done W", Vab: "V(end) − V(start)", J: "|J|", P: "Power I²R", pd: "Power density σE²", V: "Potential V", U: "Energy of the pair U",
};
const SYS: Record<string, [string, string, string]> = { cart: ["x", "y", "z"], cyl: ["ρ", "φ", "z"], sph: ["r", "θ", "φ"] };
const TONE: Record<string, "flux" | "charge" | "surface" | "field"> = {
  flux: "flux", enclosed: "charge", area: "surface", probeD: "flux", probeE: "field", outerQ: "charge", eMid: "field", dMid: "flux", total: "charge", Fmag: "charge", Emag: "field",
  dPsi: "flux", Dn: "flux", shadow: "surface", theta: "surface", magnitude: "flux", sum: "flux", vmag: "field", Q: "charge", patchFlux: "flux", Dmag: "flux",
  W: "charge", V: "field", J: "flux",
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
