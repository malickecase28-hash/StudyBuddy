import { toCyl, toSph } from "@forma/physics";
import { z } from "zod";
import { defineComponent } from "../component";

export { unitVectors as unitVectorsAt } from "@forma/physics";

const V3 = z.tuple([z.number(), z.number(), z.number()]);
const DEG = 180 / Math.PI;

export const Axes3 = defineComponent({
  id: "axes3",
  params: z.object({ length: z.number().positive().default(2) }),
  model: () => ({}),
  handles: [],
  readouts: {},
});

export const Vector3 = defineComponent({
  id: "vector3",
  params: z.object({
    from: V3,
    to: V3,
    label: z.string().min(1),
    tone: z.enum(["charge", "field", "flux", "surface", "ink"]).default("ink"),
    components: z.boolean().default(false),
    /** "m" when from/to are positions in metres: readouts then carry the metre unit (vxm…). */
    unit: z.enum(["", "m"]).default(""),
    /** Drawing magnification only (tiny mm vectors or long ones); readouts always use the true values. */
    drawScale: z.number().positive().default(1),
  }),
  model: (p) => {
    const d = [p.to[0] - p.from[0], p.to[1] - p.from[1], p.to[2] - p.from[2]] as const;
    const mag = Math.hypot(d[0], d[1], d[2]);
    return p.unit === "m" ? { vxm: d[0], vym: d[1], vzm: d[2], vmagm: mag } : { vx: d[0], vy: d[1], vz: d[2], vmag: mag };
  },
  handles: [],
  readouts: { vx: "", vy: "", vz: "", vmag: "", vxm: "m", vym: "m", vzm: "m", vmagm: "m" },
  quotable: { vx: "", vy: "", vz: "", vmag: "", vxm: "m", vym: "m", vzm: "m", vmagm: "m" },
});

export const CoordFrame = defineComponent({
  id: "coord-frame",
  params: z.object({
    point: V3,
    system: z.enum(["cart", "cyl", "sph"]).default("cart"),
    unitVectors: z.boolean().default(true),
    draggable: z.boolean().default(false),
    /** Drawing magnification only; readouts use the true point. */
    drawScale: z.number().positive().default(1),
  }),
  model: (p) => {
    const pt = p.point as [number, number, number];
    if (p.system === "cart") return { px: pt[0], py: pt[1], pz: pt[2] };
    const c = toCyl(pt);
    if (p.system === "cyl") return { pRho: c.rho, pPhi: c.phi * DEG, pz: c.z };
    const s = toSph(pt);
    return { pR: s.r, pTheta: s.theta * DEG, pPhi: s.phi * DEG };
  },
  handles: ["point"],
  readouts: { px: "m", py: "m", pz: "m", pRho: "m", pPhi: "°", pR: "m", pTheta: "°" },
  quotable: { px: "m", py: "m", pz: "m", pRho: "m", pPhi: "°", pR: "m", pTheta: "°" },
});

export const vecComponents = [Axes3, Vector3, CoordFrame];
