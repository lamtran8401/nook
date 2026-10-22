---
id: SHOP-48
kind: investigate
size: S
areas: []
created: 2026-10-16
updated: 2026-10-16
---

# SHOP-48: Find why the order list is slow

> In short: the order list takes 4.6 s on the largest shop; find where the time goes and what brings it under one second.

## Why

Shop owners wait for the order list each morning, and some give up.

## Questions

- Where does the time go: the api, the database or the page?
- Which change brings the list under one second?

## Out of scope

- A change of the page design.
