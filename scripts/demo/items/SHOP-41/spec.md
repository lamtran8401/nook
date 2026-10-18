---
id: SHOP-41
kind: feature
size: S
areas: [api]
created: 2026-10-10
updated: 2026-10-10
---

# SHOP-41: Show the order total with tax

> In short: the order total names the tax of its country, such as 20% in France.

## Why

Customers in France saw a total with no tax line and asked support for an invoice.

## What changes

- **api:** the order total adds a tax line by country.

## Acceptance criteria

- [ADD] The total of an order adds the tax of its country.
- [CHANGE] An order with no country shows the total with no tax line.

## Details

- **Rates:** France 20%, Germany 19%, Vietnam 10%. (Q1)

## Out of scope

- A tax that changes by product.
