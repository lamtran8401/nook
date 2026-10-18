---
id: SHOP-45
kind: feature
size: M
areas: [api, web]
created: 2026-10-18
updated: 2026-10-18
---

# SHOP-45: Search orders by customer email

> In short: support finds the orders of a customer by the email, such as ana@example.com.

## Why

Support asks the customer for the order id, and most customers do not have it.

## What changes

- **api:** a search by email on the order list.
- **web:** a search box above the list.

## Acceptance criteria

- [ADD] A search by email lists the orders of that customer, newest first.
