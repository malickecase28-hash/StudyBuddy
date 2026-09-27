# EMag (ELE3001) Resource Catalog

The authoritative list of source material for course content. Every plan cites items from this file by id.
- Paths are relative to `Resources/Electromagnetics/`.
- **Restricted:** UTech material (slides, papers, homework, solutions) is for private study use only. It must be replaced with original questions before any public launch (spec §6.7).
- **Verify every solution independently.** Lecturer solutions marked "draft" and student solutions can contain arithmetic slips. Plans use their own computed values, verified in code.

## Assessments (weight evidence)

| id | File | What | Topics per question (marks) |
|---|---|---|---|
| `mst2324` | `Malo drop/ele3001-emg1-2324-s1-mst.pdf` (+ `-solved.pdf`) | Mid-semester test, 23 Oct 2023, 90 min: all of Section A plus one of Section B, 70 marks | **Q1 (16):** Coulomb in vector form, displacement vector in mm, F12, effect of flipping a sign. **Q2 (17):** define E; E at P from two charges (µm); V at the surface of a charged sphere. **Q3 (17):** flux through a spherical patch (θ, φ bounds); infinite sheet: E and D at a point. **Q4 (20):** state Gauss's law; Q from ρv = ρ² sin φ in a cylindrical region; capacitance of a coax (100 km, inches, εr = 6.78). **Q5 (20):** E = −∇V with V = ρ²z³ + 5z cos φ at P(2, π, 3); parallel-plate energy density, C, εr |
| `ict2-2425` | `Malo drop/ele3001-emg1-2425-s1-ict_02-solved.pdf` | ICT 02 (18 Nov 2024), solved, handwritten | **Q1:** Biot-Savart for an N-turn coil on its axis; Ampère for a conductor, H at P (vector), J. **Q2:** E/D boundary across a general plane −6x + 8y = 16 (εr1 = 21, εr2 = 7, D₁ = −10ax − 20ay + 14az; normal and tangential split, D2, E2, angles). **Q3:** B/H boundary across a general plane (B2, H2, angle to the normal, magnetization) |
| `f2425` | `07_Past_Papers/…2024.2025 - Sem 1 .pdf` | Finals Dec 2024 | Q1: EM importance (4), Coulomb in nm (11), V → D (10). Q2: Q from D (8), dielectric boundary (17). Q3: coax H (8), magnetic boundary (17). Q4: Ampère inside a conductor (15), continuity (5), Poynting (5) |
| `f2425r`, `f2324`, `f1819s1`, `f1819s3`, `f1718`, `f1516`, `f1415` | `07_Past_Papers/*` | Other finals | Mined per plan |
| `drill23`, `drill24` | `04_Exam_Practice/Drill 202x - EOM Practice Questions.pdf` (+ 2024 solutions) | 10-question finals drills built from past papers (images) | Mined per plan |
| `drill25` | `03_Tutorials/Drill 2025 - Final Tutorial Session*.pdf` | Final tutorial drill, with solutions | Mined per plan |

## Homework: the lecturer reuses these as test questions, so every question here becomes a mapped item

