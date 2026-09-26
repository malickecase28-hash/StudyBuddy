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
Task 5: Ruling: Readout formats the model's negative value as ASCII "-4", and adding the planned divergence axe screen exposed an unlabeled SVG rect attribute violation — asserted "-4" and moved the box label to an image-role group — cost if wrong: axe sees the box as a standalone image, and the test checks ASCII formatting.
Task 5: complete (commits 77ce44a..b1a5627, tests: pnpm test && pnpm typecheck && web tsc && pnpm build && pnpm e2e → PASS, 60 files/493 tests; 38 e2e tests).
Task 6: Ruling: equation overlays hid the field labels in scalar and vector slice views — aligned overlays upper-right when either view is present — cost if wrong: formulas cover some upper-right arrows while shown.
Task 6: Ruling: the first final e2e rerun reused the live dev server while it was under visual review and failed unrelated screens — stopped the dev server and reran against the plan's production webServer — cost if wrong: the interrupted run is not evidence; the clean rerun passed.
Task 6: verification — pnpm test 60 files/493 tests; pnpm typecheck PASS; web tsc PASS; pnpm build PASS; pnpm e2e 38/38 PASS; visually reviewed all three first explanations and exam examples at 1360×900.
Task 6: complete (commits b1a5627..695734a, tests: full plan verification → PASS).
