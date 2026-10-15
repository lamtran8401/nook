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
   - it does not block: a guess, `kit eng guess <id> "<question>" --took "<a>" --other "<b>" --impact low|med|high`;
   - neither: give it a row with `open` in the Decisions table.

## The acceptance criteria
One line each, `- [TAG] text (source)`. No number: the n-th line is AC n.
- The tag: `[ADD]` a new behavior, `[CHANGE]` a behavior that changes, `[REMOVE]` a behavior that goes away, `[NONE]` no lasting behavior (a speed target, a fix of a wrong result).
  `/close` turns each `ADD` and `CHANGE` into a page of the wiki.
- One behavior and its observable result: a number, a text or a visible state.
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