| id | File | Topic | Questions |
|---|---|---|---|
| `hw01-2425` | `Malo drop/ele3001_emg1_2425-s1_hw01-solved-draft.pdf` (lecturer draft) | Vectors and electrostatics | 1.2: gradient in rect./cyl./sph. at a point; divergence in all three systems. 1.3: Coulomb and E definitions; derive Coulomb's law from Gauss's law; F and E in nm. 1.4: Q from ρL, ρS, ρv by integration (cyl./sph.); ρv from D by divergence; net flux two ways |
| `hw01-student` | `Malo drop/deSousaJustin-ELE3001-HW01.{pdf,docx}`, `Malo drop/emag hw/*.jpg`, `Malo drop/question 4/*.jpg` | Student solutions to HW01 | Cross-check only. `question 4_1.jpg`: 579.26π² = 5717 C, not 5721.71 C (arithmetic slip) |
| `hw02-2324` | `Malo drop/Case Malicke - ELE3001 - HW02.pdf` | Electrostatic fields (2023) | 2.1 gradients; 2.2 divergences; 2.3 Coulomb/E/Gauss statements and derivation; 2.4 point charges in cm, F and E; further pages scanned |
| `hw03-2425` | `Malo drop/ele3001_emg1_2425-s1_hw03.pdf` (+ `-solved (2).pdf`) | Biot-Savart and special boundary problems | 3.1: 200-turn coil H on axis; Ampère with J = 95.49 kA/m², B at P. 3.2: E boundary, plane −3x + 4z = 15, ε1 = 8ε0, ε2 = 5ε0, D1 given: D2, E2, θ1, θ2, cos ratio. 3.3: B boundary, plane 5x + 4y + 10z = 12, μr1 = 4.66: H2, B2, angles, M1, M2 |
| `hw03-student` | `Malo drop/de Sousa Justin - ELE3001 - HW03.pdf` | Student HW03 (scanned) | Cross-check |
| `hw04-2425` | `Malo drop/ele3001_emg1_2425-s1_hw04.pdf` | Dynamic fields and plane waves | 4.1: continuity and Faraday statements. 4.2: TEM wave terms α, ω, β, φ; E(z,t) → H(z,t); u relation. 4.3: dielectric vs conductor propagation; Poynting vector and average power |
| `ws04` | `Malo drop/de Sousa Justin - ELE3001 - WS04.pdf` | Worksheet 04 (scanned) | Needs a page render |
| `u3w01a` | `Malo drop/ELE3001 - U3.W01(a) - Magnetostatic Fields.pdf` (+ `u3.w01-a-…-solutions.pdf`, 53 pp) | Unit 3 worksheet and solutions | Feeds 6b |
| `tut-vec` | `03_Tutorials/Tutorial - Review of Vectors 01-03 Solutions.pdf` | Vectors tutorial | Feeds Plan F |

## Lecture material (newest first; the `Malo drop` versions supersede `02_Lecture_Slides`)

| id | File | Covers |
|---|---|---|
| `lec2a` | `Malo drop/ELE3001 Lec.2a - Review of Vectors.pdf` (50 pp) | Vector algebra, coordinate systems, calculus |
| `lec2b` | `Malo drop/ele3001-lec.2b-electrostatic-fields.pdf` (63 pp) | Unit 2 objectives 1–6: Coulomb, E, D, Gauss |
| `lec2c` | `Malo drop/ele3001-lec.2c-electrostatic-fields.pdf` (36 pp) | Unit 2 objectives 7–11: potential, current and Ohm's law, dielectrics, boundaries, capacitance and stored energy (Serway §26 figures) |
| `u2w02b` | `Malo drop/ELE3001 - U2.W02(b) - Electrostatic Fields - Extract (Pp. 35 & 36).pdf` | dl, dS and dv in rectangular, cylindrical and spherical coordinates (the lecturer's "issue of dS and dv" review) |
| `lec3a`, `lec3b` | `Malo drop/ele3001-lec.3a/3b-magnetostatic-fields.pdf` | Unit 3: B, forces, Biot-Savart, Ampère, coax, inductance, generators and transformers |
| `maxwell` | `02_Lecture_Slides/Maxwells Equations Explained (revised).pdf` | Unit 4 |
| `unit1` | `02_Lecture_Slides/Unit 1 - Introduction.pdf` | Unit 1: EM in technology (finals Q1(a)) |
| `revguide` | `00_Module_Info/Revision Guide - Finals 2025-26 Topics.pdf` | Finals scope (struck: Biot-Savart, generalized coax, Poynting) |
| `outline` | `00_Module_Info/Module Outline 2026-27.pdf` | Dates: ICT 01 12/15 Oct 2026, ICT 02 16/19 Nov 2026; weights 30/10/60 |
| `formula` | `01_Reference_Sheets/*` | Formula sheet (grad, div, curl, Laplacian), constants, glossary |

## Textbooks

- Wentworth (required): in `08_Textbooks` and again in `Malo drop`, the same book twice.
- Hayt & Buck; Schaum's Electromagnetics; Schaum's Advanced Calculus; Schaum's Vector Analysis.
- Use them for definitions and extra practice. Never copy their text.

## Tooling note

Scanned PDFs need page rendering to read. `pdftoppm` is not installed. Plan authors render pages with `pypdfium2` (`pip install pypdfium2`) into the scratchpad.
