---
name: tdd
description: "The test-first loop for one slice: a test that fails for the right reason, the smallest code, refactor, the checks of the area, then the proof. Use when you build or fix code in /quick or in a slice. Not the thinking before a test: test-design."
allowed-tools: Bash(kit eng *), Read, Glob, Grep, Edit, Write
---

Goal: code that a test proves, written in the smallest steps that work.
A test that you saw fail for the right reason proves the code. A test that passed at once proves nothing.

## Before you start
1. Read the slice (`kit eng task brief <id> <T>`): the ACs, the `done when` line, the folder.
2. Read the tests next to the code you change. Copy their style: the same helpers, the same names, the same test doubles.
3. Run the tests of the area once. Know what is green before you change anything.
4. Answer the five questions of `test-design.md` (this folder) for each AC of the slice, two lines each.

## The loop
1. Write one test for one behavior. Name it with the behavior: `returns the shipments that match the status`. Arrange, act once, assert the visible result.
2. Run it. It must fail, for the reason of the AC. A missing import is not the right reason: add the stub and run again until the assertion fails.
   A test that passes at once: the test is wrong or the code exists. Stop and check.
3. Write the smallest code that makes it pass. No code for the next test.
4. Run the test, then the tests of the file.
5. Refactor with the tests green: `clean-code`, inside the scope of the slice.
6. Repeat for the next behavior, with one negative case for each AC: an input or a state that must be refused or left unchanged.
7. Run the checks of the area (`checks` in `kit.yml`). Fix each failure; `diagnose` when the cause is not clear after one read.
8. Run `kit eng task prove <id> <T> --files <the new test files>`. It runs your new tests on the base of the branch, without your change.
   `proven`: they fail there. `weak`: they pass there, so they cannot fail; fix the test. `none`: a load or import error; read the note.

## A good test
- One behavior, and the name says it. The expected value is written by hand.
- The fewest doubles. Mock the edge (network, database, clock), never the code under test.
- No sleep, no order between tests. It fails when the behavior is removed.

## Gotchas
- A test that cannot fail is the most expensive line in the diff: it reads as proof and proves nothing. `task prove` says `weak`; the code reviewer blocks on it.
- Do not change a test to make code pass, and do not skip or weaken one. A test that is wrong now is a question: `kit eng task wait <id> <T> --reason`.
- A snapshot written with `--update` before the code existed proves nothing.
- Edit only in the folder of the slice. A check that needs the running app is a manual check for the owner: say so in your summary.
- Keep the list of changed files while you work. `kit eng task done --files` needs it.
