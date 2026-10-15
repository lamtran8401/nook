---
name: check
description: "Review a submitted item in checking: the reviewer marks each criterion with evidence and a grade, the code reviewer reads the diff, then the item waits for the owner's accept or goes back. Use when the owner says check, review or 'is it done'."
argument-hint: "<item id>"
disable-model-invocation: true
allowed-tools: Bash(kit eng *), Bash(git status *), Bash(git diff *), Bash(git log *), Read, Glob, Grep
---

Goal: a verdict that the owner can trust.
A review that passes a weak result costs more than one that sends it back, so the agents look for the reason to reject first.
Nobody fixes code in a review.
The flow: `${CLAUDE_PLUGIN_ROOT}/skills/pickup/flow.md`. The verdict, the grades and the report: `rubric.md` (this folder).

## Order
1. Run `kit eng pickup <id>`. The state must be `checking`; else say so and stop.
2. Read the last verify: `kit eng item verify <id> --last`. No code changes in checking, so it holds. When it is missing or failed, run `verify` first.
3. Start two agents in the same turn, each with `kit eng item brief <id>`, the folder of each area and the verify output:
   - `kit-engineering:reviewer`: it reads the spec and the diff, finds one negative case for each AC, and marks each met AC itself with `kit eng item ac done <id> <n> --evidence "<text>" --grade run|sourced|judged|owner`.
   - `code-review`: the fresh reviewer on the full diff of each area.
   For a contract change, add `contract-check`.
4. Read `kit eng item ac list <id>`. Check each mark: the evidence names a test, a file and line, or output. A mark with no evidence text is a gap: `kit eng item ac undo <id> <n>`.
5. An AC not met, or a blocking finding: `kit eng item reject <id> --reason "<AC n or file:line: what>"`. Stop. Next: `/cook <id>`.
6. Every AC met: report with the weakest evidence first, the nits, what was not confirmed, and the manual checks.
   Say: accept in your terminal: `kit eng item accept <id>`. Offer `/walkthrough <id>`. Stop. Next: `/close <id>`.

Kind `investigate`: the reviewer checks `findings.md`. Read `${CLAUDE_PLUGIN_ROOT}/skills/spec/investigate.md`.

## Gotchas
- Early victory: a reviewer that runs two tests and says "all green" has checked the tests, not the criteria. Each AC needs its own evidence that could have failed. Green checks prove that the tests pass.
- The reviewer is never the builder, and the lead is not a fresh pair of eyes either: it read the build messages. Do not skip the agents because the diff is small.
- The reviewer cannot run tests. When it needs a run, start `verify` for that check and give the output back. Do not mark an AC on your own run.
- A test that passes on the base (`proof: weak`) proves nothing. An AC that rests on it is not met.
- Code that no AC asks for is a blocking finding even when it works. Read the diff for it.
- A clean `git status` in an area that the plan changes means the work is missing.
- Nits never send the item back. Two reject cycles on the same item is a plan problem: offer `kit eng item replan <id> --reason`.
- Never run the accept. The owner types it; the model is denied.
