import { Diagnostic } from "@forma/engine";

const opt = (id: string, label: string, correct: boolean, feedback: string) => ({ id, label, correct, feedback });

/** Readiness diagnostic: 6 topics × (core + probe). A missed core triggers an easier probe on the same idea. */
export const diagnostic = Diagnostic.parse({
  topics: [
    { id: "dot", label: "Vectors & dot product", refresher: "em1.math.vectors" },
    { id: "coords", label: "Spherical coordinates", refresher: "em1.math.surface-integrals" },
    { id: "calculus", label: "Integration", refresher: "m0.int.antiderivatives" },
    { id: "techniques", label: "Substitution or parts", refresher: "m0.int.choosing" },
    { id: "surface", label: "Surface integrals & normals", refresher: "em1.math.surface-integrals" },
    { id: "coulomb", label: "Coulomb's law", refresher: "em1.electrostatics.coulomb" },
    { id: "superposition", label: "Field superposition", refresher: "em1.electrostatics.field" },
  ],
  items: [
    {
      id: "dot-core",
      topic: "dot",
      role: "core",
      prompt: "A = 2a_x − a_y + 3a_z, B = a_x + 4a_y + 2a_z. A·B = ?",
      options: [
        opt("a", "4", true, "2 − 4 + 6 = 4."),
        opt("b", "2a_x − 4a_y + 6a_z", false, "The dot product is a scalar."),
        opt("c", "12", false, "Watch the sign: −1 × 4 = −4."),
      ],
    },
    {
      id: "dot-probe",
      topic: "dot",
      role: "probe",
      prompt: "Two vectors are perpendicular. Their dot product is…",
      options: [opt("a", "0", true, "cos 90° = 0."), opt("b", "The product of their lengths", false, "That's for parallel vectors.")],
    },
    {
      id: "coords-core",
      topic: "coords",
      role: "core",
      prompt: "In spherical coordinates (r, θ, φ), what does θ measure?",
      options: [
        opt("a", "The angle down from the +z axis", true, "θ: 0 at +z, π at −z."),
        opt("b", "The angle around the z axis from +x", false, "That's φ."),
        opt("c", "The distance from the z axis", false, "That's the cylindrical ρ."),
      ],
    },
    {
      id: "coords-probe",
      topic: "coords",
      role: "probe",
      prompt: "The point (r = 2, θ = 90°, φ = 0°) in Cartesian is…",
      options: [opt("a", "(2, 0, 0)", true, "On the equator, along +x."), opt("b", "(0, 0, 2)", false, "θ = 90° is the equator, not the pole.")],
    },
    {
      id: "calculus-core",
      topic: "calculus",
      role: "core",
      prompt: "∫₀^π sin θ dθ = ?",
      options: [opt("a", "2", true, "[−cos θ]₀^π = 1 + 1."), opt("b", "0", false, "sin θ ≥ 0 on [0, π]: the area can't be 0."), opt("c", "π", false, "Evaluate −cos θ at the limits.")],
    },
    {
      id: "calculus-probe",
      topic: "calculus",
      role: "probe",
      prompt: "d/dr (r⁴) = ?",
      options: [opt("a", "4r³", true, "Power rule."), opt("b", "r³", false, "Bring the power down: 4r³.")],
    },
    {
      id: "techniques-core",
      topic: "techniques",
      role: "core",
      prompt: "∫2x cos(x²) dx = ?",
      options: [
        opt("a", "sin(x²) + C", true, "u = x², du = 2x dx: ∫cos u du."),
        opt("b", "2x sin(x²) + C", false, "Differentiate it: the product rule gives extra terms. Substitute u = x² instead."),
        opt("c", "cos(x²)·x² + C", false, "The x and x² can't be integrated separately. Substitute u = x²."),
      ],
    },
    {
      id: "techniques-probe",
      topic: "techniques",
      role: "probe",
      prompt: "To integrate x eˣ, which technique works?",
      options: [opt("a", "Integration by parts", true, "u = x, dv = eˣ dx."), opt("b", "Substitution with u = eˣ", false, "There's no derivative of eˣ left to absorb the x.")],
    },    {
      id: "surface-core",
      topic: "surface",
      role: "core",
      prompt: "The area element on a sphere of radius a is…",
      options: [
        opt("a", "a² sin θ dθ dφ", true, "Right."),
        opt("b", "a² dθ dφ", false, "Missing sin θ."),
        opt("c", "a dφ dz", false, "That's a cylinder."),
      ],
    },
    {
      id: "surface-probe",
      topic: "surface",
      role: "probe",
      prompt: "Uniform D = 2 a_z C/m² through a 3 m² flat patch whose normal is a_z. Flux = ?",
      options: [opt("a", "6 C", true, "|D| × A × cos 0."), opt("b", "0", false, "The normal is parallel to D: cos 0 = 1.")],
    },
    {
      id: "coulomb-core",
      topic: "coulomb",
      role: "core",
      prompt: "Two charges are moved twice as far apart. The force between them becomes…",
      options: [opt("a", "¼ as large", true, "Inverse square."), opt("b", "½ as large", false, "It's inverse **square**: (½)² = ¼.")],
    },
    {
      id: "coulomb-probe",
      topic: "coulomb",
      role: "probe",
      prompt: "A +2 µC and a −2 µC charge are near each other. They…",
      options: [opt("a", "Attract", true, "Opposite signs attract."), opt("b", "Repel", false, "Only like charges repel.")],
    },
    {
      id: "superposition-core",
      topic: "superposition",
      role: "core",
      prompt: "Equal +Q charges sit at (−1, 0, 0) and (1, 0, 0). E at the origin is…",
      options: [
        opt("a", "0", true, "Equal and opposite contributions cancel."),
        opt("b", "2kQ a_x", false, "They point in opposite directions: add them as vectors."),
      ],
    },
    {
      id: "superposition-probe",
      topic: "superposition",
      role: "probe",
      prompt: "The field from several charges is found by…",
      options: [opt("a", "Adding the individual fields as vectors", true, "Superposition."), opt("b", "Adding their magnitudes", false, "Directions matter: use vector addition.")],
    },
  ],
});
