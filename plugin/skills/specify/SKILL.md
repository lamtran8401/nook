---
name: specify
description: "Frame an item into works/<id>/spec.md: one round of questions, then intent, areas and plain criteria that anyone can check, checked before the owner reads it; on the owner's yes the item moves to planning. Use when the owner says specify, spec, frame, requirements or 'what does done mean'."
argument-hint: "[item id]"
disable-model-invocation: true
allowed-tools: Bash(nook eng *), Bash(ls *), Read, Glob, Grep, Edit, Write
---

Goal: a spec that the owner reads once and agrees with: why the item exists, which areas change, and criteria that anyone can check.
The spec is the contract for the plan, the build and the review.
The flow, the question round and the confirm question: `${CLAUDE_PLUGIN_ROOT}/skills/pickup/flow.md`.

## Order
1. Run `nook eng pickup <id>`. The state must be `backlog` or `framing`; else say so and stop.
   In `backlog`, run `nook eng item start <id>`: it scaffolds `spec.md`.
2. Run `triage`: kind, size, areas, contract flag, risk. Show the result.
3. Read the knowledge first. When the wiki is on, read its index and open a page only when a line matches the item. Name each page that the spec uses, as `(wiki: resources/<page>.md)`.
   Confirm each area with its proof: a path and a line that the change touches. Read the repos yourself; a scout runs only on a deep budget.
4. Write your reading in five lines or fewer, so the owner corrects a wrong reading before the questions.
5. The question round, once: collect every blocking question, register each with `nook eng ask <id> "<text>" --blocking --rec "<answer>"`, ask them in one call, record the answers with `nook eng answer`.
   The ticket has a `Type:` row that `nook eng kind list` does not know: add one question to the same call, "Take every <Type> as <kind> from now on?". On yes, run `nook eng kind set <Type> <kind>`.
   A question that does not block becomes a guess with `nook eng guess`.
6. Write `works/<id>/spec.md`: read `write.md` (this folder) and follow it.
7. Check the spec: read `check.md` (this folder), fix each gap, and check again. `nook eng item check <id>` must list no gap for `agree`.
8. Show the spec and ask the confirm question. On "Looks right", run `nook eng item agree <id>` and report.

Kind `investigate`: Questions in place of criteria. Read `investigate.md` before step 6.

## Gotchas
- One question round. A second round means the first one missed a question: record the gap as a guess, write it in Details, and say so in the report.
- A criterion that no test and no person can check ("the page works well") is not a criterion. Ask what the user sees, or propose a number and mark it as proposed.
- The front matter (`kind`, `size`, `areas`) is the source. `agree` copies it into the item. Every area must exist in `nook.yml` (`nook eng area list`).
- The criteria live in `spec.md` and nowhere else. The n-th `- [TAG] text` line is AC n. Do not run `nook eng item ac add` for the same lines.
- A ticket table with Given, When and Then columns holds one behavior in each row. One criterion for each row, with the observable result.
- An area with uncommitted work stops `nook eng item branch` later. Run `nook eng area status` now and tell the owner.
- After `agree`, a small fix to the spec shows at the accept. A change of substance needs `nook eng item reframe <id> --reason` first.

The reading of step 4, a full spec for SHOP-12 and the weak and strong criteria: `example.md` (this folder).
