import { meta, orig, SLIDES_2A, src, WENT } from "../sources";

const R = String.raw;
const GL = "em1.electrostatics.gauss-law";

export const vectors = {
  id: "em1.math.vectors",
  title: "Vectors and coordinate systems",
  unit: 2,
  objectives: [
    "Write vectors in components; find magnitudes and unit vectors.",
    "Form position and displacement vectors, with units.",
    "Use dot and cross products: angles, projections and perpendiculars.",
    "Convert points and vectors between cartesian, cylindrical and spherical coordinates.",
    "Build dl, dS and dv in all three coordinate systems.",
  ],
  prerequisites: [],
  misconceptions: [
    { tag: "DISPLACEMENT_ORDER", description: "Writes R12 = r1 − r2 (start minus end).", remediation: "em1.math.vectors/main" },
    { tag: "UNIT_VECTOR_LENGTH", description: "Forgets to divide by the magnitude, or divides by the sum of components.", remediation: "em1.math.vectors/main" },
    { tag: "DOT_CROSS_CONFUSION", description: "Uses the dot product where a perpendicular vector (cross product) is needed.", remediation: "em1.math.vectors/main" },
    { tag: "PHI_QUADRANT", description: "Takes φ straight from tan⁻¹(y/x) without placing the quadrant.", remediation: "em1.math.vectors/main" },
    { tag: "ELEMENT_SCALE_FACTOR", description: "Drops ρ, r or sin θ from dl, dS or dv.", remediation: "em1.math.vectors/main" },
  ],
  examLinks: [],
  sources: [src(SLIDES_2A, "Review of Vectors"), src(WENT, "§2.1, p. 12")],
  status: "verified",
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Vectors and coordinate systems (in depth)",
      minutes: 80,
      blocks: [
        { ...meta("vivid", src(SLIDES_2A, "Vector algebra")), id: "idea-vec-basics", type: "plate", plateId: "idea-vec-basics" },
      ],
    },
    {
      id: "quick",
      title: "Quick refresher: the dot product",
      minutes: 6,
      blocks: [
        {
          ...meta("quiet", src(WENT, "§2.1, p. 12")),
          id: "dot-def",
          type: "prose",
          text: "$\\mathbf A\\cdot\\mathbf B = |\\mathbf A||\\mathbf B|\\cos\\theta = A_xB_x + A_yB_y + A_zB_z$. The result is a **scalar**: how much of A points along B, times |B|. That is exactly what flux needs: how much of D goes *through* a surface.",
        },
        {
          ...meta("assessment", orig()),
          id: "dot-mcq",
          type: "mcq",
          prompt: "A = (1, 2, 2), B = (2, 0, 1). A·B = ?",
          options: [
            { id: "four", label: "4", correct: true, feedback: "1·2 + 2·0 + 2·1 = 4." },
            { id: "vec", label: "(2, 0, 2)", correct: false, feedback: "The dot product is a scalar: multiply the matching components, then add them." },
            { id: "three", label: "3", correct: false, feedback: "Recheck: 1·2 + 2·0 + 2·1." },
          ],
          dimension: "computational",
        },
        {
          ...meta("assessment", orig()),
          id: "mag-a",
          type: "numeric",
          prompt: "A = (1, 2, 2). What is |A|? (A pure number: no units.)",
          answer: { value: 3, unit: "" },
          distractors: [{ value: 5, unit: "", errorClass: "arithmetic", feedback: "Square each component before adding: 1 + 4 + 4 = 9, so |A| = 3." }],
          hints: ["|A| = √(A_x² + A_y² + A_z²).", "1² + 2² + 2² = 9.", "√9."],
          dimension: "computational",
        },
        {
          ...meta("assessment", orig()),
          id: "dot-perp",
          type: "mcq",
          prompt: "D is parallel to a flat patch (lying in its plane), so it's perpendicular to the patch's normal. D·dS = ?",
          options: [
            { id: "zero", label: "0", correct: true, feedback: "Right: cos 90° = 0. No flux crosses a surface that D slides along." },
            { id: "max", label: "|D||dS|", correct: false, feedback: "That's when D is parallel to the normal (cos 0° = 1)." },
          ],
          dimension: "conceptual",
        },
      ],
    },
  ],
};

