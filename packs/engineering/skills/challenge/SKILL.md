---
name: challenge
description: "Run the skeptic against a plan at the chosen depth, skip, one pass or a full round, and judge each objection with the code. Use in /recipe or when the owner says challenge, attack or find holes in the plan. Not the Risks section: write-plan."
argument-hint: "<skip|one|full> <item id>"
allowed-tools: Bash(kit eng *), Read, Glob, Grep, Edit
---

Goal: find the weak point of the plan while it is cheap to change. After the approve, a weak plan costs a replan, a new approve and wasted slices.
The skeptic argues against the plan and proposes no new one. You decide which objections hold.

## The depths
```
skip   no skeptic                                        S item with no risk signal
one    one skeptic pass                                  M item
full   the skeptic, plus the objections of each consumer of a changed contract     L item, every contract change
```
`/recipe` chose the depth from `triage`. With no depth in the arguments, use the one that `triage` recommends.

## Order
- skip: write one line, "challenge skipped, depth skip", and stop.
- one: start the Agent tool with `subagent_type: kit-engineering:skeptic`, the brief (`kit eng item brief <id>`), `spec.md`, the whole `plan.md`, and the question "Where does this plan fail?".
- full: the same, plus `kit-engineering:contract-designer` once for each consumer area of a changed contract, with the contract change and the question "State the objections that the builder of this area would state, and what would change its mind." Start them in the same turn.

Then judge each objection, in order:
1. Open the file that the objection names. An objection with no evidence is a question, not a finding.
2. It holds: change `plan.md`, and say what changed in one line. A change to the contract or the order means `write-plan` for that section and `plan-check` again.
3. It does not hold: write the reason in one line, with the evidence.
4. It holds and the plan cannot fix it: add it to Risks as an accepted risk, and tell the owner.
5. It shows a gap in the spec: stop. Tell the owner. The spec changes only with the owner's word (`kit eng item reframe`).

```
Challenge: one pass, 3 objections.
1. The filter runs in the query, and status has no index (skeptic). Holds: `schema.sql:88`. Design names the index as a data change; Steps orders it first.
2. Old frontends break with the new parameter. Does not hold: the parameter is optional (`list.ts:42`).
3. The plan has no rollback for the index. Holds: Risks lists it as hard to undo; the owner decides when it runs.
```
Keep the list to 25 lines or fewer.

## Gotchas
- Never argue with an objection from memory. Read the code first.
- Do not let the skeptic redesign the plan. Its job is to find holes.
- A full round for a small item is waste. A skip for a contract change is a risk. Follow the chosen depth.
- An objection that repeats a listed risk is not new. Ask instead whether the listed reduction is too weak.
- The agents start with no history. Give each the spec, the plan and its one question.
