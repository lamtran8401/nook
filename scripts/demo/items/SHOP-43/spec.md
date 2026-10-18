---
id: SHOP-43
kind: feature
size: M
areas: [api, web]
created: 2026-10-16
updated: 2026-10-17
---

# SHOP-43: Export the order list as CSV

> In short: the owner of a shop downloads the orders of a month as one CSV file for the accountant.

## Why

Each month the owner copies the orders by hand into a sheet for the accountant.

## What changes

- **api:** `GET /orders/export?month=2026-10` gives the orders of that month as CSV.
- **web:** an Export button above the order list.

## Acceptance criteria

- [ADD] The export gives one row for each order of the month, with its date, total and tax.
- [ADD] The Export button downloads the file of the month on screen.
- [ADD] A month with no order gives a file with the header only.

## Details

- **Columns:** date, order id, customer, total, tax, such as `2026-10-03,SHOP-1042,Ana Ruiz,120.00,20.00`. (Q1)
- **Time zone:** a month runs in the time zone of the shop. (G1, med)

## Out of scope

- An export of a range that is not one month.
