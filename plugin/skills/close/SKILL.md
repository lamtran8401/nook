---
name: close
description: "Close an accepted item in done: accept its ADRs, keep the knowledge, send its own loose ends back into it, ask about the commits, archive the ticket. Use when the owner says close, finish or commit an accepted item."
argument-hint: "[item id]"
disable-model-invocation: true
allowed-tools: Bash(nook eng *), Bash(git status *), Bash(git log *), Read, Glob, Grep, Write, Edit
---

Goal: the next item finds the decisions and the knowledge of this one without a question to anyone.
Close is where an item turns into lasting knowledge. Skip it, and the next person repeats the finding out.
The flow: `${CLAUDE_PLUGIN_ROOT}/skills/pickup/flow.md`.

## Order
1. Run `nook eng pickup <id>`. The state must be `done`; else say so and stop.
2. Read what to keep: the Design section of `plan.md` (the decisions), `nook eng adr list` (the ADRs of the item with status `proposed`), `nook eng item ac list <id>` (the tags), `nook eng guesses <id> --open` (the guesses that nobody decided).
3. ADRs and guesses: ask the owner once, in one round. Ask accept or drop for each proposed ADR of the item, and accept or flip for each open guess.
   Run `nook eng adr accept <n>` for an accepted ADR. A decision that replaces an old one: `nook eng adr supersede <old> --by <new>`. Never edit the status line by hand.
   Run `nook eng guess accept <id> <G>` or `nook eng guess flip <id> <G> --answer "<answer>"`. A flip changes the work of this item: stop the close and send the item back, as step 5 says.
4. Knowledge: each `ADD` or `CHANGE` criterion changes a page. When the wiki is on:
   - Find the page of each topic in `resources/INDEX.md` of the wiki. A topic with no page gets a new page, `type: system`.
   - Draft each change: how the system works now, the pitfalls that remain, one History line `<date>: <id>`.
   - Show the drafts in the question round of step 3, with yes or no for each. Write the accepted ones, then run `nook wiki index --fix` and `nook wiki links`.
   - A draft that the owner keeps for later goes to `docs/wiki/drafts/<shelf>/<page>.md`, and `/daily-brief` shows it until the owner decides.
   With no wiki, list the pages that the owner must write.
   A `NONE` or `REMOVE` tag changes a page only when it removes a behavior that a page states.
5. Loose ends of this item: a nit, a gap in its own behavior, or a flipped guess is work of this item, never a new item.
   Stop the close. Send the item back: `nook eng item reopen <id> --reason "<the loose ends>"`, then `nook eng item reframe <id> --reason` when a criterion must change. The owner runs the item again; close runs at the end.
   A new idea outside the scope is the only follow-up. Ask the owner in the round of step 3; with a yes, `nook eng item new "<title>" --backlog --source <this item>`.
6. Commits: ask in chat, "commit now?". The answer yes is the request. Then `nook eng item commit <id>` prints the plan, one commit for each done slice; `nook eng item commit <id> --run` makes them. Never push.
7. Hand-over: when work stays open, write `handoff.md` as `/handoff` says. Else skip it.
8. Archive: `nook eng item archive <id>` moves the ticket folder to `backlog/archive/`. `nook eng doctor` at the end. Report.

Kind `investigate`: no commit unless the owner says so; for each line of `## Results`, a ticket for the owner to create, a wiki page or a session; a follow-up for each Follow-up line that the owner says yes to. Read `${CLAUDE_PLUGIN_ROOT}/skills/specify/investigate.md`.

## The report
```
Waits for you: commit now? 2 commits planned (nook eng item commit SHOP-12 prints them).
Closed SHOP-12. ADR 0007 accepted (filter in the query). ADR 0008 dropped. Guesses: G1 and G2 accepted.
Knowledge: shipments/shipment-list changed (2 examples), terms/tracking-status new.
Follow-up in the backlog, with your yes: SHOP-19 (saved filters, outside the scope). Ticket archived: backlog/archive/SHOP-12/.
Next: /pickup for the next item.
```

## Gotchas
- A wiki page states how the system works now and which pitfalls remain. It does not tell the story of the item. One History line is the only trace.
- Use the words of the business on a page, not the words of the ticket.
- `item commit` needs the files of each slice. A slice with no files recorded is reported; tell the owner, do not guess the files.
- Slices that share a file join one commit. Read the plan that `item commit` prints before `--run`.
- Never open a pull request. Offer PR text only when the owner asks.
- Never open an item for the loose ends of this item. The owner reads an item as one piece of work: its nits and gaps finish inside it.
- A new idea that nobody wrote down is lost. Ask the owner about it in the round of step 3.
