---
type: missing test
---

# SHOP-47: the root cause

The template formatted the date with no time zone, so it read as UTC. Every mail test placed its order at noon, so no test crossed midnight in another zone.
