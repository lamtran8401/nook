---
name: adr
description: "Draft a decision record in docs/adr/ for a decision that outlives the item, with status proposed; /close accepts it. Use in /plan, or when the owner says record this decision or ADR. Not for a detail of one item: that goes in the Design section."
argument-hint: "<title> [--item <id>]"
allowed-tools: Bash(nook eng *), Read, Glob, Edit, Write
---

Goal: one short record of a choice that the next item must know about: what was decided, why, and what it costs.
Without it, a later agent finds the code and not the reason, and can undo the choice.
An ADR is for a decision that outlives the item: a contract rule, a data rule, a pattern for every area.

## Order
1. Run `nook eng adr list`. A live decision that covers this one: write no new record; say which one applies.
   A decision that replaces an old one: the old one is superseded at `/close` with `nook eng adr supersede <old> --by <new>`. Do not change the old file by hand.
2. Run `nook eng adr new "<title>" --item <id>`. It makes `docs/adr/NNNN-title.md` with the status `proposed`.
3. Fill the file. Write the areas that the decision binds under the title, as `Scope: bff, frontend`.
   - Context: the problem, the constraints, what the code does today.
   - Decision: one sentence, then the reasons, then each rejected option with one line.
   - Consequences: what becomes easier, what becomes harder, what the next item must do.
4. Name the record in the Design section of `plan.md`, next to the decision it keeps.

```
# 0007: Filter the shipment list in the query
Scope: bff, frontend

## Context
The list has up to 5,000 rows. A filter in the frontend is slow at that size. Old clients must keep working.

## Decision
The bff filters in the query through an optional `status` parameter.
Rejected: a filter in the frontend (slow above 500 rows); a new endpoint (doubles the consumers).

## Consequences
- Easier: the list stays fast. Old clients are not affected.
- Harder: each new filter needs a bff change.
```

## Gotchas
- One decision for each record. Two decisions are two files.
- Write the reason. A record that says only "use X" is not a record.
- Do not accept the record, and do not edit the status line. `/close` asks the owner and runs `nook eng adr accept <n>`.
- The title states the decision as a noun phrase ("Filter the list in the query"), not the topic ("Filtering").
- A decision true for this item only is not an ADR. Put it in Design.
