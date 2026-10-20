---
name: triage
description: "Classify an item with one line of evidence for each point: kind, size, areas, contract flag, risk, path and challenge depth. Use in /spec and /quick, or when the owner asks how big or how risky a change is. Not for the areas in the code: find-repos."
argument-hint: "<item id or title>"
allowed-tools: Bash(nook eng *), Read, Glob, Grep
---

Goal: a fast, honest classification that sets the path of the item: how many documents, how much challenge, how many builders.
A wrong size costs too much process or too little.
Run it before framing, and again when the plan changes the scope.

## Order
1. An item id: run `nook eng item brief <id>` and read the ticket in `backlog/<id>/`. Else the subject is a title.
2. Run `nook eng area list` for the areas and their kinds, and `nook eng area status` for dirty files.
   A row `Kind:` in the Fields of `ticket.md` is the first answer for the kind: the tracker type, mapped by the source. Its evidence is that row; change it only with a reason from the ticket.
3. Decide each point, with one line of evidence. A bare label is a guess.
```
kind       fix (repairs behavior that must work already) · feature (adds behavior) · chore (build, tools, docs) · investigate ("find out why", "check if")
size       S one area · M two areas · L three or more, or a step that is hard to undo
           at least M: a contract change, a data or schema change, a business rule that is unclear
areas      the areas of nook.yml that change; run find-repos when two readings exist
contract   yes when a shared interface changes: a proto, GraphQL, OpenAPI or event schema, even in one area
risk       data migration · shared contract · many consumers · unclear requirement · no tests today · hard to undo
path       quick (fix or chore, one area, S, no contract) · standard · yolo when the mode is yolo · investigate
challenge  skip (S, no risk) · one skeptic pass (M) · full round (L, every contract change); each risk tick raises it one step
```
4. For an item that exists, write the result into the spec front matter (`kind`, `size`, `areas`): it is the source. Before `agree`, `nook eng item edit <id> kind|size|areas <value>` keeps the ledger in step.
5. Show the result as a short list.

```
kind: feature. Evidence: the ticket adds a filter to a list.
size: M. Evidence: bff and frontend change. No contract change.
areas: bff `src/shipments/list.ts:42`, frontend `ShipmentList.tsx:18`.
contract: no. The list is a REST call of the bff with no shared schema.
areas state: bff clean. frontend has 3 dirty files: tell the owner before `nook eng item branch`.
risk: none beyond two areas. path: standard. challenge: one pass.
```

## Gotchas
- Size follows the areas first. A big file count alone does not change it.
- A shared interface is a contract even when one area holds the file.
- Dirty files in an area stop `nook eng item branch`. Name them now, not at cook.
- A quick item that grows past one area or one slice is no longer quick. Say so when you see it.
- Do not guess an unclear point. Name it for the question round.
