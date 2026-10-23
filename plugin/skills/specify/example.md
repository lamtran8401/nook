# A spec of size M: SHOP-12

The file that `/specify` writes for a ticket in two areas, after one question round.

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

## Acceptance criteria

- [ADD] A list asked for one status holds only its shipments, newest first. An empty status holds every shipment, the same as no status. (Q1, G3)
- [ADD] A list asked for an unknown status, such as "lost", gets an error that names it and the valid ones: pending, shipped and delivered. (Q3)
- [ADD] The page shows a status select with All, pending, shipped and delivered, in this order, and opens on All with every shipment. (Q2)
- [ADD] A person who picks a status sees only its shipments, and All shows every shipment again. With no match, the page names the status: "No pending shipments." (Q1, Q2, G1)
- [CHANGE] When the list cannot load for a picked status, the page shows the error banner of today. (edge case)

## Details

- **Where the filter lives:** in the API; the page passes the status, such as `?status=pending`. (Q1)
- **How the user picks:** a select with All first, then pending, shipped and delivered. (Q2)
- **An unknown status:** an error that names it and the valid ones, such as "lost" is not a status. (Q3)
- **Statuses in one request:** one; `?status=pending,shipped` is an unknown status. (Q4)
- **The text with no match:** it names the status, such as "No pending shipments." (G1, low)
- **An empty status:** the same as no status, so `?status=` shows every shipment. (G3, low)

## Out of scope

- One shipment by id, the sort order, the columns and the error banner text: they stay as they are.
- The DOM entry of the page and the wiring of the select. (owner, at /plan)
- Several statuses in one request.
- The status in the page address.
- Statuses in another case, such as `Pending`: they are unknown.
````
