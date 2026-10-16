---
id: {{id}}
kind: {{kind}}
size: {{size}}
areas: {{areas}}
created: {{today}}
updated: {{today}}
---

# {{id}}: {{title}}

<!-- The front matter is the source of kind, size and areas. `agree` copies them into the ledger. -->
<!-- Change `updated` to the date of each edit. The dates use the form YYYY-MM-DD. -->
<!-- Write the In short line last, as one line: `> In short: <1 or 2 sentences>`. -->

## Why

<!-- One paragraph for the business reader: the problem today, who has it, and what changes for them. -->

## What changes

<!-- One line for each area: `- **<area>:** the change in plain words`. -->
<!-- Add one line `- **Stays as it is:** ...` for the parts that do not change. -->

## Acceptance criteria

<!-- One line for each criterion: `- [ADD|CHANGE|REMOVE|NONE] text (source)`. The n-th line is AC n. -->
<!-- The source is the question, the guess or the ticket line that the criterion comes from: (Q1), (G1), (ticket). -->
<!-- A test must be able to check each criterion. One criterion for each thing that the owner sees work, with its edge cases in the same line. -->
<!-- Proposed cap: the criteria of the ticket + 2, in the range S 1-3, M 3-6, L 5-10. Over it, say why in the Decisions table. -->
<!-- Plain words: what a person or a caller gets. No endpoint, query, code, field or file name; the plan's Proof holds the exact check. -->

## Decisions

<!-- The answers that shape the item, one row each. From: the question or the guess, for example Q1 or G1, med. -->

| Point | Answer | From |
|---|---|---|

## Out of scope

<!-- One line for each thing that this item does not change. -->
