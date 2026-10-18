---
id: SHOP-41
approach: a rate table by country in the total
created: 2026-10-10
updated: 2026-10-10
---

# SHOP-41: the plan

> In short: the total reads the rate of the country from one table. The risk is a country with no rate.

## Today

The total is the sum of the lines, with no tax.

## Approach

| Decision | Why |
|---|---|
| One rate table in code | three countries, and they change once a year |

## Impact

None: Contract, Data, Cache, Consistency, Performance, Security, Rollout.

## Proof

| AC | Layer | Proof |
|---|---|---|
| 1, 2 | api, unit | a total for France and one with no country |

## Risks

A new country with no rate. The total then shows no tax line.
