# AGENTS.md — Forma (StudyBuddy)

Forma is a study app with exact physics, living "plates" (animated, interactive diagrams), and deep teaching. EMag (UTech ELE3001) is the first course. Claude writes the plans; you (Codex) implement them.

## Where things are
- `app/` — pnpm monorepo. Packages:
  - `@forma/physics` — exact field maths
  - `@forma/engine` — course schema, learner state, scheduler, templates
  - `@forma/plate` — plate components, timeline, lints, idea lessons
  - `@forma/ui` — primitives, tokens
  - `@forma/course-em1` — EMag content
  - `apps/web` — Next.js 16 app
- `docs/superpowers/specs/` — design specs (the authority)
- `docs/superpowers/plans/` — implementation plans (what you execute)
- `docs/superpowers/resources/emag-catalog.md` — every course source by id
- `Resources/Electromagnetics/` — the source PDFs (restricted; private study use only)

## Commands (run from `app/`)
- `pnpm test` — all unit tests (Vitest). Must pass after every task.
- `pnpm typecheck` — packages.
- `cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json` — web types.
- `cd apps/web && pnpm build` — must pass before e2e.
- `cd apps/web && pnpm e2e` — Playwright + axe. Visual baselines live in `apps/web/e2e/*-snapshots/`.

## How to execute a plan
1. Read the whole plan, its spec, and this file.
2. Create the ledger the plan names (`.superpowers/sdd/<plan>/progress.md`).
3. For each task, in order:
   1. write the failing test;
   2. run it and see it fail for the stated reason;
   3. implement;
   4. run it and see it pass;
   5. run the task's full test command;
   6. commit.
4. After each task, append to the ledger:
   `Task N: complete (commits <base7>..<head7>, tests: <command> → <result>)`.
5. When output differs from a step's `Expected:` line, do not improvise:
   - **The code is wrong:** fix the code.
   - **The plan is wrong:** make the smallest change that satisfies the spec, and log it as
     `Task N: Ruling: <what was wrong> — <what you did> — <cost if wrong>`.
6. When done, stop and report. Claude reviews the branch before anything merges.

## Content rules (course content is the product)
- Never invent teaching text, numbers, or physics. Plans give every explanation, worked example, ask, check and recap word for word. Transcribe exactly.
- Every unit-bearing number in teaching text must be backed by one of:
  - a visible readout,
  - a declared quotable value,
  - a visible param (metres),
  - a claim,
  - a step `given`.

  The lint (`validatePlate`, `validateIdeas`) enforces this.
- If a claim or the number lint fails, the message prints the model value.
  - Fix the text **and** the claim together, keeping the text's precision.
  - Never add a `given` for a value the plate could show.
  - Log a `Ruling:` line.
- Word budget: explanation steps ≤ 180 words, asks ≤ 80 words.
- Item and question ids follow `docs/superpowers/resources/emag-catalog.md`.

## Never
- Commit with `--no-verify`, skip hooks, or force-push.
- Weaken, skip, or delete a test to make it pass (unless the plan says to change that test).
- Add a dependency the plan doesn't name.
- Use hex colours in components or CSS. Use tokens (`var(--flux)`, `var(--charge)`, `var(--surface)`, `var(--field)`, `var(--graphite)`, `var(--ink)`).
- Publish, push, or merge. Pushing is the user's call.

## Brand in one paragraph
Forma: "Shape how you understand." The visual direction is a drafting table: paper and graphite, hatch patterns, and semantic colours (charge, field, flux, surface). The type and palette are already set in `@forma/ui` (`themeCss`, `forma.css`). The voice is plain, exact and warm: short sentences, no hype, no emoji in the UI.

## Definition of done (per plan)
- All of these pass:
  - `pnpm test`
  - `pnpm typecheck`
  - the web `tsc`
  - `pnpm build`
  - `pnpm e2e`
- Every task has a ledger line, and every deviation has a `Ruling:` line.
