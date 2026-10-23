---
name: retro
description: "Look back on the span since the last retro: the items sent back, the guesses flipped, the slow questions, the weak proofs, the guard blocks and the corrections of the owner; the cause of each and the change that stops it, picked by the owner; one file docs/retro/<date>.md. Use when the owner types /retro, at the end of a week."
disable-model-invocation: true
allowed-tools: Bash(nook *), Read, Glob, Grep, Write, Edit, AskUserQuestion
---

Goal: the next span loses less time, from changes that the owner picked, each with a fact behind it.

## Order
1. Run `nook retro --json`. It gives the span, the file of today and the facts, each with its item and its time. The guard blocks come grouped by reason, with a count.
2. Run `nook events --kind prompt --since <the span>`. Find the prompts where the owner corrected the work, repeated an ask, or stopped a tool. Each one is a fact, with its time.
3. No fact: write the file with "Nothing went wrong in the span." and a Kept section, ask nothing, and report in one line.
4. Group the facts that share a cause. For each group, read what explains it: the reason of the event, the documents of the item in `works/<id>/`, the slice and its proof. Write the cause in one line, from that evidence.
5. For each cause, propose one change that stops it, and where it goes: a rule of the owner, a Nook skill or hook, or a habit. Name the file. A change with no fact behind it is not a change.
6. Ask the owner once with AskUserQuestion, more than one answer allowed: which changes to make. Give the two changes of most value as options. List the others, numbered, in the question, so the owner can type their numbers.
7. Write `docs/retro/<date>.md` (the shape is below). The file of today exists already: add a section "Later the same day" to it. Never edit the file of another day.
8. Make each picked change that belongs to this workspace, such as a rule of the owner. A change to Nook goes to the Nook repo on a branch, as its `CLAUDE.md` says; name it in the report.
9. Report in chat: the in-short line, the picked changes and where each one went.

## The file
```
# Retro: <date>
> In short: <the span in one sentence: how many facts, the main cause>
## What happened       one table: Fact, Item, Source (the event and its time)
## Causes and changes  one table: Cause, Change, Where, Picked (yes or no)
## Kept                what worked, with an example
```

## Gotchas
- The facts come from `nook retro` and `nook events`, not from memory. A thing that neither holds is not a fact; ask the owner when it matters.
- The facts `root causes` group the fixes of the span by their root cause type. A type with a high count is a cause to dig into with the team, by 5 Whys. The action that prevents it is the team's, not a change of Nook.
- A guard block with a high count can be a false alarm: a plain read that the guard does not know. Read its commands in `nook events --kind block` before you call it a cause.
- One cause can explain many facts. Five rejects for one missing test list are one cause, not five.
- Make no change before the owner's yes. Proposing is not changing.
- Talk about the work, not about a person. "The plan had no case list", not "the builder forgot".
