# Write the plan

Step 3 of `/plan`. A plan that the owner approves in a few minutes.
The reader is the owner on the tech side. The builder reads the code and its slice, so the plan holds no path:line, no function signature and no code.
Fill the file that `agree` scaffolded. The sections, their sizes, the diagrams and two snippets: `sections.md`.

## Read first
- `nook eng item brief <id>` and `works/<id>/spec.md`: the criteria and Out of scope. The plan meets each criterion and adds nothing outside the scope.
- The live ADRs (`nook eng adr list`): follow each one, or say why this item must break it. With the wiki on, the pages that name the areas.

## Order
1. Facts: where the behavior enters, which part holds it, which pattern the code uses. Read the code yourself and open the file of each fact that the plan rests on. On a deep budget, start a `scout` for each area with the brief and one question, in the same turn.
2. Today: one mermaid diagram of the parts and calls of today, and at most 3 facts.
3. Options: two or three, with a recommendation. On a lean budget, weigh them yourself. On a deep budget, start `system-designer` with the brief and the facts; a contract change adds `contract-designer`, and a data or schema change adds `data-modeler`.
4. Approach: one diagram after the change, a table of the key decisions with the reason of each (size L adds "If it fails"), and at most 3 options not taken. Name the ADR of a decision that outlives the item.
5. System design, size L in two places or more: one mermaid flowchart with one `subgraph` for each place (browser, backend, worker, provider); the page draws each group as a column.
   Data model, when the item adds or changes data: one mermaid `erDiagram` of the tables that it adds or changes, with the keys marked PK and FK.
6. Impact: one row for each kind that changes; one line "None: ..." for the rest. The Rollout row holds the order of shipping and the rollback.
   An item that ships in stages, such as behind a flag for 10% first, adds `## Rollout`: numbered steps, each with the check that lets the next one start.
7. Flow, size L only: one sequence diagram of the hard path, at most 3 rules that must always be true, at most 4 failure cases.
8. Proof: at most 6 rows, the criteria grouped, each with its layer, the exact check and its negative case.
   The spec says each criterion in plain words. The Proof holds what it leaves out: the call or the screen, the values, the codes and the names.
   A criterion with several cases lists each case in its row, as "4a a missing page, 4b an empty one, 4c an unknown status". The reviewer needs a test for each.
9. Risks: at most 3 rows with likelihood and what we do, and the guesses that the plan relies on (`nook eng guesses <id> --open`).
10. Front matter: keep `created`, set `updated` to today, write `approach` in one line.

## Gotchas
- A size M plan stays under 60 lines with text and a size L plan under 100, diagrams included; System design, Data model and Rollout add at most 40. A longer plan holds the work of the builder: move it to the slices.
- The plan holds facts only: no question, no answer and no state such as "waits for Q3". An answer that changes the plan means `nook eng item replan <id>` and a new text.
- A design with one option shows no trade-off. Show a rejected option, or say why none exists.
- A breaking contract change needs a migration path and the owner's word. Prefer the additive form.
- "Add tests" is not a proof. Each row says what makes it fail without the change.
- A criterion that only a person can check goes to Risks too. A good idea outside the scope goes there as "not done on purpose".
- The order of the work is not a section: the slices set `depends`, and the page of the item draws the lanes.
