---
name: debug
description: "Find the cause of a failing test, build or behavior: reproduce, isolate, read, state the cause with evidence, fix the cause, run again. Use when a check fails, a test is red or a result is unexpected, and the cause is not clear after one read."
allowed-tools: Bash(nook eng *), Bash(git diff *), Bash(git log *), Read, Glob, Grep, Edit
---

Goal: a fix that removes the cause, not one that hides the symptom.
A guessed fix passes today and fails next week, and it costs a failed review.
For a plain typo, fix it and move on.

## Order
1. Reproduce. Run the failing command. Copy the first error and its location. When it does not fail again, you have no bug yet: find what differs (order, time, state, environment).
2. Isolate. Run the smallest test or command that still fails. Remove what does not matter: other tests, other files, other input.
3. Read. The code at the error and one level up. What changed: `git diff`, `git log -5`. The cause is often in the last change.
4. State the cause in one sentence, with the evidence. When you cannot, make the value visible: one print or one test that shows it, run again, then remove the print.
5. Fix the cause. Do not widen a test, skip a test or add a retry.
6. Run the failing command again, then the checks of the area.

## Kinds of failure
```
a test fails after your change          the change is the first suspect: read the diff, then the test
a test fails and you did not touch it   something it depends on changed: another test, a shared helper, the order, the clock
a build fails                           read the first error only: the later ones often follow from it
a type error                            check the generated types: a contract change can need codegen
works alone, fails in the suite         shared state or test order: find what the first test leaves behind
fails only in CI or only here           the environment: versions, env variables, the lockfile, the time zone
```

## When you are stuck
After three tries with no progress, stop.
A builder runs `nook eng task fail <id> <T> --reason "<the command, the first error, what you ruled out, your best guess>"`, so the lead continues without you.
The lead reports the same four things to the owner.

```
Cause: `listShipments` builds the query before it reads `status`, so the filter never applies. Evidence: `list.ts:42` reads `params` at line 51.
Fix: read `status` first. The test "filters by status" fails without the fix and passes with it.
Checks: bff lint and test pass.
```

## Gotchas
- Change one thing at a time. A cause that you cannot trigger again is a guess.
- A pass after a retry is not a fix. Find why the first run failed.
- Read the first error, not the last.
- A test that depends on the clock, the network or the order of tests is the bug. Fix the test or the code, not the retry.
- A fix outside the folder of your slice is a question for the lead, not a change you make.
- Experiments go in `$TMPDIR`, never under `~/.claude` or in an area you do not own.
