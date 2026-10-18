---
id: SHOP-44
kind: feature
size: S
areas: [worker]
created: 2026-10-12
updated: 2026-10-13
---

# SHOP-44: Send a mail when an order ships

> In short: the customer gets one mail with the tracking link when the order ships.

## Why

Customers ask support where their parcel is. The carrier gives a tracking link that nobody sends.

## What changes

- **worker:** a job sends the mail when an order moves to shipped.

## Acceptance criteria

- [ADD] The customer gets one mail with the tracking link when the order ships.
- [ADD] A second ship event for the same order sends no second mail.

## Details

- **The mail:** the subject is "Your order SHOP-1042 is on its way", with the link of the carrier. (Q1)

## Out of scope

- A text message.
