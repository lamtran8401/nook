---
name: spec
description: "Frame an item: one round of questions, then work/<id>/spec.md with intent, areas and checkable acceptance criteria; the owner confirms and the item moves to planning. Use when the owner says spec, frame, requirements or 'what does done mean'."
argument-hint: "<item id>"
disable-model-invocation: true
allowed-tools: Bash(kit eng *), Bash(ls *), Read, Glob, Grep, Edit, Write
---

Goal: a spec that the owner reads once and agrees with: why the item exists, which areas change, and criteria that anyone can check.
The spec is the contract for the plan, the build and the review.
The flow, the question round and the confirm question: `${CLAUDE_PLUGIN_ROOT}/skills/pickup/flow.md`.

## Order
1. Run `kit eng pickup <id>`. The state must be `backlog` or `framing`; else say so and stop.
   In `backlog`, run `kit eng item start <id>`: it scaffolds `spec.md`.
2. Run `triage`: kind, size, areas, contract flag, risk. Show the result.
3. Read the knowledge first. When the wiki pack is on, read its index and open a page only when a line matches the item.
   Run `find-repos` for the areas, with the proof for each. Skip it when `triage` ran it.
4. Write your reading in five lines or fewer, so the owner corrects a wrong reading before the questions.
5. The question round, once: collect every blocking question, register each with `kit eng ask <id> "<text>" --blocking --rec "<answer>"`, ask them in one call, record the answers with `kit eng answer`.
   A question that does not block becomes a guess with `kit eng guess`.
6. Write `work/<id>/spec.md` with `write-spec`: the front matter with its dates, In short, Why, What changes, Acceptance criteria, Decisions, Out of scope.
7. Run `spec-check`. Fix each gap. Then `kit eng item check <id>` must list no gap for `agree`.
8. Show the spec and ask the confirm question. On "Looks right", run `kit eng item agree <id>` and report.

Kind `investigate`: Questions in place of criteria. Read `investigate.md` (this folder) before step 6.

## Gotchas
- One question round. A second round means the first one missed a question: write the gap in the Decisions table as a guess, and say so in the report.
- A criterion that no test and no person can check ("the page works well") is not a criterion. Ask what the user sees, or propose a number and mark it as proposed.
- The front matter (`kind`, `size`, `areas`) is the source. `agree` copies it into the item. Every area must exist in `kit.yml` (`kit eng area list`).
- The criteria live in `spec.md` and nowhere else. The n-th `- [TAG] text` line is AC n. Do not run `kit eng item ac add` for the same lines.
- A ticket table with Given, When and Then columns holds one behavior in each row. One criterion for each row, with the observable result.
- An area with uncommitted work stops `kit eng item branch` later. Run `kit eng area status` now and tell the owner.
- After `agree`, a change to the spec needs `kit eng item reframe <id> --reason`. Never edit an agreed spec in silence.

The reading of step 4, a full spec for SHOP-12 and the weak and strong criteria: `example.md` (this folder).
