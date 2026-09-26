# G1 progress

Plan: `docs/superpowers/plans/2026-09-27-forma-plan-g1-coulomb-field.md`

Task 1: Ruling: the planned MST Q2(b) component values were slightly outside Vitest's three-decimal tolerance — asserted their correctly rounded three-decimal values from the package ε₀ — cost if wrong: a different charge geometry would be hidden by lower precision, but the full-sign vector checks remain.
Task 1: complete (commits 5327599..50bfcbb, tests: pnpm test && pnpm typecheck && cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json → PASS, 61 files/500 tests; typecheck and web tsc PASS).
Task 2: complete (commits 2df460a..14b114d, tests: pnpm vitest run packages/course-em1 && pnpm typecheck → PASS, 14 files/231 tests).
Task 3: Ruling: the MST Q1(b) prompt included the future positive-charge value before that value was shown on the plate, and the trap's false-case phrase `10 m` triggered the unit lint — refer to changing only the sign in the prompt and describe the wrong conversion without quoting `10 m`; the later plate state still shows +42.0 nC — cost if wrong: the prompt gives less numeric detail until the example reveals the changed charge.
Task 3: complete (commits 0d23f26..9ae3be8, tests: pnpm vitest run packages/course-em1 && pnpm typecheck → PASS, 15 files/238 tests).

Task 4: complete (commits cfdeaa1..04ea695, tests: pnpm vitest run packages/course-em1 && pnpm typecheck → PASS, 15 files/244 tests).
Task 5: Ruling: the finals field example divides by qB, but the probe plate has no qB instance — added qB as a given for the example prompt and division step — cost if wrong: the given duplicates the charge already stated in the prompt.
Task 5: Ruling: the linter rejected the hypothetical 1 C test charge and positive-charge trap magnitude because neither is on the current plate — removed those magnitudes while preserving the conceptual statements — cost if wrong: the answer no longer repeats the lecture's example test-charge value.
Task 5: complete (commits 5442a21..ac87ccc, tests: pnpm vitest run packages/course-em1 && pnpm typecheck → PASS, 15 files/257 tests).
Task 6: Ruling: the line and sheet prompts state future probe locations before those locations appear on the plate — added the exact 0.5 m and 1.8 m values as example givens — cost if wrong: the givens repeat problem data, but keep each stated distance lint-backed at the prompt step.
Task 6: complete (commits 93441a7..d4825b2, tests: pnpm vitest run packages/course-em1 && pnpm typecheck → PASS, 15 files/263 tests).
