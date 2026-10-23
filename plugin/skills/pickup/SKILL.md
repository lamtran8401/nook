---
name: pickup
description: "Start or resume a session on an item: the brief, the last hand-over note, what blocks it, and the next command. Use when the owner says pickup, resume, continue, where were we or what is next, or at the start of a session."
argument-hint: "[item id]"
disable-model-invocation: true
allowed-tools: Bash(nook eng *), Read
---

Goal: the session knows where the item is and what comes next, from the ledger and the note, not from memory of an earlier session.
The flow of an item, its gates and its paths: `flow.md` (this folder). Read it when a move is refused and you do not know why.

## Order
1. With an id: run `nook eng pickup <id>`. It records this session as the lead and prints the brief and the last `handoff.md`.
   Without an id: run `nook eng next` and `nook eng item list`. When more than one item is open, ask the owner which one. A pickup without an id makes nobody the lead.
2. Say the item, its state, its mode and its path (quick, standard, yolo).
3. Say what the hand-over note says, when there is one. Where the note and the brief differ, the brief is right.
4. Say what blocks the item: `nook eng questions <id> --open`, `nook eng task list <id> --state failed`, and `nook eng doctor` in `ready` or later.
5. Say the next command, from `nook eng next <id>`, and one or two others that make sense. Stop. The next command starts the work.
   In mode `yolo`, the next command is `/yolo <id>`; the owner types it.

## The report
```
Nothing waits for you.
SHOP-12: cooking, mode normal, standard path. Lead: this session.
Hand-over (yesterday): T1 done in bff. T2 was running in frontend; the builder is gone, restart it.
Blocks: none. doctor: no drift. Guess G2 (med) is open.
Next: /cook SHOP-12 (restart T2). /guesses SHOP-12 to review G2 first.
```

## Gotchas
- Do not start the work. A pickup orients; the stage command acts.
- A note from an old session can be stale. The ledger wins.
- A running slice with no builder alive is the common case after a restart. Say so; `/cook` starts a new builder with the same brief.
- Only one lead session for each open item. A second session that runs `pickup` takes the lead; say so when the brief shows another session.
