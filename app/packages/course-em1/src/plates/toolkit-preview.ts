import { PlateDef } from "@forma/plate";

export const toolkitPreview = PlateDef.parse({
  id: "toolkit-preview",
  title: "Toolkit preview",
  instances: [
    { id: "grad", component: "scalar-slice", params: { field: "tut-3.4", probe: [1, 2, 3], plane: "xz", offset: 2 } },
    { id: "div", component: "vector-slice", params: { field: "source", probe: [0.5, 0, 0.2], box: 0.4 } },
    { id: "curl", component: "vector-slice", params: { field: "swirl", plane: "xy", probe: [0.3, 0.1, 0], loop: 0.3 } },
    { id: "region", component: "coord-region", params: { system: "sph", ranges: [[0, 1.5], [0, 60], [30, 75]], face: 0 } },
    { id: "spec", component: "spectrum", params: { f: 2.45e9 } },
    { id: "units", component: "unit-convert", params: { value: 0.28, unit: "in" } },
    { id: "axes", component: "axes3", params: {} },
  ],
  steps: [
    { id: "grad", title: "Gradient", show: ["grad"], note: "Preview." },
    { id: "div", title: "Divergence", show: ["div"], hide: ["grad"], note: "Preview." },
    { id: "curl", title: "Curl", show: ["curl"], hide: ["div"], note: "Preview." },
    { id: "region", title: "Region", show: ["region", "axes"], hide: ["curl"], note: "Preview." },
    { id: "spec", title: "Spectrum", show: ["spec"], hide: ["region", "axes"], note: "Preview." },
    { id: "units", title: "Units", show: ["units"], hide: ["spec"], note: "Preview." },
  ],
});
