---
id: SHOP-42
kind: feature
size: L
areas: [api, web]
created: 2026-10-14
updated: 2026-10-15
---

# SHOP-42: Pay for an order with a saved card

> In short: a returning customer pays with a card saved on an earlier order, in one click. A declined charge tries again and shows its reason.

## Why

Half of the orders come from returning customers, and each one types the card again. The checkout loses one order in eight at the card form.

## What changes

- **api:** a table of saved cards, a charge by card id through the vault, retries after a decline, and a refund to the same card.
- **web:** the saved cards at checkout, and the reason of a decline.

## Acceptance criteria

- [ADD] A returning customer pays with a saved card in one click.
- [ADD] A declined charge tries again after 1, 5 and 30 minutes. (G2)
- [ADD] A refund goes back to the card that paid. (Q2)
- [CHANGE] A decline shows its reason, such as "the card expired". (Q1)

## Details

- **Saved cards:** only the vault holds the card number; the shop keeps a token and the last 4 digits, such as 4242. (Q1)
- **Retries:** a declined charge tries again at 10:01, 10:06 and 10:36 after a decline at 10:00. (G2, high)
- **Refunds:** a refund goes to the card that paid, also after the card is removed. (Q2)

## Out of scope

- A wallet such as Apple Pay.
- A second currency.
