---
name: review
description: "Review a done slice or the full diff of an item with fresh eyes through the code-reviewer agent: a fixed blocking list sends work back, the rest are nits. Use when the owner asks for a review, in /cook (L, deep budget) and /deep-review. Not for your own diff: clean-code. Not the bundled one."
argument-hint: "<item id> [<T>]"
allowed-tools: Bash(nook eng *), Bash(git diff *), Read
---

Goal: code that the next person changes safely: clear, in the style of its area, with no silent failure.
A builder reads its own code with the eyes that wrote it. A second reader finds what the first cannot see.
The reviewer of `/deep-review` judges the criteria. This review judges the code.

## When
```
/cook    L item        each slice, after task done                the files of the slice (nook eng task show <id> <T>)
/deep-review   every item    once, one agent for every area             the full diff of each area against its base
```
An S or M item gets the review in `/deep-review` only.
One code-reviewer agent reads every area of the item in one run. Never start one agent for each area.
A second round of `/deep-review` reviews only the files that changed since the last review. Send it to the code-reviewer of the first round, as `pickup/flow.md` says under "Who does the work".

## Order
1. Take the scope: the files of the slice, or the full diff of each area.
2. Start the Agent tool (no `name`: a subagent) with `subagent_type: nook:code-reviewer` and this prompt:
   ```
   Item: <id>. Scope: slice <T> | the full item.
   Areas: <area> folder <path> base <branch>, one line for each area. Files: <list> | the full diff.
   Plan: works/<id>/plan.md (the dependencies it names).
   ```
3. Read the verdict. The blocking list lives in the agent file; only a finding on it sends work back. A pass with nits: keep the nits for the report of the stage.
4. A blocking finding in `/cook`: `nook eng task reopen <id> <T> --reason "<file:line> <what>"`, and send the four parts (where, what, why, how to show it) to the builder of the slice. It fixes, runs the checks, and runs `task done` again with every file. Then review the slice again.
   The same finding after two rounds is a question for the owner.
5. A blocking finding in `/deep-review`: it sends the item back. Name it in the reason of `nook eng item reject`.

```
Code review: T1 pass (2 nits). T2 send back, then pass: list.ts:42 swallowed the query error (fixed).
Nits for the owner: StatusFilter.tsx:18 `d` reads better as `status`.
```

## Gotchas
- Do not fix the code yourself. The builder that knows the slice fixes it. A builder that is gone gets a new one with the brief and the finding.
- A nit never sends work back, also in a yolo run.
- A test that cannot fail is on the blocking list. It is the finding that a green suite hides best.
- A dependency that the plan did not name is a finding, also when it works. The plan is the agreement.
- The agent reads the whole function, not only the changed lines. Give it the folder and the base, not a pasted diff.
