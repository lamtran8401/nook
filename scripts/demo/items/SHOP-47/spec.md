---
id: SHOP-47
kind: fix
size: S
areas: [worker]
created: 2026-10-14
updated: 2026-10-15
---

# SHOP-47: Fix the date in the receipt mail

> In short: the receipt mail shows the day of the order in the time zone of the shop, not in UTC.

## Why

A customer in Hanoi who orders late at night gets a receipt with the wrong day, and asks support.

## Reproduce

1. Place an order at 23:30 in a shop in Hanoi.
2. Open the receipt mail.

## Actual

The mail shows the day before, the day in UTC.

## Expected

The mail shows the day of the order in the time zone of the shop.

## What changes

- **worker:** the receipt mail formats the date in the time zone of the shop.

## Acceptance criteria

- [CHANGE] An order at 23:30 in Hanoi shows its own day in the receipt mail.
- [ADD] A shop with no time zone shows the day in UTC.

## Out of scope

- The dates of the order list in the admin.
