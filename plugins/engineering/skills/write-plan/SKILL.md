---
name: write-plan
description: "Write work/<id>/plan.md: Architecture (facts with path and line), Design (the choice and the options not taken), Steps, Tests (a check and a negative case for each AC), Risks. Use in /recipe or when the owner asks how to build it. Not the slices."
argument-hint: "<item id>"
allowed-tools: Bash(kit eng *), Read, Glob, Grep, Edit, Write
---

Goal: a plan that the owner approves with confidence: facts about the code today, one chosen approach with its trade-offs, the order of the work, how each criterion is proven, what can go wrong.
Fill the file that `agree` scaffolded. What each section holds, its line cap and the example: `sections.md` (this folder).

## Read first
- `kit eng item brief <id>` and `work/<id>/spec.md`: the criteria and the Out of scope list. The plan meets each criterion and adds nothing outside the scope.
- The live ADRs (`kit eng adr list`) and, when the wiki pack is on, the pages that name the areas. A live ADR is a decision already made: follow it, or say why this item must break it.
- The folder of each area: `kit eng area status`. Read the code where the work happens.

## Order
1. Architecture. One question for each area: where does the behavior of the spec enter, which files hold it, which pattern does the code use today.
   Start `kit-engineering:scout` for each area with the brief and its one question, in the same turn.
   Check each claim that matters: open the file, read the line. Write facts with `area path:line`, the tests that exist, the contract files and their consumers, and the unknowns.
2. Design. Start `kit-engineering:system-designer` with the brief and the Architecture section for two or three options with trade-offs and a recommendation.
   A contract change adds `kit-engineering:contract-designer`; a data or schema change adds `kit-engineering:data-modeler`. One question each.
   Choose one option. Write the decision and the reason for each key choice, the contract and data impact ("none" when none), the rejected options with one reason each, the decisions that outlive the item.
3. Steps. The order across areas: contract, then provider, then consumers. What keeps working at each step, the rollout, the rollback, which step is hard to undo and who runs it.
4. Tests. For each AC: the test, its layer and one negative case. The tests that must stay green. The commands.
5. Risks. What can fail and how you detect or reduce it; what is left out on purpose; the guesses the plan relies on (`kit eng guesses <id> --open`).

## Gotchas
- A fact that you did not read in the code is a guess. Give the path and line, or move it to Unknown.
- A design with one option shows no trade-off. Show a rejected option, or say why none exists.
- A breaking contract change needs a migration path and the owner's word. Prefer the additive form.
- "Add tests" is not a check. Name the test and what makes it fail without the change.
- A criterion that only a person can check goes to Risks too.
- A good idea outside the scope goes under Risks as "not done on purpose".
- Do not write the slices. `slice-tasks` cuts them from Steps and Tests.
