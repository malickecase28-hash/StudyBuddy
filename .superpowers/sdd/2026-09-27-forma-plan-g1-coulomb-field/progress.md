# G1 progress

Plan: `docs/superpowers/plans/2026-09-27-forma-plan-g1-coulomb-field.md`

Task 1: Ruling: the planned MST Q2(b) component values were slightly outside Vitest's three-decimal tolerance — asserted their correctly rounded three-decimal values from the package ε₀ — cost if wrong: a different charge geometry would be hidden by lower precision, but the full-sign vector checks remain.
Task 1: complete (commits 5327599..50bfcbb, tests: pnpm test && pnpm typecheck && cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json → PASS, 61 files/500 tests; typecheck and web tsc PASS).
