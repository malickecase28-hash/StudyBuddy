# Forma: Teaching Depth, Desk and Tools (amendment): Design Spec

- **Date:** 2026-09-25
- **Status:** Approved section by section in brainstorming; pending written-spec review
- **Amends:** `2026-09-25-forma-identity-shell-plate-engine-design.md`. That spec stays in force except where this document changes it:
  - §3: the Desk, the footer and tools.
  - §4.2: the step grammar.
  - §5: checks and branching.
  - §6: Gauss content scope.
  - "Text discipline": the word budgets.
- **Why:** the owner's verdict after Plan B: *"I don't really feel like I'm learning much going in the Gauss. It feels like a miniature version of knowledge and then a question: a review rather than actually learning."* And: *"Students should be able to answer even the small insignificant questions. This should be worth the value per cash they spend to join a course."*
- **Visual references** (brainstorm companion): `forma-desk.html` (Desk options, A chosen), `forma-tools.html` (tool options, A chosen), `forma-teaching-sample.html` (Explain → Work → Check sample; the owner asked for more depth than shown).

## 0. Diagnosis

- The v2 Gauss plate had 6 steps, each with a ≤ 60-word note followed by a question. That shape shows finished ideas and tests them. It does not build them.
- Missing:
  - the reasoning in between (*why* D·dS, why only the piercing component counts);
  - worked examples before any test;
  - answers to the small questions a strong student can field;
  - derivations in view (they were hidden behind "Why?").
- A good lecture spends 25–30 minutes on flux → Gauss's law; the v2 lesson spent about 5.

## 1. Teaching model: Explain → Work → Ask → Check (deep)

A plate lesson is a sequence of **ideas**. Gauss's law has five. Each idea contains:

| Part | Content | Limits |
|---|---|---|
| **Explain** | 3–6 plate steps that build the idea. Reasoning and derivations are shown line by line in the margin; each line lights the plate part it uses. | ≤ 180 words per step; every step must change the plate (the "possible slide" lint stays) |
| **Worked examples** | 3, in rising difficulty: **basic** (e.g. a 2 m square at 60°), **tutorial-level** (Q.06/Q.08/Q.09 style), **exam-level** (a finals part). Solved line by line on the plate; each names its common trap (e.g. "using sin 60° gives 10.4 µC"). | Answers come from templates or physics claims, never typed by hand |
| **Questions students ask** | 6–10 short Q&As covering the small questions (why cos not sin; curved patches; a charge exactly on the surface; units of flux; does the material change Ψ; open vs closed surfaces; dS on the bottom face of a cube). Each shows the plate state that answers it where possible. Browsable within the idea, and searchable from ⌘K. | ≤ 80 words per answer |
| **Check** | 4–6 items: concept check, plate task, seeded numeric variant, one exam-style part. Misses name the slip. | Pass rule: every check correct within 2 attempts. After a second miss, a **remediation worked example** (same template, new numbers) is inserted, then the check is retried. |
| **Recap card** | The idea's key results and traps. Saved to the notebook automatically when the idea is passed. At the end of the lesson, the cards merge into a printable revision sheet. | — |

- **Pacing:** no streaks, points or drip. A learner can stop at any idea boundary and resume exactly there. Revise and Solve reuse the same worked examples and checks.
- **Value guarantee (coverage matrix, enforced by a test):** each concept declares:
  - its learning objectives;
  - the tutorial questions and past-paper parts mapped to it;
  - its misconceptions.

  The build fails unless:
  - every objective has ≥ 1 explain step, ≥ 1 worked example and ≥ 1 check;
  - every mapped tutorial/past-paper part is either worked or checked;
  - every misconception has ≥ 1 ask and ≥ 1 check that detects it (a distractor or option tagged with it).
- **Narration fit:** explain steps, worked-example lines and asks each carry the existing `narration?` slot and cue track, so sub-project 7 can voice them without restructuring content.

## 2. Desk, countdown, tools

**Desk (`/`), option A "Drafting desk", full window width:**
- **Continue card (~65% width):**
  - a live thumbnail of the exact plate state (plate, idea, step, part: explain/work/check), rendered from the real plate state;
  - one "Continue" button.
- **Right column:** "Due today" (recalls and variants due, "Start review"). The finals countdown is shown **only here**, as one small line inside this card.
- **Course route strip:** concepts in order with state glyphs; the current one is marked; each opens its workspace.
- **Recent notebook:** the last 3 entries, with restore links.
- **Removed:** the dark StudyBuddy hero (including the "StudyBuddy" name), the embedded 3D toy (it moves to Explore), and duplicate continue blocks.

