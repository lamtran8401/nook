---
name: quick
description: "A small fix or chore with no spec and no plan: one area, size S, no contract change; one slice built test first, the checks, then a stop at the owner's accept. Use when the owner says quick fix, small bug, typo or hotfix. Not for two areas: /specify."
argument-hint: "<id or title> <what to change>"
disable-model-invocation: true
allowed-tools: Bash(nook eng *), Bash(git status *), Bash(git diff *), Bash(git log *), Read, Glob, Grep, Edit, Write
---

Goal: a small fix with the least process. The speed comes from skipping documents, not the test or the checks.
The first word of the arguments is a key (`SHOP-30`) or an item in the backlog; else the words are the title of a fix with no ticket.
No arguments, or no words that say what to change: ask the owner with AskUserQuestion what to fix. Offer the two likeliest items of the backlog as options, and name the others in the question.

## Is it quick?
All of these must be true, or you stop and send the owner to `/specify`.
```
one area      the fix is in one area of nook.yml
size S        a few lines or one small behavior
no contract   no shared schema, no data change
clear         you can say in one sentence what "fixed" means
low risk      a wrong fix is easy to see and to undo
```

## Order
1. A key that is not in the ledger: get the ticket as `/intake` says, for this one key.
2. Run `triage` on the ticket and the owner's words. Find the one area; read the repos when two readings exist. Check it: `nook eng area status`.
3. Run `nook eng quick <id> --area <area> --kind fix|chore`, or `nook eng quick "<title>" --area <area> --kind fix|chore` with no ticket. Triage gives the kind: a bug is a fix, a small technical task is a chore. A `Type:` row of the ticket can go to `--type` in place of `--kind`. The item is in `cooking` with one running slice for you; `nook eng task list <id>` names it.
4. Add the criterion: `nook eng item ac add <id> "<the observable result>" --tag ADD|CHANGE|REMOVE|NONE`. The accept needs at least one.
5. Run `nook eng item branch <id>`. Build in that folder with `tdd`: a failing test for the bug, the smallest fix, `clean-code` on the diff.
6. Run `nook eng task prove <id> <T> --files <the test files>`, then `verify`. A proof `weak` means the test did not catch the bug: fix the test first.
7. Kind `fix`: fill `works/<id>/root-cause.md`: one `type` from `engineering.rootCauses` of `nook.yml`, then the analysis in a few lines. Every fix needs its root cause. A chore has none: never invent one.
8. Run `nook eng task done <id> <T> --files <changed files>`, then `nook eng item submit <id>`.
9. No reviewer runs here: mark the AC with the proof as evidence, `nook eng item ac done <id> 1 --evidence "<test>: fails on the base, passes on the branch" --grade run`.
   Report. Say: accept: type `/gate accept <id>`. The owner's accept is the review.

## The report
```
Waits for you: accept: type /gate accept SHOP-30
SHOP-30 fixed in bff, branch nook/SHOP-30-export-date. AC1: the export date equals the shipment date in the list.
Test: export.test.ts "uses the shipment date" failed before the fix (proof proven) and passes now.
Files: src/export/date.ts, src/export/date.test.ts. Verify: bff pass (213 tests).
Next: /close SHOP-30.
```

## Gotchas
- A fix with no test is not a fix. When the area has no test for the code, write the first one.
- The test must fail before the fix, for the reason of the bug. A test that passes at once proves nothing: `weak`.
- A fix that grows past one area or one slice is not quick. Stop: `nook eng item reframe <id> --reason "grew"`, then `/specify <id>`. The same for a high-impact guess.
- Do not tidy code that you did not need to change. A quick fix has a small diff.
