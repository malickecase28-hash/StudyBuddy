import { FormulaSheet } from "@/components/calc/FormulaSheet";

export const metadata = { title: "Formulas" };

export default function FormulasPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <p className="label">Tools</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Formula sheet</h1>
        <p className="mt-1 text-sm text-soft">Every formula the course uses, by unit, and the maths it assumes you already know.</p>
      </div>
      <FormulaSheet />
    </div>
  );
}
