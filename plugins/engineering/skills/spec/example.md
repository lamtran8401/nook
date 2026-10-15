# A spec: SHOP-12, filter shipments by status

## The reading before the questions
```
My reading of SHOP-12:
- Shippers filter the shipment list by tracking status.
- The filter lists every status that the API returns. A selected status narrows the list.
- Changes in bff (a parameter) and frontend (a control). No contract change.
- Saved filters are out of scope.
Tell me what is wrong, then I ask the open questions.
```

## The spec
```markdown
---
id: SHOP-12
kind: feature
size: M
areas: [bff, frontend]
---
# SHOP-12: Filter shipments by tracking status

## Intent
Shippers scroll a long list to find one shipment. They cannot narrow it by tracking status.

## What we will do
- bff: accept an optional `status` on the list call and filter in the query.
- frontend: add a status control above the list; send the status; show the empty state.
- Old clients keep working, because the status is optional.

## Open points
- The ticket says "all statuses". The API has 7, and 2 of them are internal. Resolved: Q1, the filter shows the 5 public ones.
- No status selected: the ticket is silent. Resolved: G1, the list shows every shipment (impact low).
- The export button uses the same list call. Impact: it exports the filtered list. Resolved: Q2, yes.

## Acceptance criteria
- [ADD] The filter lists the 5 public tracking statuses that the API returns. (ticket AC1, Q1)
- [ADD] A selected status narrows the shipment list to that status. (ticket AC2)
- [ADD] With no status selected, the list shows every shipment. (G1)
- [ADD] When the status query fails, the list stays unchanged and a banner shows "Unable to filter". (edge case)
- [CHANGE] The export of a filtered list holds only the shipments of that status. (Q2)

## Out of scope
- Saved filters.
```

## Criteria: one behavior and one observable result
| Weak | Strong |
|---|---|
| The filter works well. | [ADD] The filter lists every tracking status that the API returns. |
| The list is fast. | [NONE] A selected status shows the filtered list in under 1 second for 500 shipments. |
| Handle errors. | [ADD] When the status query fails, the list stays unchanged and a banner shows "Unable to filter". |

A criterion is checkable when a person who did not write the code can say yes or no.
A number, a text or a visible state makes it checkable.

## From the ticket to the criteria
The ticket says: "As a shipper I want to filter shipments by status. AC: filter works for all statuses."
The clarify step of `write-spec` finds what the ticket leaves out:
```
gap         "all statuses": the API has 7; 2 are internal           → Q1: show the 5 public ones
edge case   no status selected                                      → G1: the full list (impact low)
edge case   a status with no shipments                              → G2: the empty state "No shipments"
impact      the export button uses the same list call               → Q2: export the filtered list
```
