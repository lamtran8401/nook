# A spec of size M: SHOP-12

The file that `/spec` writes for a ticket in two areas, after one question round.

````markdown
---
id: SHOP-12
kind: feature
size: M
areas: [bff, frontend]
created: 2026-10-15
updated: 2026-10-15
---

# SHOP-12: Filter shipments by status

> In short: a person picks one status and sees only those shipments. The API filters, and the page passes the status.

## Why

A person who looks for the pending shipments reads the whole list today and picks them out by eye. The API returns every shipment, and the page has no way to ask for less. The filter runs in the API, so it still holds when the list grows.

## What changes

- **bff:** `GET /shipments` takes an optional `status`. A known status returns only its shipments. An unknown status returns a 400 that names the valid ones.
- **frontend:** the page gets a status select with All and the three statuses. Called with a status, it asks the API for that status only.
- **Stays as it is:** one shipment by id, the sort order, the columns, the error banner text.

## Acceptance criteria

- [ADD] `GET /shipments?status=pending` returns only the pending shipments, newest first. (Q1)
- [ADD] `GET /shipments?status=` returns every shipment, as with no status. (G3)
- [ADD] `GET /shipments?status=lost` returns a 400: "unknown status lost; use pending, shipped or delivered". (Q3)
- [ADD] The page shows a select with All, pending, shipped and delivered, in this order. (Q2)
- [ADD] When the page opens, All is selected and every shipment shows. (Q2)
- [ADD] Called with a status, the page asks for `/shipments?status=<status>` and shows what the API returns. (Q1)
- [ADD] Called with All, the page asks for `/shipments` with no status. (Q2)
- [ADD] When no shipment has the status, the page shows "No pending shipments.", with the status in the text. (G1)
- [CHANGE] A failed call with a status shows the error banner of today. (edge case)

## Decisions

| Point | Answer | From |
|---|---|---|
| Where the filter lives | in the API; the page passes the status | Q1 |
| How the user picks | a select, All first | Q2 |
| An unknown status | a 400 that names the valid ones | Q3 |
| How many statuses | one for each request | Q4 |
| The text when nothing matches | it names the status | G1, low |
| The status type of the frontend | a string | G2, low |
| An empty `status=` | the same as no status | G3, low |

## Out of scope

- The DOM entry of the page and the wiring of the select. (owner, at /recipe)
- Several statuses in one request.
- The status in the page address.
- Statuses in another case, such as `Pending`: they are unknown.
````
