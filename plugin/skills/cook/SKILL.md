---
name: cook
description: "Build an approved item in ready or cooking: a branch, one builder teammate for each area, proofs, the checks, then submit. Use when the owner says cook, build, implement or start coding. Pairs with /recipe."
argument-hint: "[item id]"
disable-model-invocation: true
allowed-tools: Bash(nook eng *), Bash(git status *), Bash(git diff *), Bash(git log *), Read, Glob, Grep
---

Goal: every slice done with a proof, every check green, the item in `review`.
The lead directs; a builder writes the code, one for each area. Who builds each slice: `brief.md` (this folder). The flow: `${CLAUDE_PLUGIN_ROOT}/skills/pickup/flow.md`.

## Order
1. Run `nook eng pickup <id>` and `nook eng doctor`. The state must be `ready` or `cooking`, with no drift; else report the gap and its fix and stop.
2. In `ready`: `nook eng item branch <id>`, then `nook eng item begin <id>`.
   A refusal names the gap (an area in use, a protected branch, a changed document). Report it; do not work around it.
3. The loop, until no slice is `todo`, `running` or `waiting`:
   - `nook eng task list <id> --ready`: give each ready slice to the builder of its area; start one when the area has none (at most 4).
   - a slice is done: check its evidence (`nook eng task show <id> <T>`: files, proof). An L item: run `code-review` on the slice; a blocking finding reopens it: `nook eng task reopen <id> <T> --reason "<file:line> <what>"`. An S or M item gets its code review in `/deep-review`.
   - `--state waiting`: look for the answer in `spec.md`, `plan.md`, the ADRs. Found: `nook eng task resume <id> <T>` and send it to the builder. Not found: collect it for one owner round, as `flow.md` says.
   - `--state failed`: read the reason. `nook eng task retry <id> <T>`, or `nook eng item replan <id> --reason "..."` when the plan is wrong.
4. Run `verify`: the verifier runs `nook eng item verify <id>` and `task prove` for each done slice. A failing area goes back to its builder with the first error lines.
5. Kind `fix`: fill `works/<id>/root-cause.md`: one `type` from `engineering.rootCauses` of `nook.yml`, then the analysis in a few lines. Ask: at the earliest point, what made this bug possible?
6. Run `nook eng item submit <id>`. Report as below. Next: `/deep-review <id>`.

Kind `investigate`: no branch, no builders; the research writes `findings.md`. Read `${CLAUDE_PLUGIN_ROOT}/skills/spec/investigate.md`.

## The report
```
Nothing waits for you.
SHOP-12 built and submitted. State: review.
T1 (bff): done, 4 files, proof proven. T2 (frontend): done, 3 files, proof weak: the banner test passes on the base.
Verify: bff pass (212 tests), frontend pass (89 tests). Skipped tests: none.
Guesses: G2 (med) status order. Manual check for the owner: the banner on the page.
Next: /deep-review SHOP-12.
```

## Gotchas
- An approved document is frozen: `begin` refuses a changed `plan.md`; the fix is `nook eng item replan`.
- A proof `weak` means the new test passes on the base: it cannot fail. Send the slice back before you submit; `submit` only warns.
- The kind of the area picks the builder (`nook eng area list`): `backend-builder` or `frontend-builder`. A frontend slice never goes to the backend builder.
- Uncommitted work stops `item branch`. Report it; never stash or reset.
- A builder's summary is a claim. Its files and its proof in `task show` are the evidence.
- A `name` makes a teammate. Only a builder of an area with two or more slices gets one.
