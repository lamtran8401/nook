---
name: write-plan
description: "Write work/<id>/plan.md for the owner's approve: In short, Today and Approach with a diagram each, Impact, Flow for size L, Proof, Risks. Decisions and evidence, not code. Use in /recipe or when the owner asks how to build it. Not the slices."
argument-hint: "<item id>"
allowed-tools: Bash(kit eng *), Read, Glob, Grep, Edit, Write
---

Goal: a plan that the owner approves in a few minutes.
The reader is the owner on the tech side. The builder reads the code and its slice, so the plan holds no path:line, no function signature and no code.
Fill the file that `agree` scaffolded. The sections, their sizes, the diagrams and two snippets: `sections.md` (this folder).

## Read first
- `kit eng item brief <id>` and `work/<id>/spec.md`: the criteria and Out of scope. The plan meets each criterion and adds nothing outside the scope.
- The live ADRs (`kit eng adr list`): follow each one, or say why this item must break it. With the wiki pack on, the pages that name the areas.

## Order
1. Facts. Start `kit-engineering:scout` for each area with the brief and one question, in the same turn: where the behavior enters, which part holds it, which pattern the code uses. Open the file of each fact that the plan rests on.
2. Today: one mermaid diagram of the parts and calls of today, and at most 3 facts.
3. Options. Start `kit-engineering:system-designer` with the brief and the facts for two or three options with a recommendation.
   A contract change adds `kit-engineering:contract-designer`; a data or schema change adds `kit-engineering:data-modeler`.
4. Approach: one diagram after the change, a table of the key decisions with the reason of each (size L adds "If it fails"), and at most 3 options not taken. Name the ADR of a decision that outlives the item.
5. Impact: one row for each kind that changes; one line "None: ..." for the rest. The Rollout row holds the order of shipping and the rollback.
6. Flow, size L only: one sequence diagram of the hard path, at most 3 rules that must always be true, at most 4 failure cases.
7. Proof: at most 6 rows, the criteria grouped, each with its layer, the exact check and its negative case.
   The spec says each criterion in plain words. The Proof holds what it leaves out: the call or the screen, the values, the codes and the names.
   A criterion with several cases lists each case in its row, as "4a a missing page, 4b an empty one, 4c an unknown status". The reviewer needs a test for each.
8. Risks: at most 3 rows with likelihood and what we do, and the guesses that the plan relies on (`kit eng guesses <id> --open`).
9. Front matter: keep `created`, set `updated` to today, write `approach` in one line.

## Gotchas
- A size M plan stays under 60 lines with text and a size L plan under 100, diagrams included. A longer plan holds the work of the builder: move it to the slices.
- A design with one option shows no trade-off. Show a rejected option, or say why none exists.
- A breaking contract change needs a migration path and the owner's word. Prefer the additive form.
- "Add tests" is not a proof. Each row says what makes it fail without the change.
- A criterion that only a person can check goes to Risks too. A good idea outside the scope goes there as "not done on purpose".
- The order of the work is not a section: `slice-tasks` sets `depends`, and the page of the item draws the lanes.
