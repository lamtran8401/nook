# Retro: the first item through the flow

> In short: IT-1 of the sandbox was the first item through the whole flow, from intake to close. It showed nine faults of the kit and of the lead. Eight are fixed; one waits for the owner.

## Faults and fixes

| Fault | Cause | Fix |
|---|---|---|
| The builders did not see when a slice is done or which guesses stand. | The task brief left out the `done when` line and the open guesses. | The brief prints both (`22b5d97`). |
| The ledger kept only the first file of each slice. | `--files a b` kept `a` and dropped the rest with no word. | A list flag takes every word up to the next flag (`420c017`). |
| One half-done edit blocked every tool, and the Stop hook looped. | A fault of the code became a usage error, exit 2, which a hook reads as a block. | Only a wrong flag is a usage error. The shim blocks a guard and passes every other hook when the kit fails (`29826e8`). |
| While the kit failed to load, the guards let every call pass. | A load error exits 1, and Claude Code reads exit 1 as "pass". | The shim blocks a guard on any exit other than 0 or 2, and names the `!` repair (`29826e8`). |
| The lead wrote a call before the function it calls. | No rule on the order of edits. | `CLAUDE.md`: each edit leaves `kit` runnable (`9c208a4`). |
| A builder gave All the value `All`, against ADR 0002, and `/check` sent the item back. | The brief did not name the decisions that bind the slice. | The brief prints the live ADRs of the item and of the area (`29826e8`). |
| The counts of a review came from the lead's own run. | `item verify` printed only a mark for each check. | `item verify` prints the counts of each check (`2249fff`). |
| A guess flip on a done item would send finished slices back to `todo`. | The flip reset slices in every state. | On a done item a flip records the answer only (`3240c0f`). |
| A small item used six review agents, three of them at once. | `/cook` reviewed each slice of an M item; `/check` started one code reviewer for each area. | An S or M item gets one code reviewer in `/check`, for every area, before the AC reviewer (`9c208a4`). |

## Waits for the owner

- A new test file or a new export makes the proof `none`, because the tests cannot load on the base. T1 and T4 of IT-1 had this proof. The proposal: read a missing module or a missing export that the slice adds as `proven`.

## Kept

- The gate hook let the owner approve and accept in the session.
- `/check` found a real fault that the tests did not show: the All value.
- The item page, built with the UI kit, holds the spec, the plan, the tasks and the walkthrough.
