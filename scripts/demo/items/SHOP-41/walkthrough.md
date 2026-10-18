---
id: SHOP-41
created: 2026-10-11
---

# SHOP-41: the walkthrough

> In short: the total of an order now adds the tax of its country. An order with no country keeps its old total.

## What works now

- **Tax by country:** the total reads the rate of the country, such as 20% for France, and adds one tax line.
- **No country:** an order with no country shows the total as before, with no tax line.

## What changed

```tree
api/
  src/
    orders/
      tax.ts  new  the rate of each country
      total.ts  changed  adds the tax line
```

## Where to start reading

1. `api/src/orders/tax.ts`: the one table of rates.
2. `api/src/orders/total.ts`: where the total adds the line.

## How it is built

A country with no rate gives no line, so a new country never breaks the total.

```ts
const rate = RATES[order.country]
if (rate === undefined) return lines
```

## Try it

1. Open an order from France. The total shows a tax line of 20%.
2. Open an order with no country. The total shows no tax line.

## Heads up

- A new country needs its rate in `tax.ts`.
