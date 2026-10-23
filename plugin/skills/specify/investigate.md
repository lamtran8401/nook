# An investigate item

Read this file from `/specify`, `/plan`, `/cook`, `/deep-review` and `/close` when the kind of the item is `investigate`.
The item asks questions and leaves results: a tech spike, a technical solution, a research, a kaizen.
It can change no code, or build a proof of concept in slices. Everything else follows the standard flow.

| Stage | What changes |
|---|---|
| spec | `## Questions` in place of `## Acceptance criteria`: one bullet for each question. `agree` needs at least one question. |
| plan | `plan.md` is short: Today names where to look; Approach has one row for each question, with how it gets its answer; Proof names the evidence each answer needs; Risks names what the code cannot answer. No skeptic. With no code: no `tasks.md`, and Impact is one line, "None: the item changes no code". With a proof of concept: write `tasks.md` with slices in their areas and `acs: none`; they run and verify as the slices of a feature. |
| cook | With no slices: no branch and no builders. `begin`, then the lead and the read-only agents do the research. With slices: the standard cook for them. Write `findings.md` with its `## Results`, then `submit`. |
| check | The reviewer checks `findings.md`, not criteria. Each question needs an answer with evidence. |
| close | No commit of a proof of concept unless the owner says so. For each line of `## Results`: a ticket that the owner creates, a wiki page, a session to plan. |

## The spec
```markdown
---
id: SHOP-15
kind: investigate
size: S
areas: [bff]
created: 2026-10-15
updated: 2026-10-15
---
# SHOP-15: Find why the shipment list is slow

> In short: find the cause of the 4 seconds of the list call before anyone changes code.

## Why
The shipment list call takes 4 seconds at peak. Find the cause before anyone changes code.

## Questions
- Which query takes most of the time of the list call?
- Which callers send the same call more than once?

## Out of scope
- Any code change.
```

## The research in cook
1. Run `nook eng item begin <id>`.
2. Find the evidence for each question. On a lean budget, read the code yourself, one question at a time. On a deep budget, start one read-only agent for each question, in the same turn: `nook:scout` for a question about facts, `nook:system-designer` for a question about how the parts connect.
   Give each the brief (`nook eng item brief <id>`) and its one question.
3. Check each claim that matters: open the file and read the line.
4. Write `works/<id>/findings.md`: one section `## Q<n>` for each question with the lines `Answer`, `Evidence`, `Open`, and `Follow-up` when there is one.
5. Write `## Results`: one line for each thing the work left. A result is a decision or a document, a proof of concept, new tickets, a session, or a wiki page.
6. Run `nook eng item submit <id>`. The guard needs `findings.md` filled, with its `## Results`.

```markdown
## Q1
Answer: the query `listShipments` takes 3.2 of the 4 seconds. The `status` column has no index.
Evidence: `bff/src/shipments/list.ts:42`; the `EXPLAIN` output in `logs/2026-10-07.txt:118`.
Open: the load of the database at peak was not measured.
Follow-up: add an index (new item).

## Results
- A decision: index `status` first; measure again after it.
- New tickets: SHOP-16 add the index.
```

## Gotchas
- An answer with no evidence is not an answer. A question that the code cannot answer goes under Open, with what is needed.
- A finding that tempts you to fix the code is a follow-up item, not a change. The code of an investigation is a proof of concept; the real change is a new item.
- A scout reads only what it is asked. One question for each agent; a list of five gives a shallow answer.
