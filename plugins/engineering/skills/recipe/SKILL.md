---
name: recipe
description: "Plan an item in planning: work/<id>/plan.md and the slices in tasks.md, challenged by the skeptic, checked, then stopped at the owner's approve. Use when the owner says recipe, plan, design, approach or slices. Pairs with /cook."
argument-hint: "<item id>"
disable-model-invocation: true
allowed-tools: Bash(kit eng *), Bash(git status *), Bash(git log *), Read, Glob, Grep, Edit, Write
---

Goal: a plan that the owner approves with confidence, and slices that a builder finishes without a question.
The approve freezes `spec.md`, `plan.md` and `tasks.md`.
A change after it needs `kit eng item replan <id>`, so settle the plan before you ask for the approve.
The flow, the question round and the confirm question: `${CLAUDE_PLUGIN_ROOT}/skills/pickup/flow.md`.

## Order
1. Run `kit eng pickup <id>`. The state must be `planning`; else say so and stop.
2. Choose the depth of the challenge from `triage`: skip (S, no risk), one pass (M), full round (L, or any contract or schema change).
   Ask the owner only when the depth is not clear, in the same round as the design choices of step 3.
3. Write the plan with `write-plan`: In short, Today, Approach, Impact, Flow for size L, Proof, Risks. It starts the scout and the designers.
4. Run `challenge` at the chosen depth. Change the plan for each objection that holds.
5. Run `slice-tasks`: it writes `tasks.md` and runs `kit eng task import <id>`.
6. Run `plan-check`. Fix each gap. For a contract change, run `contract-check`.
7. For each decision that outlives the item, run `adr`.
8. Run `kit eng item check <id>`: no gap for `approve`.
9. Show the plan and the slices, with the objections and your answer to each, and ask the confirm question for both.
   On "Looks right", report and say: approve: type `/gate approve <id>`. Then stop. Next: `/cook <id>`. Offer the page of the item: `/item-view <id>`.

Kind `investigate`: a short plan and no slices. Read `${CLAUDE_PLUGIN_ROOT}/skills/spec/investigate.md`.

## The report
```
Waits for you: approve: type /gate approve SHOP-12
Plan: work/SHOP-12/plan.md. Challenge: one pass, 2 objections, 1 changed the plan (an index on status).
Slices: T1 bff (S), T2 frontend (S, after T1). ACs covered: 1 to 5. item check: no gap.
ADR proposed: 0007 filter in the query. Guesses: G1 (low) status order.
Next: /cook SHOP-12 after the approve.
```

## Gotchas
- Each criterion needs a slice that covers it and a test that proves it. `kit eng item check` reports a criterion with no slice.
- A slice touches one area. A change in two areas is two slices, linked by `depends`.
- Contract first, then the provider, then the consumers. A consumer slice that depends on nothing runs too early.
- Today holds facts at the level of parts, not lines. A choice belongs in Approach.
- The spec is agreed. Edit it only for a real gap, tell the owner, and run `spec-check` again. A changed goal needs `kit eng item reframe`.
- The agents start with no history. Give each one the brief (`kit eng item brief <id>`) and the one question it answers.
- Never run the approve. The owner types `/gate approve <id>` in the prompt; the model is denied.

A full `plan.md` and `tasks.md` for SHOP-12: `example.md` (this folder).
