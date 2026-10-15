---
name: code-review
description: "Review a done slice or the full diff of an item with fresh eyes through the code-reviewer agent: a fixed blocking list sends work back, the rest are nits. Use in /cook (M, L) and /check. Not for your own diff: clean-code. Not the bundled one."
argument-hint: "<item id> [<T>]"
allowed-tools: Bash(kit eng *), Bash(git diff *), Read
---

Goal: code that the next person changes safely: clear, in the style of its area, with no silent failure.
A builder reads its own code with the eyes that wrote it. A second reader finds what the first cannot see.
The reviewer of `/check` judges the criteria. This review judges the code.

## When
```
/cook    M or L item   each slice, after task done                the files of the slice (kit eng task show <id> <T>)
/check   every item    once, in the same turn as the reviewer     the full diff of each area against its base
```
An S item gets the review in `/check` only.

## Order
1. Take the scope: the files of the slice, or the full diff of each area.
2. Start the Agent tool (no `name`: a subagent) with `subagent_type: kit-engineering:code-reviewer` and this prompt:
   ```
   Item: <id>. Scope: slice <T> | the full item.
   Area: <area>, folder <path>, base <branch>. Files: <list> | the full diff.
   Plan: work/<id>/plan.md (the dependencies it names).
   ```
3. Read the verdict. The blocking list lives in the agent file; only a finding on it sends work back. A pass with nits: keep the nits for the report of the stage.
4. A blocking finding in `/cook`: `kit eng task reopen <id> <T> --reason "<file:line> <what>"`, and send the four parts (where, what, why, how to show it) to the builder of the slice. It fixes, runs the checks, and runs `task done` again with every file. Then review the slice again.
   The same finding after two rounds is a question for the owner.
5. A blocking finding in `/check`: it sends the item back. Name it in the reason of `kit eng item reject`.

```
Code review: T1 pass (2 nits). T2 send back, then pass: list.ts:42 swallowed the query error (fixed).
Nits for the owner: StatusFilter.tsx:18 `d` reads better as `status`.
```

## Gotchas
- Do not fix the code yourself. The builder that knows the slice fixes it. A builder that is gone gets a new one with the brief and the finding.
- A nit never sends work back, also in an auto run.
- A test that cannot fail is on the blocking list. It is the finding that a green suite hides best.
- A dependency that the plan did not name is a finding, also when it works. The plan is the agreement.
- The agent reads the whole function, not only the changed lines. Give it the folder and the base, not a pasted diff.
