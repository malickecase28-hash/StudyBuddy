Task 1: in progress
Task 1: complete (commit 66d3955..7952d3d, checks: `pnpm test` (76 files, 850 tests) and `pnpm typecheck` → PASS)
Task 2: Ruling: the plan says I is already labeled, but the new emf-loop I readout failed the existing label assertion — added Current I, with the planned induced-current override — cost if wrong: an unlabelled current would be ambiguous.
Task 2: complete (commit 7952d3d..5db2d7d, checks: `pnpm test` (76 files, 850 tests), `pnpm typecheck`, web `tsc` → PASS)
Task 3: Ruling: the plan redeclares C0, which the template module already defines as 299792458 m/s — reused that constant and kept the new ETA0 definition — cost if wrong: duplicate declaration prevents the course module from loading.
Task 3: complete (commit 5db2d7d..HEAD, checks: `pnpm vitest run packages/course-em1` (21 files, 509 tests) and `pnpm typecheck` → PASS)
