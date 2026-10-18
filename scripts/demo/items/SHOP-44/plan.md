---
id: SHOP-44
approach: a job on the shipped event, with a sent mark
created: 2026-10-13
updated: 2026-10-13
---

# SHOP-44: the plan

> In short: the worker listens for the shipped event and marks each order it mails. The risk is a mail sent twice.

## Today

The worker sends the receipt mail only.

## Approach

| Decision | Why |
|---|---|
| A sent mark on the order | a second event finds the mark and sends nothing |

## Impact

| Kind | Impact |
|---|---|
| Data | a column `shipped_mail_at` on the order |

None: Contract, Cache, Consistency, Performance, Security, Rollout.

## Proof

| AC | Layer | Proof |
|---|---|---|
| 1, 2 | worker, service | one mail for two events, with a fake mailer |

## Risks

The mailer is down. The job tries again on the next event.
