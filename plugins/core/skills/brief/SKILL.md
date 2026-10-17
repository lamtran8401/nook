---
name: brief
description: "The daily brief in chat: what waits for the owner, what is done since yesterday and what runs, in every folder that the owner made an environment. Writes no file. Use when the owner types /brief, at the start of a day or after a break."
disable-model-invocation: true
allowed-tools: Bash(nook brief*), Bash(nook doctor*)
---

Goal: in one short read, the owner knows what to do first today, and nothing more.

## Order
1. Run `nook brief`. It reads every folder of the list in `~/.config/nook/environments`, and the folder of this session when the list lacks it.
2. Show its three parts as they come: "Waits for you", "Done since yesterday", "Runs". Keep the action of each line, such as `/gate accept IT-7`.
3. Above the list, say in one plain sentence what matters most now, such as "Two things need you: IT-7's accept and a wiki draft." On a quiet day, say so.
4. When the brief shows a gap of the doctor, say what it breaks in plain words. The fix stays on its line.

## Gotchas
- The brief writes no file and makes no page. The owner reads it in chat.
- Do not run the actions of the lines. Each one is the owner's choice, and some are owner moves.
- Do not add a line that `nook brief` did not print. A thing that is missing belongs in the pack that owns it.
- More than one folder: each line names its folder. Keep the names.
