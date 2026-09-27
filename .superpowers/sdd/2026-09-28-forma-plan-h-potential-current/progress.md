# Plan H progress

Execution follows the plan task order. Deviations are recorded as rulings.
Task 1: complete (commits a92f970..657924e, tests: pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json) -> PASS, 69 files/627 tests; typechecks PASS).
Task 2: Ruling: the inverse-square distractor equals the correct value when r = 1 m - omit that coincident distractor - cost if wrong: this parameter case has no diagnostic distractor.
Task 2: Ruling: four significant figures round the Finals current-density value away from its 248680 check - retain six significant figures for its answer and worked value - cost if wrong: more displayed precision than the other templates.
Task 2: complete (commits accbd99..6ed1255, tests: pnpm vitest run packages/course-em1 -> PASS, 18 files/331 tests).
Task 3: Ruling: the closed-loop quadrature leaves a 1.93e-14 J residue while the plan claims exact zero — clamp integration residue below 1e-12 to zero — cost if wrong: a physically meaningful work below that absolute threshold is also zeroed.
Task 3: Ruling: the MST trap quotes 0.128 m without a visible readout or given — remove the unsupported number while retaining the diameter-versus-radius error — cost if wrong: the exact numeric distractor is absent from the trap text.
Task 3: Ruling: the volt ask quotes 1 V, 1 J and 1 C without plate backing — state the joule-per-coulomb definition without unsupported quantities — cost if wrong: the definition is less numerical.
Task 3: complete (commits fbb8904..1b4786a, tests: pnpm vitest run packages/course-em1 && pnpm typecheck -> PASS, 18 files/344 tests; typecheck PASS).
Task 4: Ruling: the first energy worked example repeated the preceding zero-potential view and triggered the possible-slide warning — show the work-from-potential equation in its setup — cost if wrong: the equation is repeated when the example begins.
Task 4: complete (commits 8e08900..9e2d05e, tests: pnpm vitest run packages/course-em1 && pnpm typecheck -> PASS, 18 files/357 tests; typecheck PASS).
Task 5: Ruling: the continuity plate quotes a derived −5 C/m³ rate that is not a declared readout and triggers the number lint — keep the relation ∂ρv/∂t = −∇·J and state that density falls — cost if wrong: the worked note no longer gives the derived rate numerically.
Task 5: Ruling: the proof example reused the prior state and triggered the possible-slide warning — show a different closed-box size at the proof setup — cost if wrong: the proof begins with a larger illustrative volume.
Task 5: complete (commits d92e1f2..416721b, tests: pnpm vitest run packages/course-em1 && pnpm typecheck -> PASS, 18 files/370 tests; typecheck PASS).
Task 6: complete (commits 88a66d7..1ba0450, tests: pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e) -> PASS, 70 files/685 tests; e2e 44/44; typechecks/build PASS).
