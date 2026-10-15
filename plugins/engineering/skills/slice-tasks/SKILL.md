---
name: slice-tasks
description: "Cut a plan into slices in work/<id>/tasks.md, one area each with depends, acs, size and done when, then import them into the ledger. Use in /recipe or when the owner says slice, split into tasks or break down the plan. Not for the plan: write-plan."
argument-hint: "<item id>"
allowed-tools: Bash(kit eng *), Read, Edit, Write
---

Goal: slices that one builder finishes test first without a question, in an order that never builds a consumer before its provider.
A builder reads only its own slice, so each slice stands alone.
`kit eng task import <id>` makes the ledger slices from the file.

## Read first
- Steps in `plan.md`: the order across areas and what waits for what. They become `depends`.
- Tests in `plan.md`: the check for each AC. They become `done when`.
- The kind of each area (`kit eng area list`): it picks the builder, so a slice never mixes two areas.

## Rules
- One area for each slice. A change in two areas is two slices.
- The first slice depends on nothing. A slice that depends on another names it in `depends`.
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
- done when: `list.test.ts` passes with the three new cases and `yarn lint` passes
```
The tool reads the heading and the lines `area`, `depends`, `acs`, `size`. `done when` is for the builder.
A slice with no behavior to prove (a rename, a move) gets `- proof: none (<reason>)`; `task prove` skips it and the owner sees the mark.
A full `tasks.md` for SHOP-12: `${CLAUDE_PLUGIN_ROOT}/skills/recipe/example.md`.

## Order
1. List the changes by area, from Design and Steps.
2. Cut each area's work at a behavior: one behavior, or a few that share a file, with the tests that prove them.
3. Write each slice. The title says what it does ("Add the status parameter"), not where ("bff work").
4. Set `depends` from Steps, `acs` from the criteria the slice proves, `size` as the effort for one builder.
5. Run `kit eng task import <id>`, then `kit eng item check <id>`. Fix each gap it lists: a cycle, an AC with no slice, a slice with two areas.
6. Name the slices of each open guess with `--slices T1,T2` when you record it, so a flip resets the right ones.

## Gotchas
- `task import` is refused with a cycle or an AC that no slice covers. Read the gaps; do not drop the AC.
- Run `kit eng task import <id>` again after each change to `tasks.md`. The ledger does not watch the file.
- Do not put the code in the slice. Give the behavior and the test; the builder writes the code.
- A change to the slices after the approve is refused. `kit eng item replan <id>` first.
