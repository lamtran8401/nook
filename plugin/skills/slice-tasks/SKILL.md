---
name: slice-tasks
description: "Cut a plan into slices in works/<id>/tasks.md, one area each with depends, acs, size and done when, then import them into the ledger. Use in /recipe or when the owner says slice, split into tasks or break down the plan. Not for the plan: write-plan."
argument-hint: "<item id>"
allowed-tools: Bash(nook eng *), Read, Edit, Write
---

Goal: slices that one builder finishes test first without a question, in an order that never builds a consumer before its provider.
A builder reads only its own slice, so each slice stands alone.

## Read first
- The Rollout row and the diagrams of `plan.md`: the order across areas and what waits for what. They become `depends`.
- Proof in `plan.md`: the proof of each AC. It becomes `done when`.
- The kind of each area (`nook eng area list`): it picks the builder, so a slice never mixes two areas.

## Rules
- One area for each slice. A change in two areas is two slices.
- The first slice depends on nothing.
- Every AC is in at least one slice. An AC that only a person can check still needs a slice; its `done when` names what the builder reports.
- Two slices that edit the same file are ordered by `depends`, or the builders collide.
- A slice is small enough for one builder in one sitting. A title with "and" twice is two slices.

## Format
```
## T1: Add the status parameter to the shipment list
- area: bff
- depends: none
- acs: AC1, AC2, AC3
- size: S
- files: the list query, its test file
- done when: `list.test.ts` passes with the three new cases and `yarn lint` passes
```
The tool reads the heading and the lines `area`, `depends`, `acs`, `size`. `done when` is for the builder.
A slice with no behavior to prove (a rename, a move) gets `- proof: none (<reason>)`; `task prove` skips it and the owner sees the mark.
A full `tasks.md` for SHOP-12: `${CLAUDE_PLUGIN_ROOT}/skills/recipe/example.md`.

## Order
1. List the changes by area, from the Approach and the Rollout row.
2. Cut each area's work at a behavior: one behavior, or a few that share a file, with the tests that prove them.
3. Write each slice. The title says what it does ("Add the status parameter"), not where ("bff work").
4. Set `depends` from the Rollout row, `acs` from the criteria the slice proves, `size` as the effort for one builder, and `files` as the main files the builder starts from, with no line numbers.
5. Run `nook eng task import <id>`, then `nook eng item check <id>`. Fix each gap it lists: a cycle, an AC with no slice, a slice with two areas.
6. Name the slices of each open guess, so a flip resets the right ones: `--slices T1,T2` on a new guess, `nook eng guess slices <id> <G> --slices T1,T2` on a guess from `/spec`.

## Gotchas
- `task import` refuses a cycle or an AC that no slice covers. Never drop the AC.
- Run `nook eng task import <id>` after each change to `tasks.md`.
- Do not put the code in the slice. Give the behavior and the test; the builder writes the code.
- Write facts only: no state such as done, running or "waits for Q3". The ledger holds the state, and the page shows it.
- A change to the slices after the approve is refused. `nook eng item replan <id>` first.
