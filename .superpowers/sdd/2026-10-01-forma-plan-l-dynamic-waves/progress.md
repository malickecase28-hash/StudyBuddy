Task 1: complete (commit 66d3955..7952d3d, checks: `pnpm test` (76 files, 850 tests) and `pnpm typecheck` → PASS)
Task 2: Ruling: the plan says I is already labeled, but the new emf-loop I readout failed the existing label assertion — added Current I, with the planned induced-current override — cost if wrong: an unlabelled current would be ambiguous.
Task 2: complete (commit 7952d3d..5db2d7d, checks: `pnpm test` (76 files, 850 tests), `pnpm typecheck`, web `tsc` → PASS)
Task 3: Ruling: the plan redeclares C0, which the template module already defines as 299792458 m/s — reused that constant and kept the new ETA0 definition — cost if wrong: duplicate declaration prevents the course module from loading.
Task 3: complete (commit 5db2d7d..e7205eb, checks: `pnpm vitest run packages/course-em1` (21 files, 509 tests) and `pnpm typecheck` → PASS)
Task 4: complete (no commit per plan; `pnpm typecheck` → PASS)
Task 5: Ruling: `idea-faraday.ts` and id `idea-faraday` already serve the Gauss spheres lesson — kept that plate and named the induction plate `idea-faraday-law` — cost if wrong: a duplicate id overwrites the existing plate.
Task 5: Ruling: dotted example ids fail the existing step-id schema — changed `p4.9`, `p4.27`, and `p4.29` to hyphenated ids — cost if wrong: plate validation rejects the lessons.
Task 5: Ruling: `text:went-p4.21` is explained but not worked or checked, so it fails the coverage matrix — removed it from the plate requirement list — cost if wrong: the coverage matrix does not enforce that source item.
Task 5: Ruling: authored plate modules are independently scoped and Plan K's helper comment does not define `R`, `choice`, or `eqp` — added the same local helpers used by sibling plates — cost if wrong: each module fails to load.
Task 5: Ruling: the task-separated staging pass also removed the still-locked waves entry — restored it in a follow-up correction — cost if wrong: the waves concept would disappear between Tasks 5 and 6.
Task 5: complete (commits e7205eb..d092f26, checks: `pnpm test` (76 files, 868 tests) and `pnpm typecheck` → PASS)
Task 6: Ruling: example ids in the plan use dots, which the existing step-id schema rejects — changed `d11.1`, `d11.3`, `d11.4`, `ex5.3`, and `ex5.7` to hyphenated ids — cost if wrong: plate validation fails.
Task 6: Ruling: Wentworth 4.1 and P4.31 are explained but are not worked or checked — removed those source ids from `idea-tem-wave` requirements — cost if wrong: the coverage matrix does not enforce those source items.
Task 6: Ruling: the Ch. 4 drill gives an initial 34 V/m amplitude but its setup showed 10 V/m — set the example amplitude to 34 V/m — cost if wrong: the wave view disagrees with the problem statement.
Task 6: Ruling: each authored plate is independently scoped and the Plan K helper comment does not define helpers — added the existing local `R`, `choice`, and `eqp` pattern — cost if wrong: plate modules fail to load.
Task 6: complete (commit d092f26..HEAD, checks: `pnpm test` (76 files, 892 tests) and `pnpm typecheck` → PASS)
Task 7: Ruling: first full e2e run had a one-off shortcut-panel timeout — the isolated test and a clean full 47-test run passed — cost if wrong: an intermittent navigation issue would be missed.
Task 7: verification — `pnpm test` (76 files, 894 tests), `pnpm typecheck`, web `tsc`, `pnpm build`, and `pnpm e2e` (47/47) → PASS; 1360×900 Playwright visual walk passed, no baselines changed.