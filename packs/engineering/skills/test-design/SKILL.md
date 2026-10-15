---
name: test-design
description: "Decide what to test and where before you write a test: the behavior that changes, what can break, the tests that exist, the lowest layer, and if a new test is necessary. Use before the first test of a slice or a fix. Not the loop itself: tdd."
allowed-tools: Read, Glob, Grep
---

Goal: the fewest tests that fail when the behavior breaks.
The five questions, the layers, the note you write and the gotchas: `${CLAUDE_PLUGIN_ROOT}/skills/tdd/test-design.md`. Read it, answer the questions for each AC of the slice, then start the loop of `tdd`.

## Order
1. Name the behavior from the criterion: input, action, visible result.
2. List what can break, and who calls the code.
3. Find the tests that exist next to the code and in the callers. Read them.
4. Pick the lowest layer that sees the behavior.
5. Decide: a new test, a new case in an old test, or nothing new. Add one negative case for each criterion.

## Gotchas
- The thinking takes two minutes and saves a test that cannot fail. Do not skip it for a small slice.
- A test that the criteria do not need is out of scope; name it in the summary.
