import { emComponents, Registry, type CompiledIdeas, type PlateDef } from "@forma/plate";
import { dVsE, normalDirection, outsideCharge, symmetry, whyArea } from "./detours";
import { faraday } from "./faraday";
import { fluxSurface } from "./flux-surface";
import { gauss } from "./gauss";
import { ideaClosed } from "./idea-closed";
import { ideaFaraday } from "./idea-faraday";

export const plates: Record<string, PlateDef> = Object.fromEntries(
  [faraday, gauss, whyArea, outsideCharge, normalDirection, dVsE, symmetry, fluxSurface.plate, ideaFaraday.plate, ideaClosed.plate].map((p) => [p.id, p]),
);

export const registry = new Registry().register(...emComponents);

/** Plates authored as ideas (Explain → Work → Ask → Check → Recap), with their index. */
export const ideaPlates: Record<string, CompiledIdeas> = { [fluxSurface.plate.id]: fluxSurface, [ideaFaraday.plate.id]: ideaFaraday, [ideaClosed.plate.id]: ideaClosed };

/** Until the interface renders plates, each plate's block-based "-classic" lesson stands in for it. */
export const classicLesson: Record<string, string> = Object.fromEntries(
  Object.keys(plates).map((id) => [id, id.endsWith("-plate") ? id.replace(/-plate$/, "-classic") : "main-classic"]),
);
