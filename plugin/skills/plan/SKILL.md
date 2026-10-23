---
name: plan
description: "Plan an item in planning: works/<id>/plan.md and its slices in tasks.md, checked, then stopped at the owner's approve. Use when the owner says plan, design, approach, recipe or slices. Pairs with /cook."
argument-hint: "[item id]"
disable-model-invocation: true
allowed-tools: Bash(nook eng *), Bash(git status *), Bash(git log *), Read, Glob, Grep, Edit, Write
---

Goal: a plan that the owner approves with confidence, and slices that a builder finishes without a question.
Settle the plan before you ask for the approve: a change of substance after it needs `nook eng item replan <id>`.
The flow, the question round and the confirm question: `${CLAUDE_PLUGIN_ROOT}/skills/pickup/flow.md`.

## Order
1. Run `nook eng pickup <id>`. The state must be `planning`; else say so and stop.
2. Read the budget in the context of the session (lean or deep). A lean budget writes the plan with no agent.
3. Write `plan.md`: read `write.md` (this folder) and follow it. Ask the design choices with a real trade-off in one round.
4. Cut the slices into `tasks.md` and import them: read `slices.md` (this folder) and follow it.
5. Check the plan and the slices: read `check.md` (this folder), fix each gap, and check again. `nook eng item check <id>` must list no gap for `approve`.
6. Show the plan and the slices, and ask the confirm question for both.
   On "Looks right", report and say: approve: type `/gate approve <id>`. Then stop.

Kind `investigate`: a short plan and no slices. Read `${CLAUDE_PLUGIN_ROOT}/skills/specify/investigate.md`.

## What comes next
Name each one in the report; do not run it here.
- Size L, or a contract or schema change: `/challenge <id>` before the approve, so a skeptic argues against the plan.
- A contract change with consumers: `/contract-check <id>`.
- A decision that outlives the item: `/adr`.
- After the approve: `/cook <id>`.

## The report
```
Waits for you: approve: type /gate approve SHOP-12
Plan: works/SHOP-12/plan.md. Slices: T1 bff (S), T2 frontend (S, after T1). ACs covered: 1 to 5. item check: no gap.
Guesses: G1 (low) status order. Next: /cook SHOP-12 after the approve.
```

## Gotchas
- Each criterion needs a slice that covers it and a test that proves it. `nook eng item check` reports a criterion with no slice.
- A slice touches one area. A change in two areas is two slices, linked by `depends`.
- Contract first, then the provider, then the consumers. A consumer slice that depends on nothing runs too early.
- The spec is agreed. Edit it only for a real gap and tell the owner. A changed goal needs `nook eng item reframe`.
- Never run the approve. The owner types `/gate approve <id>` in the prompt; the model is denied.

A full `plan.md` and `tasks.md` for SHOP-12: `example.md` (this folder).
