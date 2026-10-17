# An investigate item

Read this file from `/spec`, `/recipe`, `/cook`, `/deep-review` and `/close` when the kind of the item is `investigate`.
The item asks questions and changes no code.
Everything else follows the standard flow.

| Stage | What changes |
|---|---|
| spec | `## Questions` in place of `## Acceptance criteria`: one bullet for each question. `agree` needs at least one question. |
| recipe | No slices and no builders. `plan.md` is short: Today names where to look; Approach has one row for each question, with how it gets its answer; Impact is one line, "None: the item changes no code"; Proof names the evidence each answer needs; Risks names what the code cannot answer. `tasks.md` stays empty. No skeptic. |
| cook | No branch and no builders. `begin`, then the lead and the read-only agents do the research. Write `findings.md`, then `submit`. |
| check | The reviewer checks `findings.md`, not criteria. Each question needs an answer with evidence. |
| close | No commit. A follow-up item for each Follow-up line that the owner says yes to. A wiki page when the answers matter again. |

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
2. Start one read-only agent for each question, in the same turn: `nk-eng:scout` for a question about facts, `nk-eng:system-designer` for a question about how the parts connect.
   Give each the brief (`nook eng item brief <id>`) and its one question.
3. Check each claim that matters: open the file and read the line.
4. Write `work/<id>/findings.md`: one section `## Q<n>` for each question with the lines `Answer`, `Evidence`, `Open`, and `Follow-up` when there is one.
5. Run `nook eng item submit <id>`. The guard needs `findings.md` filled.

```markdown
## Q1
Answer: the query `listShipments` takes 3.2 of the 4 seconds. The `status` column has no index.
Evidence: `bff/src/shipments/list.ts:42`; the `EXPLAIN` output in `logs/2026-10-07.txt:118`.
Open: the load of the database at peak was not measured.
Follow-up: add an index (new item).
```

## Gotchas
- An answer with no evidence is not an answer. A question that the code cannot answer goes under Open, with what is needed.
- A finding that tempts you to fix the code is a follow-up item, not a change. The item changes no code.
- A scout reads only what it is asked. One question for each agent; a list of five gives a shallow answer.
