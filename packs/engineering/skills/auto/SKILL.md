---
name: auto
description: "Run an item in mode auto from its state to the owner's accept: the lead runs the phases, records each guess, passes the plan gate with proceed, and stops at a stop rule. Use when the owner types /auto after kit eng item mode <id> auto."
argument-hint: "<item id> [context for the lead]"
disable-model-invocation: true
allowed-tools: Bash(kit eng *), Bash(git status *), Bash(git diff *), Bash(git log *), Read, Glob, Grep, Edit, Write
---

Goal: the item goes from its state to `checking` with every AC met, and waits for the owner's accept.
The gain is time. The cost is guesses, so each guess is small, visible and recorded.
The flow: `${CLAUDE_PLUGIN_ROOT}/skills/pickup/flow.md`.

## Start
1. Run `kit eng item show <id>`. The mode must be `auto`, set by the owner (`mode_by`). Else say: run `kit eng item mode <id> auto` in your terminal, and stop. Never set it yourself.
2. The words after the id are the owner's context. They win over the ticket; cite them as `(owner)`.

## The stages
Run `kit eng next <id>`: it names the stage. Read `${CLAUDE_PLUGIN_ROOT}/skills/<stage>/SKILL.md` and follow it from step 1, with these changes:
| Stage | In an auto run |
|---|---|
| intake | pull the ticket; do not rank |
| spec | take the recommended answer of each blocking question and record it as a guess; no confirm question; run `agree` yourself |
| recipe | take the recommended depth and the recommended option of each design choice, as guesses; no confirm question; pass the gate with `kit eng item proceed <id>` |
| cook | answer a waiting slice from the documents, or take the most likely answer as a guess |
| check | run the agents as written; not met: `reject`, then cook again; at most two reject cycles; stop at the accept |

The mode is the owner's instruction to run the next stage yourself. Do not ask for permission.
The Stop hook holds the session while the next stage is yours; its reason names the file.
Each guess, at once: `kit eng guess <id> "<question>" --took "<a>" --other "<b>" --impact low|med|high --slices T1,T2`. It must make sense with no context.

## Stop rules
Stop, write `handoff.md` as `/handoff` says, and report, when:
- a slice failed three times and no other slice can run;
- the spec has a gap that changes what the owner asked for (a gap in the plan needs only `kit eng item replan <id> --reason`, then a new `proceed`);
- two reject cycles in checking did not meet every AC;
- a step is hard to undo (a push, a migration, a deletion, a breaking contract change): register it with `kit eng ask <id> "<text>" --blocking --rec "<answer>"` and ask;
- the accept: say "accept in your terminal: `kit eng item accept <id>`"; offer `/guesses <id>` and `/walkthrough <id>`.

## Gotchas
- An auto run that the model started is a breach. Check `mode_by` first.
- A guess that is not recorded is a decision that nobody made. Record it before the next step.
- Do not skip a step of a stage because the item looks small.
- Do not stack a guess on a high-impact guess. Finish the slices that do not depend on it first.
- The ledger is the memory. After a compaction, run `kit eng pickup <id>` and `kit eng next <id>`, then go on.