**Countdown:** removed from the global footer (the footer keeps save status only). Its only other place is Revise mode's exam view.

**Tools: resizable split:**
- Opening a tool splits the window into page | tool, with the tool at 45% by default.
- A drag handle (plus keyboard ← →); ⤢ expands to full width; ✕ closes.
- The plate re-fits its width, so tool toolbars are never clipped.
- One tool open at a time; switching tools swaps the pane.
- Pinning keeps a tool open across steps and pages for that mode.
- Open tool and width are remembered per mode; Solve opens with paper at 50/50.
- Below 900 px, a tool opens as a full-screen sheet with a close bar.

## 3. Engine and components

**Grammar (`@forma/engine`, `@forma/plate`):**
- `Idea = { id, title, objectives: string[], explain: Step[], examples: Example[], asks: Ask[], checks: Step[] (with interaction), recap: { points: string[]; traps: string[] } }`. A plate lesson is `{ plateId, ideas: Idea[] }`, built on one plate's instances. Steps keep the Plan A `Step` fields and gain `kind: "explain" | "work" | "ask" | "check" | "recap"`.
- `Example = { id, level: "basic" | "tutorial" | "exam", title, problem, setup: patch, lines: { text, latex?, focus: string[], patch? }[], trap?: string, answer: { template?: string; claim?: Claim } }`. The timeline expands each line into a step, so → steps through the lines.
- `Ask = { id, q, a, patch?, focus?, tags: string[] }`.
- **Check gate:** per idea, as in §1. Remediation examples come from the check's template with a fresh seed.
- **Lints:** explain ≤ 180 words; ask ≤ 80; possible-slide applies to explain and work; narration verbatim overlap as before.
- **Timeline:** groups steps by idea and shows location ("Idea 2 · Worked example 2 of 3 · line 3").
- **Coverage-matrix test:** as in §1, and part of `pnpm test`.

**New components (models call `@forma/physics`; views render model output only):**
- `uniform-field`: a steady D of set magnitude and direction.
- `flat-patch`: centre, size, normal angle θ as a handle. Readouts: dΨ = D·dS and the projected "shadow" A cos θ.
- `vector`: a labelled arrow (D, dS, n̂) with an optional angle arc.
- `patch-tiling`: tiles a surface into N patches, with a running Σ D·dS converging to ∮ D·dS and per-patch shading.
- Views for `line-charge` and `sheet-charge`, and cylinder/pillbox surfaces (the physics already exists).
- `recap-card`: a static view for the notebook and print.

**Exactness:** every number in explain text, worked-example lines, asks and recap cards is a physics claim checked by the replay validator. Worked-example answers come only from templates or claims.

**Reused unchanged:** timeline mechanics, overrides, snapshots, modes, ⌘K, themes and palette. Misconception detours become "an extra worked example plus the matching asks" inside the idea.

## 4. Build order and scope

1. **Plan C: Desk, countdown, tools.** §2 in full, with e2e/axe/visual tests updated.
2. **Plan D: Teaching engine.** §3 grammar, lints, check gate, recap cards, revision sheet, coverage-matrix test and the new components. Proven with one fully built idea: "Flux through a surface", deeper than the sample.
3. **Plan E: Gauss's law at full depth.** All five ideas:
   - ① Faraday: why flux exists;
   - ② flux through a surface;
   - ③ closed surfaces and the outward normal;
   - ④ Gauss's law: independent of shape and size, outside charges cancel;
   - ⑤ using it: symmetry for point, line and sheet charges, finding D from Q.

   About 60–80 plate steps, about 40 asks, 3 worked examples per idea (including tutorial Q.06, Q.08, Q.09 and Finals 2024-25 Q2(a)), checks and recap cards. Every number is verified; the coverage matrix passes. Sources are the harvested slides, textbooks and tutorial sheets. Restricted UTech material stays marked for replacement before public launch.
4. **Later:** the rest of EMag with the same template (sub-project 6), then narration production (sub-project 7).

**Out of scope:** accounts and payments (sub-project 5), and other courses.

## 5. Success criteria

1. A student who completes Gauss's law can answer every entry in its questions-students-ask set and every mapped tutorial/past-paper part without leaving Forma (checked by the coverage matrix and by the owner's review).
2. No explain or work step is a "possible slide"; every number shown is physics-verified.
3. Worked examples precede every check, and a double miss always yields a fresh worked example.
4. The Desk uses the full window width, continues to the exact step in one click, and shows the countdown only on the Desk and in Revise.
5. Tools open as a resizable split without clipping, remembered per mode, and as a sheet on phones.
6. The owner judges the Gauss lesson "actually learning, not review" and worth paying for.
