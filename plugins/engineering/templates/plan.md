---
id: {{id}}
approach: 
created: {{today}}
updated: {{today}}
---

# {{id}}: the plan

<!-- `approve` needs text in Today, Approach, Impact, Proof and Risks, and in Flow for size L. -->
<!-- `nook eng item check {{id}}` lists the sections that are empty. A mermaid block counts as text. -->
<!-- Length: a plan of size M has fewer than 60 lines with text, a plan of size L fewer than 100. Blank lines do not count; the diagrams do. -->
<!-- Write decisions, not code: no path with a line number, no function signature, no code block. -->
<!-- Write the In short line last, as one line of 2 sentences: `> In short: <the approach>. <the main risk>.` -->

<!-- Facts only: no question, no answer and no state such as "waits for Q3". The ledger holds them. -->

## Today

<!-- One mermaid diagram of the parts that exist now. Then at most 3 facts, one line each. -->

## Approach

<!-- One mermaid diagram of the parts after the change. Mark a new part as new and a changed part as changed. -->
<!-- Then a decisions table. Size M: | Decision | Why |. Size L: | Decision | Why | If it fails |. -->
<!-- Then at most 3 options not taken: | Option not taken | Why not |. -->
<!-- Size L, when the item runs in two places or more: add `## System design`, one mermaid flowchart with one `subgraph` for each place. -->
<!-- When the item adds or changes data: add `## Data model`, one mermaid erDiagram of those tables, with PK and FK. -->

## Impact

<!-- A table | Kind | Impact | with a row only for each kind that changes. -->
<!-- The kinds: Contract, Data, Cache, Consistency, Performance, Security, Rollout. -->
<!-- Then one line for the other kinds: `None: <the kinds that do not change>.` -->
<!-- When the item ships in stages: add `## Rollout`, numbered steps, each with its check; the Rollout row names it. -->

## Flow

<!-- Size L only. One mermaid sequence diagram of the main request. -->
<!-- Then at most 3 invariants: "What must always be true:" and one line each. -->
<!-- Then at most 4 failure cases: | Case | What happens |. -->

## Proof

<!-- A table | AC | Layer | Proof | with at most 6 rows. Put related criteria in one row: 1, 2. -->
<!-- Layer: the area, then the layer of the test, for example `web, component`. -->
<!-- Write the negative case in the same cell as the check. -->

## Risks

<!-- A table | Risk | Likelihood | What we do | with at most 3 rows. Likelihood: low, med or high. -->
