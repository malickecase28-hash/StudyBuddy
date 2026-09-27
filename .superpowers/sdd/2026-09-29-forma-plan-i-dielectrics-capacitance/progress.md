# Plan I progress

Execution follows the plan task order. Deviations are recorded as rulings.
Task 1: complete (commits a3ceb72..d39296a, tests: pnpm test && pnpm typecheck -> PASS, 71 files/697 tests; typecheck PASS).
Task 2: complete (commits d67f58a..985a4d7, tests: pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json) -> PASS, 72 files/706 tests; typechecks PASS).
Task 3: complete (commits c82cf12..54f9408, tests: pnpm vitest run packages/course-em1 -> PASS, 19 files/392 tests; 50-seed and independent-answer checks PASS).
Task 4: Ruling: the named course catalog file was ignored and untracked in this checkout — force-added the updated authoritative catalog as Plan I requires — cost if wrong: the catalog now has a tracked copy in the branch.
Task 4: complete (commits 8932f76..55bd6cc, tests: pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json) -> PASS, 75 files/732 tests; typechecks PASS; publication report regenerated for the retired concept).
Task 5: complete (commits f8a8e04..8d77c97, tests: pnpm vitest run packages/course-em1 && pnpm typecheck -> PASS, 21 files/414 tests; package typecheck PASS; publication report regenerated for the unlocked concept).
Task 6: complete (commits 6a02ec1..3fa8d69, tests: pnpm vitest run packages/course-em1 && pnpm typecheck -> PASS, 21 files/427 tests; package typecheck PASS).
Task 7: Ruling: the plan's equation rendered Q²/(2C), which its global constraint explicitly forbids — render the equivalent ½Q²/C form — cost if wrong: a different but equivalent equation layout.
Task 7: complete (commits 6473ad4..a663c6d, tests: pnpm vitest run packages/course-em1 && pnpm typecheck -> PASS, 21 files/446 tests; package typecheck PASS; publication report regenerated for the unlocked concept).
Task 8: complete (commits 2dd272d..7fc41dd, tests: pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e) -> PASS, 76 files/785 tests; typechecks/build PASS; e2e 47/47; visual baselines unchanged).
Task 4: Ruling: moved the unchanged flux-density lesson declaration from electrostatics.ts into gauss-law.ts so its physical definition matches ownership; removed the stale import. Cost if wrong: definition location changes, not lesson content.
Task 9: Ruling: the existing Desk e2e hard-navigated before the debounced IndexedDB save completed — made it poll for the exact saved plate step before asserting restoration; cost if wrong: up to 5 seconds waiting in this test.
Task 9: verification — 76 files/785 unit tests PASS; package and web TypeScript PASS; production build PASS; Playwright 47/47 PASS. Visual walkthrough: first explanation and exam example for all 8 ideas at 1360x900 PASS; boundary hatching/normal/arrows, slanted ICT plane, conductor/no D2 arrow, epsilon-r hatching, and MST Q4(c) C = 7.950e-5 verified. Seeded old flux-density position opens Gauss law lesson flux-density.
