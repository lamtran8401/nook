# Check the spec

Step 7 of `/specify`. A gap left here comes back as a failed review. This is the cheapest place to find it, so be strict.

## Order
Read `works/<id>/spec.md`, the ticket and `nook eng item brief <id>`. Name each gap in one line, with the line of the file.
1. Front matter: `kind` set; a feature has a `size`; `areas` not empty and each one in `nook eng area list`; `created` and `updated` are dates, and `updated` is today after an edit.
2. In short and Why: the change in one line, then one paragraph that says who is stuck and why. Neither repeats the title.
3. What changes: a reader who did not see the ticket understands what changes in each area. The parts that stay as they are stand in Out of scope.
4. Details: each gap, edge case, conflict and impact has a line with one example and how it was resolved: `Q<n>`, `G<n>` with its impact, or `open`. An answered question or a guess also shows in the criterion that it touches.
5. Criteria: at least one (investigate: one question). Each line starts with `[ADD]`, `[CHANGE]`, `[REMOVE]` or `[NONE]` and ends with its source. "ticket" stands before a number of the ticket.
6. Each criterion is checkable: one thing that the owner sees work, its observable result, a yes or no from a person who did not write the code. Reject "works well", "is fast", "handles errors". Ask for a number or an example.
   The count: the proposed cap is the criteria of the ticket + 2, in the range of the size (S 1 to 3, M 3 to 6, L 5 to 10). Over the cap, merge the criteria of one thing to see. Keep more only for a complex requirement, with a line in Details that says why; with no such line, it is a gap.
7. Not copied: a criterion that repeats a vague line of the ticket word for word is a gap. Rewrite it as one behavior and one result.
   Plain words: a criterion with an endpoint, a query, a status code, a field, a function or a file name is a gap. Rewrite it as what a person or a caller gets; the exact check goes in the Proof of the plan.
8. Coverage: every requirement of the ticket has a criterion or an Out of scope line. No criterion adds a behavior that nobody asked for.
9. Out of scope has content and names what a reader could assume.
10. Questions: `nook eng questions <id> --open` lists no blocking question.
11. The guard: `nook eng item check <id>` lists no gap for `agree`.

## Fix or report
- Fix what is mechanical: a tag, a source, a heading, the front matter.
- Report what needs the owner: a criterion that cannot be made checkable, an area not confirmed, an unclear scope. Propose the fix with the number or text you would use.
- Run the check again after each fix. A moved line changes the AC numbers.

```
check of SHOP-12: 2 gaps
- AC2 "The list is fast" is not checkable. Proposed: "[NONE] A selected status shows the filtered list in under 1 second for 500 shipments." The owner confirms the number.
- Out of scope is empty. Proposed: "Saved filters."
Passed: front matter and dates, why, coverage, sources, no open question, item check.
```

## Gotchas
- Check the criteria against the ticket, not only against the file. A criterion the ticket needs and the file lacks is a gap.
- A criterion that nobody can check is the most expensive gap: the accept stalls.
- Do not add a criterion the owner did not ask for. Propose it as a question.
