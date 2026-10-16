---
name: auto
description: "Run an item alone from its state to the owner's accept: the lead runs the phases, records each guess, passes the plan gate with proceed, and stops at a stop rule. Use when the owner types /auto with an id, a prompt, or nothing."
argument-hint: "[item id | what to build] [context for the lead]"
disable-model-invocation: true
allowed-tools: Bash(kit eng *), Bash(git status *), Bash(git diff *), Bash(git log *), Read, Glob, Grep, Edit, Write
---

Goal: the item goes from its state to `checking` with every AC met, and waits for the owner's accept.
The gain is time; the cost is guesses, so each one is small and recorded.
The flow: `${CLAUDE_PLUGIN_ROOT}/skills/pickup/flow.md`.

## Start
1. Read the lines that start with "Kit auto". A hook of the kit ran when the owner typed `/auto`: it named the item and set its mode `auto` as the owner.
   - "It was refused": show the lines, and stop. With several open items, ask with AskUserQuestion which one, and tell the owner to type `/auto <id>`.
   - No "Kit auto" line: the hook did not run. Run `kit doctor`, report each gap, and stop. Never set the mode yourself.
   - A line "Kit session: background": this session can edit only inside a worktree, and the build of an area happens in place on the branch of the item. Tell the owner before the first stage, in plain words, and ask with AskUserQuestion: go on in a normal session (recommended), or run the spec and the plan here and stop before the build.
2. Run `kit eng item show <id>`. The mode must be `auto`, set by the owner (`mode_by`).
3. An item that the hook "made from the prompt": the words of the owner are the ticket. Write `backlog/<id>/ticket.md` from them, then run intake from its step 3.
4. The words after an id are the owner's context; they win over the ticket, cited as `(owner)`.

## The stages
Run `kit eng next <id>`: it names the stage. Read `${CLAUDE_PLUGIN_ROOT}/skills/<stage>/SKILL.md` and follow it from step 1, with these changes:
| Stage | In an auto run |
|---|---|
| intake | pull the ticket, no rank |
| spec | take the recommended answer of each blocking question and record it as a guess; no confirm question; run `agree` yourself |
| recipe | take the recommended depth and the recommended option of each design choice, as guesses; no confirm question; pass the gate with `kit eng item proceed <id>` |
| cook | answer a waiting slice from the documents, or take the most likely answer as a guess |
| check | run the agents as written; not met: `reject`, then cook again; at most two reject cycles; stop at the accept |

The mode is the owner's instruction to run the next stage yourself; do not ask.
The Stop hook holds the session while the next stage is yours; its reason names the file.
Each guess, at once: `kit eng guess <id> "<question>" --took "<a>" --other "<b>" --impact low|med|high --slices T1,T2`. It must make sense with no context.
A guess fills a gap in the ticket; it never cuts the ticket. An answer that drops or narrows a sentence of the ticket is a stop rule, not a guess.
The Stop hook lets you wait while a background agent works; its report wakes you.

## Stop rules
Stop, write `handoff.md` (`/handoff`), and report, when:
- a slice failed three times and no other slice can run;
- an answer would drop or narrow what the ticket asks for, as "the button shows but does not load the next page": register it with `kit eng ask <id> "<text>" --blocking --rec "<answer>"` and ask;
- the spec has a gap that changes what the owner asked for (a gap in the plan needs only `kit eng item replan <id> --reason`, then a new `proceed`);
- two reject cycles in checking did not meet every AC;
- a step is hard to undo (a push, a migration, a deletion, a breaking contract change): register it with `kit eng ask <id> "<text>" --blocking --rec "<answer>"` and ask;
- the accept: say "accept: type `/gate accept <id>`"; offer `/guesses <id>` and `/view <id>`.

## Gotchas
- An auto run that the model started is a breach: check `mode_by` first.
- An unrecorded guess is a decision that nobody made; record it before the next step.
- Do not skip a step because the item looks small.
- Do not stack a guess on a high-impact guess; finish the slices that do not depend on it first.
- The ledger is the memory. After a compaction: `kit eng pickup <id>`, `kit eng next <id>`, go on. The builders are gone: `kit eng task list <id> --state running` names the slices to give to new ones.