export const surfaceIntegrals = {
  id: "em1.math.surface-integrals",
  title: "Surface elements & flux integrals",
  unit: 2,
  objectives: [
    "Write a vector surface element dS = a_n dS with an outward normal.",
    "Compute flux through a flat patch as |D||dS| cos θ.",
    "Use dS = r² sin θ dθ dφ a_r on a sphere.",
  ],
  prerequisites: [{ conceptId: "em1.math.vectors", minMastery: 0.3 }],
  misconceptions: [
    { tag: "SURFACE_NORMAL_DIRECTION", description: "Uses a normal that isn't outward, or ignores the angle.", remediation: `${GL}/normal-direction` },
  ],
  examLinks: [{ paper: "Finals 2024-25 Sem 1", question: "Q2(a)", marks: 8, weight: 0.2 }],
  sources: [src(WENT, "§2.3 Spherical coordinates, p. 22"), src(SLIDES_2A, "Coordinate systems")],
  status: "verified",
  rules: [
    {
      id: "normal-twice",
      when: { type: "tagCount", tag: "SURFACE_NORMAL_DIRECTION", gte: 2 },
      then: [{ type: "offerRemediation", tag: "SURFACE_NORMAL_DIRECTION", lessonRef: `${GL}/normal-direction` }],
      once: true,
    },
  ],
  lessons: [
    {
      id: "main",
      title: "Refresher: slicing a surface into patches",
      minutes: 12,
      blocks: [
        {
          ...meta("quiet", orig()),
          id: "hook",
          type: "prose",
          text: "Flux asks one question: **how much of a field pierces a surface?** To answer it, slice the surface into tiny flat patches, find what pierces each one, and add them up. That sum is a surface integral.",
        },
        {
          ...meta("vivid", orig()),
          id: "patch-sim",
          type: "sim-3d",
          scene: "surface-element",
          config: { tilt: 0, d: 3 },
          caption: "One patch dS with its normal a_n (amber) in a uniform D (teal). Tilt it and watch D·dS.",
        },
        {
          ...meta("quiet", src(WENT, "§2.6, p. 44")),
          id: "ds",
          type: "prose",
          text: "Each patch is a vector: $d\\mathbf S = \\mathbf a_n\\,dS$, where the size is the area and the direction is the unit normal. On a **closed** surface $\\mathbf a_n$ always points **outward**.",
        },
        {
          ...meta("vivid", orig()),
          id: "predict-tilt",
          type: "predict",
          prompt: "The patch is tilted so its normal makes 60° with D. The flux through it becomes…",
          options: [
            { id: "half", label: "Half of the face-on value", correct: true, feedback: "cos 60° = ½." },
            {
              id: "sin",
              label: "About 87% of the face-on value",
              correct: false,
              feedback: "That's sin 60°. Flux uses the angle between D and the **normal**, so it's cos θ.",
              tag: "SURFACE_NORMAL_DIRECTION",
            },
            { id: "same", label: "Unchanged", correct: false, feedback: "A tilted patch presents less area to the field." },
          ],
          reveal: "$d\\Psi = \\mathbf D\\cdot d\\mathbf S = |\\mathbf D|\\,dS\\cos\\theta$ with θ measured from the **normal**. Face-on (θ = 0) gives the most flux; edge-on (θ = 90°) gives none.",
          dimension: "conceptual",
        },
        {
          ...meta("quiet", orig()),
          id: "eq-patch",
          type: "equation-build",
          steps: [
            { latex: R`d\Psi`, caption: "The flux through one patch.", highlights: [] },
            { latex: R`d\Psi = \htmlClass{t-flux}{\mathbf D}\cdot \htmlClass{t-surface}{d\mathbf S}`, caption: "D dotted with the patch vector.", highlights: ["t-flux", "t-surface"] },
            {
              latex: R`d\Psi = |\mathbf D|\,dS\cos\theta`,
              caption: "θ is the angle between D and the patch's normal.",
              highlights: [],
            },
          ],
          bindings: { "t-flux": "flux", "t-surface": "surface" },
        },
        {
          ...meta("assessment", orig()),
          id: "num-flat",
          type: "numeric",
          prompt: "Uniform D = 3 a_z nC/m² passes through a 2 m × 2 m square in the xy-plane, with normal a_z. Flux through it?",
          answer: { value: 12, unit: "nC" },
          distractors: [{ value: 6, unit: "nC", errorClass: "arithmetic", feedback: "Area is 2 × 2 = 4 m²." }],
          hints: ["D is parallel to the normal, so cos θ = 1.", "Ψ = |D| × area.", "3 nC/m² × 4 m²."],
          dimension: "computational",
        },
        {
          ...meta("assessment", orig()),
          id: "num-tilt",
          type: "numeric",
          prompt: "Same D and square, but the square is tilted so its normal makes 60° with a_z. Flux through it?",
          answer: { value: 6, unit: "nC" },
          distractors: [
            {
              value: 10.39,
              unit: "nC",
              errorClass: "conceptual",
              tag: "SURFACE_NORMAL_DIRECTION",
              feedback: "You used sin 60°. The angle is measured from the normal, so it's cos 60° = ½.",
            },
          ],
          hints: ["Ψ = |D| A cos θ.", "cos 60° = 0.5.", "12 nC × 0.5."],
          dimension: "computational",
        },
        {
          ...meta("quiet", src(WENT, "§2.3, p. 22")),
          id: "sphere-ds",
          type: "prose",
          text: "On a sphere of radius $r$, a patch spanning $d\\theta$ and $d\\phi$ has area $r^2\\sin\\theta\\,d\\theta\\,d\\phi$ and points along $\\mathbf a_r$: $d\\mathbf S = r^2\\sin\\theta\\,d\\theta\\,d\\phi\\,\\mathbf a_r$. Integrate θ over $0\\to\\pi$ and φ over $0\\to 2\\pi$ to get $4\\pi r^2$. When D is radial and depends only on r, $\\oint \\mathbf D\\cdot d\\mathbf S = D(r)\\,4\\pi r^2$.",
        },
        {
          ...meta("assessment", orig()),
          id: "mcq-sphere-ds",
          type: "mcq",
          prompt: "The vector surface element on the sphere r = a is…",
          options: [
            { id: "sph", label: "a² sin θ dθ dφ a_r", correct: true, feedback: "Right." },
            { id: "cyl", label: "ρ dφ dz a_ρ", correct: false, feedback: "That's the curved side of a cylinder." },
            { id: "nosin", label: "a² dθ dφ a_r", correct: false, feedback: "Missing sin θ: the patches shrink toward the poles." },
          ],
          dimension: "recognition",
        },
        {
          ...meta("assessment", orig()),
          id: "checkpoint",
          type: "checkpoint",
          title: "Refresher check",
          passRatio: 0.5,
          items: [
            {
              ...meta("assessment", orig()),
              id: "cp-area",
              type: "numeric",
              prompt: "Surface area of the sphere r = 2 m?",
              answer: { value: 50.27, unit: "m^2" },
              distractors: [{ value: 16.76, unit: "m^2", errorClass: "conceptual", feedback: "That's (4/3)πr², the volume formula's factor. Area is 4πr²." }],
              dimension: "computational",
            },
            {
              ...meta("assessment", orig()),
              id: "cp-inward",
              type: "mcq",
              prompt: "On a closed surface, D points into the surface on one patch. That patch's D·dS is…",
              options: [
                { id: "neg", label: "Negative", correct: true, feedback: "Right: D against the outward normal." },
                { id: "pos", label: "Positive", correct: false, feedback: "The normal is outward; inward D gives cos θ < 0.", tag: "SURFACE_NORMAL_DIRECTION" },
              ],
              dimension: "recognition",
            },
          ],
        },
      ],
    },
  ],
};

