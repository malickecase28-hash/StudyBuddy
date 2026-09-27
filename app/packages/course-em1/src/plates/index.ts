import { emComponents, Registry, type CompiledIdeas, type PlateDef } from "@forma/plate";
import { dVsE, normalDirection, outsideCharge, symmetry, whyArea } from "./detours";
import { faraday } from "./faraday";
import { fluxSurface } from "./flux-surface";
import { gauss } from "./gauss";
import { ideaClosed } from "./idea-closed";
import { ideaFaraday } from "./idea-faraday";
import { ideaGaussLaw } from "./idea-gauss-law";
import { ideaSymmetry } from "./idea-symmetry";
import { ideaEmWorld } from "./idea-em-world";
import { ideaUnits } from "./idea-units";
import { ideaVecBasics } from "./idea-vec-basics";
import { ideaVecProducts } from "./idea-vec-products";
import { ideaCoords } from "./idea-coords";
import { ideaElements } from "./idea-elements";
import { ideaGradient } from "./idea-gradient";
import { ideaDivergence } from "./idea-divergence";
import { ideaCurl } from "./idea-curl";
import { ideaCoulombLaw } from "./idea-coulomb-law";
import { ideaSuperposition } from "./idea-superposition";
import { ideaEPoint } from "./idea-e-point";
import { ideaESuperposition } from "./idea-e-superposition";
import { ideaEContinuous } from "./idea-e-continuous";
import { ideaChargeDensity } from "./idea-charge-density";

export const plates: Record<string, PlateDef> = Object.fromEntries(
  [faraday, gauss, whyArea, outsideCharge, normalDirection, dVsE, symmetry, fluxSurface.plate, ideaFaraday.plate, ideaClosed.plate, ideaGaussLaw.plate, ideaSymmetry.plate, ideaEmWorld.plate, ideaUnits.plate, ideaVecBasics.plate, ideaVecProducts.plate, ideaCoords.plate, ideaElements.plate, ideaGradient.plate, ideaDivergence.plate, ideaCurl.plate, ideaCoulombLaw.plate, ideaSuperposition.plate, ideaEPoint.plate, ideaESuperposition.plate, ideaEContinuous.plate, ideaChargeDensity.plate].map((p) => [p.id, p]),
);

export const registry = new Registry().register(...emComponents);

/** Plates authored as ideas (Explain → Work → Ask → Check → Recap), with their index. */
export const ideaPlates: Record<string, CompiledIdeas> = { [fluxSurface.plate.id]: fluxSurface, [ideaFaraday.plate.id]: ideaFaraday, [ideaClosed.plate.id]: ideaClosed, [ideaGaussLaw.plate.id]: ideaGaussLaw, [ideaSymmetry.plate.id]: ideaSymmetry, [ideaEmWorld.plate.id]: ideaEmWorld, [ideaUnits.plate.id]: ideaUnits, [ideaVecBasics.plate.id]: ideaVecBasics, [ideaVecProducts.plate.id]: ideaVecProducts, [ideaCoords.plate.id]: ideaCoords, [ideaElements.plate.id]: ideaElements, [ideaGradient.plate.id]: ideaGradient, [ideaDivergence.plate.id]: ideaDivergence, [ideaCurl.plate.id]: ideaCurl, [ideaCoulombLaw.plate.id]: ideaCoulombLaw, [ideaSuperposition.plate.id]: ideaSuperposition, [ideaEPoint.plate.id]: ideaEPoint, [ideaESuperposition.plate.id]: ideaESuperposition, [ideaEContinuous.plate.id]: ideaEContinuous, [ideaChargeDensity.plate.id]: ideaChargeDensity };

/** Until the interface renders plates, each plate's block-based "-classic" lesson stands in for it. */
export const classicLesson: Record<string, string> = Object.fromEntries(
  Object.keys(plates).map((id) => [id, ideaPlates[id] ? "main" : id.endsWith("-plate") ? id.replace(/-plate$/, "-classic") : "main-classic"]),
);
