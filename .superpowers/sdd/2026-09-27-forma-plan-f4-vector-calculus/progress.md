# F4 Vector Calculus Progress

Plan: docs/superpowers/plans/2026-09-27-forma-plan-f4-vector-calculus.md`r`n
Task 1: Ruling: the existing exact template inventory and zero-valued answer comparison rejected the new, valid templates — added their independent truth equations and used an absolute tolerance floor for near-zero answers — cost if wrong: the generic answer audit has a looser absolute tolerance only below magnitude 1.
Task 1: complete (commits 5557ddd..86d1f94, tests: pnpm vitest run packages/course-em1 && pnpm typecheck → PASS, 12 files/198 tests).
Task 2: Ruling: the existing misconception inventory omitted the three vector-calculus tags, and the copied gradient example repeated the previous scene — expanded the expected tag list and hid the equation panel at the repeated scene transition — cost if wrong: the equation is not shown during the first example prompt.
Task 2: complete (commits 1d43dea..dc9113f, tests: pnpm vitest run packages/course-em1 && pnpm typecheck → PASS, 13 files/205 tests).
Task 3: Ruling: the Task 2 assertion expected only the first plate after adding divergence — expanded it to include the second plate — cost if wrong: none beyond maintaining the progressive registration assertion.
Task 3: complete (commits dbc595e..33017d0, tests: pnpm vitest run packages/course-em1 && pnpm typecheck → PASS, 13 files/212 tests).
Task 4: Ruling: the planned curl requires tag MISSING_SCALE_FACTORS, but none of its checks detects that misconception — removed the per-idea requirement; the gradient and divergence ideas cover it in combined concept coverage — cost if wrong: curl alone no longer claims scale-factor misconception coverage.
Task 4: complete (commits c1008ef..ada0cb5, tests: pnpm vitest run packages/course-em1 && pnpm typecheck → PASS, 13 files/219 tests).
