import { labs, plates } from "@forma/course-em1";
import { expect, it } from "vitest";
import { RENDERED_INTERACTIONS } from "@/components/plate/rendered";

it("every interaction authored in a plate has a renderer", () => {
  const used = [...Object.values(plates), ...Object.values(labs).map((l) => l.plate)].flatMap((p) => p.steps.flatMap((s) => (s.interaction ? [s.interaction.type] : [])));
  for (const t of used) expect(RENDERED_INTERACTIONS, t).toContain(t);
});
