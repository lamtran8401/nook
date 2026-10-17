---
name: learn-cards
description: "Review the cards that are due: show the front, let the owner answer, show the back, mark known (good) or missed (again) with `nook learn card review`. Use in /learn-today. Not for making new cards: /learn-today adds them."
allowed-tools: Bash(nook learn *)
---

Goal: each due card gets one honest answer, and comes back at the right time.

## Order
1. Take the cards due from `nook learn today [course]`.
2. For each card: show the front only, and wait for the owner's answer.
3. Show the back. Mark it: `nook learn card review [course] <id> good` when the answer holds the point, `again` when it does not.
4. After the last card, say how many were good and how many come back tomorrow.

## Gotchas
- Never show the back before the owner answers.
- An answer that is close but misses the point is `again`. The card comes back tomorrow, which costs little.
- More than 20 cards due: do the oldest 20 and say how many wait.
