---
id: SHOP-47
approach: format the date with the time zone of the shop
created: 2026-10-15
updated: 2026-10-15
---

# SHOP-47: the plan

> In short: the mail template formats the date with the time zone of the shop. The risk is a shop with no time zone.

## Today

The template formats the date of the order with no time zone, so it reads as UTC.

## Approach

| Decision | Why |
|---|---|
| Pass the zone of the shop to the template | the day follows the shop |

## Proof

| AC | Layer | Proof |
|---|---|---|
| 1, 2 | worker | a mail test at 23:30 in Hanoi, and one with no zone |

## Impact

None: Contract, Data, Cache, Consistency, Performance, Security, Rollout.

## Risks

A shop with no time zone set. It falls back to UTC, as today.
