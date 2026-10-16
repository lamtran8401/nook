---
name: retro
description: "Look back on the span since the last retro: the items sent back, the guesses flipped, the slow questions, the weak proofs; the cause of each and the change that stops it, picked by the owner; one file docs/retro/<date>.md. Use when the owner types /retro, at the end of a week."
disable-model-invocation: true
allowed-tools: Bash(kit *), Read, Glob, Grep, Write, Edit, AskUserQuestion
---

Goal: the next span loses less time, from changes that the owner picked, each with a fact behind it.

## Order
1. Run `kit retro --json`. It gives the span, the file of today and the facts, each with its item and its time.
2. No fact: write the file with "Nothing went wrong in the span." and a Kept section, ask nothing, and report in one line.
3. Group the facts that share a cause. For each group, read what explains it: the reason of the event, the documents of the item in `work/<id>/`, the slice and its proof. Write the cause in one line, from that evidence.
4. For each cause, propose one change that stops it, and where it goes: a rule of the owner, a skill or a hook of the kit, or a habit. Name the file. A change with no fact behind it is not a change.
5. Ask the owner once with AskUserQuestion, more than one answer allowed: which changes to make. The recommended ones first.
6. Write `docs/retro/<date>.md` (the shape is below). The file of today exists already: add a section "Later the same day" to it. Never edit the file of another day.
7. Make each picked change that belongs to this environment, such as a rule of the owner. A change of the kit goes to the repo of the kit on a branch, as its `CLAUDE.md` says; name it in the report.
8. Report in chat: the in-short line, the picked changes and where each one went.

## The file
```
# Retro: <date>
> In short: <the span in one sentence: how many facts, the main cause>
## What happened       one table: Fact, Item, Source (the event and its time)
## Causes and changes  one table: Cause, Change, Where, Picked (yes or no)
## Kept                what worked, with an example
```

## Gotchas
- The facts come from `kit retro`, not from memory. A thing that the ledger does not hold is not a fact; ask the owner when it matters.
- One cause can explain many facts. Five rejects for one missing test list are one cause, not five.
- Make no change before the owner's yes. Proposing is not changing.
- Talk about the work, not about a person. "The plan had no case list", not "the builder forgot".
