---
name: handoff
description: "End a session: write works/<id>/handoff.md, at most 40 lines, with State, Done, Next, Open, Guesses and Watch. Use when the owner says handoff, wrap up the session, save state or stop for today, or when a yolo run stops."
argument-hint: "[item id]"
disable-model-invocation: true
allowed-tools: Bash(nook eng *), Bash(git status *), Read, Write, Edit
---

Goal: a new session, or the owner after a night, knows in one minute where the item is, what was done, what comes next and what to watch.
The next session starts with no memory. The note is how it continues without a question to you.
Write facts about the state, not a diary.

## Order
1. Run `nook eng pickup <id>` and `nook eng next <id>`. The ledger is the truth for the state and the slices; the note adds what the ledger does not hold.
2. Run `nook eng item history <id>`: what changed since the last note.
3. Read the old `works/<id>/handoff.md` when there is one. You replace it; keep what is still true.
4. Run `nook eng doctor` and `nook eng area status`: drift, dirty files, an area on another branch.
5. Write `works/<id>/handoff.md`, 40 lines or fewer, with the six sections below. Replace the old note.
6. Report the path and the Next section. The next command is `/pickup <id>` in a new session. Do not start new work.

## The six sections
```
# Hand-over: SHOP-12
## State      the state, the mode, the slices by state; the stop reason when a yolo run stopped
## Done       what changed since the last note, with the file paths; not the story of how
## Next       one command and one slice; at a gate, the `/gate` command that the owner types
## Open       each open question (nook eng questions <id> --open) and each failed slice, with the reason and what you tried
## Guesses    each open guess (nook eng guesses <id> --open) as question, taken, other; it makes sense with no context
## Watch      drift, dirty files, a flaky test, an area on another branch, the files the next session reads first
```

## Gotchas
- A note that says "all good" is not a note. Say what is done and what is next.
- Do not copy the spec or the plan into the note. Name the section.
- Dirty files in an area go under Watch. The next session sees them as drift otherwise.
- Name the stop reason of a yolo run in State: a gate, a failed slice, a question with no safe default.
- Over 40 lines, cut Done first. The ledger holds the history.
