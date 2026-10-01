Task 1: in progress
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
Task 5: complete (checks: `pnpm test` (76 files, 892 tests) and `pnpm typecheck` → PASS)