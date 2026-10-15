# A plan and its slices: SHOP-12

## plan.md
```markdown
# Plan: SHOP-12

## Architecture
- bff `src/shipments/list.ts:42` builds the list query from `page` and `sort`. It reads no `status`.
  - Tests: `src/shipments/list.test.ts`, run by `yarn test` (the check of bff in `kit.yml`).
- frontend `src/shipments/ShipmentList.tsx:18` calls `GET /shipments` with `page` and `sort`.
- frontend `src/shipments/export.ts:31` reuses the same call for the export.
- Contract: none. The list is a REST call of the bff with no shared schema file.
- Unknown: how the cache key of the list is built.

## Design
Add `status` as an optional query parameter of the list in bff. The frontend sends it from a new filter control.
- Decision: the parameter is optional. Reason: old frontends keep working during the rollout.
- Decision: the filter runs in the query. Reason: the list has up to 5,000 rows.
- Contract impact: none. Data impact: the `status` column needs an index (`schema.sql:88` shows none).
- Outlives the item: filter in the query, not in memory (ADR 0007).

Rejected: a new endpoint `/shipments/by-status`. It repeats the list contract and doubles the consumers.
Rejected: a filter in the frontend. It breaks above 500 rows.

## Steps
1. bff: the index, then the optional parameter and the filter. Ships first.
2. frontend: the control, the banner, the export. Ships after the bff.
Compatibility: new bff with old frontend works (the parameter is optional). New frontend with old bff does not filter.
Rollback: remove the control. The bff ignores a missing parameter. The index is hard to undo: the owner decides when it runs.

## Tests
- AC1 (the filter lists the 5 public statuses): bff unit test on the status list. Negative: an internal status adds no option.
- AC2 (a status narrows the list): bff test with two statuses. Negative: an unknown status returns an empty list, not an error.
- AC3 (no status shows every shipment): bff test with no parameter. Negative: an empty string equals no parameter.
- AC4 (the banner): frontend test with a failing query asserts "Unable to filter". Negative: a slow query shows no banner.
- AC5 (the export): frontend test that the export call carries the status. Negative: no status exports every row.
- Keep green: `list.test.ts` (bff), `ShipmentList.test.tsx` (frontend). `kit eng item verify SHOP-12` runs both areas.

## Risks
- The frontend ships before the bff. Effect: the filter does nothing. Reduce: Steps orders the bff first.
- The index build locks writes on a large table. Detect: the size of `shipments` in staging. The owner decides when it runs.
- No test covers the cache key. Detect: a stale list after a filter, in the manual check.
- Not done on purpose: saved filters. They need a data change.
```

## tasks.md
```markdown
# Slices: SHOP-12

## T1: Add the status parameter to the shipment list
- area: bff
- depends: none
- acs: AC1, AC2, AC3
- size: S
- done when: `list.test.ts` passes with the three new cases and `yarn lint` passes

## T2: Add the filter control and pass the status to the export
- area: frontend
- depends: T1
- acs: AC1, AC4, AC5
- size: S
- done when: `ShipmentList.test.tsx` and `export.test.ts` pass with the new cases and the full suite stays green
```
`kit eng task import` reads the heading and the lines `area`, `depends`, `acs`, `size`.
The line `done when` is for the builder.
A slice with no new behavior (a rename, a move) gets `- proof: none (<reason>)`, and `task prove` skips it.

## What each section holds
| Section | Holds | Does not hold | Lines |
|---|---|---|---|
| Architecture | the parts that change and how they connect today; one fact for each line with `area path:line`; what is not there when it matters | a choice, an opinion, the new design | 30 |
| Design | the chosen solution; each key decision with its reason; the contract and data impact ("none" when none); the rejected options with one reason each | a list of steps | 40 |
| Steps | the order across areas; what keeps working at each step; rollout and rollback; which step is hard to undo and who runs it | the slices | 25 |
| Tests | for each AC: the test, its layer and one negative case; the tests that must stay green; the commands | the test code | 30 |
| Risks | what can fail, how you detect or reduce it; what is left out on purpose; the guesses the plan relies on | a generic risk of any project | 20 |
