# Expect: kinds and their flows

The plan is `docs/plan/kinds.md`. Each row must pass before the step is done.

## Part 1: the flow files

| # | Given | When | Then |
|---|---|---|---|
| K1 | the pack | it loads | `plugins/engineering/flows/` holds one file for each kind: `feature`, `fix`, `chore`, `investigate` |
| K2 | a flow file with a rule that the code does not know | `nook doctor` runs | it names the file, the rule and the rules that it knows |

## Part 2: the fix

| # | Given | When | Then |
|---|---|---|---|
| K3 | a fix whose `spec.md` has no `## Reproduce` | `agree` runs | it refuses and names the missing section |
| K4 | a fix with `## Reproduce`, `## Actual` and `## Expected` filled | `agree` runs | the sections pass |
| K5 | a fix in cooking with no `root-cause.md` | `submit` runs | it refuses and names the file and its shape |
| K6 | a desk with `engineering.rootCauses` and a `root-cause.md` whose type is not on the list | `submit` runs | it refuses and lists the types of the desk |
| K7 | a `root-cause.md` with the type of `engineering.unknownRootCause` and no `reason` | `submit` runs | it refuses and asks for the reason |
| K8 | a desk with no list, and a `root-cause.md` with a type and an analysis | `submit` runs | the check passes; the ledger holds the type |

## Part 3: the investigation

| # | Given | When | Then |
|---|---|---|---|
| K9 | an investigation with no area and no slice | it moves from planning to cooking and to review | no guard asks for an area or a slice |
| K10 | an investigation with an area and slices | it runs | the slices run and prove as the slices of a feature |
| K11 | a `findings.md` with an answer to each question and no `## Results` | `submit` runs | it refuses and names the kinds of result: a decision or a document, a proof of concept, new tickets, a session, a wiki page |

## Part 4: sub-bugs

| # | Given | When | Then |
|---|---|---|---|
| K12 | an item with a `parent` | `nook eng item show` runs | it names the parent; the parent names its children |
| K13 | a parent with an open child | the owner runs `accept` on the parent | it refuses and names each open child |
| K14 | a child that is done or cancelled | the owner runs `accept` on the parent | the children pass |
| K15 | an open child | `nook eng item detach <child> --reason "next sprint"` runs | the child has no parent; the ledger records the reason; the `accept` of the parent passes |

## Part 5: the tracker types

| # | Given | When | Then |
|---|---|---|---|
| K16 | a source with `kinds` and a ticket of a mapped type | `nook issues pull` runs | `ticket.md` has a row `Kind: fix` in Fields |
| K17 | a ticket of a type in `skip` | the pull runs | it stops: the type has no local work in this desk |
| K18 | a ticket of a type in neither list | the pull runs | it stops with the fix: add the type to `kinds` or to `skip` |
| K19 | a ticket with a parent in the tracker | the pull runs | `ticket.md` has a row `Parent: SHOP-12`; `/intake` sets the parent of the item |

## Part 6: the metrics

| # | Given | When | Then |
|---|---|---|---|
| K20 | fixes accepted in the span | `nook eng metrics` and `nook retro` run | each root cause type shows with its count, the most frequent first |

## Part 7: the docs

- The engineering reference states the flow files, the root cause, the parent and `item detach`. The reference of issue-tracker states `kinds` and `skip`.
- The guide shows a fix and an investigation from intake to done.
- The skills `/spec`, `/intake`, `triage`, `/deep-review` and `/close` follow the flow of the kind.
- Each Markdown file passes `nook ste`. A sample list of root causes in the docs names no real team.
