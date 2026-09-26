import type { Interaction } from "@forma/engine";

/** Interaction types the web app renders on a plate. Others arrive with their first content (plan decision D5). */
export const RENDERED_INTERACTIONS: readonly Interaction["type"][] = ["predict-drag", "manipulate-goal", "place", "choose", "numeric", "identify"];
