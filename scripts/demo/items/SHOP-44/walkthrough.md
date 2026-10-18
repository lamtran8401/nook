---
id: SHOP-44
created: 2026-10-14
---

# SHOP-44: the walkthrough

> In short: a customer gets one mail with the tracking link when the order ships. A second event sends nothing.

## What works now

- **The shipped mail:** the worker sends one mail with the link of the carrier when an order moves to shipped.
- **Once only:** the order keeps the time of the mail, so a second event finds it and sends nothing.

## What changed

```tree
worker/
  src/
    jobs/
      shipped-mail.ts  new  sends the mail and marks the order
    mail/
      templates.ts  changed  the shipped mail
```

## Where to start reading

1. `worker/src/jobs/shipped-mail.ts`: the job and its mark.

## How it is built

The mark and the mail go in one step, so a crash never leaves a mail with no mark.

```ts
if (order.shippedMailAt) return
await mailer.send(shippedMail(order))
await orders.mark(order.id, now())
```

## Try it

1. Move a test order to shipped. One mail comes with the tracking link.
2. Move it to shipped again. No second mail comes.

## Heads up

- A mail that fails leaves no mark, so the next event sends it.
