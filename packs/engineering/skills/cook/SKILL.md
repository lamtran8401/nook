---
name: cook
description: "Build an approved item in ready or cooking: a branch, one background builder for each ready slice, proofs, the checks, then submit. Use when the owner says cook, build, implement or start coding. Pairs with /recipe."
argument-hint: "<item id>"
disable-model-invocation: true
allowed-tools: Bash(kit eng *), Bash(git status *), Bash(git diff *), Bash(git log *), Read, Glob, Grep
---

Goal: every slice done with a proof, every check green, the item in `checking`.
The lead coordinates and never writes the code of a slice: a builder does, in its own context.
The flow: `${CLAUDE_PLUGIN_ROOT}/skills/pickup/flow.md`. How to start a builder and what it gets: `brief.md` (this folder).

## Order
1. Run `kit eng pickup <id>` and `kit eng doctor`. The state must be `ready` or `cooking`, with no drift; else report the gap and its fix and stop.
2. In `ready`: `kit eng item branch <id>`, then `kit eng item begin <id>`.
   A refusal names the gap: an area in use by another item, a protected branch, a changed document. Report it; do not work around it.
3. The loop, until no slice is `todo`, `running` or `waiting`:
   - `kit eng task list <id> --ready`: start one builder for each ready slice, at most 4 at once and one for each area. Read `brief.md`.
   - a builder returns: check its evidence (`kit eng task show <id> <T>`: files, proof). For an M or L item, run `code-review` on the slice; a blocking finding reopens it: `kit eng task reopen <id> <T> --reason "<file:line> <what>"`.
   - `--state waiting`: look for the answer in `spec.md`, `plan.md`, the ADRs. Found: `kit eng task resume <id> <T>` and send it to the builder. Not found: collect it for one owner round, as `flow.md` says.
   - `--state failed`: read the reason. `kit eng task retry <id> <T>`, or `kit eng item replan <id> --reason "..."` when the plan is wrong.
4. Run `verify`: the verifier runs `kit eng item verify <id>` and `task prove` for each done slice. A failing area goes back to its builder with the first error lines.
5. Run `kit eng item submit <id>`. Report as below. Next: `/check <id>`.

Kind `investigate`: no branch, no builders; the research writes `findings.md`. Read `${CLAUDE_PLUGIN_ROOT}/skills/spec/investigate.md`.

## The report
```
Nothing waits for you.
SHOP-12 built and submitted. State: checking.
T1 (bff): done, 4 files, proof proven. T2 (frontend): done, 3 files, proof weak: the banner test passes on the base.
Verify: bff pass (212 tests), frontend pass (89 tests). Skipped tests: none.
Guesses: G2 (med) status order. Manual check for the owner: the banner on the page.
Next: /check SHOP-12.
```

## Gotchas
- An approved document is frozen. `begin` refuses a changed `plan.md` with the fix `kit eng item replan`. Never edit one to get past the gate.
- A proof `weak` means the new test passes on the base: it cannot fail. Send the slice back before you submit; `submit` only warns.
- Pick the builder by the kind of the area (`kit eng area list`): `backend-builder` for `backend`, `frontend-builder` for `frontend`. A slice in a frontend area never goes to the backend builder.
- Uncommitted work stops `item branch`. Report the area; do not stash or reset.
- A builder's summary is a claim. Its files and its proof in `task show` are the evidence.
