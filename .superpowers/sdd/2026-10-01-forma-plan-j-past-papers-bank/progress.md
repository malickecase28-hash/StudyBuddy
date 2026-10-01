Task 1: complete (commits 084ba22..8412c3a, checks: `pnpm typecheck` and web `tsc` → PASS)
Task 2: complete (commits 8412c3a..27cbb6e, checks: `pnpm vitest run packages/course-em1` (21 files, 448 tests) and `pnpm typecheck` → PASS)
Task 3: complete with verification limitation (checks: `pnpm test` (76 files, 785 tests), `pnpm typecheck`, web `tsc`, `pnpm build` → PASS; e2e → 46/47 twice, failed existing modes shortcut check, standalone retry → PASS; manual browser check unavailable because CUA has no browser)
Ruling: the pre-existing `modes.spec.ts` shortcut assertion failed twice in full-suite runs but passed alone; J changes do not touch shortcut handling — no unrelated code or test changes; residual cost if wrong: full e2e remains intermittently red.
