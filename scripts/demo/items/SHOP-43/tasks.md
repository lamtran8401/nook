---
id: SHOP-43
created: 2026-10-17
updated: 2026-10-17
---

# SHOP-43: the slices

## T1: Stream the orders of a month as CSV

- area: api
- depends: none
- acs: 1, 3
- size: M
- done when: the route gives the rows of a month and a header for an empty one

## T2: Add the Export button

- area: web
- depends: T1
- acs: 2
- size: S
- done when: the button links to the export of the month on screen
