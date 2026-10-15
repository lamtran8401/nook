---
name: spec-check
description: "Gate before the owner reads a spec: front matter complete, areas in kit.yml, each criterion checkable and sourced, the ticket covered, no gap for agree. Use in /spec or when the owner asks if the spec is ready. Not for writing it: write-spec."
argument-hint: "<item id>"
allowed-tools: Bash(kit eng *), Read, Glob, Grep, Edit
---

Goal: a spec that passes the guard of `agree` and that the owner reads once and agrees with.
A gap left here comes back as a failed review. This is the cheapest place to find it, so be strict.

## Order
Read `work/<id>/spec.md`, the ticket and `kit eng item brief <id>`. Name each gap in one line, with the line of the file.
1. Front matter: `kind` set; a feature has a `size`; `areas` not empty and each one in `kit eng area list`.
2. Intent: one paragraph that says who is stuck and why. It does not repeat the title.
3. What we will do: a reader who did not see the ticket understands what changes.
4. Open points: each gap, edge case, conflict and impact has a line that says how it was resolved: `Q<n>`, `G<n>` or open.
5. Criteria: at least one (investigate: one question). Each line starts with `[ADD]`, `[CHANGE]`, `[REMOVE]` or `[NONE]` and ends with its source. "ticket" stands before a number of the ticket.
6. Each criterion is checkable: one behavior, one observable result, a yes or no from a person who did not write the code. Reject "works well", "is fast", "handles errors". Ask for a number or an example.
7. Not copied: a criterion that repeats a vague line of the ticket word for word is a gap. Rewrite it as one behavior and one result.
8. Coverage: every requirement of the ticket has a criterion or an Out of scope line. No criterion adds a behavior that nobody asked for.
9. Out of scope has content and names what a reader could assume.
10. Questions: `kit eng questions <id> --open` lists no blocking question.
11. The guard: `kit eng item check <id>` lists no gap for `agree`.

## Fix or report
- Fix what is mechanical: a tag, a source, a heading, the front matter.
- Report what needs the owner: a criterion that cannot be made checkable, an area not confirmed, an unclear scope. Propose the fix with the number or text you would use.
- Run the check again after each fix. A moved line changes the AC numbers.

```
spec-check SHOP-12: 2 gaps
- AC2 "The list is fast" is not checkable. Proposed: "[NONE] A selected status shows the filtered list in under 1 second for 500 shipments." The owner confirms the number.
- Out of scope is empty. Proposed: "Saved filters."
Passed: front matter, intent, coverage, sources, no open question, item check.
```

## Gotchas
- Check the criteria against the ticket, not only against the file. A criterion the ticket needs and the file lacks is a gap.
- A criterion that no test and no person can check is the most expensive gap: the reviewer cannot close it, and the accept stalls.
- Do not add a criterion the owner did not ask for. Propose it as a question.
