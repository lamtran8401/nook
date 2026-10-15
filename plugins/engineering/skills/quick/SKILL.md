---
name: quick
description: "A small fix or chore with no spec and no plan: one area, size S, no contract change; one slice built test first, the checks, then a stop at the owner's accept. Use when the owner says quick fix, small bug, typo or hotfix. Not for two areas: /spec."
argument-hint: "<id or title> <what to change>"
disable-model-invocation: true
allowed-tools: Bash(kit eng *), Bash(git status *), Bash(git diff *), Bash(git log *), Read, Glob, Grep, Edit, Write
---

Goal: a small fix with the least process. The speed comes from skipping documents, not the test or the checks.
The first word of the arguments is a key (`SHOP-30`) or an item in the backlog; else the words are the title of a fix with no ticket.

## Is it quick?
All of these must be true, or you stop and send the owner to `/spec`.
```
one area      the fix is in one area of kit.yml
size S        a few lines or one small behavior
no contract   no shared schema, no data change
clear         you can say in one sentence what "fixed" means
low risk      a wrong fix is easy to see and to undo
```

## Order
1. A key that is not in the ledger: get the ticket as `/intake` says, for this one key.
2. Run `triage` on the ticket and the owner's words. Find the one area; `find-repos` when two readings exist. Check it: `kit eng area status`.
3. Run `kit eng quick <id> --area <area>`, or `kit eng quick "<title>" --area <area>` with no ticket. The item is in `cooking` with one running slice for you; `kit eng task list <id>` names it.
4. Add the criterion: `kit eng item ac add <id> "<the observable result>" --tag ADD|CHANGE|REMOVE|NONE`. The accept needs at least one.
5. Run `kit eng item branch <id>`. Build in that folder with `tdd`: a failing test for the bug, the smallest fix, `clean-code` on the diff.
6. Run `kit eng task prove <id> <T> --files <the test files>`, then `verify`. A proof `weak` means the test did not catch the bug: fix the test first.
7. Run `kit eng task done <id> <T> --files <changed files>`, then `kit eng item submit <id>`.
8. No reviewer runs here: mark the AC with the proof as evidence, `kit eng item ac done <id> 1 --evidence "<test>: fails on the base, passes on the branch" --grade run`.
   Report. Say: accept in your terminal: `kit eng item accept <id>`. The owner's accept is the review.

## The report
```
Waits for you: accept in your terminal: kit eng item accept SHOP-30
SHOP-30 fixed in bff, branch kit/SHOP-30-export-date. AC1: the export date equals the shipment date in the list.
Test: export.test.ts "uses the shipment date" failed before the fix (proof proven) and passes now.
Files: src/export/date.ts, src/export/date.test.ts. Verify: bff pass (213 tests).
Next: /close SHOP-30.
```

## Gotchas
- A fix with no test is not a fix. When the area has no test for the code, write the first one.
- The test must fail before the fix, for the reason of the bug. A test that passes at once proves nothing: `weak`.
- A fix that grows past one area or one slice is not quick. Stop: `kit eng item reframe <id> --reason "grew"`, then `/spec <id>`. The same for a high-impact guess.
- Do not tidy code that you did not need to change. A quick fix has a small diff.
