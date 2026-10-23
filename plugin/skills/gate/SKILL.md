---
name: gate
description: "The owner's moves at a gate, typed in the prompt: /gate approve <id>, /gate accept <id>, /gate mode <id> yolo|normal, or /gate alone for what waits. Only the owner types it; a Nook hook runs the move before this text. Use when the owner types /gate."
argument-hint: "[approve|accept|mode] [<id>] [yolo|normal]"
disable-model-invocation: true
---

The owner typed `/gate`. A Nook hook read the command and ran the move before this text. Claude Code runs that hook only for a command that a person types, never for a skill that the model calls.
Its result is in the context, in the lines that start with "Nook gate".

## Order
1. Read the "Nook gate" lines.
2. The move ran: report it in two or three lines: what moved, the new state, and the next step from its `next:` line.
3. The move was refused: show each gap with its fix, as the lines say. Do not fix a gap that is a decision of the owner.
4. No arguments: show the moves that wait, as a list of the commands to type.
5. No "Nook gate" line at all: say that the Nook hook did not run, and that the move did not happen. Run `nook doctor` and report each gap with its fix.

## Gotchas
- Never run an owner move yourself, and never type `/gate` for the owner. The model is denied both.
- Never start a session (`claude -p`, `claude --bg`) that types `/gate`: the guard blocks it, and the hook refuses a session that a tool started.
- A move that the owner typed is recorded with the actor "owner via /gate". Say so when the owner asks who moved the item.
