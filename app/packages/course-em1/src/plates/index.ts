import { emComponents, Registry, type PlateDef } from "@forma/plate";
import { dVsE, normalDirection, outsideCharge, symmetry, whyArea } from "./detours";
import { faraday } from "./faraday";
import { gauss } from "./gauss";

export const plates: Record<string, PlateDef> = Object.fromEntries(
  [faraday, gauss, whyArea, outsideCharge, normalDirection, dVsE, symmetry].map((p) => [p.id, p]),
);

export const registry = new Registry().register(...emComponents);

/** Until the interface renders plates, each plate's block-based "-classic" lesson stands in for it. */
export const classicLesson: Record<string, string> = Object.fromEntries(
  Object.keys(plates).map((id) => [id, id.endsWith("-plate") ? id.replace(/-plate$/, "-classic") : "main-classic"]),
);
