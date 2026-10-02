# Forma Maths Foundations: a prerequisite crash course

**Date:** 2026-10-02.
**Status:** Draft, for the owner's review.
**Builds on:** the course engine (`@forma/engine`), idea plates (`@forma/plate`) and the EMag course (`@forma/course-em1`).

## Why

ELE3001 assumes maths that many students, the owner included, never secured. That means algebra and trig, units, differentiation, integration, choosing a technique, multiple integrals in curved coordinates, and vectors.

Today the 5-minute readiness check probes only six EM-adjacent topics. Its refreshers point at EM concepts, so a student who can't integrate is sent to "Surface integrals" and stays stuck.

The fix is a short prerequisite course built with the same living plates. Each course's readiness check measures the background maths and recommends the right foundation lessons first.

## What the owner decided (2026-10-02)

- **Scope:** all four areas:
  - algebra and trigonometry;
  - units and notation;
  - calculus (differentiation, integration, techniques, multiple integrals);
  - vectors from scratch.
- **Routing:** recommend, never block. A weak result puts the matching foundation lessons at the front of the route, and the student can always skip them.
- **Readiness checks:** every course module gets a 5-minute check that also gauges background maths.
- **Already shipped:** the Maths toolkit cheat sheet, in the Formulas tool and at `/formulas`.

## The course

A second course, id `math0` (exported from `@forma/course-em1` until a second module justifies its own package), titled **"Maths Foundations for Engineering"**. Its concepts form one prerequisite graph. Each concept has one main idea lesson, built with `defineIdeaPlate` like the EMag idea plates. A lesson has:
- explanation steps with claims checked against plate readouts;
- worked examples (basic, tutorial and exam level) with traps;
- asks, checks and a recap.

Every teaching sentence is written in the plan, word for word. Sources are `StudyBuddy original` with an `original` licence, because no restricted material is needed.

| Unit | Concepts (ids `m0.*`) | What each one makes you able to do |
|---|---|---|
| A · Algebra and trig | `m0.algebra.rearranging`, `m0.trig.triangles`, `m0.trig.identities`, `m0.trig.radians`, `m0.algebra.exp-log` | Rearrange any formula for any symbol; Pythagoras and SOH-CAH-TOA in 2D and 3D; the identities EM uses; radians; e and ln |
| B · Units and notation | `m0.units.prefixes`, `m0.units.checking`, `m0.notation.symbols` | Convert prefixes, including squared and cubed; check an answer's units; read Greek letters, subscripts, hats and bold vectors |
| C · Differentiation | `m0.diff.rules`, `m0.diff.chain-product`, `m0.diff.partial` | Power, exponential and trig rules; chain, product and quotient rules; partial derivatives as the step to gradient, divergence and curl |
| D · Integration | `m0.int.antiderivatives`, `m0.int.definite`, `m0.int.substitution`, `m0.int.parts`, `m0.int.choosing` | Standard integrals; area and limits; substitution; parts; **which technique to use, and when choosing coordinates removes the need** (the ρ in ρ dρ dφ) |
| E · Multiple integrals | `m0.multi.double`, `m0.multi.order`, `m0.multi.cylindrical`, `m0.multi.spherical` | Double integrals over regions; changing the order; volume and surface elements and their Jacobians; separable integrals |
| F · Vectors from scratch | `m0.vec.components`, `m0.vec.dot`, `m0.vec.cross` | Components and magnitude; the dot product as projection; the cross product as area and direction |

**EMag's own maths unit stays where it is.** `em1.math.vectors`, `em1.math.vector-calculus` and `em1.math.surface-integrals` are the bridge; Unit F hands over to them.

## New plate components

These are added to `@forma/plate`, with exact maths in `@forma/physics` (or a new `maths.ts` there):
- **`graph-1d`:** a function on axes, with:
  - a probe point (readouts: x, f(x));
  - an optional tangent (readout: slope);
  - an optional shaded area from a to b (readout: area, computed exactly where possible and otherwise by Gauss–Legendre);
  - optional Riemann rectangles (n).
- **`triangle`:** a right triangle with sides a, b, c and angle θ (readouts: c, sin θ, cos θ, tan θ), and a 3D-box mode for the distance formula.
- **`unit-circle`:** an angle θ in radians and degrees, with the projections cos θ and sin θ.
- **`region-2d`:** a region between curves, with strips in dx-first or dy-first order (readout: area), for order of integration.
- **Reused:**
  - `coord-region` and `coord-frame` for volume and surface elements;
  - `vector3` and `axes3` for vectors;
  - `unit-convert` for prefixes;
  - `line-work` for worked algebra.

Every new component gets the same claims and lint support as the existing ones, so the number lint keeps teaching text honest.

## Readiness checks and routing

- **Background topics.** No schema change is needed: background topics are ordinary diagnostic topics whose `refresher` names a foundation concept (e.g. `m0.int.choosing`). The existing route machinery already recommends them, and they can be skipped. EMag's check gets 8 background topics:
  1. rearranging;
  2. trig and Pythagoras;
  3. units and prefixes;
  4. derivatives;
  5. chain rule;
  6. definite integrals;
  7. substitution vs parts;
  8. volume elements.

  The checks stay about 5 minutes: background items come first, and a correct core skips its probe.
- **Recommend, never block.**
  - `diagnosticRoute` returns `foundations` (foundation concepts, in prerequisite order) separately from the course route.
  - The Desk shows "Before Electromagnetics: N foundation lessons", with "Start" and "Skip for now".
  - Skipping is remembered.
  - Nothing locks.
- **Every module.** Each course's diagnostic carries its own background list. A foundation concept is listed at most once across courses, and it is marked done when its recap is saved.

## Multiple courses

The web app currently imports one course. `lib/course.ts` becomes a registry (`courses`, `getCourse(id)`, `conceptById` across all courses). The changes:
- `/courses` lists both courses;
- `/c/[course]` and the map read the course from the route;
- learner state is already keyed by concept id, so it doesn't change;
- the course list shows Maths Foundations first, labelled "Prerequisite".

## Errors and edge cases

- **Unanswered items:** a student who answers no background items gets no foundations route, and the Desk offers the check again.
- **Wrong course id:** a foundation concept id in a diagnostic that doesn't exist fails the course test at build time (an existing test pattern: refreshers must resolve).

## Verification

- **No new tests.** Plate claims and lints, the existing course-coverage loops (extended to iterate all courses), typecheck, build and e2e.
- **Browser walkthroughs:** each plan's last task walks the new lessons at 1360×900 and 390×844.

## Phasing

| Plan | Contents | Depends on |
|---|---|---|
| **N1** | Course registry; the foundations course (inside `@forma/course-em1` for now, so existing plate and idea tests cover it); `graph-1d`; Desk card | — |
| **N2** | Unit D · Integration (5 idea lessons), the owner's sharpest need | N1 |
| **N3** | Unit E · Multiple integrals (4), with `region-2d` | N2 |
| **N4** | Unit C · Differentiation (3) | N1 |
| **N5** | Units A and B · Algebra, trig, units, notation (8), with `triangle` and `unit-circle` | N1 |
| **N6** | Unit F · Vectors (3), and EMag's background readiness items | N5 |

Claude writes each plan with every lesson word for word, and Codex executes them.

## Not in scope

- Gating.
- Other courses' content.
- Adaptive question generation beyond the existing seeded templates.
- Video.
