---
id: SHOP-48
approach: time each layer on a copy of the largest shop
created: 2026-10-16
updated: 2026-10-16
---

# SHOP-48: the plan

> In short: time the api, the query and the page on a copy of the largest shop, then try one index.

## Today

The order list loads in 4.6 s on the largest shop, and nobody knows which layer takes the time.

## Approach

| Step | Why |
|---|---|
| Time each layer | the answer names the layer |
| Try an index on the copy | the fix is proven before a ticket |

## Proof

| Question | Proof |
|---|---|
| 1 | the time of each layer on the copy |
| 2 | the time of the list with the change, on the copy |

## Impact

None: Contract, Data, Cache, Consistency, Performance, Security, Rollout.

## Risks

The copy is older than the shop. Each timing names the count of orders.
