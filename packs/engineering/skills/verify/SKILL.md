---
name: verify
description: "Run the checks of every area of an item and the proof of each done slice through the verifier agent; report the true result with counts and the first error lines. Use before submit, in /check, or when the owner asks if it passes. Not the bundled one."
argument-hint: "<item id> [--area <a>]"
allowed-tools: Bash(kit eng *), Read
---

Goal: a true answer to one question: do the checks pass for the code on the branch, in every area that changed, and does each new test prove its slice?
The answer gates `submit` and the review. A false pass costs the most of any mistake in the flow, because the owner trusts it.

## Order
1. Start the Agent tool with `subagent_type: kit-engineering:verifier` and the item id, plus an area when only one failed before.
   It runs `kit eng item verify <id>` (the `checks` of each area, in the area folder; one `check_run` row for each) and `kit eng task prove <id> <T>` for each done slice.
2. Read its report against the ledger: `kit eng item verify <id> --last` shows the last run and its output; `kit eng task show <id> <T>` shows the proof.
3. Report each area as pass or fail for each check, with the counts when the output shows them, and each proof as `proven`, `weak`, `none` or `skipped`.
4. A failure goes back to the builder of the slice with the first error lines, the file and the line. A `weak` proof goes back too: the test cannot fail.
5. A pass is valid for the code that was checked. A change after it needs a new run before `submit`.

```
bff: lint pass · test pass (212 passed, 0 failed, 0 skipped) · build pass
frontend: lint pass · test FAIL (88 passed, 1 failed) · build not run
  ShipmentList.test.tsx:41 "shows Unable to filter when the query fails": expected "Unable to filter", received nothing.
Proofs: T1 proven. T2 weak: the banner test passes on the base.
Result: not green. submit is blocked until frontend passes; T2 goes back to its builder.
```

## What a pass needs
- Command output that shows it. A summary with no output is not a pass.
- Every area of the item ran. An area that did not run is reported as not run, never left out.
- The full suite, not a filter. A filtered run proves only the filter.
- An area with `checks: []` has no checks; a missing `checks` fails verify until the owner sets it. Report the line, not "failed".

## Gotchas
- Early victory: an agent that ran two tests and says "all green" checked two tests. Ask for the counts and the command.
- A flaky result is a result. Report both runs and name the test. Do not call it a pass because the second run passed.
- A skipped or disabled test is a gap. List each one.
- A check command that is `true`, or one that prints nothing, checks nothing. Say so.
- Nobody fixes code in this skill. Report; the builder fixes.
