"use client";

import { registry } from "@forma/course-em1";
import type { Frame, PlateDef } from "@forma/plate";
import { Readout } from "@forma/ui";

const LABEL: Record<string, string> = {
  flux: "Ψ, flux out", enclosed: "Q enclosed", area: "Surface area", probeD: "|D| at probe", probeE: "|E| at probe",
  outerQ: "Outer sphere", eMid: "|E| at 0.5 m", total: "Total charge",
  dPsi: "dΨ through the patch", Dn: "D·n̂", shadow: "Shadow A cos θ", theta: "θ (D to normal)", magnitude: "|D|", sum: "Σ D·dS over the patches", count: "Patches",
};
const TONE: Record<string, "flux" | "charge" | "surface" | "field"> = {
  flux: "flux", enclosed: "charge", area: "surface", probeD: "flux", probeE: "field", outerQ: "charge", eMid: "field", total: "charge",
  dPsi: "flux", Dn: "flux", shadow: "surface", theta: "surface", magnitude: "flux", sum: "flux",
};
const pretty = (unit: string) => unit.replace("^2", "²");

export function PlateReadouts({ plate, frame, hidden = [] }: { plate: PlateDef; frame: Frame; hidden?: { instance: string; readout: string }[] }) {
  const rows = plate.instances.flatMap((inst) => {
    const ev = frame[inst.id];
    if (!ev?.visible || ev.params.readout === false || (inst.component === "faraday-spheres" && ev.params.revealed !== true)) return [];
    return Object.entries(registry.get(inst.component).readouts)
      .filter(([name]) => !hidden.some((h) => h.instance === inst.id && h.readout === name))
      .map(([name, unit]) => ({ key: `${inst.id}.${name}`, name, unit, value: typeof ev.model[name] === "number" ? (ev.model[name] as number) : null }));
  });
  if (!rows.length) return null;
  return (
    <div className="readouts" role="group" aria-label="Instrument readouts">
      {rows.map((r) => (
        <Readout key={r.key} label={LABEL[r.name] ?? r.name} value={r.value} unit={pretty(r.unit)} {...(TONE[r.name] ? { tone: TONE[r.name] } : {})} />
      ))}
    </div>
  );
}
