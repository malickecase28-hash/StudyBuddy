import { GraphingCalculator } from "@/components/calc/GraphingCalculator";

export const metadata = { title: "Calculator" };

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <p className="label">Tools</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Graphing calculator</h1>
        <p className="mt-1 text-sm text-soft">Graph curves, contours and surfaces; calculate with units and constants; integrate in any coordinate system.</p>
      </div>
      <GraphingCalculator tall />
    </div>
  );
}
