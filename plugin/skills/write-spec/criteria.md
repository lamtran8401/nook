# The clarify step and the criteria

## Clarify before you write a criterion
Do not copy the ticket. Think it through as the person who must build it.
1. List each requirement of the ticket in your own words, with its source: `ticket AC2`, a comment, an attachment.
2. For each one, look for:
   - a gap: what the ticket does not say;
   - an edge case: empty, large, wrong, missing, at the same time;
   - a conflict: two requirements that cannot both hold;
   - an impact on a related feature: another screen, caller, export or report that uses the same call, table or component. Read the callers.
3. Resolve each finding:
   - it changes the work: a blocking question in the round of `/spec`;
   - it does not block: a guess, `nook eng guess <id> "<question>" --took "<a>" --other "<b>" --impact low|med|high`;
   - neither: give it a line in Details that ends with `(open)`.

## The acceptance criteria
One line each, `- [TAG] text (source)`. No number: the n-th line is AC n.
- The tag: `[ADD]` a new behavior, `[CHANGE]` a behavior that changes, `[REMOVE]` a behavior that goes away, `[NONE]` no lasting behavior (a speed target, a fix of a wrong result).
  `/close` turns each `ADD` and `CHANGE` into a page of the wiki.
- One thing that the owner sees work, and its observable result: a number, a text or a visible state.
- Fold its edge cases into the same line: "An empty one gives the first page." An edge case gets its own criterion only when it is a separate thing to see.
- The proposed cap: the criteria of the ticket + 2, kept in the range of the size: S 1 to 3, M 3 to 6, L 5 to 10. A ticket with no criteria gets the top of the range.
  A complex requirement can go over the cap. Then add a line to Details that says why. `agree` warns over the cap; it does not refuse.
- Plain words, for the owner: what a person or a caller does, and what they get. "The status filter works on every page: 25 pending give 20, then 5."
- No endpoint, query, status code, field, function or file name. The exact check of each criterion goes in the Proof of `plan.md`.
- The source in brackets at the end: `(ticket AC2)`, `(Q3)`, `(G1)`, `(edge case)`. Write "ticket" before a number of the ticket; a bare `(AC2)` reads as a criterion of the spec.
- Every requirement of the ticket has a criterion or an Out of scope line. Every resolved finding that changes the behavior has a criterion.
- A row of a Given, When, Then table is one criterion.

## The bar
- A person who did not write the code can say yes or no to each criterion, and a test or a check can show it.
- No criterion adds a behavior that nobody asked for.
- The intent tells the owner something the title does not.

| Weak | Why | Strong |
|---|---|---|
| The filter works well. | no result to see | [ADD] The filter lists every tracking status that the API returns. (ticket AC1) |
| Handle errors. | which error, which result | [ADD] When the status query fails, the list stays unchanged and a banner shows "Unable to filter". (edge case) |
| Make the list fast. | no number | [NONE] A selected status shows the filtered list in under 1 second for 500 shipments. (Q3) |
| Filter works for all statuses. | copied; "all" is wrong | [ADD] The filter lists the 5 public tracking statuses that the API returns. (ticket AC1, Q1) |
| `GET /shipments?cursor=xyz` returns a 400: `unknown cursor xyz`. | says how, in code | [ADD] A request for a next page that does not exist gets an error that names it, and no shipments. (edge case) |
| The last page has `next: null`. | a field name | [ADD] The last page says that no page comes after it. (ticket AC4) |
