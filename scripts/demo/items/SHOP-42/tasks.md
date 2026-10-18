---
id: SHOP-42
created: 2026-10-15
updated: 2026-10-15
---

# SHOP-42: the slices

## T1: Add the saved card table

- area: api
- depends: none
- acs: 1
- size: S
- done when: a card saves and lists for its customer

## T2: Charge a saved card through the vault

- area: api
- depends: T1
- acs: 1
- size: M
- done when: a charge by card id pays with a fake vault

## T3: Pick a saved card at checkout

- area: web
- depends: T2
- acs: 1
- size: M
- done when: the checkout lists the saved cards and pays with one

## T4: Retry a declined charge

- area: api
- depends: T2
- acs: 2
- size: M
- done when: the retries run at 1, 5 and 30 minutes with a fake clock

## T5: Refund to the same card

- area: api
- depends: T2
- acs: 3
- size: S
- done when: a refund to a removed card pays back

## T6: Show the reason of a decline

- area: web
- depends: T3
- acs: 4
- size: S
- done when: each decline code shows its reason
