---
name: close
description: "Close an accepted item in done: accept its ADRs, keep the knowledge, open the follow-ups, ask about the commits, archive the ticket. Use when the owner says close, wrap up, finish or commit an accepted item."
argument-hint: "<item id>"
disable-model-invocation: true
allowed-tools: Bash(kit eng *), Bash(git status *), Bash(git log *), Read, Glob, Grep, Write, Edit
---

Goal: the next item finds the decisions and the knowledge of this one without a question to anyone.
Close is where an item turns into lasting knowledge. Skip it, and the next person repeats the finding out.
The flow: `${CLAUDE_PLUGIN_ROOT}/skills/pickup/flow.md`.

## Order
1. Run `kit eng pickup <id>`. The state must be `done`; else say so and stop.
2. Read what to keep: the Design section of `plan.md` (the decisions), `kit eng adr list` (the ADRs of the item with status `proposed`), `kit eng item ac list <id>` (the tags), `kit eng guesses <id>` (the guesses that stand).
3. ADRs: ask the owner once, accept or drop for each proposed ADR of the item. Run `kit eng adr accept <n>` for an accepted one.
   A decision that replaces an old one: `kit eng adr supersede <old> --by <new>`. Never edit the status line by hand.
4. Knowledge: each `ADD` or `CHANGE` criterion changes a page. When the wiki pack is on, add or change the page with its skill; else list the pages the owner must write.
   A `NONE` or `REMOVE` tag changes a page only when it removes a behavior that a page states.
5. Follow-ups: one backlog item for each follow-up the item left: `kit eng item new <id> "<title>" --backlog --source <this item>`.
6. Commits: ask in chat, "commit now?". The answer yes is the request. Then `kit eng item commit <id>` prints the plan, one commit for each done slice; `kit eng item commit <id> --run` makes them. Never push.
7. Hand-over: when work stays open, write `handoff.md` as `/handoff` says. Else skip it.
8. Archive: `kit eng item archive <id>` moves the ticket folder to `backlog/archive/`. `kit eng doctor` at the end. Report.

Kind `investigate`: no commit; a follow-up for each Follow-up line. Read `${CLAUDE_PLUGIN_ROOT}/skills/spec/investigate.md`.

## The report
```
Waits for you: commit now? 2 commits planned (kit eng item commit SHOP-12 prints them).
Closed SHOP-12. ADR 0007 accepted (filter in the query). ADR 0008 dropped.
Knowledge: shipments/shipment-list changed (2 examples), terms/tracking-status new.
Follow-up SHOP-19 in the backlog (saved filters). Ticket archived: backlog/archive/SHOP-12/.
Next: /pickup for the next item.
```

## Gotchas
- A wiki page states how the system works now and which pitfalls remain. It does not tell the story of the item. One History line is the only trace.
- Use the words of the business on a page, not the words of the ticket.
- `item commit` needs the files of each slice. A slice with no files recorded is reported; tell the owner, do not guess the files.
- Slices that share a file join one commit. Read the plan that `item commit` prints before `--run`.
- Never open a pull request. Offer PR text only when the owner asks.
- A follow-up that nobody wrote down is lost. Open the item now, with one line of source.
